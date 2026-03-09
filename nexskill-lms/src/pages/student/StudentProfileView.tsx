import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileHeaderCard from '../../components/profile/ProfileHeaderCard';
import ProfileInterestsGoals from '../../components/profile/ProfileInterestsGoals';

interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  bio: string | null;
  current_skill_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  created_at: string;
  updated_at: string;
}

const StudentProfileView: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [hoursLearned, setHoursLearned] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  // Fetch profile data with interests and goals
  useEffect(() => {
    async function fetchProfile() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch student profile
        const { data: profileData, error: profileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        setProfile(profileData);

        // Fetch interests
        const { data: interestsData, error: interestsError } = await supabase
          .from('student_interests')
          .select(`
            interest_id,
            interests (
              id,
              name
            )
          `)
          .eq('student_profile_id', profileData.id);

        if (interestsError) {
          console.error('Error fetching interests:', interestsError);
        } else {
          const interestNames = interestsData
            ?.map((item: any) => item.interests?.name)
            .filter(Boolean) || [];
          setInterests(interestNames);
        }

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('student_goals')
          .select(`
            goal_id,
            goals (
              id,
              name
            )
          `)
          .eq('student_profile_id', profileData.id);

        if (goalsError) {
          console.error('Error fetching goals:', goalsError);
        } else {
          const goalNames = goalsData
            ?.map((item: any) => item.goals?.name)
            .filter(Boolean) || [];
          setGoals(goalNames);
        }

        // Fetch real learning stats in parallel
        const [enrollmentsResult, progressResult] = await Promise.all([
          supabase.from('enrollments').select('course_id').eq('profile_id', user.id),
          supabase.from('user_lesson_progress').select('lesson_id, is_completed, completed_at').eq('user_id', user.id)
        ]);

        const enrolledCourseIds = (enrollmentsResult.data || []).map((e: any) => e.course_id);

        const completedLessonIds = (progressResult.data || []).filter((p: any) => p.is_completed).map((p: any) => p.lesson_id);

        // Calculate streak from completed_at dates
        const completedDates = (progressResult.data || [])
          .filter((p: any) => p.is_completed && p.completed_at)
          .map((p: any) => new Date(p.completed_at).toDateString());
        const uniqueDays = [...new Set(completedDates)].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < uniqueDays.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          expected.setHours(0, 0, 0, 0);
          if (uniqueDays[i].getTime() === expected.getTime()) {
            streak++;
          } else break;
        }
        setStreakDays(streak);

        // Fetch duration info for completed lessons to calculate hours
        if (completedLessonIds.length > 0) {
          const { data: durationData } = await supabase
            .from('module_content_items')
            .select('content_id, lessons!inner(estimated_duration_minutes)')
            .eq('content_type', 'lesson')
            .in('content_id', completedLessonIds);
          const totalMinutes = (durationData || []).reduce((sum: number, item: any) => {
            return sum + (item.lessons?.estimated_duration_minutes || 5);
          }, 0);
          setHoursLearned(Math.round(totalMinutes / 60));
        }

        // Estimate completed courses: courses where all enrolled lessons are completed
        if (enrolledCourseIds.length > 0) {
          const { data: moduleData } = await supabase
            .from('modules')
            .select('id, course_id')
            .in('course_id', enrolledCourseIds);
          const moduleIds = (moduleData || []).map((m: any) => m.id);
          if (moduleIds.length > 0) {
            const { data: contentData } = await supabase
              .from('module_content_items')
              .select('content_id, module_id')
              .eq('content_type', 'lesson')
              .in('module_id', moduleIds);
            const completedSet = new Set(completedLessonIds);
            const lessonsByCourse: Record<string, { total: number; completed: number }> = {};
            const moduleIdToCourseId: Record<string, string> = {};
            (moduleData || []).forEach((m: any) => { moduleIdToCourseId[m.id] = m.course_id; });
            (contentData || []).forEach((item: any) => {
              const cid = moduleIdToCourseId[item.module_id];
              if (!cid) return;
              if (!lessonsByCourse[cid]) lessonsByCourse[cid] = { total: 0, completed: 0 };
              lessonsByCourse[cid].total++;
              if (completedSet.has(item.content_id)) lessonsByCourse[cid].completed++;
            });
            const completed = Object.values(lessonsByCourse).filter(c => c.total > 0 && c.completed === c.total).length;
            setCompletedCount(completed);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#304DB5] mb-4"></div>
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to load profile</h2>
            <p className="text-slate-600 mb-4">{error || 'Profile not found'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Try again
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Transform profile data for ProfileHeaderCard component
  const profileData = {
    name: `${profile.first_name} ${profile.last_name}`,
    headline: profile.headline || 'Student',
    level: profile.current_skill_level || null,
    memberSince: new Date(profile.created_at).getFullYear().toString(),
    streakDays: streakDays,
    bio: profile.bio || "Tell us about yourself! Click 'Edit Profile' to get started.",
    interests: interests,
    goals: goals,
    completedCourses: completedCount,
    certificates: completedCount, // Certificates = completed courses until a certificates table exists
    hoursLearned: hoursLearned,
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Profile Header */}
        <ProfileHeaderCard
          profile={profileData}
          onEditProfile={() => navigate('/student/profile/edit')}
        />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Bio and Interests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">About me</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{profileData.bio}</p>
            </div>

            {/* Interests & Goals */}
            <ProfileInterestsGoals
              mode="view"
              interests={profileData.interests}
              goals={profileData.goals}
              level={profileData.level}
            />
          </div>

          {/* Right column - Metrics and Quick Actions */}
          <div className="space-y-6">
            {/* Learning Stats — fetched from enrollments + lesson progress */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Learning stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <span className="text-lg">📚</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Courses completed</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {profileData.completedCourses}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Certificates earned</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {profileData.certificates}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <span className="text-lg">⏱️</span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Hours learned</div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {profileData.hoursLearned}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/student/profile/edit')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all text-left flex items-center justify-between"
                >
                  <span>Edit profile</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/student/settings')}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left flex items-center justify-between"
                >
                  <span>Account settings</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/student/settings/billing')}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left flex items-center justify-between"
                >
                  <span>Billing & payments</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentProfileView;