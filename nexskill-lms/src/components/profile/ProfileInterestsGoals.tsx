import React from 'react';

interface ProfileInterestsGoalsProps {
  mode: 'view' | 'edit';
  interests: string[];
  goals: string[];
  level: string | null;
  onChange?: (updated: { interests: string[]; goals: string[]; level: string }) => void;
}

const allInterests = ['Design', 'Development', 'Marketing', 'Data', 'Business', 'Career'];
const allGoals = ['Get a job', 'Upskill in my role', 'Pass a certification', 'Start a side project'];
const levels = ['Beginner', 'Intermediate', 'Advanced'];

const ProfileInterestsGoals: React.FC<ProfileInterestsGoalsProps> = ({
  mode,
  interests,
  goals,
  level,
  onChange,
}) => {
  const handleInterestToggle = (interest: string) => {
    if (mode === 'view' || !onChange) return;
    const updated = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest];
    onChange({ interests: updated, goals, level: level || levels[0] });
  };

  const handleGoalToggle = (goal: string) => {
    if (mode === 'view' || !onChange) return;
    const updated = goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal];
    onChange({ interests, goals: updated, level: level || levels[0] });
  };

  const handleLevelChange = (newLevel: string) => {
    if (mode === 'view' || !onChange) return;
    onChange({ interests, goals, level: newLevel });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Interests & goals</h2>

      {/* Interests */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Areas of interest</h3>
        <div className="flex flex-wrap gap-2">
          {mode === 'view'
            ? interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-blue-100 text-[#304DB5] text-sm font-medium rounded-full"
              >
                {interest}
              </span>
            ))
            : allInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${interests.includes(interest)
                  ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {interest}
              </button>
            ))}
        </div>
      </div>

      {/* Goals */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Learning goals</h3>
        <div className="flex flex-wrap gap-2">
          {mode === 'view'
            ? goals.map((goal) => (
              <span
                key={goal}
                className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full"
              >
                {goal}
              </span>
            ))
            : allGoals.map((goal) => (
              <button
                key={goal}
                onClick={() => handleGoalToggle(goal)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${goals.includes(goal)
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {goal}
              </button>
            ))}
        </div>
      </div>

      {/* Skill Level */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Current skill level</h3>
        <div className="flex gap-2">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => mode === 'edit' && handleLevelChange(lvl)}
              disabled={mode === 'view'}
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${level === lvl
                ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                : mode === 'edit'
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-100 text-slate-700'
                }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileInterestsGoals;
