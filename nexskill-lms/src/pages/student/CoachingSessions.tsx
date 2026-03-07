import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

const CoachingSessions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-16 transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My sessions</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">Manage and review your coaching sessions</p>
            </div>
            <button
              onClick={() => navigate('/student/coaching')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Book new session
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">0</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Upcoming sessions</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">0</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed sessions</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="text-3xl font-bold text-[#304DB5] dark:text-blue-400 mb-1">—</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Available credits</div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'upcoming'
                    ? 'text-[#304DB5] dark:text-blue-400 border-b-2 border-[#304DB5] dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Upcoming (0)
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'past'
                    ? 'text-[#304DB5] dark:text-blue-400 border-b-2 border-[#304DB5] dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Past (0)
              </button>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={activeTab === 'upcoming'
                        ? 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                        : 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      }
                    />
                  </svg>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                  {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                  {activeTab === 'upcoming'
                    ? 'Book a 1:1 session with a coach to get started'
                    : 'Your completed sessions will appear here'}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/student/coaching')}
                    className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                  >
                    Browse coaches
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingSessions;
