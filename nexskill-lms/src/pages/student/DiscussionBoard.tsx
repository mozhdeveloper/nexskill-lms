import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
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

const dummyThreads: Thread[] = [
  {
    id: '1',
    title: 'Best practices for managing global state in React?',
    excerpt: 'I\'ve been working on a large application and struggling to decide between Context API and Redux. What do you all recommend for...',
    courseTag: 'Advanced React Patterns',
    authorName: 'Sarah Chen',
    replyCount: 12,
    lastActivity: '2 hours ago',
    reactionCount: 18,
  },
  {
    id: '2',
    title: 'How to optimize performance in large component trees?',
    excerpt: 'My app has a deeply nested component structure and I\'m seeing performance issues. I\'ve tried React.memo but...',
    courseTag: 'React Performance',
    authorName: 'Michael Torres',
    replyCount: 8,
    lastActivity: '5 hours ago',
    reactionCount: 14,
  },
  {
    id: '3',
    title: 'Question about CSS Grid vs Flexbox for responsive layouts',
    excerpt: 'I\'m redesigning my portfolio and can\'t decide which layout system to use. What are the pros and cons of each?',
    courseTag: 'UI Design Basics',
    authorName: 'Priya Patel',
    replyCount: 15,
    lastActivity: 'Yesterday',
    reactionCount: 22,
  },
  {
    id: '4',
    title: 'TypeScript generics are confusing me',
    excerpt: 'I understand the basics of TypeScript but generics still don\'t click. Can someone explain with a practical example?',
    courseTag: 'TypeScript Fundamentals',
    authorName: 'Jamal Williams',
    replyCount: 6,
    lastActivity: '1 day ago',
    reactionCount: 9,
  },
  {
    id: '5',
    title: 'What\'s the best way to handle form validation?',
    excerpt: 'I\'ve been using plain React state for forms but it\'s getting messy. Should I use a library like Formik or React Hook Form?',
    courseTag: 'React Forms',
    authorName: 'Emma Rodriguez',
    replyCount: 10,
    lastActivity: '2 days ago',
    reactionCount: 16,
  },
  {
    id: '6',
    title: 'Advice for junior developers starting their first job?',
    excerpt: 'I just accepted my first developer position and I\'m nervous. What should I focus on in my first few months?',
    courseTag: 'Career Development',
    authorName: 'Alex Kim',
    replyCount: 24,
    lastActivity: '3 days ago',
    reactionCount: 35,
  },
  {
    id: '7',
    title: 'Testing async functions with Jest - help needed',
    excerpt: 'I\'m having trouble mocking API calls in my tests. The async/await syntax isn\'t working as expected...',
    courseTag: 'Testing React Apps',
    authorName: 'David Lee',
    replyCount: 5,
    lastActivity: '4 days ago',
    reactionCount: 7,
  },
  {
    id: '8',
    title: 'How do you organize your component folder structure?',
    excerpt: 'My project is growing and I need a better way to organize components. What patterns do you use for file structure?',
    courseTag: 'React Architecture',
    authorName: 'Olivia Martinez',
    replyCount: 18,
    lastActivity: '1 week ago',
    reactionCount: 28,
  },
];

const DiscussionBoard: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'my-courses', label: 'My courses' },
    { id: 'popular', label: 'Popular' },
    { id: 'unanswered', label: 'Unanswered' },
  ];

  const handleNewPost = (content: string) => {
    console.log('New post:', content);
    // In a real app, this would create a new thread
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/student/community/threads/${threadId}`);
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Community discussions</h1>
            <p className="text-slate-600">Ask questions, share insights, and learn with others.</p>
          </div>

          {/* Filter chips */}
          <div className="flex gap-3 mb-6">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
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
            {dummyThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="w-full bg-white dark:bg-dark-background-card rounded-2xl shadow-sm hover:shadow-md border border-slate-200 p-6 transition-all text-left"
              >
                {/* Thread header */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-[#304DB5] transition-colors">
                    {thread.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2">{thread.excerpt}</p>
                </div>

                {/* Thread metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 text-[#304DB5] text-xs font-medium rounded-full">
                      {thread.courseTag}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-xs font-semibold">
                        {thread.authorName.charAt(0)}
                      </div>
                      <span className="text-sm text-slate-600">{thread.authorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
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
    </StudentAppLayout>
  );
};

export default DiscussionBoard;
