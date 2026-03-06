import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';
import AutocompleteModal from '../../components/AutocompleteModal';

interface Interest {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  name: string;
}

interface CategorizedOption {
  id: string;
  name: string;
  type: 'interest' | 'goal';
}

const OnboardingPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  // Available options from database
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [categorizedOptions, setCategorizedOptions] = useState<CategorizedOption[]>([]);

  // Selected items
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

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

  // Combine interests and goals into categorized options
  useEffect(() => {
    const interests: CategorizedOption[] = availableInterests.map(i => ({
      id: i.id,
      name: i.name,
      type: 'interest' as const,
    }));

    const goals: CategorizedOption[] = availableGoals.map(g => ({
      id: g.id,
      name: g.name,
      type: 'goal' as const,
    }));

    setCategorizedOptions([...interests, ...goals]);
  }, [availableInterests, availableGoals]);

  const handleSelect = (id: string, type: 'interest' | 'goal') => {
    if (type === 'interest') {
      if (selectedInterestIds.includes(id)) {
        setSelectedInterestIds(prev => prev.filter(i => i !== id));
      } else {
        setSelectedInterestIds(prev => [...prev, id]);
      }
    } else {
      if (selectedGoalIds.includes(id)) {
        setSelectedGoalIds(prev => prev.filter(g => g !== id));
      } else {
        setSelectedGoalIds(prev => [...prev, id]);
      }
    }
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

      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ current_skill_level: 'Intermediate' })
        .eq('id', studentProfile.id);

      if (updateError) throw updateError;

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

  return (
    <StudentAuthLayout maxWidth="large">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome to NexSkill!</h1>
          <p className="text-text-secondary text-sm">
            Let's personalize your learning experience
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-8">
          {/* Interests Section */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Your Interests</h2>
                <p className="text-sm text-text-secondary mt-1">Choose topics you're passionate about</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInterestModal(true)}
                className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
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
              <div className="text-center py-8 text-text-secondary text-sm">
                No interests selected yet. Click "Add" to get started!
              </div>
            )}
          </div>

          {/* Learning Goals Section */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Learning Goals</h2>
                <p className="text-sm text-text-secondary mt-1">What do you want to achieve?</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 bg-brand-primary text-white rounded-full text-sm font-medium hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
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
              <div className="text-center py-8 text-text-secondary text-sm">
                No goals selected yet. Click "Add" to get started!
              </div>
            )}
          </div>

          {/* Experience Level Section */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Experience Level</h2>
            <p className="text-sm text-text-secondary mb-4">This helps us recommend the right courses</p>
            <div className="space-y-3">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setExperienceLevel(level.id)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all text-left ${experienceLevel === level.id
                    ? 'border-brand-primary bg-brand-primary-soft'
                    : 'border-gray-200 bg-white hover:border-brand-primary-light'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.icon}</span>
                      <div>
                        <p className="font-medium text-text-primary mb-1">{level.label}</p>
                        <p className="text-sm text-text-secondary">{level.description}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${experienceLevel === level.id ? 'border-brand-primary' : 'border-gray-300'
                        }`}
                    >
                      {experienceLevel === level.id && (
                        <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={selectedInterestIds.length === 0 || selectedGoalIds.length === 0 || !experienceLevel || isSubmitting}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Saving...' : 'Continue to dashboard'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="sm:w-auto px-6 py-3 text-text-secondary font-medium hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>
        </form>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
          <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
          <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
        </div>
      </div>

      {/* Modals */}
      <AutocompleteModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title="Add Interests"
        placeholder="Search interests (e.g., Design, Data...)"
        options={categorizedOptions.filter(opt => opt.type === 'interest')}
        selectedIds={selectedInterestIds}
        onSelect={handleSelect}
      />

      <AutocompleteModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Add Learning Goals"
        placeholder="Search goals (e.g., Get a Job...)"
        options={categorizedOptions.filter(opt => opt.type === 'goal')}
        selectedIds={selectedGoalIds}
        onSelect={handleSelect}
      />
    </StudentAuthLayout>
  );
};

export default OnboardingPreferences;