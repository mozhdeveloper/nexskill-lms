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
  currentUserId?: string; // Optional: provide if already fetched
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
      if (profileCacheRef.current[profileId]) return profileCacheRef.current[profileId];

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).single();
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
      let activeUserId = options.currentUserId;

      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData.session?.user?.id;
        if (!activeUserId) {
          const { data: userData, error: authError } = await supabase.auth.getUser();
          if (authError || !userData?.user) throw new Error("User not authenticated");
          activeUserId = userData.user.id;
        }
      }

      let query = supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${activeUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${activeUserId})`)
        .order("created_at", { ascending: true });

      if (courseId) query = query.eq("course_id", courseId);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const userIds = new Set<string>();
      data?.forEach((msg) => { userIds.add(msg.sender_id); userIds.add(msg.recipient_id); });
      const uncachedUserIds = Array.from(userIds).filter((id) => !profileCacheRef.current[id]);

      if (uncachedUserIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("*").in("id", uncachedUserIds);
        profilesData?.forEach((profile) => { profileCacheRef.current[profile.id] = profile; });
      }

      setMessages((data || []).map((msg) => ({
        ...msg,
        sender_profile: profileCacheRef.current[msg.sender_id],
        recipient_profile: profileCacheRef.current[msg.recipient_id],
      })));
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [recipientId, courseId, options.currentUserId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!isSupabaseConfigured || !recipientId) return;
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      let activeUserId = options.currentUserId;
      if (!activeUserId) {
        const { data: user } = await supabase.auth.getUser();
        activeUserId = user?.user?.id;
      }
      if (!activeUserId) return;

      channel = supabase
        .channel(`messages-${activeUserId}-${recipientId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
          const newMessage = payload.new as Message;
          const isRelevant = (newMessage.sender_id === activeUserId && newMessage.recipient_id === recipientId) || (newMessage.sender_id === recipientId && newMessage.recipient_id === activeUserId);
          if (!isRelevant) return;

          const senderProfile = await loadProfile(newMessage.sender_id);
          const recipientProfile = await loadProfile(newMessage.recipient_id);

          setMessages((prev) => {
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            const tempIndex = prev.findIndex(msg => msg.id.startsWith("temp-") && msg.sender_id === newMessage.sender_id && msg.content === newMessage.content);
            const messageWithProfile: MessageWithProfiles = { ...newMessage, sender_profile: senderProfile || undefined, recipient_profile: recipientProfile || undefined };
            if (tempIndex !== -1) {
              const newMessages = [...prev];
              newMessages[tempIndex] = messageWithProfile;
              return newMessages;
            }
            return [...prev, messageWithProfile];
          });
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map(msg => msg.id === updated.id ? { ...msg, ...updated } : msg));
        })
        .subscribe();
    };

    setupRealtimeSubscription();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [recipientId, loadProfile, options.currentUserId]);

  const sendMessage = async (content: string, recipientId: string, courseId?: string) => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");

    let activeUserId = options.currentUserId;
    if (!activeUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      activeUserId = sessionData.session?.user?.id;
      if (!activeUserId) {
        const { data: userData } = await supabase.auth.getUser();
        activeUserId = userData?.user?.id;
      }
    }

    if (!activeUserId) throw new Error("User not authenticated");

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const senderProfile = profileCacheRef.current[activeUserId];
    const recipientProfile = profileCacheRef.current[recipientId];

    const optimisticMessage: MessageWithProfiles = {
      id: tempId, sender_id: activeUserId, recipient_id: recipientId, content: content.trim(),
      created_at: now, updated_at: now, read_at: undefined, course_id: courseId || undefined,
      sender_profile: senderProfile, recipient_profile: recipientProfile,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { data: insertedMessage, error: insertError } = await supabase
      .from("messages")
      .insert({ sender_id: activeUserId, recipient_id: recipientId, content: content.trim(), course_id: courseId })
      .select().single();

    if (insertError) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      throw new Error("Failed to send message");
    }

    if (insertedMessage) {
      setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...insertedMessage, sender_profile: senderProfile, recipient_profile: profileCacheRef.current[recipientId] } : msg));
    }
  };

  const markMultipleAsRead = async (messageIds: string[]) => {
    if (!isSupabaseConfigured || messageIds.length === 0) return;
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", messageIds);
  };

  return { messages, loading, error, sendMessage, markAsRead: async (id) => markMultipleAsRead([id]), markMultipleAsRead };
};

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  refreshConversations: () => Promise<void>;
}

export const useConversations = (courseId?: string, currentUserId?: string): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const profileCacheRef = useRef<Record<string, Profile>>({});

  const fetchConversations = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);

    try {
      let activeUserId = currentUserId;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData.session?.user?.id;
        if (!activeUserId) {
          const { data: userData } = await supabase.auth.getUser();
          activeUserId = userData?.user?.id;
        }
      }
      if (!activeUserId) throw new Error("User not authenticated");

      let query = supabase.from("conversations").select("*").or(`user1_id.eq.${activeUserId},user2_id.eq.${activeUserId}`).order("last_message_at", { ascending: false });
      if (courseId) query = query.eq("course_id", courseId);

      const { data: conversationsData, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const otherUserIds = (conversationsData || []).map((conv) => conv.user1_id === activeUserId ? conv.user2_id : conv.user1_id);
      const uncachedUserIds = otherUserIds.filter((id) => !profileCacheRef.current[id]);

      if (uncachedUserIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("*").in("id", uncachedUserIds);
        profilesData?.forEach((profile) => { profileCacheRef.current[profile.id] = profile; });
      }

      setConversations((conversationsData || []).map((conv) => {
        const otherUserId = conv.user1_id === activeUserId ? conv.user2_id : conv.user1_id;
        const unreadCount = conv.user1_id === activeUserId ? conv.unread_count_user1 : conv.unread_count_user2;
        return {
          user1_id: conv.user1_id, user2_id: conv.user2_id, course_id: conv.course_id,
          last_message: conv.last_message_content, last_message_at: conv.last_message_at,
          last_sender_id: conv.last_sender_id, other_user_id: otherUserId,
          other_user_profile: profileCacheRef.current[otherUserId], unread_count: unreadCount,
        };
      }));
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally { setLoading(false); }
  }, [courseId, currentUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (refreshTrigger > 0) fetchConversations(); }, [refreshTrigger, fetchConversations]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const channel = supabase.channel("conversations-realtime").on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, async (payload) => {
        const conv = payload.new as { user1_id?: string; user2_id?: string; };
        if (conv && (conv.user1_id === user.id || conv.user2_id === user.id)) {
          if (refreshTimeout) clearTimeout(refreshTimeout);
          refreshTimeout = setTimeout(() => { setRefreshTrigger((prev) => prev + 1); }, 300);
        }
      }).subscribe();
      return channel;
    };
    const channelPromise = setupRealtimeSubscription();
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      channelPromise.then((channel) => { if (channel) supabase.removeChannel(channel); });
    };
  }, []);

  return { conversations, loading, error, refreshConversations: fetchConversations };
};
