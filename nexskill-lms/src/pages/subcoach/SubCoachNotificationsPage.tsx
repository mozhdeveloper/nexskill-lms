import React, { useState } from 'react';
import SubCoachAppLayout from '../../layouts/SubCoachAppLayout';
import SubCoachNotificationList from '../../components/subcoach/SubCoachNotificationList';

const SubCoachNotificationsPage: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');

  // Dummy notifications
  const allNotifications = [
    {
      id: '1',
      type: 'assignment' as const,
      title: 'New Assignment Submitted',
      message: 'Emma Wilson submitted"Portfolio Website" assignment',
      timestamp: '5 minutes ago',
      read: false,
    },
    {
      id: '2',
      type: 'question' as const,
      title: 'Student Question',
      message: 'Alex Martinez asked a question in"Color Theory" lesson',
      timestamp: '30 minutes ago',
      read: false,
    },
    {
      id: '3',
      type: 'session' as const,
      title: 'Session Starting Soon',
      message: 'Q&A Session - UI Principles starts in 2 hours',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: '4',
      type: 'assignment' as const,
      title: 'Assignment Graded',
      message: 'You graded David Lee\'s"Final Project" submission',
      timestamp: '3 hours ago',
      read: true,
    },
    {
      id: '5',
      type: 'system' as const,
      title: 'New Student Assigned',
      message: 'Lisa Anderson has been assigned to you in JavaScript Mastery',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: '6',
      type: 'question' as const,
      title: 'Question Answered',
      message: 'Your answer to Sophie Turner\'s question was marked helpful',
      timestamp: '2 days ago',
      read: true,
    },
    {
      id: '7',
      type: 'session' as const,
      title: 'Session Completed',
      message: 'JavaScript Workshop session completed successfully',
      timestamp: '3 days ago',
      read: true,
    },
  ];

  // Filter notifications
  const filteredNotifications = allNotifications.filter((notif) => {
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'unread' && !notif.read) ||
      (filterRead === 'read' && notif.read);
    return matchesType && matchesRead;
  });

  // Statistics
  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const assignmentCount = allNotifications.filter((n) => n.type === 'assignment').length;
  const questionCount = allNotifications.filter((n) => n.type === 'question').length;
  const sessionCount = allNotifications.filter((n) => n.type === 'session').length;

  const handleMarkAsRead = (id: string) => {
    console.log('Mark as read:', id);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
  };

  return (
    <SubCoachAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Notifications</h1>
            <p className="text-sm text-text-secondary">
              Stay updated with student activity and system alerts
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EDF0FB]">
              <div className="text-2xl font-bold text-text-primary">{allNotifications.length}</div>
              <div className="text-xs text-text-secondary mt-1">Total Notifications</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{unreadCount}</div>
              <div className="text-xs text-blue-600 mt-1">Unread</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{assignmentCount}</div>
              <div className="text-xs text-purple-600 mt-1">Assignments</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{questionCount}</div>
              <div className="text-xs text-green-600 mt-1">Questions</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-5 border border-cyan-200">
              <div className="text-2xl font-bold text-cyan-700">{sessionCount}</div>
              <div className="text-xs text-cyan-600 mt-1">Sessions</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Filter by Type */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="assignment">Assignments</option>
                  <option value="question">Questions</option>
                  <option value="session">Sessions</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Filter by Read Status */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterRead}
                  onChange={(e) => setFilterRead(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
            </div>

            <div className="mt-3 text-xs text-text-secondary">
              Showing {filteredNotifications.length} of {allNotifications.length} notifications
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Your Notifications</h3>
            <SubCoachNotificationList
              notifications={filteredNotifications}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-dashed border-cyan-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                🔔
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Managing Notifications</h4>
                <ul className="space-y-1 text-xs text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>You'll receive notifications for student activity in your assigned courses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Assignment submissions and questions require your attention within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Session reminders help you prepare materials in advance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>System notifications keep you informed of course updates and student assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Update your notification preferences in your profile settings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubCoachAppLayout>
  );
};

export default SubCoachNotificationsPage;
