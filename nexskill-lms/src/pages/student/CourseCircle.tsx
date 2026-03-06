import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import StudentAppLayout from "../../layouts/StudentAppLayout";
import { Search, Send, Plus, AlertCircle } from "lucide-react";
import { useMessages, useConversations } from "../../hooks/useChat";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Profile } from "../../types/db";

const CourseCircle: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        setCurrentUserId(user.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Use our chat hooks - filtered by courseId
  const { conversations, loading: conversationsLoading } =
    useConversations(courseId);
  const {
    messages,
    loading: messagesLoading,
    error,
    sendMessage,
    markAsRead,
  } = useMessages({ recipientId: selectedRecipientId || undefined, courseId });

  // Fetch available users enrolled in this course
  useEffect(() => {
    if (!courseId || !isSupabaseConfigured) return;

    const fetchEnrolledUsers = async () => {
      try {
        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select(
            `
            profile_id,
            profiles:profile_id (
              id,
              first_name,
              last_name,
              email,
              role
            )
          `,
          )
          .eq("course_id", courseId);

        if (enrollError) throw enrollError;

        const users = (enrollments || [])
          .flatMap((e) => e.profiles)
          .filter(Boolean) as Profile[];

        setAvailableUsers(users);
      } catch (err) {
        console.error("Error fetching enrolled users:", err);
      }
    };

    fetchEnrolledUsers();
  }, [courseId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedRecipientId && messages.length > 0) {
      const markUnreadMessages = async () => {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) return;

        const unreadMessages = messages.filter(
          (msg) => msg.recipient_id === user.user.id && !msg.read_at,
        );
        unreadMessages.forEach((msg) => markAsRead(msg.id));
      };

      markUnreadMessages();
    }
  }, [selectedRecipientId, messages, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRecipientId || !courseId) return;

    try {
      await sendMessage(selectedRecipientId, messageInput, courseId);
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleStartConversation = (userId: string) => {
    setSelectedRecipientId(userId);
    setShowNewConversation(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    const userName =
      `${conv.other_user_profile?.first_name} ${conv.other_user_profile?.last_name}`.toLowerCase();
    return userName.includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find(
    (c) => c.other_user_id === selectedRecipientId,
  );

  if (!isSupabaseConfigured) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Chat Not Configured
            </h2>
            <p className="text-slate-600">
              Supabase is not configured. Please set up your environment
              variables to enable real-time chat.
            </p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Course Circle
            </h1>
            <p className="text-slate-600">
              Connect with fellow learners and coaches in this course.
            </p>
          </div>

          <div
            className="bg-white rounded-2xl shadow-xl overflow-hidden flex"
            style={{ height: "calc(100vh - 250px)" }}
          >
            {/* Conversations List */}
            <div className="w-96 border-r border-slate-200 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Conversations
                  </h2>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/90 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">
                      Loading conversations...
                    </div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="text-slate-400 mb-2">
                      No conversations yet
                    </div>
                    <button
                      onClick={() => setShowNewConversation(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Start a conversation
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.other_user_id}
                      onClick={() => setSelectedRecipientId(conv.other_user_id)}
                      className={`p-4 border-b border-slate-200 cursor-pointer transition-colors hover:bg-slate-50 ${
                        selectedRecipientId === conv.other_user_id
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {conv.other_user_profile?.first_name?.[0]}
                          {conv.other_user_profile?.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {conv.other_user_profile?.first_name}{" "}
                              {conv.other_user_profile?.last_name}
                            </h3>
                            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                              {new Date(
                                conv.last_message_at,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {conv.last_message}
                          </p>
                          {(conv.unread_count ?? 0) > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                              {conv.unread_count} new
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Thread Header */}
                  <div className="p-6 bg-white border-b border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {selectedConversation.other_user_profile?.first_name?.[0]}
                      {selectedConversation.other_user_profile?.last_name?.[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedConversation.other_user_profile?.first_name}{" "}
                        {selectedConversation.other_user_profile?.last_name}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {selectedConversation.other_user_profile?.role}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-slate-400">
                          Loading messages...
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-red-500">
                          Error loading messages
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-slate-400">
                          No messages yet. Start the conversation!
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isCurrentUser =
                            message.sender_id === currentUserId;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div className="max-w-lg">
                                <div
                                  className={`rounded-2xl px-4 py-3 ${
                                    isCurrentUser
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-slate-900 border border-slate-200"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                </div>
                                <p
                                  className={`text-xs text-slate-500 mt-1 ${
                                    isCurrentUser ? "text-right" : "text-left"
                                  }`}
                                >
                                  {new Date(
                                    message.created_at,
                                  ).toLocaleTimeString([], {
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
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-6 bg-white border-t border-slate-200">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type your message..."
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Press Enter to send, Shift + Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                      <Send className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-slate-600">
                      Choose someone to start messaging in this course
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New Conversation Modal */}
          {showNewConversation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    New Conversation
                  </h3>
                  <p className="text-sm text-slate-600">
                    Select someone enrolled in this course to message
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {availableUsers.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      No other users enrolled in this course
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers
                        .filter((user) => user.id !== currentUserId)
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleStartConversation(user.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-slate-600">
                                {user.role}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseCircle;
