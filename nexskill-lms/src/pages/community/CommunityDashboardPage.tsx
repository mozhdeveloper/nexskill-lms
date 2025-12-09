import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityManagerLayout from '../../layouts/CommunityManagerLayout';
import CommunityKpiStrip from '../../components/community/CommunityKpiStrip';
import CommunityOverviewList from '../../components/community/CommunityOverviewList';
import ApprovalQueueTable from '../../components/community/ApprovalQueueTable';

interface Activity {
  id: number;
  action: string;
  community: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  details?: string;
}

const CommunityDashboardPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, action: 'Approved post', community: 'JavaScript Mastery', time: '5 minutes ago', type: 'success', details: 'Post about React hooks best practices was approved and is now visible.' },
    { id: 2, action: 'Rejected spam', community: 'General Discussion', time: '15 minutes ago', type: 'warning', details: 'Promotional spam post was rejected and user was warned.' },
    { id: 3, action: 'Created announcement', community: 'All Communities', time: '1 hour ago', type: 'info', details: 'Platform maintenance scheduled for next week.' },
    { id: 4, action: 'Archived group', community: 'Old Cohort', time: '2 hours ago', type: 'neutral', details: 'Cohort completed, group archived for reference.' },
    { id: 5, action: 'Added moderator', community: 'UI/UX Design', time: '3 hours ago', type: 'success', details: 'Coach Mike was added as a moderator.' },
  ]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleUndoActivity = (activity: Activity) => {
    setActivities(prev => prev.filter(a => a.id !== activity.id));
    showFeedback(`Action "${activity.action}" has been undone`);
    setSelectedActivity(null);
  };

  return (
    <CommunityManagerLayout>
      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-green-500 text-white">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium">{actionFeedback}</p>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Community Dashboard</h1>
            <p className="text-sm text-text-secondary">
              Monitor engagement, moderation, and group activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => showFeedback('Refreshing dashboard data...')}
              className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
            >
              🔄 Refresh
            </button>
            <Link
              to="/community/approvals"
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
            >
              🛡️ Review Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8">
          {/* KPI Strip */}
          <CommunityKpiStrip />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Top Communities */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Top Communities</h2>
                <Link
                  to="/community/overview"
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  View All →
                </Link>
              </div>
              <CommunityOverviewList limit={5} />
            </div>

            {/* Right: Approval Queue Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Pending Approvals</h2>
                <Link
                  to="/community/approvals"
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  View All →
                </Link>
              </div>
              <ApprovalQueueTable limit={5} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                to="/community/groups"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👥
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Manage Groups</p>
                  <p className="text-xs text-text-muted">15 active</p>
                </div>
              </Link>

              <Link
                to="/community/announcements"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📢
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Announcements</p>
                  <p className="text-xs text-text-muted">Create new</p>
                </div>
              </Link>

              <Link
                to="/community/engagement"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📈
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Engagement</p>
                  <p className="text-xs text-text-muted">View metrics</p>
                </div>
              </Link>

              <Link
                to="/community/overview"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏘️
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">All Communities</p>
                  <p className="text-xs text-text-muted">Browse all</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary">Recent Moderation Activity</h3>
              <button
                onClick={() => showFeedback('Loading full activity history...')}
                className="text-xs px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <span className="text-xl">
                    {activity.type === 'success' ? '✅' : activity.type === 'warning' ? '🚨' : activity.type === 'info' ? '📢' : '📦'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                    <p className="text-xs text-text-muted">{activity.community} • {activity.time}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActivity(activity);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Details
                  </button>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {selectedActivity.type === 'success' ? '✅' : selectedActivity.type === 'warning' ? '🚨' : selectedActivity.type === 'info' ? '📢' : '📦'}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedActivity.action}</h3>
                    <p className="text-sm text-text-muted">{selectedActivity.time}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedActivity(null)} className="text-2xl text-text-muted hover:text-text-primary">×</button>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <p className="text-sm text-text-secondary mb-2">
                  <strong>Community:</strong> {selectedActivity.community}
                </p>
                <p className="text-sm text-text-secondary">
                  <strong>Details:</strong> {selectedActivity.details}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    showFeedback(`Navigating to ${selectedActivity.community}...`);
                    setSelectedActivity(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium"
                >
                  Go to Community
                </button>
                {selectedActivity.type !== 'neutral' && (
                  <button
                    onClick={() => handleUndoActivity(selectedActivity)}
                    className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 text-sm font-medium"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </CommunityManagerLayout>
  );
};

export default CommunityDashboardPage;
