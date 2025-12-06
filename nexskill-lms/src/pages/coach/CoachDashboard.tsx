import React from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';

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
  activeStudents: 126,
  newThisWeek: 14,
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

const upcomingSessions = [
  {
    id: 1,
    dateTime: 'Today, 2:00 PM',
    studentName: 'Sarah Johnson',
    sessionType: 'Portfolio review',
    status: 'Confirmed',
  },
  {
    id: 2,
    dateTime: 'Tomorrow, 10:00 AM',
    studentName: 'Michael Chen',
    sessionType: 'Mock interview',
    status: 'Confirmed',
  },
  {
    id: 3,
    dateTime: 'Dec 6, 3:30 PM',
    studentName: 'Emily Rodriguez',
    sessionType: 'Career planning',
    status: 'Reschedule requested',
  },
  {
    id: 4,
    dateTime: 'Dec 7, 11:00 AM',
    studentName: 'David Kim',
    sessionType: 'Technical mentoring',
    status: 'Confirmed',
  },
  {
    id: 5,
    dateTime: 'Dec 8, 4:00 PM',
    studentName: 'Jessica Wang',
    sessionType: 'Resume review',
    status: 'Confirmed',
  },
];

const aiShortcuts = [
  { id: 1, label: 'Generate lesson outline', icon: '📝' },
  { id: 2, label: 'Analyze quiz results', icon: '📊' },
  { id: 3, label: 'Draft course announcement', icon: '📢' },
  { id: 4, label: 'Suggest price optimization', icon: '💡' },
];

const CoachDashboard: React.FC = () => {
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
        <div className="bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Welcome back, Coach</h1>
              <p className="text-slate-600 dark:text-dark-text-secondary">Here's an overview of your teaching performance</p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-semibold text-[#304DB5] dark:text-blue-400">
                  Active courses: {courses.length}
                </span>
              </div>
              <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-200 dark:border-purple-800">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  Active students: {studentMetrics.activeStudents}
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
            <div className="lg:col-span-2 bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-6">Revenue</h2>
              
              {/* Main KPI */}
              <div className="mb-6">
                <div className="text-5xl font-bold text-[#304DB5] mb-2">
                  ${revenueData.currentMonth.toLocaleString()}
                </div>
                <p className="text-lg text-slate-600 dark:text-dark-text-secondary">This month</p>
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total all-time</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">
                    ${revenueData.totalAllTime.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Month-over-month</p>
                  <p className="text-2xl font-bold text-green-600">+{revenueData.monthOverMonth}%</p>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-3">Last 6 months</p>
                <div className="flex items-end justify-between gap-2 h-32">
                  {revenueData.lastSixMonths.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-24">
                        <div
                          className="w-full bg-gradient-to-t from-[#304DB5] to-[#5E7BFF] rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${(item.amount / maxRevenue) * 100}%` }}
                          title={`$${item.amount}`}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Count & Engagement */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">Active students</p>
                    <p className="text-3xl font-bold text-[#304DB5]">{studentMetrics.activeStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">🆕</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">New this week</p>
                    <p className="text-3xl font-bold text-green-600">{studentMetrics.newThisWeek}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">Average rating</p>
                    <p className="text-3xl font-bold text-yellow-600">{studentMetrics.averageRating}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Course Performance */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-6">Course performance</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course.name)}
                  className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-1">{course.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-dark-text-secondary">
                        <span>👥 {course.enrolledStudents} students</span>
                        <span>⭐ {course.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Completion rate</p>
                      <p className="text-xl font-bold text-[#304DB5]">{course.completionRate}%</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full transition-all"
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
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-6">Upcoming coaching sessions</h2>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-slate-200 dark:border-gray-700 rounded-xl hover:border-[#5E7BFF] transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#304DB5] mb-1">{session.dateTime}</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary">{session.studentName}</p>
                        <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{session.sessionType}</p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          session.status === 'Confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSessionClick(session.id)}
                      className="text-sm font-medium text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                    >
                      View details →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tool Shortcuts */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-6">AI tool shortcuts</h2>
              <div className="grid grid-cols-2 gap-4">
                {aiShortcuts.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    onClick={() => handleAIShortcut(shortcut.label)}
                    className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-transparent hover:border-[#5E7BFF] hover:shadow-md transition-all group"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                      {shortcut.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary leading-tight">
                      {shortcut.label}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="text-lg">✨</span>
                  <p className="text-xs text-slate-600 dark:text-dark-text-secondary">
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
