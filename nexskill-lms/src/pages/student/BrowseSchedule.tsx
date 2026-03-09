import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

const BrowseSchedule: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StudentAppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#111827] mb-2">Browse Schedule</h1>
              <p className="text-lg text-[#5F6473]">
                Find and book coaching sessions with expert instructors
              </p>
            </div>
            <button
              onClick={() => navigate('/student/live-classes')}
              className="px-6 py-3 bg-[#304DB5] text-white font-semibold rounded-xl hover:bg-[#5E7BFF] transition-colors"
            >
              ← Back to Live Classes
            </button>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">🚀</span>
          <div>
            <p className="text-lg font-semibold text-amber-800 mb-1">Coaching Schedule — Coming Soon</p>
            <p className="text-sm text-amber-700">
              We're building a scheduling system so you can browse available time slots and book 1:1 sessions with coaches.
              In the meantime, check out your enrolled courses' live sessions.
            </p>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-lg border border-[#EDF0FB] dark:border-gray-700 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">No schedules available yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
            Coach availability and scheduling features are being developed
          </p>
          <button
            onClick={() => navigate('/student/live-classes')}
            className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            View Live Classes
          </button>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default BrowseSchedule;