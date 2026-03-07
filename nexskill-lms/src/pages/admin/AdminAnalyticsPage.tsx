import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import AnalyticsTabs from '../../components/admin/analytics/AnalyticsTabs';
import UserAnalyticsPanel from '../../components/admin/analytics/UserAnalyticsPanel';
import CoachAnalyticsPanel from '../../components/admin/analytics/CoachAnalyticsPanel';
import CourseAnalyticsPanel from '../../components/admin/analytics/CourseAnalyticsPanel';
import FunnelAnalyticsPanel from '../../components/admin/analytics/FunnelAnalyticsPanel';
import AiAnalyticsPanel from '../../components/admin/analytics/AiAnalyticsPanel';
import BiReportsPanel from '../../components/admin/analytics/BiReportsPanel';

type TabValue = 'users' | 'coaches' | 'courses' | 'funnels' | 'ai' | 'bi';

interface GlobalFilters {
  timeframe: string;
  segment: string;
}

interface UserAnalytics {
  dau: number;
  mau: number;
  dauMauRatio: number;
  newUsers: number;
  returningUsers: number;
  retentionCurve: { dayLabel: string; percentage: number }[];
  activityByRegion: { region: string; users: number }[];
  deviceBreakdown: { device: string; percentage: number }[];
}

interface CoachAnalytics {
  activeCoaches: number;
  newCoachesThisPeriod: number;
  avgCoursesPerCoach: number;
  avgRevenuePerCoach: number;
  coachActivityTrend: { label: string; value: number }[];
  topCoaches: { name: string; courses: number; students: number; rating: number }[];
}

interface CourseAnalytics {
  totalCourses: number;
  activeCourses: number;
  avgCompletionRate: number;
  avgRating: number;
  enrollmentsTrend: { label: string; value: number }[];
  categoryBreakdown: { category: string; enrollments: number; completionRate: number }[];
  topCourses: { title: string; enrollments: number; rating: number; completionRate: number }[];
}

interface FunnelAnalytics {
  totalFunnels: number;
  avgFunnelConversion: number;
  leadsGeneratedThisPeriod: number;
  funnelList: {
    id: string;
    name: string;
    entryPoint: string;
    steps: string[];
    conversionRate: number;
    dropOffByStep: { step: string; percentage: number }[];
  }[];
}

interface AiAnalytics {
  totalAiRequests: number;
  uniqueAiUsers: number;
  avgResponseTimeMs: number;
  errorRate: number;
  estimatedCostThisPeriod: number;
  requestsByTool: { tool: string; count: number }[];
  loadByHour: { hourLabel: string; requests: number }[];
  usageByRole: { role: string; requests: number }[];
}

interface BiReports {
  availableReports: {
    id: string;
    name: string;
    category: 'Engagement' | 'Revenue' | 'Learning' | 'Operations';
    description: string;
    lastGeneratedAt?: string;
    schedule: 'none' | 'daily' | 'weekly' | 'monthly';
    format: 'table' | 'chart' | 'mixed';
  }[];
  recentExports: {
    id: string;
    reportName: string;
    generatedAt: string;
    generatedBy: string;
    format: 'CSV' | 'XLSX' | 'PDF';
    status: 'ready' | 'processing' | 'failed';
  }[];
}

const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('users');
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({
    timeframe: 'last_30_days',
    segment: 'all',
  });

  // Dummy User Analytics data
  const userAnalytics: UserAnalytics = {
    dau: 3245,
    mau: 9872,
    dauMauRatio: 32.9,
    newUsers: 1205,
    returningUsers: 8667,
    retentionCurve: [
      { dayLabel: 'Day 1', percentage: 100 },
      { dayLabel: 'Day 7', percentage: 68 },
      { dayLabel: 'Day 14', percentage: 45 },
      { dayLabel: 'Day 30', percentage: 32 },
    ],
    activityByRegion: [
      { region: 'Philippines', users: 4145 },
      { region: 'United States', users: 2765 },
      { region: 'UAE', users: 1778 },
      { region: 'India', users: 894 },
      { region: 'Singapore', users: 290 },
    ],
    deviceBreakdown: [
      { device: 'Desktop', percentage: 58 },
      { device: 'Mobile', percentage: 35 },
      { device: 'Tablet', percentage: 7 },
    ],
  };

  // Dummy Coach Analytics data
  const coachAnalytics: CoachAnalytics = {
    activeCoaches: 210,
    newCoachesThisPeriod: 8,
    avgCoursesPerCoach: 4.0,
    avgRevenuePerCoach: 2840,
    coachActivityTrend: [
      { label: 'Week 1', value: 185 },
      { label: 'Week 2', value: 192 },
      { label: 'Week 3', value: 198 },
      { label: 'Week 4', value: 210 },
    ],
    topCoaches: [
      { name: 'Sarah Chen', courses: 12, students: 847, rating: 4.9 },
      { name: 'Mike Rodriguez', courses: 9, students: 623, rating: 4.8 },
      { name: 'Emily Johnson', courses: 8, students: 592, rating: 4.7 },
      { name: 'David Kim', courses: 7, students: 521, rating: 4.8 },
      { name: 'Anna Martinez', courses: 7, students: 489, rating: 4.6 },
    ],
  };

  // Dummy Course Analytics data
  const courseAnalytics: CourseAnalytics = {
    totalCourses: 847,
    activeCourses: 692,
    avgCompletionRate: 68.5,
    avgRating: 4.7,
    enrollmentsTrend: [
      { label: 'Week 1', value: 1240 },
      { label: 'Week 2', value: 1380 },
      { label: 'Week 3', value: 1520 },
      { label: 'Week 4', value: 1695 },
    ],
    categoryBreakdown: [
      { category: 'Technology', enrollments: 4520, completionRate: 72 },
      { category: 'Business', enrollments: 3180, completionRate: 65 },
      { category: 'Design', enrollments: 2840, completionRate: 70 },
      { category: 'Marketing', enrollments: 1920, completionRate: 63 },
      { category: 'Personal Development', enrollments: 1680, completionRate: 68 },
    ],
    topCourses: [
      { title: 'Full Stack Development', enrollments: 1247, rating: 4.9, completionRate: 78 },
      { title: 'UX Design Bootcamp', enrollments: 1105, rating: 4.8, completionRate: 75 },
      { title: 'Digital Marketing Mastery', enrollments: 987, rating: 4.7, completionRate: 71 },
      { title: 'Data Science with Python', enrollments: 842, rating: 4.8, completionRate: 69 },
      { title: 'Product Management', enrollments: 756, rating: 4.6, completionRate: 66 },
    ],
  };

  // Dummy Funnel Analytics data
  const funnelAnalytics: FunnelAnalytics = {
    totalFunnels: 8,
    avgFunnelConversion: 24.5,
    leadsGeneratedThisPeriod: 3420,
    funnelList: [
      {
        id: 'funnel-1',
        name: 'UX Bootcamp Lead Gen',
        entryPoint: 'Landing page – UX Bootcamp',
        steps: ['View', 'Opt-in', 'Enroll', 'Complete'],
        conversionRate: 28.5,
        dropOffByStep: [
          { step: 'View', percentage: 100 },
          { step: 'Opt-in', percentage: 52 },
          { step: 'Enroll', percentage: 35 },
          { step: 'Complete', percentage: 28.5 },
        ],
      },
      {
        id: 'funnel-2',
        name: 'Tech Courses Free Trial',
        entryPoint: 'Homepage banner',
        steps: ['Click', 'Sign Up', 'Start Trial', 'Subscribe'],
        conversionRate: 22.3,
        dropOffByStep: [
          { step: 'Click', percentage: 100 },
          { step: 'Sign Up', percentage: 48 },
          { step: 'Start Trial', percentage: 32 },
          { step: 'Subscribe', percentage: 22.3 },
        ],
      },
      {
        id: 'funnel-3',
        name: 'Business Course Bundle',
        entryPoint: 'Email campaign',
        steps: ['Open', 'Visit Page', 'Add to Cart', 'Purchase'],
        conversionRate: 18.7,
        dropOffByStep: [
          { step: 'Open', percentage: 100 },
          { step: 'Visit Page', percentage: 42 },
          { step: 'Add to Cart', percentage: 28 },
          { step: 'Purchase', percentage: 18.7 },
        ],
      },
      {
        id: 'funnel-4',
        name: 'Coaching Session Funnel',
        entryPoint: 'Coach profile page',
        steps: ['View Profile', 'Book Session', 'Confirm', 'Attend'],
        conversionRate: 31.2,
        dropOffByStep: [
          { step: 'View Profile', percentage: 100 },
          { step: 'Book Session', percentage: 58 },
          { step: 'Confirm', percentage: 42 },
          { step: 'Attend', percentage: 31.2 },
        ],
      },
      {
        id: 'funnel-5',
        name: 'Webinar to Course',
        entryPoint: 'Webinar registration page',
        steps: ['Register', 'Attend Webinar', 'View Offer', 'Enroll'],
        conversionRate: 26.8,
        dropOffByStep: [
          { step: 'Register', percentage: 100 },
          { step: 'Attend Webinar', percentage: 65 },
          { step: 'View Offer', percentage: 45 },
          { step: 'Enroll', percentage: 26.8 },
        ],
      },
    ],
  };

  // Dummy AI Analytics data
  const aiAnalytics: AiAnalytics = {
    totalAiRequests: 12847,
    uniqueAiUsers: 2103,
    avgResponseTimeMs: 324,
    errorRate: 1.8,
    estimatedCostThisPeriod: 487,
    requestsByTool: [
      { tool: 'AI Coach', count: 5420 },
      { tool: 'Quiz Generator', count: 3210 },
      { tool: 'Content Summarizer', count: 2180 },
      { tool: 'Learning Path Recommender', count: 1450 },
      { tool: 'Translation Assistant', count: 587 },
    ],
    loadByHour: [
      { hourLabel: '00:00', requests: 245 },
      { hourLabel: '02:00', requests: 180 },
      { hourLabel: '04:00', requests: 120 },
      { hourLabel: '06:00', requests: 310 },
      { hourLabel: '08:00', requests: 680 },
      { hourLabel: '10:00', requests: 920 },
      { hourLabel: '12:00', requests: 1240 },
      { hourLabel: '14:00', requests: 1380 },
      { hourLabel: '16:00', requests: 1520 },
      { hourLabel: '18:00', requests: 1450 },
      { hourLabel: '20:00', requests: 1180 },
      { hourLabel: '22:00', requests: 780 },
    ],
    usageByRole: [
      { role: 'Student', requests: 8920 },
      { role: 'Coach', requests: 3140 },
      { role: 'Admin', requests: 787 },
    ],
  };

  // Dummy BI Reports data
  const biReports: BiReports = {
    availableReports: [
      {
        id: 'report-1',
        name: 'Cohort Retention Overview',
        category: 'Engagement',
        description: 'Track retention trends across student cohorts over time.',
        lastGeneratedAt: '2025-12-03T14:22:00Z',
        schedule: 'weekly',
        format: 'mixed',
      },
      {
        id: 'report-2',
        name: 'Revenue by Channel',
        category: 'Revenue',
        description: 'Breakdown of revenue by acquisition channel and campaign.',
        lastGeneratedAt: '2025-12-01T09:15:00Z',
        schedule: 'monthly',
        format: 'chart',
      },
      {
        id: 'report-3',
        name: 'Student Outcomes by Course',
        category: 'Learning',
        description: 'Completion rates, assessment scores, and learning velocity per course.',
        schedule: 'none',
        format: 'table',
      },
      {
        id: 'report-4',
        name: 'Operational Efficiency Dashboard',
        category: 'Operations',
        description: 'Platform uptime, support ticket resolution, and system load metrics.',
        lastGeneratedAt: '2025-12-04T08:00:00Z',
        schedule: 'daily',
        format: 'mixed',
      },
      {
        id: 'report-5',
        name: 'Coach Performance Report',
        category: 'Engagement',
        description: 'Student satisfaction, session attendance, and coach activity levels.',
        lastGeneratedAt: '2025-11-28T16:45:00Z',
        schedule: 'weekly',
        format: 'table',
      },
      {
        id: 'report-6',
        name: 'Subscription Churn Analysis',
        category: 'Revenue',
        description: 'Identify patterns in subscription cancellations and downgrades.',
        schedule: 'none',
        format: 'mixed',
      },
    ],
    recentExports: [
      {
        id: 'export-1',
        reportName: 'Cohort Retention Overview',
        generatedAt: '2025-12-03T14:22:00Z',
        generatedBy: 'Admin User',
        format: 'PDF',
        status: 'ready',
      },
      {
        id: 'export-2',
        reportName: 'Revenue by Channel',
        generatedAt: '2025-12-01T09:15:00Z',
        generatedBy: 'Finance Manager',
        format: 'XLSX',
        status: 'ready',
      },
      {
        id: 'export-3',
        reportName: 'Operational Efficiency Dashboard',
        generatedAt: '2025-12-04T08:00:00Z',
        generatedBy: 'System',
        format: 'CSV',
        status: 'ready',
      },
    ],
  };

  // Top-level KPIs (derived from analytics data)
  const topLevelKpis = {
    dau: userAnalytics.dau,
    mau: userAnalytics.mau,
    avgSessionLength: '18m 34s',
    overallCompletionRate: courseAnalytics.avgCompletionRate,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserAnalyticsPanel data={userAnalytics} filters={globalFilters} />;
      case 'coaches':
        return <CoachAnalyticsPanel data={coachAnalytics} filters={globalFilters} />;
      case 'courses':
        return <CourseAnalyticsPanel data={courseAnalytics} filters={globalFilters} />;
      case 'funnels':
        return <FunnelAnalyticsPanel data={funnelAnalytics} filters={globalFilters} />;
      case 'ai':
        return <AiAnalyticsPanel data={aiAnalytics} filters={globalFilters} />;
      case 'bi':
        return <BiReportsPanel data={biReports} />;
      default:
        return null;
    }
  };

  return (
    <AdminAppLayout>
      <div className="m-5 px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Monitor engagement, performance, and funnel conversion across NexSkill.
          </p>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={globalFilters.timeframe}
                onChange={(e) =>
                  setGlobalFilters({ ...globalFilters, timeframe: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="this_quarter">This quarter</option>
                <option value="all_time">All time</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
              <select
                value={globalFilters.segment}
                onChange={(e) => setGlobalFilters({ ...globalFilters, segment: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
              >
                <option value="all">All users</option>
                <option value="students">Students only</option>
                <option value="coaches">Coaches only</option>
                <option value="b2b">B2B orgs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top-level KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
            <div className="text-sm text-blue-700 mb-1">Daily Active Users</div>
            <div className="text-3xl font-bold text-blue-900">{topLevelKpis.dau.toLocaleString()}</div>
            <div className="text-xs text-blue-600 mt-1">
              {userAnalytics.dauMauRatio}% of MAU
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
            <div className="text-sm text-purple-700 mb-1">Monthly Active Users</div>
            <div className="text-3xl font-bold text-purple-900">{topLevelKpis.mau.toLocaleString()}</div>
            <div className="text-xs text-purple-600 mt-1">
              +{userAnalytics.newUsers.toLocaleString()} new this month
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
            <div className="text-sm text-green-700 mb-1">Avg Session Length</div>
            <div className="text-3xl font-bold text-green-900">{topLevelKpis.avgSessionLength}</div>
            <div className="text-xs text-green-600 mt-1">+2m 15s vs last period</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
            <div className="text-sm text-orange-700 mb-1">Course Completion</div>
            <div className="text-3xl font-bold text-orange-900">
              {topLevelKpis.overallCompletionRate}%
            </div>
            <div className="text-xs text-orange-600 mt-1">Platform average</div>
          </div>
        </div>

        {/* Tabs */}
        <AnalyticsTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </AdminAppLayout>
  );
};

export default AdminAnalyticsPage;
