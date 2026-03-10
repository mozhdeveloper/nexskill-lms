import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';

interface Thread {
  id: string;
  title: string;
  content: string;
  author_name: string;
  reply_count: number;
  created_at: string;
}

interface Reply {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
}

const ThreadView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    fetchThread();
    fetchReplies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const fetchThread = async () => {
    if (!threadId) { setLoading(false); return; }
    const { data } = await supabase
      .from('discussion_threads')
      .select('id, title, content, reply_count, created_at, profiles!discussion_threads_author_id_fkey(first_name, last_name)')
      .eq('id', threadId)
      .single();
    if (data) {
      setThread({
        id: data.id,
        title: data.title,
        content: data.content,
        reply_count: data.reply_count || 0,
        created_at: data.created_at,
        author_name: (data as any).profiles
          ? `${(data as any).profiles.first_name || ''} ${(data as any).profiles.last_name || ''}`.trim()
          : 'Anonymous',
      });
    }
    setLoading(false);
  };

  const fetchReplies = async () => {
    if (!threadId) return;
    const { data } = await supabase
      .from('discussion_replies')
      .select('id, content, created_at, profiles!discussion_replies_author_id_fkey(first_name, last_name)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    setReplies(
      (data || []).map((r: any) => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        author_name: r.profiles
          ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim()
          : 'Anonymous',
      }))
    );
  };

  const handlePostReply = async () => {
    if (!replyContent.trim() || !currentUserId || !threadId) return;
    setPosting(true);
    try {
      const { error: insertErr } = await supabase.from('discussion_replies').insert({
        thread_id: threadId,
        author_id: currentUserId,
        content: replyContent.trim(),
      });
      if (insertErr) throw insertErr;
      // Sync reply_count from actual count
      const { count } = await supabase
        .from('discussion_replies')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);
      await supabase.from('discussion_threads')
        .update({ reply_count: count || 0 })
        .eq('id', threadId);
      setReplyContent('');
      fetchReplies();
      setThread(prev => prev ? { ...prev, reply_count: (count || 0) } : prev);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#304DB5]" />
        </div>
      </StudentAppLayout>
    );
  }

  if (!thread) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate('/student/community')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#304DB5] mb-6 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to discussions
            </button>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-md p-12 text-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thread not found</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">This discussion thread does not exist.</p>
              <button onClick={() => navigate('/student/community')} className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full">
                Browse discussions
              </button>
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/student/community')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#304DB5] dark:hover:text-blue-400 mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to discussions
          </button>

          {/* Thread body */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{thread.title}</h1>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">{thread.content}</p>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-xs font-semibold">
                  {thread.author_name.charAt(0).toUpperCase()}
                </div>
                <span>{thread.author_name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}</span>
                <span>{formatTime(thread.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Replies */}
          {replies.length > 0 && (
            <div className="space-y-4 mb-6">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </p>
              {replies.map((reply) => (
                <div key={reply.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {reply.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{reply.author_name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatTime(reply.created_at)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply composer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Add a reply</h3>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts or answer..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePostReply}
                disabled={!replyContent.trim() || posting}
                className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post reply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default ThreadView;
