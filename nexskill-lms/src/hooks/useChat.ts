import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import type {
  Message,
  MessageWithProfiles,
  Conversation,
  Profile,
} from "../types/db";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseMessagesOptions {
  recipientId?: string;
  courseId?: string;
}

interface UseMessagesReturn {
  messages: MessageWithProfiles[];
  loading: boolean;
  error: string | null;
  sendMessage: (
    content: string,
    recipientId: string,
    courseId?: string,
  ) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markMultipleAsRead: (messageIds: string[]) => Promise<void>;
}

/**
 * Custom hook for real-time messaging functionality
 * Based on Supabase realtime chat tutorial
 */
export const useMessages = (
  options: UseMessagesOptions = {},
): UseMessagesReturn => {
  const [messages, setMessages] = useState<MessageWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileCacheRef = useRef<Record<string, Profile>>({});

  const { recipientId, courseId } = options;

  // Load profile data with caching
  const loadProfile = useCallback(
    async (profileId: string): Promise<Profile | null> => {
      if (!isSupabaseConfigured) return null;

      // Check cache first
      if (profileCacheRef.current[profileId]) {
        return profileCacheRef.current[profileId];
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (error) throw error;

        if (data) {
          profileCacheRef.current[profileId] = data;
          return data;
        }
        return null;
      } catch (err) {
        console.error("Error loading profile:", err);
        return null;
      }
    },
    [],
  );

  // Fetch messages with profiles
  const fetchMessages = useCallback(async () => {
    if (!isSupabaseConfigured || !recipientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        throw new Error("User not authenticated");
      }

      const currentUserId = user.user.id;

      // Build query for conversation between current user and recipient
      let query = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true });

      // Optionally filter by course
      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Collect all unique user IDs that need profiles
      const userIds = new Set<string>();
      data?.forEach((msg) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
      });

      // Filter out IDs we already have cached
      const uncachedUserIds = Array.from(userIds).filter(
        (id) => !profileCacheRef.current[id],
      );

      // Batch fetch all uncached profiles in ONE query
      if (uncachedUserIds.length > 0) {
        try {
          const { data: profilesData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", uncachedUserIds);

          if (!profileError && profilesData) {
            // Update cache with all fetched profiles
            profilesData.forEach((profile) => {
              profileCacheRef.current[profile.id] = profile;
            });
          }
        } catch (err) {
          console.error("Error loading profiles:", err);
        }
      }

      // Attach profiles to messages (using updated cache)
      const messagesWithProfiles: MessageWithProfiles[] = (data || []).map(
        (msg) => ({
          ...msg,
          sender_profile: profileCacheRef.current[msg.sender_id],
          recipient_profile: profileCacheRef.current[msg.recipient_id],
        }),
      );

      setMessages(messagesWithProfiles);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [recipientId, courseId]); // profileCache removed to prevent infinite loops

  // Initial fetch on mount or when recipientId/courseId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time updates (separate from fetch to avoid refetching on every cache update)
  useEffect(() => {
    if (!isSupabaseConfigured || !recipientId) {
      return;
    }
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      const currentUserId = user.user.id;

      // Subscribe to messages table changes
      // Note: Filtering in realtime can be tricky, so we'll filter in the callback instead
      channel = supabase
        .channel(`messages-${currentUserId}-${recipientId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newMessage = payload.new as Message;

              // Filter: only process messages for this conversation
              const isRelevant =
                (newMessage.sender_id === currentUserId &&
                  newMessage.recipient_id === recipientId) ||
                (newMessage.sender_id === recipientId &&
                  newMessage.recipient_id === currentUserId);

              if (!isRelevant) {
                return;
              }

              // Fetch profiles for sender and recipient from cache
              const senderProfile = await loadProfile(newMessage.sender_id);
              const recipientProfile = await loadProfile(
                newMessage.recipient_id,
              );

              // Add or update message in a single state update
              setMessages((prev) => {
                // Check if message already exists (prevents duplicates)
                const existingIndex = prev.findIndex(
                  (msg) => msg.id === newMessage.id,
                );

                if (existingIndex !== -1) {
                  // Message already exists, don't add duplicate
                  return prev;
                }

                // Check for optimistic message to replace
                const tempIndex = prev.findIndex(
                  (msg) =>
                    msg.id.startsWith("temp-") &&
                    msg.sender_id === newMessage.sender_id &&
                    msg.content === newMessage.content,
                );

                const messageWithProfile: MessageWithProfiles = {
                  ...newMessage,
                  sender_profile: senderProfile || undefined,
                  recipient_profile: recipientProfile || undefined,
                };

                if (tempIndex !== -1) {
                  // Replace optimistic message
                  const newMessages = [...prev];
                  newMessages[tempIndex] = messageWithProfile;
                  return newMessages;
                }

                // Add new message
                return [...prev, messageWithProfile];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedMessage = payload.new as Message;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMessage.id
                    ? { ...msg, ...updatedMessage }
                    : msg,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== (payload.old as Message).id),
              );
            }
          },
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [recipientId, loadProfile]); // Re-subscribe when recipientId changes

  // Send a new message
  const sendMessage = async (
    content: string,
    recipientId: string,
    courseId?: string,
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured");
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error("User not authenticated");
    }

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    // Get profiles from cache (fetch in background if needed)
    const senderProfile = profileCacheRef.current[user.user.id];
    const recipientProfile = profileCacheRef.current[recipientId];

    // Fetch missing profiles in background (don't await)
    if (!senderProfile) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            profileCacheRef.current[user.user.id] = data;
          }
        });
    }
    if (!recipientProfile) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", recipientId)
        .single()
        .then(({ data }) => {
          if (data) {
            profileCacheRef.current[recipientId] = data;
          }
        });
    }

    // Optimistic update - show message immediately (even without profiles)
    const optimisticMessage: MessageWithProfiles = {
      id: tempId,
      sender_id: user.user.id,
      recipient_id: recipientId,
      content: content.trim(),
      created_at: now,
      updated_at: now,
      read_at: undefined,
      course_id: courseId || undefined,
      sender_profile: senderProfile,
      recipient_profile: recipientProfile,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Build insert data, only including course_id if it's defined
    const insertData: {
      sender_id: string;
      recipient_id: string;
      content: string;
      course_id?: string;
    } = {
      sender_id: user.user.id,
      recipient_id: recipientId,
      content: content.trim(),
    };

    if (courseId) {
      insertData.course_id = courseId;
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from("messages")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Error sending message:", insertError);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      throw new Error("Failed to send message");
    }

    // Replace temp message with real one
    if (insertedMessage) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...insertedMessage,
                sender_profile: senderProfile,
                recipient_profile: profileCacheRef.current[recipientId],
              }
            : msg,
        ),
      );
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!isSupabaseConfigured) return;

    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error marking message as read:", updateError);
    }
  };

  // Mark multiple messages as read in a single query
  const markMultipleAsRead = async (messageIds: string[]) => {
    if (!isSupabaseConfigured || messageIds.length === 0) return;

    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", messageIds);

    if (updateError) {
      console.error("Error marking messages as read:", updateError);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    markMultipleAsRead,
  };
};

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  refreshConversations: () => Promise<void>;
}

/**
 * Custom hook for fetching all conversations for the current user
 */
export const useConversations = (courseId?: string): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const profileCacheRef = useRef<Record<string, Profile>>({});

  const fetchConversations = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        throw new Error("User not authenticated");
      }

      const currentUserId = user.user.id;
      // Query the new conversations table directly (much faster!)
      let query = supabase
        .from("conversations")
        .select(
          `
          id,
          user1_id,
          user2_id,
          last_message_content,
          last_message_at,
          last_sender_id,
          unread_count_user1,
          unread_count_user2,
          course_id
        `,
        )
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false });

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data: conversationsData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Collect all unique user IDs we need profiles for
      const otherUserIds = (conversationsData || []).map((conv) =>
        conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id,
      );

      // Filter out cached profiles
      const uncachedUserIds = otherUserIds.filter(
        (id) => !profileCacheRef.current[id],
      );

      // Batch fetch all uncached profiles in ONE query
      if (uncachedUserIds.length > 0) {
        try {
          const { data: profilesData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", uncachedUserIds);

          if (!profileError && profilesData) {
            // Update cache with newly fetched profiles
            profilesData.forEach((profile) => {
              profileCacheRef.current[profile.id] = profile;
            });
          }
        } catch (err) {
          console.error("Error loading profiles:", err);
        }
      }

      // Transform to Conversation[] format with cached profiles
      const conversationList: Conversation[] = (conversationsData || []).map(
        (conv) => {
          const otherUserId =
            conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
          const unreadCount =
            conv.user1_id === currentUserId
              ? conv.unread_count_user1
              : conv.unread_count_user2;

          return {
            user1_id: conv.user1_id,
            user2_id: conv.user2_id,
            course_id: conv.course_id,
            last_message: conv.last_message_content,
            last_message_at: conv.last_message_at,
            last_sender_id: conv.last_sender_id,
            other_user_id: otherUserId,
            other_user_profile: profileCacheRef.current[otherUserId],
            unread_count: unreadCount,
          };
        },
      );

      setConversations(conversationList);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]); // profileCache removed to prevent infinite loops

  // Initial fetch on mount and when courseId changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Refresh when realtime trigger fires
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchConversations();
    }
  }, [refreshTrigger, fetchConversations]);

  // Separate effect for real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const currentUserId = user.id;

      const channel = supabase
        .channel("conversations-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          async (payload) => {
            // Check if this conversation involves the current user
            const conv = payload.new as {
              user1_id?: string;
              user2_id?: string;
            };
            if (
              conv &&
              (conv.user1_id === currentUserId ||
                conv.user2_id === currentUserId)
            ) {
              // Debounce refresh to avoid flooding
              if (refreshTimeout) {
                clearTimeout(refreshTimeout);
              }
              refreshTimeout = setTimeout(() => {
                setRefreshTrigger((prev) => prev + 1);
              }, 300); // Wait 300ms after last update before refreshing
            }
          },
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtimeSubscription();

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []); // Empty dependency - only set up once

  return {
    conversations,
    loading,
    error,
    refreshConversations: fetchConversations,
  };
};
