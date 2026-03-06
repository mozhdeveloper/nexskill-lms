import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';

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

interface Interest {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  name: string;
}

const StudentProfileEdit: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    headline: '',
    bio: '',
  });

  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Inline search state
  const [interestSearchQuery, setInterestSearchQuery] = useState('');
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);

  // Refs for click outside detection
  const interestSearchRef = useRef<HTMLDivElement>(null);
  const goalSearchRef = useRef<HTMLDivElement>(null);

  // Available options from database
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);

  // Fetch available interests and goals
  useEffect(() => {
    async function fetchOptions() {
      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

      if (!interestsError && interestsData) {
        setAvailableInterests(interestsData);
      }

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');

      if (!goalsError && goalsData) {
        setAvailableGoals(goalsData);
      }
    }

    fetchOptions();
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (interestSearchRef.current && !interestSearchRef.current.contains(event.target as Node)) {
        setShowInterestDropdown(false);
      }
      if (goalSearchRef.current && !goalSearchRef.current.contains(event.target as Node)) {
        setShowGoalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch current profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setLoading(false);
          return navigate('/login');
        }

        setUserId(user.id);

        const { data: profileData, error: profileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setLoading(false);
            return;
          }
          throw profileError;
        }

        const profile: StudentProfile = profileData;

        setFormData({
          firstName: profile.first_name,
          lastName: profile.last_name,
          displayName: `${profile.first_name} ${profile.last_name}`,
          headline: profile.headline || '',
          bio: profile.bio || '',
        });

        if (profile.current_skill_level) {
          setSkillLevel(profile.current_skill_level);
        }

        // Fetch user's interests
        const { data: interestsData, error: interestsError } = await supabase
          .from('student_interests')
          .select('interest_id')
          .eq('student_profile_id', profile.id);

        if (!interestsError && interestsData) {
          setSelectedInterestIds(interestsData.map(item => item.interest_id));
        }

        // Fetch user's goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('student_goals')
          .select('goal_id')
          .eq('student_profile_id', profile.id);

        if (!goalsError && goalsData) {
          setSelectedGoalIds(goalsData.map(item => item.goal_id));
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  // Handle interest selection from dropdown
  const handleSelectInterest = (interestId: string) => {
    if (!selectedInterestIds.includes(interestId)) {
      setSelectedInterestIds(prev => [...prev, interestId]);
    }
    setInterestSearchQuery('');
    setShowInterestDropdown(false);
  };

  // Handle goal selection from dropdown
  const handleSelectGoal = (goalId: string) => {
    if (!selectedGoalIds.includes(goalId)) {
      setSelectedGoalIds(prev => [...prev, goalId]);
    }
    setGoalSearchQuery('');
    setShowGoalDropdown(false);
  };

  const handleRemoveInterest = (interestId: string) => {
    setSelectedInterestIds(prev => prev.filter(id => id !== interestId));
  };

  const handleRemoveGoal = (goalId: string) => {
    setSelectedGoalIds(prev => prev.filter(id => id !== goalId));
  };

  const handleSave = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const profileData = {
        user_id: userId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        headline: formData.headline.trim() || null,
        bio: formData.bio.trim() || null,
        current_skill_level: skillLevel,
      };

      const { data, error: upsertError } = await supabase
        .from('student_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;

      const savedProfileId = data.id;

      // Save interests
      await supabase
        .from('student_interests')
        .delete()
        .eq('student_profile_id', savedProfileId);

      if (selectedInterestIds.length > 0) {
        const interestRecords = selectedInterestIds.map(interestId => ({
          student_profile_id: savedProfileId,
          interest_id: interestId,
        }));

        const { error: interestsError } = await supabase
          .from('student_interests')
          .insert(interestRecords);

        if (interestsError) console.error('Error saving interests:', interestsError);
      }

      // Save goals
      await supabase
        .from('student_goals')
        .delete()
        .eq('student_profile_id', savedProfileId);

      if (selectedGoalIds.length > 0) {
        const goalRecords = selectedGoalIds.map(goalId => ({
          student_profile_id: savedProfileId,
          goal_id: goalId,
        }));

        const { error: goalsError } = await supabase
          .from('student_goals')
          .insert(goalRecords);

        if (goalsError) console.error('Error saving goals:', goalsError);
      }

      setShowSuccessMessage(true);

      setTimeout(() => {
        navigate('/student/profile');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      setSaving(false);
    }
  };

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

  const selectedInterests = availableInterests.filter(i => selectedInterestIds.includes(i.id));
  const selectedGoals = availableGoals.filter(g => selectedGoalIds.includes(g.id));

  // Filter interests and goals based on search query
  const filteredInterests = availableInterests.filter(interest =>
    !selectedInterestIds.includes(interest.id) &&
    interest.name.toLowerCase().includes(interestSearchQuery.toLowerCase())
  );

  const filteredGoals = availableGoals.filter(goal =>
    !selectedGoalIds.includes(goal.id) &&
    goal.name.toLowerCase().includes(goalSearchQuery.toLowerCase())
  );

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit profile</h1>
          <p className="text-lg text-slate-600">Update your personal details and learning goals</p>
        </div>

        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-medium">Profile saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-8 mb-6">
          {/* Personal Information */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Personal information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Headline</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="What are you focusing on?"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us a bit about yourself"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          {/* Interests Section */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Interests</h2>

            {/* Inline Search Field */}
            <div className="mb-4" ref={interestSearchRef}>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={interestSearchQuery}
                  onChange={(e) => {
                    setInterestSearchQuery(e.target.value);
                    setShowInterestDropdown(true);
                  }}
                  onFocus={() => setShowInterestDropdown(true)}
                  placeholder="Search interests (e.g., Design, Data...)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                {/* Dropdown */}
                {showInterestDropdown && interestSearchQuery && filteredInterests.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                    {filteredInterests.map((interest) => (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => handleSelectInterest(interest.id)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <span className="font-medium text-slate-900">{interest.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Interests Display */}
            {selectedInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedInterests.map((interest) => (
                  <span
                    key={interest.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {interest.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest.id)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No interests selected yet</p>
            )}
          </div>

          {/* Learning Goals Section */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Learning Goals</h2>

            {/* Inline Search Field */}
            <div className="mb-4" ref={goalSearchRef}>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={goalSearchQuery}
                  onChange={(e) => {
                    setGoalSearchQuery(e.target.value);
                    setShowGoalDropdown(true);
                  }}
                  onFocus={() => setShowGoalDropdown(true)}
                  placeholder="Search goals (e.g., Get a Job, Learn New Skills...)"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                {/* Dropdown */}
                {showGoalDropdown && goalSearchQuery && filteredGoals.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                    {filteredGoals.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => handleSelectGoal(goal.id)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <span className="font-medium text-slate-900">{goal.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Goals Display */}
            {selectedGoals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedGoals.map((goal) => (
                  <span
                    key={goal.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium"
                  >
                    {goal.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(goal.id)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No goals selected yet</p>
            )}
          </div>

          {/* Skill Level - Horizontal Layout */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Experience Level</h2>
            <div className="flex gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSkillLevel(level)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${skillLevel === level
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={() => navigate('/student/profile')}
              disabled={saving}
              className="px-8 py-3 text-slate-700 font-medium rounded-full border-2 border-slate-200 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentProfileEdit;