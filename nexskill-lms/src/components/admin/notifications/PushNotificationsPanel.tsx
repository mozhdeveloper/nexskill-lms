import React, { useState } from 'react';

interface PushConfig {
  id: string;
  name: string;
  targetApp: 'web' | 'mobile' | 'both';
  status: 'enabled' | 'disabled';
  provider: 'firebase' | 'onesignal' | 'custom' | 'placeholder';
  lastUpdatedAt: string;
}

interface PushNotificationsPanelProps {
  configs: PushConfig[];
  onChange: (updatedConfigs: PushConfig[]) => void;
}

const PushNotificationsPanel: React.FC<PushNotificationsPanelProps> = ({
  configs,
  onChange,
}) => {
  const [providerConfig, setProviderConfig] = useState({
    provider: 'firebase',
    apiKey: '••••••••••••••••',
    projectId: 'nexskill-app',
    status: 'enabled',
  });

  const getTargetAppConfig = (targetApp: PushConfig['targetApp']) => {
    switch (targetApp) {
      case 'web':
        return { label: 'Web', bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' };
      case 'mobile':
        return { label: 'Mobile', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
      case 'both':
        return { label: 'Both', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' };
    }
  };

  const getStatusConfig = (status: PushConfig['status']) => {
    switch (status) {
      case 'enabled':
        return { label: 'Enabled', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' };
      case 'disabled':
        return { label: 'Disabled', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };
    }
  };

  const handleSaveProviderConfig = () => {
    console.log('Saving provider configuration:', providerConfig);
    window.alert('Provider configuration saved (simulated)!');
  };

  const handleToggleConfigStatus = (configId: string) => {
    const updated = configs.map((c) => {
      if (c.id === configId) {
        const newStatus: PushConfig['status'] = c.status === 'enabled' ? 'disabled' : 'enabled';
        return { ...c, status: newStatus };
      }
      return c;
    });
    onChange(updated);
    console.log('Toggled push config status:', configId);
  };

  const handleEditSettings = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (!config) return;

    console.log('Editing settings for config:', configId);
    window.alert(`Edit settings for"${config.name}" - coming soon!`);
  };

  const handleSendTest = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (!config) return;

    console.log('Sending test push for config:', configId);
    window.alert(`Test push notification sent (simulated) for"${config.name}"!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-[#EDF0FB]">
        <h2 className="text-xl font-bold text-[#111827]">Push Notifications</h2>
        <p className="text-sm text-[#9CA3B5] mt-1">
          Configure providers and platform-level push campaigns
        </p>
      </div>

      {/* Provider Setup */}
      <div className="p-6 border-b border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white">
        <h3 className="text-sm font-bold text-[#111827] mb-4">Provider Configuration</h3>

        <div className="space-y-4">
          {/* Provider Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6473] mb-2">
              Push Provider
            </label>
            <select
              value={providerConfig.provider}
              onChange={(e) => setProviderConfig({ ...providerConfig, provider: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            >
              <option value="firebase">Firebase (placeholder)</option>
              <option value="onesignal">OneSignal (placeholder)</option>
              <option value="custom">Custom integration (placeholder)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6473] mb-2">Status</label>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  providerConfig.status === 'enabled'
                    ? 'bg-[#D1FAE5] text-[#047857]'
                    : 'bg-[#F3F4F6] text-[#6B7280]'
                }`}
              >
                {providerConfig.status === 'enabled' ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() =>
                  setProviderConfig({
                    ...providerConfig,
                    status: providerConfig.status === 'enabled' ? 'disabled' : 'enabled',
                  })
                }
                className="text-xs font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
              >
                Toggle
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6473] mb-2">
              API Key (masked)
            </label>
            <input
              type="password"
              value={providerConfig.apiKey}
              onChange={(e) => setProviderConfig({ ...providerConfig, apiKey: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              placeholder="Enter API key"
            />
          </div>

          {/* Project ID */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6473] mb-2">
              Project / App ID
            </label>
            <input
              type="text"
              value={providerConfig.projectId}
              onChange={(e) => setProviderConfig({ ...providerConfig, projectId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              placeholder="Enter project or app ID"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProviderConfig}
            className="w-full py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full hover:shadow-md transition-shadow"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Push Configs List */}
      <div className="p-6">
        <h3 className="text-sm font-bold text-[#111827] mb-4">Push Campaign Configurations</h3>

        {configs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔔</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No push configs yet</p>
            <p className="text-xs text-[#9CA3B5]">Configure your first push notification campaign</p>
          </div>
        )}

        <div className="space-y-3">
          {configs.map((config) => {
            const targetAppConfig = getTargetAppConfig(config.targetApp);
            const statusConfig = getStatusConfig(config.status);

            return (
              <div
                key={config.id}
                className="p-4 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#111827] mb-1">{config.name}</div>
                    <div className="text-xs text-[#9CA3B5]">
                      Provider: {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${targetAppConfig.bg} ${targetAppConfig.text}`}
                  >
                    {targetAppConfig.label}
                  </span>
                  <span className="text-xs text-[#9CA3B5]">Updated {config.lastUpdatedAt}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                  <button
                    onClick={() => handleToggleConfigStatus(config.id)}
                    className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                  >
                    {config.status === 'enabled' ? 'Disable' : 'Enable'}
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleEditSettings(config.id)}
                    className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                  >
                    Edit Settings
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleSendTest(config.id)}
                    className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationsPanel;
