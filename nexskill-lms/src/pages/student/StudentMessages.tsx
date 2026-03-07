import React, { useState, useEffect, useRef } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { Search, Send, Archive, Star, MoreVertical, Plus } from 'lucide-react';
import { useConversations, useMessages } from '../../hooks/useChat';
import { supabase } from '../../lib/supabaseClient';

interface CoachOption {
  id: string;
  first_name: string;
  last_name: string;
  course?: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const StudentMessages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'starred'>('all');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [coachOptions, setCoachOptions] = useState<CoachOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, loading: convsLoading } = useConversations();
  const { messages, loading: msgsLoading, sendMessage } = useMessages({ recipientId: selectedUserId || undefined });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showNewConversationModal || !currentUserId) return;
    const fetchCoaches = async () => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, courses!inner(coach_id, title)')
        .eq('profile_id', currentUserId);

      const coachCourseMap: Record<string, string> = {};
      (enrollments || []).forEach((e: any) => {
        if (e.courses?.coach_id && e.courses?.title) {
          coachCourseMap[e.courses.coach_id] = e.courses.title;
        }
      });

      const coachIds = Object.keys(coachCourseMap);
      if (coachIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', coachIds);

      setCoachOptions((profiles || []).map((p: any) => ({
        id: p.id,
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        course: coachCourseMap[p.id],
      })));
    };
    fetchCoaches();
  }, [showNewConversationModal, currentUserId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;
    try {
      await sendMessage(messageInput.trim(), selectedUserId);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleStarConversation = (userId: string) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const handleArchiveConversation = (userId: string) => {
    setArchivedIds(prev => new Set([...prev, userId]));
    if (selectedUserId === userId) setSelectedUserId(null);
  };

  const activeConversations = conversations.filter(c => !archivedIds.has(c.other_user_id));

  const filteredConversations = activeConversations.filter(conv => {
    const name = `${conv.other_user_profile?.first_name ?? ''} ${conv.other_user_profile?.last_name ?? ''}`.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      (conv.last_message || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'unread') return matchesSearch && (conv.unread_count ?? 0) > 0;
    if (filterTab === 'starred') return matchesSearch && starredIds.has(conv.other_user_id);
    return matchesSearch;
  });

  const selectedName = (() => {
    const c = conversations.find(c => c.other_user_id === selectedUserId);
    return c ? `${c.other_user_profile?.first_name ?? ''} ${c.other_user_profile?.last_name ?? ''}`.trim() : '';
  })();

  const unreadCount = activeConversations.filter(c => (c.unread_count ?? 0) > 0).length;
  const starredCount = activeConversations.filter(c => starredIds.has(c.other_user_id)).length;

  return (
    <StudentAppLayout>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r border-slate-200 dark:border-gray-700 flex flex-col bg-white dark:bg-dark-background-card">
          <div className="p-6 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">Messages</h1>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-lg"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'unread', 'starred'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterTab === tab
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab === 'all' && `All (${activeConversations.length})`}
                  {tab === 'unread' && `Unread (${unreadCount})`}
                  {tab === 'starred' && <><Star className="w-4 h-4 inline mr-1" />{starredCount}</>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-6 text-center text-slate-400">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No conversations yet</div>
            ) : filteredConversations.map(conv => {
              const name = `${conv.other_user_profile?.first_name ?? ''} ${conv.other_user_profile?.last_name ?? ''}`.trim() || 'Unknown';
              const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const isUnread = (conv.unread_count ?? 0) > 0;
              const isStarred = starredIds.has(conv.other_user_id);
              return (
                <div
                  key={conv.other_user_id}
                  onClick={() => setSelectedUserId(conv.other_user_id)}
                  className={`p-4 border-b border-slate-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-gray-800 ${
                    selectedUserId === conv.other_user_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${isUnread ? 'text-slate-900 dark:text-dark-text-primary' : 'text-slate-700 dark:text-dark-text-secondary'}`}>
                            {name}
                          </span>
                          {isStarred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                          {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-dark-text-muted whitespace-nowrap ml-2">
                      {conv.last_message_at ? formatRelativeTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <p className={`text-sm truncate pl-13 ${isUnread ? 'text-slate-900 dark:text-dark-text-primary font-medium' : 'text-slate-600 dark:text-dark-text-secondary'}`}>
                    {conv.last_message || 'Start a conversation'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-dark-background">
          {selectedUserId ? (
            <>
              <div className="p-6 bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary">{selectedName || 'Coach'}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleStarConversation(selectedUserId)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <Star className={`w-5 h-5 ${starredIds.has(selectedUserId) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                  </button>
                  <button onClick={() => handleArchiveConversation(selectedUserId)} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Archive">
                    <Archive className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {msgsLoading ? (
                  <div className="text-center text-slate-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">No messages yet. Say hello!</div>
                ) : messages.map(msg => {
                  const isFromMe = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-lg">
                        <div className={`rounded-2xl px-4 py-3 ${
                          isFromMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-dark-background-card text-slate-900 dark:text-dark-text-primary border border-slate-200 dark:border-gray-700'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <p className={`text-xs text-slate-500 dark:text-dark-text-muted mt-1 ${isFromMe ? 'text-right' : 'text-left'}`}>
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 bg-white dark:bg-dark-background-card border-t border-slate-200 dark:border-gray-700">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Send className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Select a conversation</h3>
                <p className="text-slate-600 dark:text-dark-text-secondary">Choose a coach from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-background-card rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">Start New Conversation</h2>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-4">Select a coach from your enrolled courses:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {coachOptions.length === 0 ? (
                <p className="text-slate-500 dark:text-dark-text-muted text-center py-4">No coaches found. Enroll in a course first.</p>
              ) : coachOptions.map(coach => (
                <button
                  key={coach.id}
                  onClick={() => {
                    setSelectedUserId(coach.id);
                    setShowNewConversationModal(false);
                  }}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {(coach.first_name[0] || '') + (coach.last_name[0] || '')}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-dark-text-primary">{coach.first_name} {coach.last_name}</p>
                    {coach.course && <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{coach.course}</p>}
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
    </StudentAppLayout>
  );
};

export default StudentMessages;
