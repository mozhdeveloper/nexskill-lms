import React, { useEffect, useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

// Dummy data
const revenueData = {
  currentMonth: 2450,
  totalAllTime: 18920,
  monthOverMonth: 18,
  lastSixMonths: [
    { month: 'Jul', amount: 1800 },
    { month: 'Aug', amount: 2100 },
    { month: 'Sep', amount: 1950 },
    { month: 'Oct', amount: 2200 },
    { month: 'Nov', amount: 2070 },
    { month: 'Dec', amount: 2450 },
  ],
};




const studentMetrics = {
  averageRating: 4.8,
};

const courses = [
  {
    id: 1,
    name: 'UI Design Fundamentals',
    enrolledStudents: 48,
    rating: 4.9,
    completionRate: 87,
  },
  {
    id: 2,
    name: 'JavaScript Mastery',
    enrolledStudents: 56,
    rating: 4.7,
    completionRate: 72,
  },
  {
    id: 3,
    name: 'Product Management Excellence',
    enrolledStudents: 34,
    rating: 4.8,
    completionRate: 81,
  },
  {
    id: 4,
    name: 'Data Analytics with Python',
    enrolledStudents: 42,
    rating: 4.6,
    completionRate: 68,
  },
];

const aiShortcuts = [
  { id: 1, label: 'Generate lesson outline', icon: '📝' },
  { id: 2, label: 'Analyze quiz results', icon: '📊' },
  { id: 3, label: 'Draft course announcement', icon: '📢' },
  { id: 4, label: 'Suggest price optimization', icon: '💡' },
];

const CoachDashboard: React.FC = () => {
  const { profile: currentUser } = useUser();
  const [activeCoursesCount, setActiveCoursesCount] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [newEnrolleesCount, setNewEnrolleesCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Active Courses
        const { count: courseCount, data: coursesData, error: courseError } = await supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .eq('coach_id', currentUser.id)
          .eq('verification_status', 'approved');

        if (courseError) throw courseError;
        setActiveCoursesCount(courseCount || 0);

        const courseIds = coursesData?.map(c => c.id) || [];


        if (courseIds.length > 0) {
          // 2. Active Students & 3. New Enrollees
          const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('profile_id, enrolled_at')
            .in('course_id', courseIds);

          if (enrollError) throw enrollError;

          const uniqueStudents = new Set(enrollments?.map(e => e.profile_id));
          setActiveStudentsCount(uniqueStudents.size);

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const newEnrollments = enrollments?.filter(e => new Date(e.enrolled_at) > sevenDaysAgo);
          setNewEnrolleesCount(newEnrollments?.length || 0);
        }

        // 4. Upcoming Sessions
        // DEBUG: Relaxed filter to checked past sessions too, and added logs
        console.log('Fetching sessions for coach:', currentUser.id);
        const { data: sessions, error: sessionError } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('coach_id', currentUser.id)
          // .gte('scheduled_at', new Date().toISOString()) // Commented out strict future filter for debug
          .order('scheduled_at', { ascending: true }) // Ascending (oldest first) might bury future ones if there are many old ones, but limit is 5. 
          .limit(10); // Increased limit

        console.log('Sessions fetch result:', { sessions, sessionError });

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

  const handleCourseClick = (courseName: string) => {
    window.alert(`📚 ${courseName}\n\n🎯 Quick Actions:\n• View course analytics\n• Edit course content\n• Manage students (24 enrolled)\n• View student feedback (4.8/5)\n• Update pricing or settings\n\n📊 Recent Activity:\n• 3 new enrollments today\n• 12 lessons completed\n• 5 student questions pending\n\nClick on course card to access full details.`);
  };

  const handleSessionClick = (sessionId: number) => {
    window.alert(`📅 Coaching Session Details\n\nSession ID: ${sessionId}\n\n👥 Session Info:\n• Duration: 60 minutes\n• Format: Video call\n• Student: Premium member\n• Topic: Course feedback\n\n🎯 Preparation:\n• Review student progress\n• Prepare discussion points\n• Test video/audio setup\n• Have course materials ready\n\n⏰ Join 5 minutes early for best experience.`);
  };

  const handleAIShortcut = (label: string) => {
    const aiFeatures: Record<string, string> = {
      'Generate lesson outline': '📝 AI Lesson Outline Generator\n\n✨ What it does:\n• Creates structured lesson outlines\n• Suggests learning objectives\n• Recommends activities and assessments\n• Optimizes lesson duration\n\n⚡ Time saved: ~2 hours per lesson\n\n💡 Click to launch AI assistant',
      'Analyze quiz results': '📊 AI Quiz Analytics\n\n✨ Features:\n• Identifies difficult questions\n• Suggests question improvements\n• Analyzes student performance patterns\n• Recommends personalized feedback\n\n📈 Improves student outcomes by 25%\n\n💡 Click to view analytics',
      'Draft course announcement': '📢 AI Announcement Writer\n\n✨ Capabilities:\n• Writes engaging announcements\n• Personalizes for your audience\n• Suggests optimal send times\n• A/B testing recommendations\n\n✅ Increases open rates by 40%\n\n💡 Click to start drafting',
      'Suggest price optimization': '💡 AI Price Optimizer\n\n✨ Analysis includes:\n• Market competitive analysis\n• Student demand prediction\n• Revenue optimization suggestions\n• Discount strategy recommendations\n\n💰 Average revenue increase: 18%\n\n💡 Click to see recommendations'
    };
    window.alert(aiFeatures[label] || `🤖 AI Tool: ${label}\n\nThis AI tool helps you work smarter and save time.\n\nClick to explore features.`);
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
                    <p className="text-3xl font-bold text-yellow-500">{studentMetrics.averageRating}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Course Performance */}
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-6">Course performance</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.name)}
                  className="p-4 bg-[color:var(--bg-secondary)] rounded-xl hover:bg-[color:var(--bg-glass-hover)] border border-[color:var(--border-base)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-1 group-hover:text-[color:var(--color-brand-electric)] transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-[color:var(--text-secondary)]">
                        <span>👥 {course.enrolledStudents} students</span>
                        <span>⭐ {course.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[color:var(--text-secondary)] mb-1">Completion rate</p>
                      <p className="text-xl font-bold text-[color:var(--color-brand-electric)]">{course.completionRate}%</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[color:var(--bg-primary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[color:var(--color-brand-electric)] to-[color:var(--color-brand-neon)] rounded-full transition-all box-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
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
