import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import AdminKpiSummary from '../../components/admin/dashboard/AdminKpiSummary';
import AdminRevenueOverview from '../../components/admin/dashboard/AdminRevenueOverview';
import AdminPlatformAnalytics from '../../components/admin/dashboard/AdminPlatformAnalytics';
import AdminSystemAlerts from '../../components/admin/dashboard/AdminSystemAlerts';

type TimeframeOption = 'Today' | 'Last 7 days' | 'Last 30 days' | 'All time';

const AdminDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  // Dummy KPI data (items 110-111 + more)
  const kpiSummary = {
    totalUsers: 12480,
    usersGrowth: '+320 vs last 30 days',
    totalCoaches: 210,
    coachesGrowth: '+8 this month',
    activeCourses: 847,
    coursesGrowth: '+42 this month',
    activeStudents: 8934,
    studentsGrowth: '+1,205 this week',
    avgRating: 4.7,
    ratingChange: '+0.2 vs last period',
  };

  // Dummy revenue data (item 112)
  const revenueSummary = {
    gross: 248750,
    net: 186562,
    refundRate: 2.3,
    trendData: [
      { period: 'Week 1', amount: 32500 },
      { period: 'Week 2', amount: 38200 },
      { period: 'Week 3', amount: 29800 },
      { period: 'Week 4', amount: 41500 },
      { period: 'Week 5', amount: 36200 },
      { period: 'Week 6', amount: 34800 },
      { period: 'Week 7', amount: 35750 },
    ],
  };

  // Dummy platform analytics (item 113)
  const platformAnalytics = {
    dau: 3245,
    mau: 9872,
    dauMauRatio: 32.9,
    avgSessionsPerUser: 4.2,
    avgTimePerSession: '18m 34s',
    topGeographies: [
      { country: 'Philippines', percentage: 42 },
      { country: 'United States', percentage: 28 },
      { country: 'United Arab Emirates', percentage: 18 },
    ],
    topDevices: [
      { device: 'Desktop', percentage: 58 },
      { device: 'Mobile', percentage: 35 },
      { device: 'Tablet', percentage: 7 },
    ],
  };

  // Dummy system alerts (item 114)
  const systemAlerts = [
    {
      id: 'alert-1',
      severity: 'critical' as const,
      title: 'High error rate on video processing queue',
      description:
        'Video encoding service experiencing elevated failure rate (12.5%). Investigating CDN health.',
      timestamp: '2 hours ago',
      resolved: false,
    },
    {
      id: 'alert-2',
      severity: 'warning' as const,
      title: 'Webhook failures detected for payment provider',
      description:
        'Stripe webhook endpoint returned 503 errors for 8 consecutive requests. Retries scheduled.',
      timestamp: '5 hours ago',
      resolved: false,
    },
    {
      id: 'alert-3',
      severity: 'info' as const,
      title: 'Scheduled maintenance window upcoming',
      description:
        'Database migration planned for Dec 8, 2025 at 02:00 UTC. Expected downtime: 15 minutes.',
      timestamp: '1 day ago',
      resolved: false,
    },
    {
      id: 'alert-4',
      severity: 'warning' as const,
      title: 'API rate limit approaching threshold',
      description:
        'Third-party analytics API usage at 87% of monthly quota. Consider upgrading plan.',
      timestamp: '3 days ago',
      resolved: false,
    },
  ];

  const timeframeOptions: TimeframeOption[] = ['Today', 'Last 7 days', 'Last 30 days', 'All time'];

  return (
    <AdminAppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] mb-2">Admin Dashboard</h1>
            <p className="text-[#5F6473]">Monitor NexSkill usage, revenue, and system health</p>
          </div>
          <div className="flex items-center gap-3">

            {/* Timeframe Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] text-sm font-semibold rounded-full hover:border-[#304DB5] transition-colors flex items-center gap-2"
              >
                <span>📅 {timeframe}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showTimeframeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-2 z-10">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTimeframe(option);
                        setShowTimeframeDropdown(false);
                        window.alert(`📊 Timeframe Updated\n\nSelected Period: ${option}\n\n📈 Dashboard Analytics:\n• Refreshing all metrics\n• Loading comparison data\n• Updating trend graphs\n• Recalculating KPIs\n\n💡 What's Included:\n• Revenue & enrollment data\n• User engagement metrics\n• Course performance stats\n• Growth comparisons\n\nAll widgets will update with ${option} data.`);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F5F7FF] transition-colors ${
                        timeframe === option
                          ? 'text-[#304DB5] font-semibold'
                          : 'text-[#5F6473]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Summary (items 110-111 + more) */}
        <AdminKpiSummary summary={kpiSummary} />

        {/* Revenue + Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Overview (item 112) */}
          <AdminRevenueOverview summary={revenueSummary} timeframe={timeframe} />

          {/* Platform Analytics (item 113) */}
          <AdminPlatformAnalytics analytics={platformAnalytics} />
        </div>

        {/* System Alerts (item 114) */}
        <AdminSystemAlerts alerts={systemAlerts} />
      </div>
    </AdminAppLayout>
  );
};

export default AdminDashboard;
