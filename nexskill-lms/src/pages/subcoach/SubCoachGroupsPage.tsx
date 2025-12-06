import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import GroupSessionsList from '../../components/subcoach/GroupSessionsList';

const SubCoachGroupsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    title: '',
    course: '',
    date: '',
    time: '',
    maxCapacity: '20',
    description: '',
  });

  // Dummy sessions data
  const allSessions = [
    {
      id: '1',
      title: 'Q&A Session - UI Principles',
      courseName: 'UI Design Fundamentals',
      dateTime: 'Today, 3:00 PM',
      registeredStudents: 12,
      maxCapacity: 20,
      status: 'Upcoming' as const,
    },
    {
      id: '2',
      title: 'JavaScript Workshop',
      courseName: 'JavaScript Mastery',
      dateTime: 'Tomorrow, 10:00 AM',
      registeredStudents: 8,
      maxCapacity: 15,
      status: 'Upcoming' as const,
    },
    {
      id: '3',
      title: 'Product Strategy Discussion',
      courseName: 'Product Management',
      dateTime: 'Jan 25, 2:00 PM',
      registeredStudents: 6,
      maxCapacity: 10,
      status: 'Upcoming' as const,
    },
    {
      id: '4',
      title: 'Design Critique Session',
      courseName: 'UI Design Fundamentals',
      dateTime: 'Jan 20, 3:00 PM',
      registeredStudents: 15,
      maxCapacity: 20,
      status: 'Completed' as const,
    },
    {
      id: '5',
      title: 'Async JavaScript Deep Dive',
      courseName: 'JavaScript Mastery',
      dateTime: 'Jan 18, 11:00 AM',
      registeredStudents: 10,
      maxCapacity: 15,
      status: 'Completed' as const,
    },
    {
      id: '6',
      title: 'Office Hours',
      courseName: 'UI Design Fundamentals',
      dateTime: 'Jan 15, 4:00 PM',
      registeredStudents: 8,
      maxCapacity: 10,
      status: 'Cancelled' as const,
    },
  ];

  // Filter sessions
  const filteredSessions = allSessions.filter((session) => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    return matchesStatus;
  });

  // Statistics
  const upcomingCount = allSessions.filter((s) => s.status === 'Upcoming').length;
  const completedCount = allSessions.filter((s) => s.status === 'Completed').length;
  const cancelledCount = allSessions.filter((s) => s.status === 'Cancelled').length;

  const handleScheduleSession = () => {
    window.alert(`✅ Group Session Scheduled Successfully\n\nTitle: ${newSession.title}\nCourse: ${newSession.course}\nDate: ${newSession.date}\nTime: ${newSession.time}\nCapacity: ${newSession.maxCapacity} students\n\n📋 Session Details:\n${newSession.description}\n\n📧 Student Notifications:\n• Email invitations: Sending\n• Calendar invites: Sent\n• In-app reminders: Scheduled\n• SMS notifications: 1 hour before\n\n🔗 Session Access:\n• Meeting link: Generated\n• Materials: Ready to upload\n• Recording: Will be enabled\n• Chat: Available\n\n⏰ Automated Reminders:\n• 24 hours before\n• 1 hour before\n• 15 minutes before\n\n💡 Students can join 10 minutes early. Prepare your materials and test your setup beforehand.`);
    setShowScheduleModal(false);
    setNewSession({ title: '', course: '', date: '', time: '', maxCapacity: '20', description: '' });
  };

  const handleViewDetails = (id: string) => {
    setSelectedSession(id);
    setShowDetailsModal(true);
  };

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Group Sessions</h1>
          <p className="text-sm text-text-secondary">
            Manage live sessions and workshops
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EDF0FB]">
              <div className="text-2xl font-bold text-text-primary">{allSessions.length}</div>
              <div className="text-xs text-text-secondary mt-1">Total Sessions</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{upcomingCount}</div>
              <div className="text-xs text-blue-600 mt-1">Upcoming</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{completedCount}</div>
              <div className="text-xs text-green-600 mt-1">Completed</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200">
              <div className="text-2xl font-bold text-gray-700">{cancelledCount}</div>
              <div className="text-xs text-gray-600 mt-1">Cancelled</div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Sessions</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="text-xs text-text-secondary">
                Showing {filteredSessions.length} of {allSessions.length} sessions
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Your Sessions</h3>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
              >
                + Schedule Session
              </button>
            </div>
            <GroupSessionsList
              sessions={filteredSessions}
              onViewDetails={handleViewDetails}
            />
          </div>

          {/* Session Management Tips */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-dashed border-cyan-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                🎥
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Session Management Tips</h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>You can schedule sessions for courses you support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Prepare materials and review common questions 24 hours before each session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Record sessions when possible so students can review later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Share session recordings and notes with students after completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Contact your supervising coach to cancel or reschedule sessions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Access Notice */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                🔒
              </div>
              <div>
                <h5 className="text-xs font-bold text-text-primary mb-1">Limited Session Management</h5>
                <p className="text-xs text-text-secondary">
                  You can schedule and host sessions for courses assigned to you. For changes to recurring session schedules or bulk session management, please contact your supervising coach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h3 className="text-xl font-bold text-text-primary">Schedule New Session</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder="e.g., Q&A Session - UI Principles"
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Course
                </label>
                <select
                  value={newSession.course}
                  onChange={(e) => setNewSession({ ...newSession, course: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="">Select a course</option>
                  <option value="UI Design Fundamentals">UI Design Fundamentals</option>
                  <option value="JavaScript Mastery">JavaScript Mastery</option>
                  <option value="Product Management">Product Management</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={newSession.maxCapacity}
                  onChange={(e) => setNewSession({ ...newSession, maxCapacity: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Brief description of the session..."
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSession}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all"
              >
                Schedule Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#EDF0FB] flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">Session Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const session = allSessions.find((s) => s.id === selectedSession);
                if (!session) return null;
                return (
                  <>
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200">
                      <h4 className="text-lg font-bold text-text-primary mb-2">{session.title}</h4>
                      <p className="text-sm text-text-secondary">{session.courseName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs text-text-secondary mb-1">Date & Time</div>
                        <div className="text-sm font-semibold text-text-primary">{session.dateTime}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs text-text-secondary mb-1">Status</div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-lg ${
                          session.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{session.status}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-xs text-text-secondary mb-1">Registrations</div>
                      <div className="text-sm font-semibold text-text-primary">
                        {session.registeredStudents} / {session.maxCapacity} students
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          style={{ width: `${(session.registeredStudents / session.maxCapacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          alert('✉️ Email sent to all registered students!');
                          const session = allSessions.find(s => s.id === selectedSession);
                          window.alert(`📧 Session Reminder Sent\n\nSession: ${session?.title}\nScheduled: ${session?.dateTime}\n\n👥 Notifications Sent To:\n• Registered students: ${session?.registeredStudents}\n• Total recipients: ${session?.registeredStudents}\n\n📨 Reminder Contents:\n• Session details and time\n• Meeting link\n• Preparation materials\n• What to bring\n• Technical requirements\n\n✅ Delivery Status:\n• Email: Sent\n• Push notifications: Delivered\n• SMS: Sent (optional)\n• In-app: Posted\n\n💡 Reminders help ensure better attendance and student preparation for your sessions.`);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-teal-600 border border-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                      >
                        Send Reminder
                      </button>
                      {session.status === 'Upcoming' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this session?')) {
                              alert('❌ Session cancelled. Students will be notified.');
                              setShowDetailsModal(false);
                            }
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          Cancel Session
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </SubCoachAppLayout>
  );
};

export default SubCoachGroupsPage;
