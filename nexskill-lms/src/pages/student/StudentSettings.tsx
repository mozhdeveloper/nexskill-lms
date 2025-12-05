import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileInterestsGoals from '../../components/profile/ProfileInterestsGoals';
import ProfileLanguagePreferences from '../../components/profile/ProfileLanguagePreferences';
import ProfileNotificationSettings from '../../components/profile/ProfileNotificationSettings';
import ProfileAccountSettingsForm from '../../components/profile/ProfileAccountSettingsForm';
import ThemeToggle from '../../components/system/ThemeToggle';

type TabType = 'account' | 'preferences' | 'notifications' | 'privacy' | 'accessibility';

const StudentSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // State for all settings
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

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showProgress: true,
    showCertificates: true,
    allowMessages: true,
    shareDataForImprovement: true,
  });

  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
  });

  const handleSave = () => {
    console.log('Saving settings:', {
      interestsGoals,
      languagePrefs,
      notificationSettings,
      accountSettings,
      privacySettings,
      accessibilitySettings,
    });
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: '👤' },
    { id: 'preferences' as TabType, label: 'Preferences', icon: '⚙️' },
    { id: 'notifications' as TabType, label: 'Notifications', icon: '🔔' },
    { id: 'privacy' as TabType, label: 'Privacy', icon: '🔒' },
    { id: 'accessibility' as TabType, label: 'Accessibility', icon: '♿' },
  ];

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-1">Settings</h1>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Manage your account and customize your learning experience
            </p>
          </div>
          <button
            onClick={() => navigate('/student/profile')}
            className="px-4 py-2 text-sm font-medium text-brand-primary hover:bg-blue-50 rounded-xl transition-colors"
          >
            ← Back to Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
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

        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 mb-6">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-brand-primary border-b-2 border-brand-primary bg-blue-50'
                      : 'text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <ProfileAccountSettingsForm account={accountSettings} onChange={setAccountSettings} />
                
                {/* Delete Account Section */}
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-red-200 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">Danger Zone</h3>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => console.log('Delete account requested')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <ThemeToggle variant="button" showLabel={true} />
                </div>

                <ProfileInterestsGoals
                  mode="edit"
                  interests={interestsGoals.interests}
                  goals={interestsGoals.goals}
                  level={interestsGoals.level}
                  onChange={setInterestsGoals}
                />
                <ProfileLanguagePreferences preferences={languagePrefs} onChange={setLanguagePrefs} />
                
                {/* Learning Preferences */}
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Learning Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Auto-play next lesson</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Automatically start the next lesson when one finishes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Video playback speed memory</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Remember your preferred playback speed</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Download for offline</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Allow downloading courses for offline viewing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <ProfileNotificationSettings
                  settings={notificationSettings}
                  onChange={setNotificationSettings}
                />
                
                {/* Email Digest Settings */}
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Email Digest</h3>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                    Choose how often you want to receive email summaries
                  </p>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                    <option>Daily</option>
                    <option>Weekly (recommended)</option>
                    <option>Monthly</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Profile Visibility</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-2 block">
                        Who can see your profile?
                      </label>
                      <select 
                        value={privacySettings.profileVisibility}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        <option value="public">Everyone</option>
                        <option value="students">Students only</option>
                        <option value="private">Only me</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Show course progress</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Display your progress publicly on your profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.showProgress}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, showProgress: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Show certificates</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Display earned certificates on your profile</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.showCertificates}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, showCertificates: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Allow direct messages</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Let other students send you messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.allowMessages}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, allowMessages: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Data & Privacy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Help improve NexSkill</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Share anonymous usage data to improve the platform</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={privacySettings.shareDataForImprovement}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, shareDataForImprovement: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => console.log('Download data')}
                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-blue-50 border border-brand-primary rounded-xl transition-colors"
                      >
                        📥 Download My Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accessibility Tab */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Display Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-2 block">
                        Font Size
                      </label>
                      <select 
                        value={accessibilitySettings.fontSize}
                        onChange={(e) => setAccessibilitySettings({ ...accessibilitySettings, fontSize: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium (default)</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">High contrast mode</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Increase contrast for better readability</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={accessibilitySettings.highContrast}
                          onChange={(e) => setAccessibilitySettings({ ...accessibilitySettings, highContrast: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Reduced motion</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Minimize animations and transitions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={accessibilitySettings.reducedMotion}
                          onChange={(e) => setAccessibilitySettings({ ...accessibilitySettings, reducedMotion: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-4">Navigation</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Screen reader optimization</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Optimize interface for screen readers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={accessibilitySettings.screenReaderOptimized}
                          onChange={(e) => setAccessibilitySettings({ ...accessibilitySettings, screenReaderOptimized: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Enhanced keyboard navigation</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Enable advanced keyboard shortcuts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={accessibilitySettings.keyboardNavigation}
                          onChange={(e) => setAccessibilitySettings({ ...accessibilitySettings, keyboardNavigation: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => console.log('View keyboard shortcuts')}
                        className="w-full px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-blue-50 border border-brand-primary rounded-xl transition-colors"
                      >
                        ⌨️ View Keyboard Shortcuts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-[#EDF0FB] dark:border-gray-700 p-6 sticky bottom-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-semibold rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentSettings;
