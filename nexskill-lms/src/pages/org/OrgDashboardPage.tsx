import React from 'react';
import { Link } from 'react-router-dom';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';
import OrgOwnerKpiStrip from '../../components/org/OrgOwnerKpiStrip';
import OrgSeatsSummaryCard from '../../components/org/OrgSeatsSummaryCard';
import OrgAnalyticsOverview from '../../components/org/OrgAnalyticsOverview';

const OrgDashboardPage: React.FC = () => {
  const handleDownloadReport = () => {
    console.log('Downloading report...');
    alert('Report download started!');
  };

  const handleInviteMembers = () => {
    console.log('Opening invite modal...');
    alert('Invite members modal would open here');
  };

  return (
    <OrgOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              Organization Dashboard
            </h1>
            <p className="text-sm text-text-secondary">
              Overview of seats, learners, and performance for your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-white border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
            >
              📥 Download Report
            </button>
            <button 
              onClick={handleInviteMembers}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
            >
              👥 Invite Members
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8">
          {/* KPI Strip */}
          <OrgOwnerKpiStrip />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Seats Summary */}
            <div>
              <OrgSeatsSummaryCard />
            </div>

            {/* Right: Analytics Preview */}
            <div>
              <OrgAnalyticsOverview compact={true} />
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                to="/org/team"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  👥
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Manage Team</p>
                  <p className="text-xs text-text-muted">5 members</p>
                </div>
              </Link>

              <Link
                to="/org/seats"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  🎫
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Seat Allocation</p>
                  <p className="text-xs text-text-muted">142/200 used</p>
                </div>
              </Link>

              <Link
                to="/org/learners"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  🎓
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">View Learners</p>
                  <p className="text-xs text-text-muted">89 active</p>
                </div>
              </Link>

              <Link
                to="/org/analytics"
                className="flex items-center gap-3 p-4 bg-white rounded-xl hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Full Analytics</p>
                  <p className="text-xs text-text-muted">Detailed reports</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h3 className="text-base font-bold text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { icon: '✅', text: 'Jessica Park completed"JavaScript Fundamentals"', time: '2 hours ago', color: 'bg-green-100' },
                { icon: '👤', text: 'New team member David Kim was added', time: '5 hours ago', color: 'bg-blue-100' },
                { icon: '🎫', text: '12 new seats were allocated to Michael Chen', time: '1 day ago', color: 'bg-orange-100' },
                { icon: '📚', text: '5 learners enrolled in"Product Management Basics"', time: '2 days ago', color: 'bg-purple-100' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.text}</p>
                    <p className="text-xs text-text-muted">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OrgOwnerAppLayout>
  );
};

export default OrgDashboardPage;
