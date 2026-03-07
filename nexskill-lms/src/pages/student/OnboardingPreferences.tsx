import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

interface Interest {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  name: string;
}

const OnboardingPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  // Available options from database
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  // Selected items
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inline search state
  const [interestSearchQuery, setInterestSearchQuery] = useState('');
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);

  // Refs for click outside detection
  const interestSearchRef = useRef<HTMLDivElement>(null);
  const goalSearchRef = useRef<HTMLDivElement>(null);

  const experienceLevels = [
    { id: 'Beginner', label: 'Beginner', description: 'New to learning online', icon: '🌱' },
    { id: 'Intermediate', label: 'Intermediate', description: 'Some experience with online courses', icon: '📚' },
    { id: 'Advanced', label: 'Advanced', description: 'Experienced online learner', icon: '🎓' },
  ];

  // Fetch available interests and goals from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('id, name')
          .eq('is_active', true)
          .order('display_order');

        if (interestsError) throw interestsError;
        setAvailableInterests(interestsData || []);

        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, name')
          .eq('is_active', true)
          .order('display_order');

        if (goalsError) throw goalsError;
        setAvailableGoals(goalsData || []);
      } catch (error) {
        console.error('Error fetching options:', error);
        alert('Failed to load options. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

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

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      console.error('No profile found');
      alert('Session error. Please log in again.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get or create student profile
      let { data: studentProfile, error: profileError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!studentProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: profile.id,
            first_name: profile.firstName || '',
            last_name: profile.lastName || '',
          })
          .select('id')
          .single();

        if (createError) throw createError;
        studentProfile = newProfile;
      }

      if (!studentProfile) throw new Error('Failed to get or create student profile');

      // Update skill level
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ current_skill_level: experienceLevel })
        .eq('id', studentProfile.id);

      if (updateError) throw updateError;

      // Insert selected interests
      if (selectedInterestIds.length > 0) {
        const interestsToInsert = selectedInterestIds.map(interestId => ({
          student_profile_id: studentProfile.id,
          interest_id: interestId,
        }));

        const { error: interestsError } = await supabase
          .from('student_interests')
          .insert(interestsToInsert);

        if (interestsError) throw interestsError;
      }

      // Insert selected goals
      if (selectedGoalIds.length > 0) {
        const goalsToInsert = selectedGoalIds.map(goalId => ({
          student_profile_id: studentProfile.id,
          goal_id: goalId,
        }));

        const { error: goalsError } = await supabase
          .from('student_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error during onboarding:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!profile) {
      console.error('No profile found');
      return;
    }

    try {
      setIsSubmitting(true);

      // Just create the blank student profile (if it doesn't exist)
      let { data: studentProfile, error: profileError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!studentProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: profile.id,
            first_name: profile.firstName || '',
            last_name: profile.lastName || '',

          })
          .select('id')
          .single();

        if (createError) throw createError;
        studentProfile = newProfile;
      }

      if (!studentProfile) throw new Error('Failed to get or create student profile');

      // Just navigate - don't update anything else
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error during skip:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <StudentAuthLayout maxWidth="large">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
            <p className="text-text-secondary">Loading preferences...</p>
          </div>
        </div>
      </StudentAuthLayout>
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
    <StudentAuthLayout maxWidth="large">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] rounded-full">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to NexSkill!</h1>
          <p className="text-slate-600 text-sm">
            Let's personalize your learning experience
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-8">
          {/* Interests Section */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your Interests</h2>
            <p className="text-sm text-slate-600 mb-4">Choose topics you're passionate about</p>

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
                  placeholder="Search interests (e.g., Design, Data, Business...)"
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
              <div className="text-center py-4 text-slate-500 text-sm">
                No interests selected yet. Search to add some!
              </div>
            )}
          </div>

          {/* Learning Goals Section */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Learning Goals</h2>
            <p className="text-sm text-slate-600 mb-4">What do you want to achieve?</p>

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
                  placeholder="Search goals (e.g., Get a Job, Upskill, Learn new skills...)"
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
              <div className="text-center py-4 text-slate-500 text-sm">
                No goals selected yet. Search to add some!
              </div>
            )}
          </div>

          {/* Experience Level Section */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Experience Level</h2>
            <p className="text-sm text-slate-600 mb-4">This helps us recommend the right courses</p>
            <div className="flex gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setExperienceLevel(level.id)}
                  className={`flex-1 py-4 text-sm font-medium rounded-full transition-all ${experienceLevel === level.id
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={selectedInterestIds.length === 0 || selectedGoalIds.length === 0 || !experienceLevel || isSubmitting}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Saving...' : 'Continue to dashboard'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="sm:w-auto px-6 py-3 text-slate-500 font-medium hover:text-[#304DB5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>
        </form>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#304DB5]"></div>
          <div className="w-2 h-2 rounded-full bg-[#304DB5]"></div>
          <div className="w-2 h-2 rounded-full bg-[#304DB5]"></div>
        </div>

        <div className="h-6"></div>
      </div>
    </StudentAuthLayout>
  );
};

export default OnboardingPreferences;