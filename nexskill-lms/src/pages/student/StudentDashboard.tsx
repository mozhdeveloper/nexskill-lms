import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useUser } from '../../context/UserContext';
import EnrolledCoursesOverview from '../../components/student/EnrolledCoursesOverview';
import ProgressCard from '../../components/student/ProgressCard';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useLiveSessions } from '../../hooks/useLiveSessions';
import { useCourseProgress } from '../../hooks/useCourseProgress';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile: currentUser } = useUser();
  const [showAICoach, setShowAICoach] = useState(true);
  const [timeFilter] = useState('This week');

  // Real data hooks
  const { courses: enrolledCourses, loading: coursesLoading } = useEnrolledCourses();
  const { upcomingSessions, loading: sessionsLoading } = useLiveSessions();

  // Get course IDs for progress calculation
  const courseIds = useMemo(() => enrolledCourses.map(c => c.id), [enrolledCourses]);
  const {
    progress: courseProgress,
    totalLessons,
    totalCompleted,
    totalTimeSeconds,
    overallPercent,
    loading: progressLoading,
  } = useCourseProgress(courseIds);

  // Build per-course progress map
  const progressMap = useMemo(() => {
    const map: Record<string, { completedLessons: number; totalLessons: number; percent: number }> = {};
    for (const p of courseProgress) {
      map[p.courseId] = { completedLessons: p.completedLessons, totalLessons: p.totalLessons, percent: p.progressPercent };
    }
    return map;
  }, [courseProgress]);

  const hoursLearned = Math.round((totalTimeSeconds / 3600) * 10) / 10;
  const certificateCount = courseProgress.filter(p => p.totalLessons > 0 && p.completedLessons >= p.totalLessons).length;

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
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-[color:var(--border-base)]">
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
            <div className="px-4 py-2 bg-[color:var(--bg-glass)] rounded-full">
              <span className="text-xs font-medium text-text-primary">
                � Enrolled: <span className="text-brand-primary">{coursesLoading ? '…' : enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''}</span>
              </span>
            </div>
            <div className="px-4 py-2 bg-[color:var(--bg-glass)] rounded-full">
              <span className="text-xs font-medium text-text-primary">
                ✅ Done: <span className="text-brand-primary">{progressLoading ? '…' : totalCompleted} lesson{totalCompleted !== 1 ? 's' : ''}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          {/* Top Row: Progress Summary + AI Coach + Certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Summary Card */}
            <div className="lg:col-span-1">
              <ProgressCard
                progressPercentage={progressLoading ? 0 : overallPercent}
                hoursLearned={hoursLearned}
                lessonsCompleted={totalCompleted}
                totalLessons={totalLessons}
                timeFilter={timeFilter}
                onFilterChange={() => {}}
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
                      {enrolledCourses.length > 0 ? (
                        <>
                          {(() => {
                            const first = enrolledCourses[0];
                            const cp = progressMap[first.id];
                            const remaining = cp ? cp.totalLessons - cp.completedLessons : 0;
                            return remaining > 0
                              ? <>You're {remaining} lesson{remaining !== 1 ? 's' : ''} away from completing <span className="font-medium text-text-primary">'{first.title}'</span>. Keep up the momentum!</>
                              : <>Great job completing <span className="font-medium text-text-primary">'{first.title}'</span>! Browse the catalog for your next challenge.</>;
                          })()}
                        </>
                      ) : (
                        <>You haven't enrolled in any courses yet. Browse the catalog to find your first course!</>
                      )}
                    </p>
                    <button
                      onClick={() => enrolledCourses.length > 0 ? navigate(`/student/courses/${enrolledCourses[0].id}`) : navigate('/student/courses')}
                      className="px-5 py-2 bg-gradient-to-r from-brand-neon to-brand-electric text-white text-sm font-medium rounded-full shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      {enrolledCourses.length > 0 ? 'Continue learning' : 'Browse courses'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates KPI Card */}
            {!showAICoach && (
              <div className="lg:col-span-1 glass-card rounded-2xl p-6">
                <p className="text-sm text-text-secondary mb-2">Certificates earned</p>
                <p className="text-4xl font-bold text-text-primary mb-3">{certificateCount}</p>
                <Link to="/student/certificates" className="text-sm text-brand-primary font-medium hover:text-brand-electric transition-colors">
                  View certificates →
                </Link>
              </div>
            )}
          </div>

          {/* Certificates Card (when AI Coach is visible) */}
          {showAICoach && (
            <div className="glass-card rounded-2xl p-6 max-w-xs">
              <p className="text-sm text-text-secondary mb-2">Certificates earned</p>
              <p className="text-4xl font-bold text-text-primary mb-3">{certificateCount}</p>
              <Link to="/student/certificates" className="text-sm text-brand-primary font-medium hover:text-brand-primary-light transition-colors">
                View certificates →
              </Link>
            </div>
          )}

          {/* Recommended Courses Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Your courses</h2>
              <Link to="/student/courses" className="text-sm font-medium text-brand-primary hover:text-brand-primary-light transition-colors">
                View all →
              </Link>
            </div>
            <EnrolledCoursesOverview maxCourses={5} />
          </div>

          {/* Continue Learning Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Continue learning</h2>
              <Link to="/student/courses" className="text-sm font-medium text-brand-primary hover:text-brand-primary-light transition-colors">
                View all →
              </Link>
            </div>

            {coursesLoading ? (
              <div className="text-sm text-text-secondary">Loading courses...</div>
            ) : enrolledCourses.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center">
                <p className="text-text-secondary mb-4">You haven't enrolled in any courses yet.</p>
                <button onClick={() => navigate('/student/courses')} className="px-5 py-2 bg-gradient-to-r from-brand-neon to-brand-electric text-white text-sm font-medium rounded-full">
                  Browse courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.slice(0, 6).map((course) => {
                  const cp = progressMap[course.id];
                  const percent = cp?.percent ?? 0;
                  const completed = cp?.completedLessons ?? 0;
                  const total = cp?.totalLessons ?? 0;

                  return (
                    <div
                      key={course.id}
                      className="glass-card rounded-3xl p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-semibold text-text-primary flex-1">
                          {course.title}
                        </h3>
                        <span className="px-3 py-1 bg-brand-primary/10 rounded-full text-xs font-medium text-brand-primary ml-2">
                          {course.level || 'Beginner'}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary mb-4">
                        {completed} / {total} lessons
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full h-1 bg-[color:var(--border-base)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-primary rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                        className="w-full py-2 px-4 bg-gradient-to-r from-brand-neon to-brand-electric text-white text-sm font-medium rounded-full hover:shadow-lg hover:scale-[1.02] transition-all"
                      >
                        {percent === 100 ? 'Review' : 'Continue'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Live Classes Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Upcoming live classes</h2>
            </div>

            <div className="glass-card rounded-3xl p-6">
              {sessionsLoading ? (
                <p className="text-sm text-text-secondary">Loading sessions...</p>
              ) : upcomingSessions.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">No upcoming live classes.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.slice(0, 5).map((session, index) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between py-4 ${index !== Math.min(upcomingSessions.length, 5) - 1 ? 'border-b border-[color:var(--border-base)]' : ''
                        }`}
                    >
                      <div className="flex-1">
                        <p className="text-xs text-text-muted mb-1">
                          {new Date(session.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                          {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h4 className="text-sm font-semibold text-text-primary mb-1">
                          {session.title}
                        </h4>
                        <p className="text-xs text-text-secondary">
                          with {session.coach?.first_name} {session.coach?.last_name}
                        </p>
                      </div>
                      {session.meeting_link ? (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-medium rounded-full hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                          Join
                        </a>
                      ) : (
                        <span className="px-4 py-2 text-xs font-medium text-text-secondary bg-[color:var(--bg-glass)] rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentDashboard;
