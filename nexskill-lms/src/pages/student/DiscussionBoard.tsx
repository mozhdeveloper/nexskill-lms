import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';

interface Thread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  reply_count: number;
  reaction_count: number;
  created_at: string;
}

const DiscussionBoard: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'my-courses', label: 'My courses' },
    { id: 'popular', label: 'Popular' },
    { id: 'unanswered', label: 'Unanswered' },
  ];

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: enrollments } = await supabase
        .from('enrollments').select('course_id').eq('profile_id', user.id);
      setEnrolledCourseIds((enrollments || []).map((e: any) => e.course_id));
    };
    init();
  }, []);

  useEffect(() => {
    fetchThreads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, enrolledCourseIds]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('discussion_threads')
        .select('id, title, content, author_id, reply_count, reaction_count, created_at, profiles!discussion_threads_author_id_fkey(first_name, last_name)');

      if (activeFilter === 'my-courses' && enrolledCourseIds.length > 0) {
        query = (query as any).in('course_id', enrolledCourseIds);
      } else if (activeFilter === 'popular') {
        query = query.order('reply_count', { ascending: false });
      } else if (activeFilter === 'unanswered') {
        query = query.eq('reply_count', 0);
      }

      if (activeFilter !== 'popular') {
        query = query.order('created_at', { ascending: false });
      }

      const { data } = await query.limit(50);
      const mapped = (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        author_id: t.author_id,
        author_name: t.profiles
          ? `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}`.trim()
          : 'Anonymous',
        reply_count: t.reply_count || 0,
        reaction_count: t.reaction_count || 0,
        created_at: t.created_at,
      }));
      setThreads(mapped);
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostThread = async () => {
    if (!newTitle.trim() || !newContent.trim() || !currentUserId) return;
    setPosting(true);
    try {
      await supabase.from('discussion_threads').insert({
        title: newTitle.trim(),
        content: newContent.trim(),
        author_id: currentUserId,
      });
      setNewTitle('');
      setNewContent('');
      setShowNewThread(false);
      fetchThreads();
    } catch (err) {
      console.error('Failed to post thread:', err);
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Community discussions</h1>
              <p className="text-slate-600 dark:text-slate-400">Ask questions, share insights, and learn with others.</p>
            </div>
            <button
              onClick={() => setShowNewThread(true)}
              className="px-5 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New discussion
            </button>
          </div>

          {/* New Thread Form */}
          {showNewThread && (
            <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Start a new discussion</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What's your question or topic?"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Details</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share more details, context, or ask your question..."
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setShowNewThread(false); setNewTitle(''); setNewContent(''); }}
                    className="px-5 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostThread}
                    disabled={!newTitle.trim() || !newContent.trim() || posting}
                    className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? 'Posting...' : 'Post discussion'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${activeFilter === filter.id
                  ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#304DB5]" />
              </div>
            ) : threads.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No discussions yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Be the first to start a conversation!</p>
                <button
                  onClick={() => setShowNewThread(true)}
                  className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  Start a discussion
                </button>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => navigate(`/student/community/threads/${thread.id}`)}
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all text-left"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {thread.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{thread.content}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-xs font-semibold">
                        {thread.author_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{thread.author_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {thread.reply_count}
                      </span>
                      <span>{formatTime(thread.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default DiscussionBoard;
