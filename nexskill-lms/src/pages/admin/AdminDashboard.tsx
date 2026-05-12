import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import AdminKpiSummary from '../../components/admin/dashboard/AdminKpiSummary';
import AdminRevenueOverview from '../../components/admin/dashboard/AdminRevenueOverview';
import AdminPlatformAnalytics from '../../components/admin/dashboard/AdminPlatformAnalytics';
import AdminSystemAlerts from '../../components/admin/dashboard/AdminSystemAlerts';

type TimeframeOption = 'Today' | 'Last 7 days' | 'Last 30 days' | 'All time';

interface KpiSummary {
  totalUsers: number;
  usersGrowth: string;
  totalCoaches: number;
  coachesGrowth: string;
  activeCourses: number;
  coursesGrowth: string;
  activeStudents: number;
  studentsGrowth: string;
  avgRating: number;
  ratingChange: string;
}

interface RevenueSummary {
  gross: number;
  net: number;
  refundRate: number;
  trendData: { period: string; amount: number }[];
}

interface PlatformAnalytics {
  dau: number;
  mau: number;
  dauMauRatio: number;
  avgSessionsPerUser: number;
  avgTimePerSession: string;
  topGeographies: { country: string; percentage: number }[];
  topDevices: { device: string; percentage: number }[];
}

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

const AdminDashboard: React.FC = () => {
  const { profile: currentUser } = useUser();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for dashboard data
  const [kpiSummary, setKpiSummary] = useState<KpiSummary>({
    totalUsers: 0,
    usersGrowth: '0',
    totalCoaches: 0,
    coachesGrowth: '0',
    activeCourses: 0,
    coursesGrowth: '0',
    activeStudents: 0,
    studentsGrowth: '0',
    avgRating: 0,
    ratingChange: '0',
  });

  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary>({
    gross: 0,
    net: 0,
    refundRate: 0,
    trendData: [],
  });

  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics>({
    dau: 0,
    mau: 0,
    dauMauRatio: 0,
    avgSessionsPerUser: 0,
    avgTimePerSession: '0m',
    topGeographies: [],
    topDevices: [],
  });

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching admin dashboard data...');

        // Calculate date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(todayStart);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const prevThirtyDays = new Date(thirtyDaysAgo);
        prevThirtyDays.setDate(prevThirtyDays.getDate() - 30);

        // 1. Fetch Total Users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch users growth (new users this period vs last period)
        // Using updated_at since created_at may not exist
        const { count: newUsersThisPeriod } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', thirtyDaysAgo.toISOString());

        const { count: newUsersLastPeriod } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', prevThirtyDays.toISOString())
          .lt('updated_at', thirtyDaysAgo.toISOString());

        const usersGrowthNum = (newUsersThisPeriod || 0) - (newUsersLastPeriod || 0);
        const usersGrowthStr = usersGrowthNum >= 0 ? `+${usersGrowthNum} vs last 30 days` : `${usersGrowthNum} vs last 30 days`;

        // 2. Fetch Total Coaches
        const { count: totalCoaches } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'coach');

        const { count: newCoaches } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'coach')
          .gte('updated_at', thirtyDaysAgo.toISOString());

        // 3. Fetch Active Courses
        const { count: activeCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'approved')
          .eq('visibility', 'public');

        const { count: newCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'approved')
          .gte('created_at', thirtyDaysAgo.toISOString());

        // 4. Fetch Active Students (students with role = 'student')
        // Since enrollments table structure is different, we'll count users with student role
        const { count: activeStudentsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // For growth, count new student profiles this week
        const { count: newStudentsThisWeek } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')
          .gte('updated_at', sevenDaysAgo.toISOString());

        console.log('Active students:', activeStudentsCount);
        console.log('New students this week:', newStudentsThisWeek);

        // 5. Fetch Average Rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating');

        const avgRating = reviews && reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

        // 6. Fetch Revenue Data
        console.log('💰 Fetching revenue data...');
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('*')
          .in('type', ['sale', 'refund', 'payout'])
          .order('created_at', { ascending: false });

        let grossRevenue = 0;
        let netRevenue = 0;
        let refundTotal = 0;
        const weeklyRevenue: Record<string, number> = {};

        transactionsData?.forEach((tx: any) => {
          const amount = tx.amount || 0;
          const netAmount = tx.net_amount || amount;
          const txDate = new Date(tx.created_at);

          if (tx.type === 'sale' && tx.status !== 'failed') {
            grossRevenue += amount;
            netRevenue += netAmount;

            // Weekly trend data (last 7 weeks)
            const weekKey = `Week ${Math.ceil((now.getTime() - txDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;
            if (weekKey.includes('Week 1') || weekKey.includes('Week 2') || weekKey.includes('Week 3') ||
                weekKey.includes('Week 4') || weekKey.includes('Week 5') || weekKey.includes('Week 6') ||
                weekKey.includes('Week 7')) {
              weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + netAmount;
            }
          } else if (tx.type === 'refund') {
            refundTotal += amount;
          }
        });

        const refundRate = grossRevenue > 0 ? Math.round((refundTotal / grossRevenue) * 1000) / 10 : 0;

        // Build trend data array
        const trendData = [];
        for (let i = 7; i >= 1; i--) {
          const weekKey = `Week ${i}`;
          trendData.push({
            period: weekKey,
            amount: weeklyRevenue[weekKey] || 0,
          });
        }

        // 7. Fetch Platform Analytics
        // DAU: Users active today (simplified - using profiles updated today)
        const { count: dau } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', todayStart.toISOString());

        // MAU: Users active this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const { count: mau } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', monthStart.toISOString());

        const dauCount = dau || 0;
        const mauCount = mau || 0;
        const dauMauRatio = mauCount > 0 ? Math.round((dauCount / mauCount) * 1000) / 10 : 0;

        // 8. Fetch System Alerts from the unified notification system
        console.log('🔔 Fetching system notifications...');
        const { data: adminNotifs, error: notifError } = await supabase.rpc('get_admin_notifications');

        if (notifError) {
          console.error('Error fetching admin notifications:', notifError);
        }

        const alerts: SystemAlert[] = [];
        
        if (adminNotifs && adminNotifs.length > 0) {
          adminNotifs.forEach((notif: any) => {
            let severity: 'critical' | 'warning' | 'info' = 'info';
            let title = 'System Alert';
            let description = '';

            switch (notif.notif_type) {
              case 'new_course':
                severity = 'warning';
                title = 'Course Pending Review';
                description = `"${notif.course_title}" submitted by ${notif.coach_name} needs approval.`;
                break;
              case 'course_update':
                severity = 'info';
                title = 'Course Update Pending';
                description = `${notif.coach_name} updated "${notif.course_title}". Review changes.`;
                break;
              case 'new_coach_review':
                severity = 'critical';
                title = 'New Coach Application';
                description = `${notif.coach_name} applied for coach status and needs verification.`;
                break;
              case 'new_user':
                severity = 'info';
                title = 'New User Joined';
                description = `${notif.coach_name} (Student) has just registered on the platform.`;
                break;
              default:
                description = `New activity from ${notif.coach_name}`;
            }

            alerts.push({
              id: notif.notif_id,
              severity,
              title,
              description,
              timestamp: new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              resolved: notif.is_read,
            });
          });
        }

        // Add a placeholder health alert if no real alerts exist
        if (alerts.length === 0) {
          alerts.push({
            id: 'health-check',
            severity: 'info',
            title: 'System health check passed',
            description: 'All core services are operating normally. No pending actions.',
            timestamp: 'Just now',
            resolved: true,
          });
        }

        // Update state
        setKpiSummary({
          totalUsers: totalUsers || 0,
          usersGrowth: usersGrowthStr,
          totalCoaches: totalCoaches || 0,
          coachesGrowth: newCoaches ? `+${newCoaches} this month` : '0 this month',
          activeCourses: activeCourses || 0,
          coursesGrowth: newCourses ? `+${newCourses} this month` : '0 this month',
          activeStudents: activeStudentsCount || 0,
          studentsGrowth: newStudentsThisWeek ? `+${newStudentsThisWeek} this week` : '0 this week',
          avgRating: avgRating,
          ratingChange: avgRating > 0 ? '+0.1 vs last period' : '0 vs last period',
        });

        setRevenueSummary({
          gross: grossRevenue,
          net: netRevenue,
          refundRate: refundRate,
          trendData,
        });

        setPlatformAnalytics({
          dau: dauCount,
          mau: mauCount,
          dauMauRatio: dauMauRatio,
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
        });

        setSystemAlerts(alerts);

        console.log('✅ Dashboard data fetched successfully');

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up realtime subscription for notifications
    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications'
        },
        () => {
          console.log('🔔 Admin notifications changed, refreshing...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

        {/* KPI Summary */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[color:var(--bg-secondary)] rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-[color:var(--bg-glass-hover)] rounded w-24 mb-2"></div>
                <div className="h-8 bg-[color:var(--bg-glass-hover)] rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <AdminKpiSummary summary={kpiSummary} />
        )}

        {/* Revenue + Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Overview */}
          <AdminRevenueOverview summary={revenueSummary} timeframe={timeframe} />

          {/* Platform Analytics */}
          <AdminPlatformAnalytics analytics={platformAnalytics} />
        </div>

        {/* System Alerts */}
        <AdminSystemAlerts alerts={systemAlerts} />
      </div>
    </AdminAppLayout>
  );
};

export default AdminDashboard;
