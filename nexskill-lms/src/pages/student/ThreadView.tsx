import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

// No discussion_threads table yet — shows empty state
const ThreadView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/student/community')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-[#304DB5] dark:hover:text-blue-400 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to discussions
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-md p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thread not found</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              This discussion thread does not exist or has not been created yet.
            </p>
            <button
              onClick={() => navigate('/student/community')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Browse discussions
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default ThreadView;
