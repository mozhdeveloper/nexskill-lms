import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

// Revenue placeholder — no earnings table exists yet
const revenueData = {
  currentMonth: 0,
  totalAllTime: 0,
  monthOverMonth: 0,
  lastSixMonths: [
    { month: 'Jul', amount: 0 },
    { month: 'Aug', amount: 0 },
    { month: 'Sep', amount: 0 },
    { month: 'Oct', amount: 0 },
    { month: 'Nov', amount: 0 },
    { month: 'Dec', amount: 0 },
  ],
};




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

          const allRatings = (reviews || []).map((r: { rating: number }) => r.rating);
          const overallAvg = allRatings.length > 0
            ? Math.round((allRatings.reduce((s: number, v: number) => s + v, 0) / allRatings.length) * 10) / 10
            : 0;
          setAvgRating(overallAvg);

          const perfs: CoursePerf[] = (coursesData || []).map((c: { id: string; title: string }) => {
            const courseRatings = ratingsByCourse[c.id] || [];
            const avg = courseRatings.length > 0
              ? Math.round((courseRatings.reduce((s, v) => s + v, 0) / courseRatings.length) * 10) / 10
              : 0;
            return {
              id: c.id,
              name: c.title,
              enrolledStudents: enrollmentsByCourse[c.id] || 0,
              rating: avg,
            };
          });
          setCoursePerfs(perfs);
        }

        // 4. Upcoming Sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('coach_id', currentUser.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5);

        if (sessionError) throw sessionError;
        setUpcomingSessions(sessions || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const handleCourseClick = (courseId: string) => {
    navigate(`/coach/courses/${courseId}`);
  };

  const handleSessionClick = (_sessionId: string) => {
    navigate(`/coach/sessions`);
  };

  const handleAIShortcut = (_label: string) => {
    navigate('/coach/ai-tools');
  };

  const maxRevenue = Math.max(...revenueData.lastSixMonths.map((m) => m.amount));

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border-base)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[color:var(--text-primary)] mb-2">Welcome back, {currentUser?.firstName || 'Coach'}</h1>
              <p className="text-[color:var(--text-secondary)]">Here's an overview of your teaching performance</p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-[color:var(--color-brand-electric)]/10 rounded-full border border-[color:var(--color-brand-electric)]/20">
                <span className="text-sm font-semibold text-[color:var(--color-brand-electric)]">
                  Active courses: {loading ? '...' : activeCoursesCount}
                </span>
              </div>
              <div className="px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                <span className="text-sm font-semibold text-purple-500">
                  Active students: {loading ? '...' : activeStudentsCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-8">
          {/* Row 1: Revenue Overview + Student Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Overview - Spans 2 columns */}
            <div className="lg:col-span-2 glass-card rounded-[24px] p-8">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Revenue</h2>

              {/* Payment integration notice */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">💳 Payment integration coming soon. Revenue tracking will be available once payments are enabled.</p>
              </div>

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

          {/* Row 2: Course Performance */}
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Course performance</h2>
            <div className="space-y-4">
              {coursePerfs.length > 0 ? coursePerfs.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="p-4 bg-[color:var(--bg-secondary)] rounded-xl hover:bg-[color:var(--bg-glass-hover)] border border-[color:var(--border-base)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-1 group-hover:text-[color:var(--color-brand-electric)] transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-[color:var(--text-secondary)]">
                        <span>👥 {course.enrolledStudents} students</span>
                        {course.rating > 0 && <span>⭐ {course.rating}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-[color:var(--text-secondary)] py-8">No approved courses yet. Create your first course!</p>
              )}
            </div>
          </div>

          {/* Row 3: Upcoming Sessions + AI Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Coaching Sessions */}
            <div className="glass-card rounded-[24px] p-6">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Upcoming coaching sessions</h2>
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border border-[color:var(--border-base)] rounded-xl hover:border-[color:var(--color-brand-electric)] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all bg-[color:var(--bg-secondary)]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--color-brand-electric)] mb-1">
                            {new Date(session.scheduled_at).toLocaleDateString()} {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-lg font-semibold text-[color:var(--text-primary)]">{session.title}</p>
                          <p className="text-sm text-[color:var(--text-secondary)]">{session.description || 'No description'}</p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${session.status === 'scheduled' || session.status === 'live'
                            ? 'bg-[color:var(--color-brand-neon)]/10 text-[color:var(--color-brand-neon)]'
                            : 'bg-orange-500/10 text-orange-500'
                            }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSessionClick(session.id)}
                        className="text-sm font-medium text-[color:var(--color-brand-electric)] hover:text-[color:var(--color-brand-neon)] transition-colors"
                      >
                        View details →
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[color:var(--text-secondary)] bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)]">
                    <p>No upcoming sessions scheduled.</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Tool Shortcuts */}
            <div className="glass-card rounded-[24px] p-6">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">AI tool shortcuts</h2>
              <div className="grid grid-cols-2 gap-4">
                {aiShortcuts.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    onClick={() => handleAIShortcut(shortcut.label)}
                    className="p-5 bg-gradient-to-br from-[color:var(--bg-secondary)] to-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)] hover:border-[color:var(--color-brand-electric)] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all group"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      {shortcut.icon}
                    </div>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)] leading-tight">
                      {shortcut.label}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-[color:var(--bg-secondary)] rounded-xl border border-[color:var(--border-base)]">
                <div className="flex items-start gap-2">
                  <span className="text-lg">✨</span>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    AI-powered tools to help you create better content, analyze student performance, and
                    optimize your teaching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default CoachDashboard;
