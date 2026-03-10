import React, { useMemo, useState, useEffect } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import AIChatPanel from '../../components/ai/AIChatPanel';
import AIProgressRecommendations from '../../components/ai/AIProgressRecommendations';
import AIExplainSimplyCard from '../../components/ai/AIExplainSimplyCard';
import AIRevisionTasks from '../../components/ai/AIRevisionTasks';
import AIMilestoneNotifications from '../../components/ai/AIMilestoneNotifications';
import AIPersonalizedStudyPlan from '../../components/ai/AIPersonalizedStudyPlan';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';

const AICoachHome: React.FC = () => {
  const { profile } = useUser();
  const { courses: enrolledCourses } = useEnrolledCourses();
  const courseIds = useMemo(() => enrolledCourses.map(c => c.id), [enrolledCourses]);
  const { totalLessons, totalCompleted, totalTimeSeconds, overallPercent } = useCourseProgress(courseIds);

  const [streakDays, setStreakDays] = useState(0);
  const [averageQuizScore, setAverageQuizScore] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchStats = async () => {
      // Average quiz score across all attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('score, max_score')
        .eq('user_id', profile.id);
      if (attempts && attempts.length > 0) {
        const valid = attempts.filter((a: { score: number; max_score: number }) => a.max_score > 0);
        if (valid.length > 0) {
          const avg = valid.reduce((s: number, a: { score: number; max_score: number }) =>
            s + Math.round((a.score / a.max_score) * 100), 0) / valid.length;
          setAverageQuizScore(Math.round(avg));
        }
      }

      // Streak: count consecutive days (ending today) with at least one completed lesson
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('completed_at')
        .eq('user_id', profile.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null);
      if (progress && progress.length > 0) {
        const days = new Set<string>(
          progress.map((p: { completed_at: string }) =>
            new Date(p.completed_at).toISOString().slice(0, 10)
          )
        );
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          if (days.has(d.toISOString().slice(0, 10))) {
            streak++;
          } else {
            break;
          }
        }
        setStreakDays(streak);
      }
    };
    fetchStats();
  }, [profile?.id]);

  const currentCourse = enrolledCourses[0]?.title ?? 'your course';
  const studentProgress = {
    activeCourses: enrolledCourses.length,
    completedLessons: totalCompleted,
    totalLessons: totalLessons,
    weeklyHours: Math.round((totalTimeSeconds / 3600) * 10) / 10,
    streakDays,
    upcomingDeadlines: 0,
    averageQuizScore,
    currentCourse,
    completionPercentage: Math.round(overallPercent),
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-6 transition-colors">
        <div className="max-w-1xl">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AI Student Coach</h1>
            <p className="text-slate-600 dark:text-slate-400">Personalized guidance based on your learning activity.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Area (Left 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <AIChatPanel />
              <AIPersonalizedStudyPlan />
            </div>

            {/* Sidebar Tools (Right 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <AIProgressRecommendations progress={studentProgress} />
              <AIRevisionTasks />
              <AIExplainSimplyCard />
              <AIMilestoneNotifications progress={studentProgress} />
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default AICoachHome;
