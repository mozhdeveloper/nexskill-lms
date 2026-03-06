import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';

interface CoachData {
  id: string;
  name: string;
  email?: string;
  jobTitle?: string;
  bio?: string;
  experienceLevel?: string;
  contentAreas?: string[];
  tools?: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  studentsCount: number;
  coursesCount: number;
}

const CoachProfile: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (!coachId) {
        setError('No coach ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch basic profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', coachId)
          .single();

        if (profileError || !profile) {
          console.error('[CoachProfile] Profile error:', profileError);
          setError('Coach not found');
          setLoading(false);
          return;
        }

        // Fetch extended coach profile (may not exist)
        const { data: coachProfile } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('id', coachId)
          .maybeSingle();

        // Fetch course count
        const { count: coursesCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', coachId);

        // Fetch student count (enrollments across all courses)
        const { data: coachCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('coach_id', coachId);

        let studentsCount = 0;
        if (coachCourses && coachCourses.length > 0) {
          const courseIds = coachCourses.map(c => c.id);
          const { count: enrollmentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .in('course_id', courseIds);
          studentsCount = enrollmentCount || 0;
        }

        const coachData: CoachData = {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Instructor',
          email: profile.email,
          jobTitle: coachProfile?.job_title,
          bio: coachProfile?.bio,
          experienceLevel: coachProfile?.experience_level,
          contentAreas: coachProfile?.content_areas || [],
          tools: coachProfile?.tools || [],
          linkedinUrl: coachProfile?.linkedin_url,
          portfolioUrl: coachProfile?.portfolio_url,
          studentsCount,
          coursesCount: coursesCount || 0,
        };

        setCoach(coachData);
      } catch (err) {
        console.error('[CoachProfile] Error:', err);
        setError('Failed to load coach profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, [coachId]);

  const handleMessageCoach = () => {
    if (coach) {
      navigate(`/student/messages?recipientId=${coach.id}&recipientName=${encodeURIComponent(coach.name)}`);
    }
  };

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="animate-pulse">
                <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-32 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (error || !coach) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-lg text-slate-600 mb-4">{error || 'Coach not found'}</p>
              <button
                onClick={() => navigate('/student/coaching')}
                className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Browse all coaches
              </button>
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] pb-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go back
          </button>

          {/* Header card */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md border border-slate-200 p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                {coach.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{coach.name}</h1>
                {coach.jobTitle && (
                  <p className="text-lg text-brand-primary font-medium mb-1">{coach.jobTitle}</p>
                )}
                {coach.experienceLevel && (
                  <p className="text-sm text-slate-500 mb-3">{coach.experienceLevel} Level</p>
                )}
                <div className="flex items-center gap-6 text-sm mb-4">
                  <div className="text-center">
                    <div className="font-bold text-xl text-slate-900">{coach.studentsCount}</div>
                    <div className="text-slate-500">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-xl text-slate-900">{coach.coursesCount}</div>
                    <div className="text-slate-500">Courses</div>
                  </div>
                </div>

                {/* Social Links */}
                {(coach.linkedinUrl || coach.portfolioUrl) && (
                  <div className="flex flex-wrap gap-2">
                    {coach.linkedinUrl && (
                      <a
                        href={coach.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full hover:bg-blue-200 transition-colors"
                      >
                        🔗 LinkedIn
                      </a>
                    )}
                    {coach.portfolioUrl && (
                      <a
                        href={coach.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-purple-100 text-purple-600 text-sm font-medium rounded-full hover:bg-purple-200 transition-colors"
                      >
                        🌐 Portfolio
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/student/coaching/coaches/${coach.id}/book`)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Book a session
              </button>
              <button
                onClick={handleMessageCoach}
                className="py-3 px-6 border-2 border-[#304DB5] text-[#304DB5] font-semibold rounded-full hover:bg-[#304DB5] hover:text-white transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </button>
            </div>
          </div>

          {/* About / Bio */}
          {coach.bio && (
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
              <p className="text-slate-700 leading-relaxed">{coach.bio}</p>
            </div>
          )}

          {/* Content Areas / Expertise */}
          {coach.contentAreas && coach.contentAreas.length > 0 && (
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {coach.contentAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-brand-primary-soft text-brand-primary font-medium rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {coach.tools && coach.tools.length > 0 && (
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Tools & Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {coach.tools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for no extended profile */}
          {!coach.bio && !coach.contentAreas?.length && !coach.tools?.length && (
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-slate-600">
                This coach hasn't completed their profile yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CoachProfile;
