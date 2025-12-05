import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import SessionSummaryCard from '../../components/coaching/SessionSummaryCard';

// Dummy sessions data
const upcomingSessions = [
  {
    id: 'session-1',
    type: 'upcoming' as const,
    coach: { name: 'Dr. Emily Chen' },
    datetime: 'Mon, Dec 8 at 2:00 PM',
    status: 'Confirmed' as const,
    topic: 'Career transition strategy and resume review',
  },
  {
    id: 'session-2',
    type: 'upcoming' as const,
    coach: { name: 'Michael Rodriguez' },
    datetime: 'Wed, Dec 10 at 10:00 AM',
    status: 'Confirmed' as const,
    topic: 'React component optimization and best practices',
  },
  {
    id: 'session-3',
    type: 'upcoming' as const,
    coach: { name: 'Sarah Thompson' },
    datetime: 'Fri, Dec 12 at 1:00 PM',
    status: 'Confirmed' as const,
    topic: 'Machine learning model evaluation techniques',
  },
];

const pastSessions = [
  {
    id: 'session-4',
    type: 'past' as const,
    coach: { name: 'Dr. Emily Chen' },
    datetime: 'Mon, Nov 25 at 3:00 PM',
    status: 'Completed' as const,
    summary: 'Discussed career goals and developed a 90-day action plan.',
    notes: 'Focus on highlighting cross-functional project leadership in resume. Target product management roles at mid-size tech companies. Practice STAR method for behavioral interviews. Follow up in 3 weeks to review progress on applications.',
  },
  {
    id: 'session-5',
    type: 'past' as const,
    coach: { name: 'Michael Rodriguez' },
    datetime: 'Thu, Nov 21 at 11:00 AM',
    status: 'Completed' as const,
    summary: 'Reviewed personal project code and discussed React patterns.',
    notes: 'Great progress on the e-commerce app. Consider implementing useMemo for product filtering. Extract reusable hooks for API calls. Look into React Query for better data fetching. Next session: advanced state management with Context API.',
  },
  {
    id: 'session-6',
    type: 'past' as const,
    coach: { name: 'David Kim' },
    datetime: 'Tue, Nov 19 at 9:00 AM',
    status: 'Completed' as const,
    summary: 'AWS architecture review and deployment strategies.',
    notes: 'Current setup is solid. Recommend moving to ECS for better container orchestration. Set up CI/CD pipeline with GitHub Actions. Consider implementing blue-green deployment for zero-downtime releases. Schedule follow-up to review implementation.',
  },
  {
    id: 'session-7',
    type: 'past' as const,
    coach: { name: 'Sarah Thompson' },
    datetime: 'Fri, Nov 15 at 2:00 PM',
    status: 'Completed' as const,
    summary: 'Introduction to neural networks and deep learning fundamentals.',
    notes: 'Good understanding of linear regression and basic ML concepts. Start with simple neural network implementations in PyTorch. Work through the fast.ai course for practical deep learning. Build a CNN for image classification as practice project.',
  },
];

const CoachingSessions: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">My sessions</h1>
              <p className="text-lg text-slate-600">Manage and review your coaching sessions</p>
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
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">{upcomingSessions.length}</div>
              <div className="text-sm text-slate-600">Upcoming sessions</div>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">{pastSessions.length}</div>
              <div className="text-sm text-slate-600">Completed sessions</div>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="text-3xl font-bold text-[#304DB5] mb-1">$15</div>
              <div className="text-sm text-slate-600">Available credits</div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 mb-6">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'upcoming'
                    ? 'text-[#304DB5] border-b-2 border-[#304DB5]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === 'past'
                    ? 'text-[#304DB5] border-b-2 border-[#304DB5]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past ({pastSessions.length})
              </button>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'upcoming' && (
                <div className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <SessionSummaryCard key={session.id} session={session} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-slate-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-lg text-slate-600 mb-2">No upcoming sessions</p>
                      <p className="text-sm text-slate-500 mb-4">Book a session to get started</p>
                      <button
                        onClick={() => navigate('/student/coaching')}
                        className="px-6 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                      >
                        Browse coaches
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'past' && (
                <div className="space-y-4">
                  {pastSessions.length > 0 ? (
                    pastSessions.map((session) => <SessionSummaryCard key={session.id} session={session} />)
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-slate-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-lg text-slate-600 mb-2">No past sessions yet</p>
                      <p className="text-sm text-slate-500">Your completed sessions will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachingSessions;
