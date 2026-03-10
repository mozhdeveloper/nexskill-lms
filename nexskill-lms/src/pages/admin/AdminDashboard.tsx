import React, { useState, useEffect } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import AdminKpiSummary from '../../components/admin/dashboard/AdminKpiSummary';
import AdminRevenueOverview from '../../components/admin/dashboard/AdminRevenueOverview';
import AdminPlatformAnalytics from '../../components/admin/dashboard/AdminPlatformAnalytics';
import AdminSystemAlerts from '../../components/admin/dashboard/AdminSystemAlerts';
import { supabase } from '../../lib/supabaseClient';
import { computeFees } from '../../config/platformFees';

type TimeframeOption = 'Today' | 'Last 7 days' | 'Last 30 days' | 'All time';

const AdminDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const [kpiSummary, setKpiSummary] = useState({
    totalUsers: 0, usersGrowth: '',
    totalCoaches: 0, coachesGrowth: '',
    activeCourses: 0, coursesGrowth: '',
    activeStudents: 0, studentsGrowth: '',
    avgRating: 0, ratingChange: '',
  });

  const [revenueSummary, setRevenueSummary] = useState({
    gross: 0, net: 0, refundRate: 0,
    trendData: [] as { period: string; amount: number }[],
  });

  // Platform analytics — real user/session data requires analytics infra; keep as computed
  const [platformAnalytics] = useState({
    dau: 0, mau: 0, dauMauRatio: 0,
    avgSessionsPerUser: 0, avgTimePerSession: '–',
    topGeographies: [] as { country: string; percentage: number }[],
    topDevices: [] as { device: string; percentage: number }[],
  });

  const [systemAlerts] = useState<{
    id: string; severity: 'critical' | 'warning' | 'info';
    title: string; description: string; timestamp: string; resolved?: boolean;
  }[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      // KPIs
      const [
        { count: totalUsers },
        { count: totalCoaches },
        { count: activeCourses },
        { count: activeStudents },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coach'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('enrollments').select('profile_id', { count: 'exact', head: true }),
      ]);

      // Average rating
      const { data: reviews } = await supabase.from('reviews').select('rating');
      const allRatings = (reviews || []).map((r: any) => r.rating);
      const avgRating = allRatings.length > 0
        ? Math.round((allRatings.reduce((s: number, v: number) => s + v, 0) / allRatings.length) * 10) / 10
        : 0;

      setKpiSummary({
        totalUsers: totalUsers || 0,
        usersGrowth: '',
        totalCoaches: totalCoaches || 0,
        coachesGrowth: '',
        activeCourses: activeCourses || 0,
        coursesGrowth: '',
        activeStudents: activeStudents || 0,
        studentsGrowth: '',
        avgRating,
        ratingChange: '',
      });

      // Revenue
      const { data: txns } = await supabase
        .from('transactions')
        .select('amount, status, created_at')
        .order('created_at', { ascending: true });

      const allTxns = txns || [];
      const succeeded = allTxns.filter((t: any) => t.status === 'succeeded');
      const refunded = allTxns.filter((t: any) => t.status === 'refunded');

      const gross = succeeded.reduce((s: number, t: any) => s + t.amount, 0);
      const platformFeeTotal = succeeded.reduce((s: number, t: any) => s + computeFees(t.amount).platformFee, 0);
      const refundedTotal = refunded.reduce((s: number, t: any) => s + t.amount, 0);
      const refundRate = gross > 0 ? Math.round((refundedTotal / gross) * 1000) / 10 : 0;

      // Weekly trend from succeeded transactions
      const now = new Date();
      const weekBuckets: { period: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekAmount = succeeded
          .filter((t: any) => {
            const d = new Date(t.created_at);
            return d >= weekStart && d < weekEnd;
          })
          .reduce((s: number, t: any) => s + computeFees(t.amount).platformFee, 0);
        weekBuckets.push({
          period: `Week ${7 - i}`,
          amount: weekAmount,
        });
      }

      setRevenueSummary({
        gross,
        net: platformFeeTotal,
        refundRate,
        trendData: weekBuckets,
      });

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const timeframeOptions: TimeframeOption[] = ['Today', 'Last 7 days', 'Last 30 days', 'All time'];

  return (
    <AdminAppLayout>
      <div className="m-5 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--text-primary)] mb-2">Admin Dashboard</h1>
            <p className="text-[color:var(--text-secondary)]">Monitor NexSkill usage, revenue, and system health</p>
          </div>
          <div className="flex items-center gap-3">

            {/* Timeframe Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="px-4 py-2 bg-[color:var(--bg-secondary)] border border-[color:var(--border-base)] text-[color:var(--text-primary)] text-sm font-semibold rounded-full hover:border-[color:var(--color-brand-electric)] hover:text-[color:var(--color-brand-electric)] transition-colors flex items-center gap-2"
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
                <div className="absolute right-0 mt-2 w-48 bg-[color:var(--bg-secondary)] rounded-xl shadow-lg border border-[color:var(--border-base)] py-2 z-10">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setTimeframe(option);
                        setShowTimeframeDropdown(false);
                        window.alert(`📊 Timeframe Updated\n\nSelected Period: ${option}\n\n📈 Dashboard Analytics:\n• Refreshing all metrics\n• Loading comparison data\n• Updating trend graphs\n• Recalculating KPIs\n\n💡 What's Included:\n• Revenue & enrollment data\n• User engagement metrics\n• Course performance stats\n• Growth comparisons\n\nAll widgets will update with ${option} data.`);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[color:var(--bg-glass-hover)] transition-colors ${timeframe === option
                        ? 'text-[color:var(--color-brand-electric)] font-semibold'
                        : 'text-[color:var(--text-secondary)]'
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

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#304DB5]" />
          </div>
        )}

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
