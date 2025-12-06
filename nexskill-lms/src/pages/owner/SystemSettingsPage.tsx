import React, { useState } from 'react';
import PlatformOwnerAppLayout from '../../layouts/PlatformOwnerAppLayout';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'integrations' | 'email'>('general');

  // Dummy feature flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      id: 'ai-coach',
      name: 'AI Student Coach',
      description: 'Enable AI-powered coaching assistant for students',
      enabled: true,
      category: 'AI Features',
    },
    {
      id: 'live-classes',
      name: 'Live Classes',
      description: 'Enable real-time video classes and webinars',
      enabled: true,
      category: 'Learning Features',
    },
    {
      id: 'community-circles',
      name: 'Community Circles',
      description: 'Enable course-specific community discussion circles',
      enabled: true,
      category: 'Community',
    },
    {
      id: 'blockchain-certs',
      name: 'Blockchain Certificates',
      description: 'Issue certificates on blockchain for verification',
      enabled: false,
      category: 'Certificates',
    },
    {
      id: 'gamification',
      name: 'Gamification',
      description: 'Enable badges, points, and leaderboards',
      enabled: true,
      category: 'Engagement',
    },
  ]);

  const toggleFeature = (id: string) => {
    setFeatureFlags(featureFlags.map(flag => 
      flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
    ));
    console.log(`Toggle feature: ${id}`);
    const flag = featureFlags.find(f => f.id === id);
    alert(`⚙️ Feature ${flag?.enabled ? 'disabled' : 'enabled'}\n\n${flag?.name} is now ${flag?.enabled ? 'OFF' : 'ON'}`);
  };

  const handleSaveSettings = () => {
    console.log('Save general settings');
    alert('✅ Settings saved successfully!\n\nAll platform settings have been updated.');
  };

  const handleConfigureIntegration = (service: string) => {
    console.log(`Configure ${service}`);
    alert(`🔧 Configure ${service}\n\nOpening ${service} integration settings...`);
  };

  // Group features by category
  const featuresByCategory = featureFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  return (
    <PlatformOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">System Settings</h1>
          <p className="text-sm text-text-secondary">
            Global platform configuration and feature toggles
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#EDF0FB]">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'features'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Feature Flags
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'integrations'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Email & Notifications
            </button>
          </div>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Platform Information */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Platform Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      defaultValue="NexSkill LMS"
                      className="w-full px-4 py-3 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      defaultValue="support@nexskill.com"
                      className="w-full px-4 py-3 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Platform URL
                    </label>
                    <input
                      type="url"
                      defaultValue="https://nexskill.com"
                      className="w-full px-4 py-3 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Default Settings */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Default Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Allow user registration
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Enable open registration for new users
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Require email verification
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        New users must verify email before accessing platform
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Maintenance mode
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Put platform in maintenance mode (admins only)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium text-sm hover:bg-brand-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Feature Flags Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              {Object.entries(featuresByCategory).map(([category, flags]) => (
                <div key={category} className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <h3 className="text-lg font-bold text-text-primary mb-4">{category}</h3>
                  <div className="space-y-4">
                    {flags.map((flag) => (
                      <div key={flag.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{flag.name}</p>
                          <p className="text-xs text-text-muted mt-1">{flag.description}</p>
                        </div>
                        <button
                          onClick={() => toggleFeature(flag.id)}
                          className={`relative inline-flex items-center cursor-pointer ml-4 ${
                            flag.enabled ? 'bg-brand-primary' : 'bg-gray-200'
                          } w-11 h-6 rounded-full transition-colors`}
                        >
                          <span
                            className={`inline-block w-5 h-5 bg-white rounded-full transform transition-transform ${
                              flag.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {/* Payment Providers */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Payment Providers</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                        💳
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Stripe</p>
                        <p className="text-xs text-text-muted">Connected • Last sync: 2 hours ago</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigureIntegration('Stripe')}
                      className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                    >
                      Configure
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                        🅿️
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">PayPal</p>
                        <p className="text-xs text-text-muted">Not connected</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigureIntegration('PayPal')}
                      className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Service */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Email Service</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                        📧
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">SendGrid</p>
                        <p className="text-xs text-text-muted">Connected • 98.5% delivery rate</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigureIntegration('SendGrid')}
                      className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Hosting */}
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Video Hosting</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                        🎥
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Vimeo</p>
                        <p className="text-xs text-text-muted">Connected • 1.2TB storage used</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigureIntegration('Vimeo')}
                      className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email & Notifications Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Welcome emails</p>
                      <p className="text-xs text-text-muted mt-1">Send welcome email to new users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Course completion emails</p>
                      <p className="text-xs text-text-muted mt-1">Notify students when they complete a course</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Payment receipts</p>
                      <p className="text-xs text-text-muted mt-1">Send receipt emails for transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformOwnerAppLayout>
  );
};

export default SystemSettingsPage;
