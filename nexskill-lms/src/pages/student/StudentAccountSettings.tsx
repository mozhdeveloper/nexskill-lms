import React, { useState } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileInterestsGoals from '../../components/profile/ProfileInterestsGoals';
import ProfileLanguagePreferences from '../../components/profile/ProfileLanguagePreferences';
import ProfileNotificationSettings from '../../components/profile/ProfileNotificationSettings';
import ProfileAccountSettingsForm from '../../components/profile/ProfileAccountSettingsForm';

const StudentAccountSettings: React.FC = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Combined state for all settings
  const [interestsGoals, setInterestsGoals] = useState({
    interests: ['Design', 'Business', 'Career'],
    goals: ['Get a job', 'Start a side project'],
    level: 'Intermediate',
  });

  const [languagePrefs, setLanguagePrefs] = useState({
    primaryLanguage: 'English',
    showSubtitles: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    mobilePush: false,
    learningProgress: true,
    courseRecommendations: true,
    aiCoachNudges: true,
    billingAlerts: true,
  });

  const [accountSettings, setAccountSettings] = useState({
    email: 'sarah.johnson@example.com',
    timezone: 'Pacific Time (PST)',
    lastPasswordUpdate: 'Nov 15, 2025',
  });

  const handleSave = () => {
    console.log('Saving all settings:', {
      interestsGoals,
      languagePrefs,
      notificationSettings,
      accountSettings,
    });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account & preferences</h1>
          <p className="text-lg text-slate-600">
            Control how NexSkill personalizes your learning experience
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700 font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6 mb-8">
          <ProfileInterestsGoals
            mode="edit"
            interests={interestsGoals.interests}
            goals={interestsGoals.goals}
            level={interestsGoals.level}
            onChange={setInterestsGoals}
          />

          <ProfileLanguagePreferences preferences={languagePrefs} onChange={setLanguagePrefs} />

          <ProfileNotificationSettings
            settings={notificationSettings}
            onChange={setNotificationSettings}
          />

          <ProfileAccountSettingsForm account={accountSettings} onChange={setAccountSettings} />
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={handleSave}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Save all changes
          </button>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentAccountSettings;
