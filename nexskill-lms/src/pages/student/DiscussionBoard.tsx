import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PostComposer from '../../components/community/PostComposer';

interface Thread {
  id: string;
  title: string;
  excerpt: string;
  courseTag: string;
  authorName: string;
  replyCount: number;
  lastActivity: string;
  reactionCount: number;
}

// No discussion_threads table yet — empty state shown below
const threads: Thread[] = [];

const DiscussionBoard: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'my-courses', label: 'My courses' },
    { id: 'popular', label: 'Popular' },
    { id: 'unanswered', label: 'Unanswered' },
  ];

  const handleNewPost = (_content: string) => {
    // No discussion_threads table yet — feature coming soon
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/student/community/threads/${threadId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/my-courses')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to My Courses</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Community discussions</h1>
          <p className="text-slate-600 dark:text-slate-400">Ask questions, share insights, and learn with others.</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🚀</span>
          <div>
            <p className="font-semibold text-amber-800">Community Discussions — Coming Soon</p>
            <p className="text-sm text-amber-700">We're building a discussion board for you to connect with fellow learners. Stay tuned!</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-3 mb-6">
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

          {/* Post composer */}
          <div className="mb-6">
            <PostComposer mode="newThread" onSubmit={handleNewPost} />
          </div>

          {/* Thread list */}
          <div className="space-y-4">
            {threads.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No discussions yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Be the first to start a conversation! Use the composer above to post a question or share an insight.</p>
              </div>
            )}
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all text-left"
              >
                {/* Thread header */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 hover:text-[#304DB5] dark:hover:text-blue-400 transition-colors">
                    {thread.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{thread.excerpt}</p>
                </div>

                {/* Thread metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-[#304DB5] dark:text-blue-400 text-xs font-medium rounded-full">
                      {thread.courseTag}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-xs font-semibold">
                        {thread.authorName.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{thread.authorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {thread.replyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      {thread.reactionCount}
                    </span>
                    <span>{thread.lastActivity}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    
  );
};

export default DiscussionBoard;
