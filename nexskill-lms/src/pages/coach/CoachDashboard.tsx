import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

interface RevenueData {
  currentMonth: number;
  totalAllTime: number;
  monthOverMonth: number;
  lastSixMonths: { month: string; amount: number }[];
}

interface CoursePerf {
  id: string;
  name: string;
  enrolledStudents: number;
  rating: number;
}

const aiShortcuts = [
  { id: 1, label: 'Generate lesson outline', icon: '📝' },
  { id: 2, label: 'Analyze quiz results', icon: '📊' },
  { id: 3, label: 'Draft course announcement', icon: '📢' },
  { id: 4, label: 'Suggest price optimization', icon: '💡' },
];

const CoachDashboard: React.FC = () => {
  const { profile: currentUser } = useUser();
  const navigate = useNavigate();
  const [activeCoursesCount, setActiveCoursesCount] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [newEnrolleesCount, setNewEnrolleesCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [coursePerfs, setCoursePerfs] = useState<CoursePerf[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    currentMonth: 0,
    totalAllTime: 0,
    monthOverMonth: 0,
    lastSixMonths: [],
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Active Courses
        const { count: courseCount, data: coursesData, error: courseError } = await supabase
          .from('courses')
          .select('id, title', { count: 'exact' })
          .eq('coach_id', currentUser.id)
          .eq('verification_status', 'approved');

        if (courseError) throw courseError;
        setActiveCoursesCount(courseCount || 0);

        const courseIds = coursesData?.map(c => c.id) || [];

        // 2. Fetch Revenue Data from transactions
        console.log('📊 Fetching revenue data for coach:', currentUser.id);
        const { data: transactionsData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('coach_id', currentUser.id)
          .in('type', ['sale', 'payout'])
          .order('created_at', { ascending: false });

        if (txError) {
          console.error('❌ Error fetching transactions:', txError);
        } else {
          console.log('✅ Transactions fetched:', transactionsData?.length || 0);
          
          // Calculate revenue metrics
          const now = new Date();
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = currentMonthStart;

          let currentMonthRevenue = 0;
          let lastMonthRevenue = 0;
          let totalAllTime = 0;
          const monthlyRevenue: Record<string, number> = {};

          transactionsData?.forEach((tx: any) => {
            if (tx.type === 'sale' && tx.status !== 'failed') {
              const netAmount = tx.net_amount || tx.amount || 0;
              const txDate = new Date(tx.created_at);

              // All-time revenue
              totalAllTime += netAmount;

              // Current month revenue
              if (txDate >= currentMonthStart) {
                currentMonthRevenue += netAmount;
              }

              // Last month revenue
              if (txDate >= lastMonthStart && txDate < lastMonthEnd) {
                lastMonthRevenue += netAmount;
              }

              // Monthly revenue for chart
              const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
              monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + netAmount;
            }
          });

          // Build last 6 months data
          const lastSixMonths = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('en-US', { month: 'short' });
            lastSixMonths.push({
              month: monthName,
              amount: monthlyRevenue[monthKey] || 0,
            });
          }

          // Calculate month-over-month growth
          const momGrowth = lastMonthRevenue > 0
            ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : currentMonthRevenue > 0 ? 100 : 0;

          setRevenueData({
            currentMonth: currentMonthRevenue,
            totalAllTime: totalAllTime,
            monthOverMonth: momGrowth,
            lastSixMonths,
          });

          console.log('💰 Revenue data calculated:', {
            currentMonth: currentMonthRevenue,
            totalAllTime,
            momGrowth,
          });
        }

        // Build course performance data
        if (courseIds.length > 0) {
          // Enrollment counts per course
          const { data: allEnrollments } = await supabase
            .from('enrollments')
            .select('course_id, profile_id, enrolled_at')
            .in('course_id', courseIds);

          const enrollmentsByCourse: Record<string, number> = {};
          const uniqueStudents = new Set<string>();
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          let newCount = 0;

          (allEnrollments || []).forEach((e: { course_id: string; profile_id: string; enrolled_at: string }) => {
            enrollmentsByCourse[e.course_id] = (enrollmentsByCourse[e.course_id] || 0) + 1;
            uniqueStudents.add(e.profile_id);
            if (new Date(e.enrolled_at) > sevenDaysAgo) newCount++;
          });

          setActiveStudentsCount(uniqueStudents.size);
          setNewEnrolleesCount(newCount);

          // Ratings per course
          const { data: reviews } = await supabase
            .from('reviews')
            .select('course_id, rating')
            .in('course_id', courseIds);

          const ratingsByCourse: Record<string, number[]> = {};
          (reviews || []).forEach((r: { course_id: string; rating: number }) => {
            if (!ratingsByCourse[r.course_id]) ratingsByCourse[r.course_id] = [];
            ratingsByCourse[r.course_id].push(r.rating);
          });

          // Build course performance array
          const perfData: CoursePerf[] = coursesData.map((c: any) => ({
            id: c.id,
            name: c.title,
            enrolledStudents: enrollmentsByCourse[c.id] || 0,
            rating: ratingsByCourse[c.id]?.length
              ? Math.round((ratingsByCourse[c.id].reduce((a, b) => a + b, 0) / ratingsByCourse[c.id].length) * 10) / 10
              : 0,
          }));

          setCoursePerfs(perfData);

          // Calculate overall average rating
          const allRatings = Object.values(ratingsByCourse).flat();
          const overallAvg = allRatings.length > 0
            ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
            : 0;
          setAvgRating(overallAvg);
        }

        // 3. Upcoming Live Sessions
        const { data: sessionsData } = await supabase
          .from('live_sessions')
          .select('*, courses(title)')
          .eq('coach_id', currentUser.id)
          .in('status', ['scheduled', 'live'])
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5);

        setUpcomingSessions(sessionsData || []);

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const maxRevenue = revenueData.lastSixMonths.length > 0
    ? Math.max(...revenueData.lastSixMonths.map((m) => m.amount), 1)
    : 1;

  return (
    <CoachAppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[color:var(--text-primary)]">
              Welcome back, {currentUser?.first_name || 'Coach'}! 👋
            </h1>
            <p className="text-[color:var(--text-secondary)] mt-1">
              Here's what's happening with your courses today.
            </p>
          </div>
          <button
            onClick={() => navigate('/coach/courses/new')}
            className="px-6 py-3 bg-gradient-to-r from-[color:var(--color-brand-electric)] to-[color:var(--color-brand-neon)] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
          >
            + Create Course
          </button>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-8">
          {/* Row 1: Revenue Overview + Student Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Overview - Spans 2 columns */}
            <div className="lg:col-span-2 glass-card rounded-[24px] p-8">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Revenue</h2>

              {/* Main KPI */}
              <div className="mb-6">
                <div className="text-5xl font-bold text-gradient mb-2 inline-block">
                  ${revenueData.currentMonth.toLocaleString()}
                </div>
                <p className="text-lg text-[color:var(--text-secondary)]">This month</p>
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)]">
                  <p className="text-sm text-[color:var(--text-secondary)] mb-1">Total all-time</p>
                  <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                    ${revenueData.totalAllTime.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-[color:var(--color-brand-neon)]/10 rounded-xl border border-[color:var(--color-brand-neon)]/20">
                  <p className="text-sm text-[color:var(--text-secondary)] mb-1">Month-over-month</p>
                  <p className="text-2xl font-bold text-[color:var(--color-brand-neon)]">+{revenueData.monthOverMonth}%</p>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div>
                <p className="text-sm font-semibold text-[color:var(--text-primary)] mb-3">Last 6 months</p>
                <div className="flex items-end justify-between gap-2 h-32">
                  {revenueData.lastSixMonths.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-24">
                        <div
                          className="w-full bg-gradient-to-t from-[color:var(--color-brand-electric)] to-[color:var(--color-brand-neon)] rounded-t-lg transition-all hover:opacity-80 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          style={{ height: `${(item.amount / maxRevenue) * 100}%` }}
                          title={`$${item.amount}`}
                        />
                      </div>
                      <span className="text-xs text-[color:var(--text-secondary)] font-medium">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Count & Engagement */}
            <div className="space-y-4">
              <div className="glass-card rounded-[24px] p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--color-brand-electric)]/20 flex items-center justify-center text-[color:var(--color-brand-electric)]">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--text-secondary)]">Active students</p>
                    <p className="text-3xl font-bold text-[color:var(--color-brand-electric)]">{loading ? '...' : activeStudentsCount}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--color-brand-neon)]/20 flex items-center justify-center text-[color:var(--color-brand-neon)]">
                    <span className="text-xl">🆕</span>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--text-secondary)]">New this week</p>
                    <p className="text-3xl font-bold text-[color:var(--color-brand-neon)]">{loading ? '...' : newEnrolleesCount}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <span className="text-xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--text-secondary)]">Average rating</p>
                    <p className="text-3xl font-bold text-yellow-500">{avgRating || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Course Performance + AI Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Performance */}
            <div className="glass-card rounded-[24px] p-8">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Course Performance</h2>
              {coursePerfs.length === 0 ? (
                <p className="text-[color:var(--text-secondary)]">No courses yet. Create your first course to see performance metrics.</p>
              ) : (
                <div className="space-y-4">
                  {coursePerfs.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-4 bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)]">
                      <div>
                        <p className="font-semibold text-[color:var(--text-primary)]">{course.name}</p>
                        <p className="text-sm text-[color:var(--text-secondary)]">{course.enrolledStudents} students</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⭐</span>
                        <span className="text-lg font-bold text-[color:var(--text-primary)]">{course.rating || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Quick Actions */}
            <div className="glass-card rounded-[24px] p-8">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">AI Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {aiShortcuts.map((action) => (
                  <button
                    key={action.id}
                    className="p-4 bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)] hover:border-[color:var(--color-brand-neon)] transition-all group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{action.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Upcoming Sessions */}
          <div className="glass-card rounded-[24px] p-8">
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Upcoming Live Sessions</h2>
            {upcomingSessions.length === 0 ? (
              <p className="text-[color:var(--text-secondary)]">No upcoming sessions scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[color:var(--color-brand-electric)]/20 flex items-center justify-center text-[color:var(--color-brand-electric)] text-xl">
                        🎥
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--text-primary)]">{session.title}</p>
                        <p className="text-sm text-[color:var(--text-secondary)]">
                          {session.courses?.title || 'Course'} • {new Date(session.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      session.status === 'live' 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-[color:var(--color-brand-neon)]/20 text-[color:var(--color-brand-neon)]'
                    }`}>
                      {session.status === 'live' ? '🔴 LIVE' : 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default CoachDashboard;
