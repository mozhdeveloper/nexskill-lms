import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';

const OrgSettingsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'general' | 'security' | 'notifications' | 'integrations'>('general');
  const [generalSettings, setGeneralSettings] = useState({
    orgName: 'Acme Corporation',
    industry: 'Technology',
    size: '100-500',
    timezone: 'Asia/Manila',
    language: 'English'
  });
  const [securitySettings, setSecuritySettings] = useState({
    require2FA: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    allowSSO: true
  });

  const handleSave = () => {
    console.log('Saving settings:', { generalSettings, securitySettings });
    alert('Settings saved successfully!');
  };

  return (
    <OrgOwnerAppLayout>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Organization Settings</h1>
              <p className="text-[#5F6473]">Manage your organization's preferences and configuration</p>
            </div>
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              💾 Save Changes
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#E5E7EB]">
            <button
              onClick={() => setSelectedTab('general')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'general'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setSelectedTab('security')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'security'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setSelectedTab('notifications')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'notifications'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setSelectedTab('integrations')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'integrations'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Integrations
            </button>
          </div>

          {/* General Tab */}
          {selectedTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Organization Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.orgName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, orgName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111827] mb-2">
                        Industry
                      </label>
                      <select
                        value={generalSettings.industry}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, industry: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Finance</option>
                        <option>Education</option>
                        <option>Retail</option>
                        <option>Manufacturing</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111827] mb-2">
                        Organization Size
                      </label>
                      <select
                        value={generalSettings.size}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, size: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option>1-50</option>
                        <option>50-100</option>
                        <option>100-500</option>
                        <option>500-1000</option>
                        <option>1000+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Regional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                      <option value="America/New_York">America/New York (GMT-5)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                      <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Default Language
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option>English</option>
                      <option>Filipino</option>
                      <option>Spanish</option>
                      <option>Arabic</option>
                      <option>Chinese</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {selectedTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Authentication & Access</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">Require Two-Factor Authentication</p>
                      <p className="text-sm text-[#5F6473]">All users must enable 2FA to access the platform</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.require2FA}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, require2FA: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">Enable Single Sign-On (SSO)</p>
                      <p className="text-sm text-[#5F6473]">Allow users to sign in with your organization's SSO</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.allowSSO}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, allowSSO: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Session & Password Policies</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Session Timeout (minutes)
                    </label>
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">
                      Password Expiry (days)
                    </label>
                    <select
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h3 className="font-bold text-[#111827] mb-1">Security Recommendations</h3>
                    <ul className="text-sm text-[#5F6473] space-y-1">
                      <li>• Enable two-factor authentication for all users</li>
                      <li>• Set password expiry to 90 days or less</li>
                      <li>• Configure SSO with your identity provider</li>
                      <li>• Regularly review access logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {selectedTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">New User Enrollment</p>
                      <p className="text-sm text-[#5F6473]">Notify admins when new users join</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">Course Completion</p>
                      <p className="text-sm text-[#5F6473]">Notify when learners complete courses</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">Weekly Progress Reports</p>
                      <p className="text-sm text-[#5F6473]">Receive weekly analytics summary</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  </label>
                  <label className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-[#111827]">License Usage Alerts</p>
                      <p className="text-sm text-[#5F6473]">Alert when license capacity reaches 80%</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Notification Recipients</h3>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Additional Email Recipients
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter email addresses, one per line"
                    className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] placeholder-[#5F6473] focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                  <p className="text-xs text-[#5F6473] mt-2">These recipients will receive all organization notifications</p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {selectedTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h3 className="text-lg font-bold text-[#111827] mb-4">Available Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Slack', icon: '💬', status: 'connected', description: 'Team communication and notifications' },
                    { name: 'Google Workspace', icon: '📧', status: 'disconnected', description: 'SSO and email integration' },
                    { name: 'Microsoft Teams', icon: '👥', status: 'disconnected', description: 'Collaboration and meetings' },
                    { name: 'Zoom', icon: '🎥', status: 'connected', description: 'Virtual classroom sessions' },
                    { name: 'Salesforce', icon: '☁️', status: 'disconnected', description: 'CRM integration' },
                    { name: 'Zapier', icon: '⚡', status: 'disconnected', description: 'Automation workflows' },
                  ].map((integration) => (
                    <div key={integration.name} className="border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{integration.icon}</span>
                          <div>
                            <h4 className="font-bold text-[#111827]">{integration.name}</h4>
                            <p className="text-sm text-[#5F6473]">{integration.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.status === 'connected' ? (
                          <>
                            <span className="flex-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full text-center">
                              Connected
                            </span>
                            <button
                              onClick={() => console.log('Disconnect', integration.name)}
                              className="px-4 py-2 border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Configure
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => console.log('Connect', integration.name)}
                            className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OrgOwnerAppLayout>
  );
};

export default OrgSettingsPage;
