import React, { useState, useEffect, useRef, useCallback } from "react";
import StudentAppLayout from "../../layouts/StudentAppLayout";
import { Search, Send, Plus, AlertCircle, ArrowDown } from "lucide-react";
import { useMessages, useConversations } from "../../hooks/useChat";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Profile } from "../../types/db";

const StudentMessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "starred">(
    "all",
  );
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableCoaches, setAvailableCoaches] = useState<Profile[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<Profile | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get conversations list
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations,
  } = useConversations();

  // Get messages for selected conversation
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
    markMultipleAsRead,
  } = useMessages({ recipientId: selectedRecipientId || undefined });

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isSupabaseConfigured) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Load available coaches for new conversation
  useEffect(() => {
    const loadCoaches = async () => {
      if (!isSupabaseConfigured || !showNewConversationModal) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "coach");

      if (!error && data) {
        setAvailableCoaches(data);
      }
    };
    loadCoaches();
  }, [showNewConversationModal]);

  // Handle scroll to detect if user scrolled up (throttled for performance)
  const handleScroll = useCallback(() => {
    if (scrollThrottleRef.current) return;

    scrollThrottleRef.current = setTimeout(() => {
      if (!messagesContainerRef.current) {
        scrollThrottleRef.current = null;
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      setShowScrollButton(!isNearBottom);
      scrollThrottleRef.current = null;
    }, 100); // Throttle to max 10 calls per second
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when conversation is opened
  useEffect(() => {
    if (selectedRecipientId) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedRecipientId]);

  // Auto-scroll when messages finish loading
  useEffect(() => {
    if (selectedRecipientId && !messagesLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [selectedRecipientId, messagesLoading, messages.length]);

  // Mark all unread messages as read when conversation is opened (optimized to prevent redundant calls)
  useEffect(() => {
    if (!currentUserId || !messages.length) return;

    const unreadMessages = messages.filter(
      (msg) =>
        msg.recipient_id === currentUserId &&
        !msg.read_at &&
        !markedAsReadRef.current.has(msg.id),
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((msg) => msg.id);
      // Mark these IDs as being processed
      unreadIds.forEach((id) => markedAsReadRef.current.add(id));

      markMultipleAsRead(unreadIds).then(() => {
        // Only refresh conversations once after marking
        refreshConversations();
      });
    }
  }, [
    selectedRecipientId,
    messages,
    currentUserId,
    markMultipleAsRead,
    refreshConversations,
  ]);

  // Clear marked set when conversation changes
  useEffect(() => {
    markedAsReadRef.current.clear();
  }, [selectedRecipientId]);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // If no search query, don't filter by search
    const matchesSearch =
      !searchQuery ||
      conv.other_user_profile?.first_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.other_user_profile?.last_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.other_user_profile?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterTab === "all" ||
      (filterTab === "unread" && (conv.unread_count || 0) > 0);

    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRecipientId) return;

    const messageText = messageInput;
    // Clear input immediately for better UX
    setMessageInput("");

    try {
      await sendMessage(messageText, selectedRecipientId);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessageInput(messageText);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.other_user_id === selectedRecipientId,
  );

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isSupabaseConfigured) {
    return (
      <StudentAppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Supabase Not Configured</h2>
            <p className="text-slate-600 dark:text-dark-text-secondary">
              Real-time messaging requires Supabase configuration. Please set up
              your environment variables.
            </p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary">
              Messages
            </h1>
            <p className="text-slate-600 dark:text-dark-text-secondary">
              Chat with your coaches
            </p>
          </div>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Message
          </button>
        </div>

        {/* Main Content */}
        <div
          className="bg-white dark:bg-dark-background-card rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex"
          style={{ height: "calc(100vh - 250px)" }}
        >
          <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Search & Filter */}
            <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-background text-slate-900 dark:text-dark-text-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterTab === "all"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterTab("unread")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterTab === "unread"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800"
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversationsLoading && conversations.length === 0 && (
                <div className="p-4 text-center text-slate-500">
                  Loading conversations...
                </div>
              )}
              {conversationsError && (
                <div className="p-4 text-center text-red-500">
                  Error: {conversationsError}
                </div>
              )}
              {!conversationsLoading &&
                conversations.length > 0 &&
                filteredConversations.length === 0 && (
                  <div className="p-4 text-center text-slate-500">
                    No conversations found
                  </div>
                )}
              {filteredConversations.map((conv) => {
                const otherUser = conv.other_user_profile;
                const displayName = otherUser
                  ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() ||
                    otherUser.username ||
                    "Unknown"
                  : "Unknown User";

                return (
                  <div
                    key={`${conv.user1_id}-${conv.user2_id}`}
                    onClick={() => {
                      setSelectedRecipientId(conv.other_user_id);
                      setSelectedUserProfile(conv.other_user_profile || null);
                    }}
                    className={`p-4 border-b border-slate-200 dark:border-gray-700 cursor-pointer transition-colors ${
                      selectedRecipientId === conv.other_user_id
                        ? "bg-blue-50 dark:bg-gray-800"
                        : "hover:bg-slate-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={`font-semibold truncate ${
                              (conv.unread_count || 0) > 0
                                ? "text-slate-900 dark:text-dark-text-primary"
                                : "text-slate-700 dark:text-dark-text-secondary"
                            }`}
                          >
                            {displayName}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-dark-text-muted ml-2">
                            {formatTimestamp(conv.last_message_at)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            (conv.unread_count || 0) > 0
                              ? "text-slate-900 dark:text-dark-text-primary font-medium"
                              : "text-slate-600 dark:text-dark-text-secondary"
                          }`}
                        >
                          {conv.last_message}
                        </p>
                        {(conv.unread_count || 0) > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Thread */}
          <div className="w-full md:w-2/3 flex flex-col overflow-hidden relative">
            {selectedRecipientId ? (
              <>
                {/* Thread Header */}
                <div className="p-6 bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {(
                        selectedConversation?.other_user_profile?.first_name ||
                        selectedUserProfile?.first_name ||
                        "U"
                      ).charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary">
                        {selectedConversation?.other_user_profile?.first_name ||
                          selectedUserProfile?.first_name ||
                          ""}{" "}
                        {selectedConversation?.other_user_profile?.last_name ||
                          selectedUserProfile?.last_name ||
                          ""}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                        {selectedConversation?.other_user_profile?.role ||
                          selectedUserProfile?.role ||
                          "Coach"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-dark-background relative"
                >
                  {messagesLoading && (
                    <div className="text-center text-slate-500">
                      Loading messages...
                    </div>
                  )}
                  {messagesError && (
                    <div className="text-center text-red-500">
                      Error: {messagesError}
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isFromCurrentUser = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isFromCurrentUser
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-dark-background-card text-slate-900 dark:text-dark-text-primary border border-slate-200 dark:border-gray-700"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isFromCurrentUser
                                ? "text-blue-100"
                                : "text-slate-500 dark:text-dark-text-muted"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to Bottom Button */}
                {selectedRecipientId && (
                  <button
                    onClick={scrollToBottom}
                    style={{ display: showScrollButton ? "block" : "none" }}
                    className="absolute bottom-24 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-50"
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                )}

                {/* Message Input */}
                <div className="p-4 bg-white dark:bg-dark-background-card border-t border-slate-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-dark-background text-slate-900 dark:text-dark-text-primary"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Send className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-slate-600 dark:text-dark-text-secondary">
                    Choose a coach from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-background-card rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">
                Start New Conversation
              </h2>
              <p className="text-slate-600 dark:text-dark-text-secondary mb-4">
                Select a coach to start messaging:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableCoaches.map((coach) => (
                  <button
                    key={coach.id}
                    onClick={() => {
                      setSelectedRecipientId(coach.id);
                      setSelectedUserProfile(coach);
                      setShowNewConversationModal(false);
                    }}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {(coach.first_name || coach.username || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-dark-text-primary">
                        {coach.first_name} {coach.last_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                        @{coach.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentAppLayout>
  );
};

export default StudentMessagesPage;
