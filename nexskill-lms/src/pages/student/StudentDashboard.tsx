import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useUser } from '../../context/UserContext';
import EnrolledCoursesOverview from '../../components/student/EnrolledCoursesOverview';
import ProgressCard from '../../components/student/ProgressCard';

// Dummy data
const courses = [
  {
    id: 1,
    title: 'UI Design Fundamentals',
    level: 'Beginner',
    progress: 67,
    completed: 8,
    total: 12,
    gradient: 'from-blue-100 to-purple-100'
  },
  {
    id: 2,
    title: 'Advanced React Patterns',
    level: 'Intermediate',
    progress: 45,
    completed: 9,
    total: 20,
    gradient: 'from-purple-100 to-pink-100'
  },
  {
    id: 3,
    title: 'Figma Mastery',
    level: 'Beginner',
    progress: 30,
    completed: 6,
    total: 20,
    gradient: 'from-pink-100 to-orange-100'
  }
];

const liveClasses = [
  {
    id: 1,
    date: 'Today, 2:00 PM',
    title: 'Introduction to Design Systems',
    instructor: 'Sarah Johnson'
  },
  {
    id: 2,
    date: 'Tomorrow, 10:00 AM',
    title: 'React Performance Optimization',
    instructor: 'Mike Chen'
  },
  {
    id: 3,
    date: 'Dec 6, 3:00 PM',
    title: 'Typography Best Practices',
    instructor: 'Emma Wilson'
  }
];

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: currentUser } = useUser();
  const [showAICoach, setShowAICoach] = useState(true);
  const [timeFilter] = useState('This week');

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              {getGreeting()}, {currentUser?.firstName || 'Student'} 👋
            </h1>
            <p className="text-sm text-text-secondary">
              Keep learning, you're doing great!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-brand-primary/5 dark:bg-gray-800/50 rounded-full">
              <span className="text-xs font-medium text-text-primary">
                🔥 Streak: <span className="text-brand-primary">5 days</span>
              </span>
            </div>
            <div className="px-4 py-2 bg-brand-primary/5 dark:bg-gray-800/50 rounded-full">
              <span className="text-xs font-medium text-text-primary">
                📊 Level: <span className="text-brand-primary">Intermediate</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8">
          {/* Top Row: Progress Summary + AI Coach + Certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Summary Card */}
            <div className="lg:col-span-1">
              <ProgressCard
                progressPercentage={45}
                hoursLearned={6.5}
                lessonsCompleted={12}
                totalLessons={20}
                timeFilter={timeFilter}
                onFilterChange={() => alert('Filter clicked')}
              />
            </div>

            {/* AI Coach Message Card */}
            {showAICoach && (
              <div className="lg:col-span-2 bg-gradient-to-br from-brand-primary/5 to-purple-500/5 rounded-3xl shadow-sm border border-brand-primary/10 p-6 relative">
                <button
                  onClick={() => setShowAICoach(false)}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-neon to-brand-electric flex items-center justify-center text-2xl flex-shrink-0 text-white shadow-lg shadow-brand-primary/20">
                    🤖
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Today's AI coach insight
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      You're 3 lessons away from completing <span className="font-medium text-text-primary">'UI Design Basics'</span>.
                      Keep up the momentum! Based on your learning pace, you can finish this course by this weekend.
                    </p>
                    <button
                      onClick={() => navigate('/student/courses/1/lessons/9')}
                      className="px-5 py-2 bg-gradient-to-r from-brand-neon to-brand-electric text-white text-sm font-medium rounded-full shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      Start next lesson
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates KPI Card */}
            {!showAICoach && (
              <div className="lg:col-span-1 glass-card rounded-2xl p-6">
                <p className="text-sm text-text-secondary mb-2">Certificates earned</p>
                <p className="text-4xl font-bold text-text-primary mb-3">4</p>
                <Link to="/student/certificates" className="text-sm text-brand-primary font-medium hover:text-brand-electric transition-colors">
                  View certificates →
                </Link>
              </div>
            )}
          </div>

          {/* Certificates Card (when AI Coach is visible) */}
          {showAICoach && (
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-card dark:bg-dark-background-card p-6 max-w-xs">
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-2">Certificates earned</p>
              <p className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-3">4</p>
              <Link to="/student/certificates" className="text-sm text-brand-primary font-medium hover:text-brand-primary-light transition-colors">
                View certificates →
              </Link>
            </div>
          )}

          {/* Recommended Courses Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Your courses</h2>
              <Link to="/student/courses" className="text-sm font-medium text-brand-primary hover:text-brand-primary-light transition-colors">
                View all →
              </Link>
            </div>
            <EnrolledCoursesOverview maxCourses={5} />
          </div>

          {/* Recommended Courses Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Recommended for you</h2>
              <Link to="/student/courses" className="text-sm font-medium text-brand-primary hover:text-brand-primary-light transition-colors">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`bg-gradient-to-br ${course.gradient} rounded-3xl shadow-card dark:bg-dark-background-card p-6 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-text-primary flex-1">
                      {course.title}
                    </h3>
                    <span className="px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-brand-primary ml-2">
                      {course.level}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4">
                    {course.completed} / {course.total} lessons
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                    className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-brand-primary text-sm font-medium rounded-full transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Live Classes Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Upcoming live classes</h2>
            </div>

            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card dark:bg-dark-background-card p-6">
              <div className="space-y-4">
                {liveClasses.map((liveClass, index) => (
                  <div
                    key={liveClass.id}
                    className={`flex items-center justify-between py-4 ${index !== liveClasses.length - 1 ? 'border-b border-[#EDF0FB] dark:border-gray-700' : ''
                      }`}
                  >
                    <div className="flex-1">
                      <p className="text-xs text-text-muted mb-1">{liveClass.date}</p>
                      <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                        {liveClass.title}
                      </h4>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        with {liveClass.instructor}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/student/live-class/${liveClass.id}`)}
                      className="px-5 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-medium rounded-full hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentDashboard;
