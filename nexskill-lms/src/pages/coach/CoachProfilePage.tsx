import React, { useState, useEffect, useCallback } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import CoachProfileHeader from '../../components/coach/profile/CoachProfileHeader';
import CoachBioForm from '../../components/coach/profile/CoachBioForm';
import CoachSocialLinksForm from '../../components/coach/profile/CoachSocialLinksForm';
import CoachAchievementsPanel from '../../components/coach/profile/CoachAchievementsPanel';
import CoachPoliciesPanel from '../../components/coach/profile/CoachPoliciesPanel';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface CoachProfile {
  name: string;
  headline: string;
  avatarUrl?: string;
  bio: {
    headline: string;
    shortBio: string;
    fullBio: string;
    specialties: string[];
  };
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    year: number;
  }>;
  policies: {
    cancellation: string;
    refund: string;
    rescheduling: string;
    conduct: string;
  };
  stats: {
    courses: number;
    students: number;
    rating: number;
  };
}

const defaultProfile: CoachProfile = {
  name: '',
  headline: '',
  avatarUrl: undefined,
  bio: { headline: '', shortBio: '', fullBio: '', specialties: [] },
  socialLinks: {},
  achievements: [],
  policies: { cancellation: '', refund: '', rescheduling: '', conduct: '' },
  stats: { courses: 0, students: 0, rating: 0 },
};

const CoachProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CoachProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch profile, coach_profile, and course IDs in parallel
      const [profileRes, coachRes, coursesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('coach_profiles').select('*').eq('id', user.id).single(),
        supabase.from('courses').select('id').eq('coach_id', user.id),
      ]);

      const courseIds = coursesRes.data?.map((c: { id: string }) => c.id) || [];

      // Now fetch student count and ratings using the courseIds
      const [studentCountRes, ratingRes] = courseIds.length > 0
        ? await Promise.all([
            supabase.from('enrollments').select('profile_id', { count: 'exact', head: true }).in('course_id', courseIds),
            supabase.from('reviews').select('rating').in('course_id', courseIds),
          ])
        : [{ count: 0 }, { data: [] as { rating: number }[] }];

      const p = profileRes.data;
      const cp = coachRes.data;
      const ratings = 'data' in ratingRes ? ratingRes.data : [];
      const avgRating = ratings && ratings.length > 0
        ? Math.round((ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length) * 10) / 10
        : 0;

      setProfile({
        name: `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || p?.username || '',
        headline: cp?.job_title || '',
        avatarUrl: undefined,
        bio: {
          headline: cp?.job_title || '',
          shortBio: cp?.bio?.substring(0, 150) || '',
          fullBio: cp?.bio || '',
          specialties: cp?.content_areas || [],
        },
        socialLinks: {
          linkedin: cp?.linkedin_url || '',
          website: cp?.portfolio_url || '',
          twitter: '',
          youtube: '',
          facebook: '',
        },
        achievements: [],
        policies: { cancellation: '', refund: '', rescheduling: '', conduct: '' },
        stats: {
          courses: courseIds.length,
          students: ('count' in studentCountRes ? studentCountRes.count : 0) || 0,
          rating: avgRating,
        },
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleProfileHeaderChange = (updatedHeader: Partial<Pick<CoachProfile, 'name' | 'headline' | 'avatarUrl'>>) => {
    setProfile((prev) => ({ ...prev, ...updatedHeader }));
    setHasUnsavedChanges(true);
  };

  const handleBioChange = (updatedBio: CoachProfile['bio']) => {
    setProfile((prev) => ({ ...prev, bio: updatedBio, headline: updatedBio.headline }));
    setHasUnsavedChanges(true);
  };

  const handleSocialLinksChange = (updatedLinks: CoachProfile['socialLinks']) => {
    setProfile((prev) => ({ ...prev, socialLinks: updatedLinks }));
    setHasUnsavedChanges(true);
  };

  const handleAchievementsChange = (updatedAchievements: CoachProfile['achievements']) => {
    setProfile((prev) => ({ ...prev, achievements: updatedAchievements }));
    setHasUnsavedChanges(true);
  };

  const handlePoliciesChange = (updatedPolicies: CoachProfile['policies']) => {
    setProfile((prev) => ({ ...prev, policies: updatedPolicies }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const nameParts = profile.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update profiles table
      await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName,
      }).eq('id', user.id);

      // Upsert coach_profiles table
      await supabase.from('coach_profiles').upsert({
        id: user.id,
        job_title: profile.headline,
        bio: profile.bio.fullBio,
        content_areas: profile.bio.specialties,
        linkedin_url: profile.socialLinks.linkedin || null,
        portfolio_url: profile.socialLinks.website || null,
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachAppLayout>
      <div className="max-w-1xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-text-primary">Coach Profile</h1>
            <div className="flex gap-3 items-center">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-500 font-medium">Unsaved changes</span>
              )}
              <button
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges || saving}
                className={`px-6 py-3 font-semibold rounded-full transition-all ${
                  hasUnsavedChanges
                    ? 'bg-gradient-to-r from-brand-neon to-brand-electric text-white hover:shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <p className="text-text-secondary">
            Manage your public profile, bio, achievements, and coaching policies
          </p>
          <p className="text-xs text-text-muted mt-2">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        </div>

        {loading ? (
          <p className="text-text-secondary text-center py-12">Loading profile...</p>
        ) : (
          <div className="space-y-6">
            <CoachProfileHeader
              profile={{
                name: profile.name,
                headline: profile.headline,
                avatarUrl: profile.avatarUrl,
              }}
              stats={profile.stats}
              onProfileChange={handleProfileHeaderChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <CoachBioForm bio={profile.bio} onChange={handleBioChange} />
                <CoachSocialLinksForm links={profile.socialLinks} onChange={handleSocialLinksChange} />
              </div>
              <div className="space-y-6">
                <CoachAchievementsPanel
                  achievements={profile.achievements}
                  onChange={handleAchievementsChange}
                />
                <CoachPoliciesPanel policies={profile.policies} onChange={handlePoliciesChange} />
              </div>
            </div>
          </div>
        )}
      </div>
    </CoachAppLayout>
  );
};

export default CoachProfilePage;
