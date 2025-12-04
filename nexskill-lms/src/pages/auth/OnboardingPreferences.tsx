import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

const OnboardingPreferences: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');

  const learningGoals = [
    { id: 'career', label: 'Advance my career', icon: '🚀' },
    { id: 'skills', label: 'Learn new skills', icon: '💡' },
    { id: 'hobby', label: 'Personal interest/hobby', icon: '🎨' },
    { id: 'business', label: 'Start or grow my business', icon: '💼' },
  ];

  const experienceLevels = [
    { id: 'beginner', label: 'Beginner', description: 'New to learning online' },
    { id: 'intermediate', label: 'Intermediate', description: 'Some experience with online courses' },
    { id: 'advanced', label: 'Advanced', description: 'Experienced online learner' },
  ];

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard
    navigate('/student/dashboard');
  };

  const handleSkip = () => {
    // Skip onboarding and go to dashboard
    navigate('/student/dashboard');
  };

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
          {/* Learning Goals Section */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              What are your learning goals?
            </h2>
            <p className="text-sm text-text-secondary mb-4">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`p-4 rounded-3xl border-2 transition-all text-left ${
                    selectedGoals.includes(goal.id)
                      ? 'border-brand-primary bg-brand-primary-soft'
                      : 'border-gray-200 bg-white hover:border-brand-primary-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="font-medium text-text-primary">{goal.label}</span>
                    {selectedGoals.includes(goal.id) && (
                      <svg className="w-5 h-5 ml-auto text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level Section */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              What's your experience level?
            </h2>
            <p className="text-sm text-text-secondary mb-4">This helps us recommend the right courses</p>
            <div className="space-y-3">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setExperienceLevel(level.id)}
                  className={`w-full p-4 rounded-3xl border-2 transition-all text-left ${
                    experienceLevel === level.id
                      ? 'border-brand-primary bg-brand-primary-soft'
                      : 'border-gray-200 bg-white hover:border-brand-primary-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary mb-1">{level.label}</p>
                      <p className="text-sm text-text-secondary">{level.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      experienceLevel === level.id
                        ? 'border-brand-primary'
                        : 'border-gray-300'
                    }`}>
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
              disabled={selectedGoals.length === 0 || !experienceLevel}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue to dashboard
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="sm:w-auto px-6 py-3 text-text-secondary font-medium hover:text-brand-primary transition-colors"
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
    </StudentAuthLayout>
  );
};

export default OnboardingPreferences;
