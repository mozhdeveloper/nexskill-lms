import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ReactionBar from '../../components/community/ReactionBar';
import CommentThread from '../../components/community/CommentThread';
import PostComposer from '../../components/community/PostComposer';
import ReportContentModal from '../../components/community/ReportContentModal';

interface Thread {
  id: string;
  title: string;
  courseTag: string;
  authorName: string;
  createdAt: string;
  body: string;
  reactions: { type: string; count: number; emoji?: string }[];
}

const dummyThread: Thread = {
  id: '1',
  title: 'Best practices for managing global state in React?',
  courseTag: 'Advanced React Patterns',
  authorName: 'Sarah Chen',
  createdAt: '2 hours ago',
  body: `I've been working on a large application and struggling to decide between Context API and Redux. What do you all recommend for managing global state?

My app has about 20 different components that need access to user authentication state and some shared data from API calls. I've heard Context can cause performance issues with frequent updates, but Redux seems like overkill for my use case.

Has anyone dealt with a similar situation? What factors helped you make your decision? I'd love to hear about your experiences and any gotchas to watch out for.`,
  reactions: [
    { type: 'like', count: 12 },
    { type: 'helpful', count: 6, emoji: '💡' },
  ],
};

const dummyComments = [
  {
    id: 'c1',
    authorName: 'Michael Torres',
    createdAt: '1 hour ago',
    body: 'I faced the same dilemma last year. For your use case, I\'d recommend starting with Context API. It\'s built into React and handles your requirements well without the extra complexity of Redux.',
    reactions: [
      { type: 'like', count: 8 },
      { type: 'helpful', count: 4, emoji: '💡' },
    ],
    replies: [
      {
        id: 'c1-r1',
        authorName: 'Sarah Chen',
        createdAt: '45 minutes ago',
        body: 'Thanks! Did you run into any performance issues with Context as your app grew?',
        reactions: [{ type: 'like', count: 2 }],
      },
      {
        id: 'c1-r2',
        authorName: 'Michael Torres',
        createdAt: '30 minutes ago',
        body: 'Not really. The key is splitting your contexts by concern. I have separate contexts for auth and API data. This way, components only re-render when their specific context changes.',
        reactions: [
          { type: 'like', count: 5 },
          { type: 'helpful', count: 3, emoji: '💡' },
        ],
      },
    ],
  },
  {
    id: 'c2',
    authorName: 'Priya Patel',
    createdAt: '50 minutes ago',
    body: 'Another option to consider is Zustand. It\'s a lightweight state management library that\'s easier to learn than Redux but more scalable than Context for frequent updates.',
    reactions: [
      { type: 'like', count: 6 },
      { type: 'helpful', count: 2, emoji: '💡' },
    ],
  },
  {
    id: 'c3',
    authorName: 'David Lee',
    createdAt: '35 minutes ago',
    body: 'I\'d echo what Michael said about Context. For 20 components, it\'s perfect. Redux becomes worth it when you need time-travel debugging, middleware for complex async logic, or have 100+ components sharing state.',
    reactions: [
      { type: 'like', count: 4 },
      { type: 'agree', count: 3, emoji: '👍' },
    ],
  },
  {
    id: 'c4',
    authorName: 'Emma Rodriguez',
    createdAt: '20 minutes ago',
    body: 'One more thing: consider using React Query (TanStack Query) for your API data. It handles caching, refetching, and synchronization beautifully, which means you might not need to put API data in global state at all!',
    reactions: [
      { type: 'like', count: 7 },
      { type: 'helpful', count: 5, emoji: '💡' },
      { type: 'celebrate', count: 2, emoji: '🙌' },
    ],
    replies: [
      {
        id: 'c4-r1',
        authorName: 'Sarah Chen',
        createdAt: '10 minutes ago',
        body: 'Oh wow, I hadn\'t thought about that! That could simplify things a lot. Thanks for the suggestion!',
        reactions: [{ type: 'like', count: 3 }],
      },
    ],
  },
  {
    id: 'c5',
    authorName: 'Jamal Williams',
    createdAt: '5 minutes ago',
    body: 'Great discussion everyone! I learned a lot from reading through these responses. This community is amazing 🔥',
    reactions: [
      { type: 'like', count: 2 },
      { type: 'celebrate', count: 1, emoji: '🙌' },
    ],
  },
];

const ThreadView: React.FC = () => {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const [comments, setComments] = useState(dummyComments);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleReact = (type: string) => {
    console.log('Reacted with:', type);
  };

  const handleReply = (commentId: string, content: string) => {
    console.log('Reply to', commentId, ':', content);
    // In a real app, this would add the reply to the comments
  };

  const handleNewComment = (content: string) => {
    const newComment = {
      id: `c${comments.length + 1}`,
      authorName: 'You',
      createdAt: 'Just now',
      body: content,
      reactions: [{ type: 'like', count: 0 }],
    };
    setComments([...comments, newComment]);
  };

  const handleReport = (reason: string, details?: string) => {
    console.log('Reported content:', { reason, details, threadId });
    // In a real app, this would submit the report to the backend
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate('/student/community')}
            className="flex items-center gap-2 text-slate-600 hover:text-[#304DB5] mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to discussions
          </button>

          {/* Thread metadata */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-[#304DB5] text-xs font-medium rounded-full">
                {dummyThread.courseTag}
              </span>
              <span className="text-sm text-slate-600">
                by {dummyThread.authorName} • {dummyThread.createdAt} • {comments.length} replies
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{dummyThread.title}</h1>
          </div>

          {/* Original post */}
          <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-md p-8 mb-6">
            {/* Author info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {dummyThread.authorName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{dummyThread.authorName}</div>
                <div className="text-sm text-slate-500">{dummyThread.createdAt}</div>
              </div>
            </div>

            {/* Post body */}
            <div className="prose prose-slate max-w-none mb-6">
              {dummyThread.body.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-slate-700 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Reactions and actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <ReactionBar reactions={dummyThread.reactions} onReact={handleReact} />
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                Report
              </button>
            </div>
          </div>

          {/* Comments section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}
            </h2>
            <CommentThread comments={comments} onReply={handleReply} />
          </div>

          {/* Reply composer */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add your reply</h3>
            <PostComposer mode="reply" onSubmit={handleNewComment} placeholder="Share your thoughts..." />
          </div>
        </div>
      </div>

      {/* Report modal */}
      <ReportContentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReport}
      />
    </StudentAppLayout>
  );
};

export default ThreadView;
