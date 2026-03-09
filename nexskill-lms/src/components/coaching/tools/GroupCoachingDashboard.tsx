import React, { useState } from 'react';

interface GroupSession {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  maxParticipants: number;
  enrolled: number;
  price: number;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

const GroupCoachingDashboard: React.FC = () => {
  const [groupSessions] = useState<GroupSession[]>([
    {
      id: 'group-1',
      title: 'Advanced Marketing Strategy Workshop',
      date: '2024-01-22',
      time: '02:00 PM',
      duration: 120,
      maxParticipants: 20,
      enrolled: 18,
      price: 149,
      status: 'Scheduled',
    },
    {
      id: 'group-2',
      title: 'SEO Masterclass',
      date: '2024-01-25',
      time: '10:00 AM',
      duration: 90,
      maxParticipants: 15,
      enrolled: 12,
      price: 99,
      status: 'Scheduled',
    },
    {
      id: 'group-3',
      title: 'Content Creation Bootcamp',
      date: '2024-01-18',
      time: '03:00 PM',
      duration: 150,
      maxParticipants: 25,
      enrolled: 25,
      price: 199,
      status: 'Completed',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalEnrolled = groupSessions.reduce((sum, session) => sum + session.enrolled, 0);
  const totalRevenue = groupSessions.reduce(
    (sum, session) => sum + session.enrolled * session.price,
    0
  );
  const avgAttendance =
    groupSessions.length > 0
      ? Math.round(
          (groupSessions.reduce((sum, s) => sum + (s.enrolled / s.maxParticipants) * 100, 0) /
            groupSessions.length)
        )
      : 0;
  const upcomingSessions = groupSessions.filter((s) => s.status === 'Scheduled').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-[#304DB5] text-white';
      case 'In Progress':
        return 'bg-[#22C55E] text-white';
      case 'Completed':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getEnrollmentColor = (enrolled: number, max: number) => {
    const percentage = (enrolled / max) * 100;
    if (percentage >= 90) return 'text-[#22C55E]';
    if (percentage >= 50) return 'text-[#F97316]';
    return 'text-[#9CA3B5]';
  };

  const viewParticipants = (sessionId: string) => {
    console.log('Viewing participants for session:', sessionId);
    alert('Would show participant list modal');
  };

  const editSession = (sessionId: string) => {
    console.log('Editing session:', sessionId);
    alert('Would open session edit modal');
  };

  const sendReminder = (sessionId: string) => {
    console.log('Sending reminder for session:', sessionId);
    alert('Reminder emails sent to all participants!');
  };

  const createNewSession = () => {
    console.log('Creating new group session');
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#111827]">Group Coaching Dashboard</h3>
          <p className="text-sm text-[#5F6473] mt-1">
            Manage group sessions, participants, and revenue
          </p>
        </div>
        <button
          onClick={createNewSession}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Session
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Total Enrolled</p>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-4xl font-bold">{totalEnrolled}</p>
          <p className="text-xs opacity-80 mt-1">Across all sessions</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#5F6473]">Total Revenue</p>
            <svg
              className="w-8 h-8 text-[#22C55E]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-4xl font-bold text-[#111827]">₱{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-[#9CA3B5] mt-1">From group sessions</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#5F6473]">Avg Attendance</p>
            <svg
              className="w-8 h-8 text-[#F97316]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-4xl font-bold text-[#111827]">{avgAttendance}%</p>
          <p className="text-xs text-[#9CA3B5] mt-1">Fill rate</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#5F6473]">Upcoming Sessions</p>
            <svg
              className="w-8 h-8 text-[#304DB5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-4xl font-bold text-[#111827]">{upcomingSessions}</p>
          <p className="text-xs text-[#9CA3B5] mt-1">Scheduled</p>
        </div>
      </div>

      {/* Sessions List */}
      <div>
        <h4 className="text-lg font-bold text-[#111827] mb-4">All Group Sessions</h4>
        <div className="space-y-4">
          {groupSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-[#EDF0FB] p-6 hover:border-[#304DB5] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Session Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-lg font-bold text-[#111827]">{session.title}</h5>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Date & Time</p>
                      <p className="font-medium text-[#111827]">{session.date}</p>
                      <p className="text-xs text-[#5F6473]">{session.time}</p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Duration</p>
                      <p className="font-medium text-[#111827]">{session.duration} min</p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Enrollment</p>
                      <p
                        className={`font-bold ${getEnrollmentColor(
                          session.enrolled,
                          session.maxParticipants
                        )}`}
                      >
                        {session.enrolled} / {session.maxParticipants}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#9CA3B5] text-xs mb-1">Price</p>
                      <p className="font-medium text-[#111827]">₱{session.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewParticipants(session.id)}
                    className="px-4 py-2 text-sm font-medium text-[#304DB5] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Participants
                  </button>
                  {session.status === 'Scheduled' && (
                    <button
                      onClick={() => sendReminder(session.id)}
                      className="px-4 py-2 text-sm font-medium text-[#22C55E] hover:bg-green-50 rounded-lg transition-colors"
                    >
                      Send Reminder
                    </button>
                  )}
                  <button
                    onClick={() => editSession(session.id)}
                    className="px-4 py-2 text-sm font-medium text-[#5F6473] hover:bg-[#F5F7FF] rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#9CA3B5] mb-1">
                  <span>Enrollment Progress</span>
                  <span>
                    {Math.round((session.enrolled / session.maxParticipants) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#EDF0FB] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full transition-all"
                    style={{
                      width: `${(session.enrolled / session.maxParticipants) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {groupSessions.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#EDF0FB] p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg text-[#5F6473] mb-2">No group sessions yet</p>
            <p className="text-sm text-[#9CA3B5] mb-4">
              Create your first group session to get started
            </p>
            <button
              onClick={createNewSession}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Create Session
            </button>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-[#111827] mb-6">Create Group Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Advanced Marketing Workshop"
                  className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    placeholder="90"
                    className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    placeholder="149"
                    className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    console.log('Creating group session');
                    setShowCreateModal(false);
                    alert('Group session created!');
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  Create Session
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-[#5F6473] font-medium rounded-full hover:bg-[#F5F7FF] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCoachingDashboard;
