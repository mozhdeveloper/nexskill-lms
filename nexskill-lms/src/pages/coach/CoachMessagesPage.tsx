import React, { useState, useEffect, useRef, useCallback } from "react";
import CoachAppLayout from "../../layouts/CoachAppLayout";
import { Search, Send, Plus, AlertCircle, ArrowDown, X, User, Mail, ChevronRight } from "lucide-react";
import { useMessages, useConversations } from "../../hooks/useChat";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Profile } from "../../types/db";

const CoachMessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Profile[]>([]);
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
  } = useMessages({ 
    recipientId: selectedRecipientId || undefined,
    currentUserId: currentUserId || undefined 
  });

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isSupabaseConfigured) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Sync recipient profile when selection changes
  useEffect(() => {
    const fetchRecipientProfile = async () => {
      if (!selectedRecipientId) {
        setRecipientProfile(null);
        return;
      }

      const existingConv = conversations.find(c => c.other_user_id === selectedRecipientId);
      if (existingConv?.other_user_profile) {
        setRecipientProfile(existingConv.other_user_profile as Profile);
      } else {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", selectedRecipientId)
          .single();
        if (data) setRecipientProfile(data);
      }
    };
    fetchRecipientProfile();
  }, [selectedRecipientId, conversations]);

  // Load ONLY students enrolled in this coach's courses
  useEffect(() => {
    const loadEnrolledStudents = async () => {
      if (!isSupabaseConfigured || !showNewConversationModal || !currentUserId) return;

      try {
        const { data: courses } = await supabase
          .from("courses")
          .select("id")
          .eq("coach_id", currentUserId);

        if (!courses || courses.length === 0) {
          setAvailableStudents([]);
          return;
        }

        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("profile_id")
          .in("course_id", courseIds);

        if (!enrollments || enrollments.length === 0) {
          setAvailableStudents([]);
          return;
        }

        const studentIds = [...new Set(enrollments.map(e => e.profile_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", studentIds)
          .eq("role", "student");

        if (profiles) setAvailableStudents(profiles);
      } catch (err) {
        console.error("Error loading students:", err);
      }
    };
    loadEnrolledStudents();
  }, [showNewConversationModal, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedRecipientId) setTimeout(() => scrollToBottom(), 100);
  }, [selectedRecipientId]);

  useEffect(() => {
    if (selectedRecipientId && !messagesLoading && messages.length > 0) setTimeout(() => scrollToBottom(), 100);
  }, [selectedRecipientId, messagesLoading, messages.length]);

  useEffect(() => {
    if (!currentUserId || !messages.length) return;
    const unreadMessages = messages.filter(msg => msg.recipient_id === currentUserId && !msg.read_at && !markedAsReadRef.current.has(msg.id));
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(msg => msg.id);
      unreadIds.forEach(id => markedAsReadRef.current.add(id));
      markMultipleAsRead(unreadIds).then(() => refreshConversations());
    }
  }, [messages, currentUserId, markMultipleAsRead, refreshConversations]);

  useEffect(() => { markedAsReadRef.current.clear(); }, [selectedRecipientId]);

  const handleScroll = useCallback(() => {
    if (scrollThrottleRef.current) return;
    scrollThrottleRef.current = setTimeout(() => {
      if (!messagesContainerRef.current) { scrollThrottleRef.current = null; return; }
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      setShowScrollButton(!isNearBottom);
      scrollThrottleRef.current = null;
    }, 100);
  }, []);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = !searchQuery || 
      conv.other_user_profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.other_user_profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTab === "all" || (filterTab === "unread" && (conv.unread_count || 0) > 0);
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRecipientId) return;
    const text = messageInput;
    setMessageInput("");
    try {
      await sendMessage(text, selectedRecipientId);
      refreshConversations();
    } catch (error) {
      setMessageInput(text);
      console.error("Failed to send:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  if (!isSupabaseConfigured) {
    return (
      <CoachAppLayout>
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Service Unavailable</h2>
            <p className="text-slate-500">Real-time messaging is not configured.</p>
          </div>
        </div>
      </CoachAppLayout>
    );
  }

  return (
    <CoachAppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500 font-medium">Direct communication with your students</p>
          </div>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>

        {/* Main Messenger Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {(["all", "unread"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                      filterTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {conversationsLoading && <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</div>}
              {filteredConversations.map((conv) => {
                const otherUser = conv.other_user_profile;
                const active = selectedRecipientId === conv.other_user_id;
                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => setSelectedRecipientId(conv.other_user_id)}
                    className={`p-4 border-b border-slate-50 cursor-pointer transition-all ${active ? "bg-blue-50/50 border-l-4 border-l-blue-600" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 shadow-sm border-2 border-white">
                        {otherUser?.first_name?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`text-sm font-bold truncate ${conv.unread_count ? "text-slate-900" : "text-slate-700"}`}>{otherUser?.first_name} {otherUser?.last_name}</h3>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <p className={`text-xs truncate ${conv.unread_count ? "text-slate-900 font-bold" : "text-slate-500"}`}>{conv.last_message}</p>
                        {(conv.unread_count || 0) > 0 && <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded-full">{conv.unread_count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-50 relative">
            {selectedRecipientId ? (
              <>
                <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 shrink-0 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {recipientProfile?.first_name?.[0] || "?"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-none mb-1">{recipientProfile?.first_name} {recipientProfile?.last_name}</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Student</span>
                    </div>
                  </div>
                </div>

                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-8 space-y-6"
                >
                  {messages.map((msg, i) => {
                    const self = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${self ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-sm border ${self ? "bg-blue-600 text-white border-blue-500 rounded-tr-none" : "bg-white text-slate-800 border-slate-200 rounded-tl-none"}`}>
                            {msg.content}
                          </div>
                          <p className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${self ? "text-right text-slate-400" : "text-left text-slate-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollButton && (
                  <button onClick={scrollToBottom} className="absolute bottom-32 right-8 p-3 bg-white border border-slate-200 rounded-full shadow-xl text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95 z-10">
                    <ArrowDown className="w-5 h-5" />
                  </button>
                )}

                <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                  <div className="flex gap-4 items-end bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Write your message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none min-h-[44px] max-h-32 text-slate-900 font-medium"
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-slate-100">
                  <Mail className="w-10 h-10 text-slate-200" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Your Inbox</h2>
                <p className="text-slate-500 max-w-xs text-sm">Select a student from the sidebar to start a conversation or view history.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal - Professional Filtered Selection */}
        {showNewConversationModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">New Message</h2>
                <button onClick={() => setShowNewConversationModal(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Enrolled Student</p>
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                  {availableStudents.length > 0 ? availableStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedRecipientId(student.id);
                        setShowNewConversationModal(false);
                      }}
                      className="w-full p-4 text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-slate-600 shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {student.first_name?.[0] || "S"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{student.first_name} {student.last_name}</p>
                        <p className="text-xs font-medium text-slate-500 truncate">{student.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                    </button>
                  )) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <User className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">No enrolled students found</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setShowNewConversationModal(false)} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CoachAppLayout>
  );
};

export default CoachMessagesPage;
