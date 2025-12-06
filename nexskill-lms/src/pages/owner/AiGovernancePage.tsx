import React, { useState } from 'react';
import PlatformOwnerAppLayout from '../../layouts/PlatformOwnerAppLayout';

interface AiModel {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  requestsThisMonth: number;
  costPerRequest: number;
  totalCost: number;
}

interface UsageByTool {
  toolName: string;
  requests: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
}

const AiGovernancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'usage' | 'policies'>('overview');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState('');
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyLimit: 5000,
    alertThreshold: 80,
    notifyEmail: 'admin@nexskill.com',
  });

  const handleSaveBudget = () => {
    console.log('Configure budget alerts:', budgetSettings);
    alert(`✅ Budget alerts configured!\n\nMonthly limit: $${budgetSettings.monthlyLimit}\nAlert at: ${budgetSettings.alertThreshold}%\nNotify: ${budgetSettings.notifyEmail}`);
    setShowBudgetModal(false);
  };

  const handleConfigureModel = (modelId: string) => {
    setShowModelModal(modelId);
  };

  const handleSaveAiPolicies = () => {
    console.log('Save AI policies');
    alert('✅ AI policies saved successfully!\n\nAll policy changes have been applied to the platform.');
  };

  // Dummy AI usage overview
  const aiOverview = {
    totalRequests: 142385,
    totalCost: 3847,
    avgCostPerRequest: 0.027,
    activeModels: 4,
    topModel: 'GPT-4o',
    costTrend: '+12.5%',
  };

  // Dummy AI models
  const aiModels: AiModel[] = [
    {
      id: 'gpt4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      status: 'active',
      requestsThisMonth: 58420,
      costPerRequest: 0.03,
      totalCost: 1752.6,
    },
    {
      id: 'gpt35',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      status: 'active',
      requestsThisMonth: 42180,
      costPerRequest: 0.002,
      totalCost: 84.36,
    },
    {
      id: 'claude',
      name: 'Claude Sonnet',
      provider: 'Anthropic',
      status: 'active',
      requestsThisMonth: 24395,
      costPerRequest: 0.015,
      totalCost: 365.93,
    },
    {
      id: 'gemini',
      name: 'Gemini Pro',
      provider: 'Google',
      status: 'inactive',
      requestsThisMonth: 0,
      costPerRequest: 0.025,
      totalCost: 0,
    },
  ];

  // Dummy usage by tool
  const usageByTool: UsageByTool[] = [
    { toolName: 'AI Student Coach', requests: 58420, cost: 1752.6, trend: 'up' },
    { toolName: 'AI Quiz Generator', requests: 42180, cost: 842.4, trend: 'stable' },
    { toolName: 'AI Sales Page Writer', requests: 24395, cost: 731.85, trend: 'up' },
    { toolName: 'AI Content Analyzer', requests: 17390, cost: 520.7, trend: 'down' },
  ];

  return (
    <PlatformOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">AI Governance</h1>
          <p className="text-sm text-text-secondary">
            AI usage policies, cost management, and analytics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#EDF0FB]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'models'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              AI Models
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'usage'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Usage Analytics
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'policies'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Policies
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Usage KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">🤖</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {(aiOverview.totalRequests / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-text-muted">Total Requests</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      {aiOverview.costTrend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    ${aiOverview.totalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Total Cost</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">📊</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    ${aiOverview.avgCostPerRequest.toFixed(3)}
                  </p>
                  <p className="text-xs text-text-muted">Avg Cost/Request</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">⚡</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {aiOverview.activeModels}
                  </p>
                  <p className="text-xs text-text-muted">Active Models</p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Cost by Model</h3>
                  <div className="space-y-4">
                    {aiModels.filter(m => m.status === 'active').map((model) => (
                      <div key={model.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-text-secondary">{model.name}</span>
                          <span className="text-sm font-semibold text-text-primary">
                            ${model.totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-[#F5F7FF] rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                            style={{
                              width: `${(model.totalCost / aiOverview.totalCost) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-bold text-text-primary mb-2">Budget Alert</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Current spending: ${aiOverview.totalCost.toLocaleString()} / $5,000 monthly budget
                  </p>
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Budget Used</span>
                      <span className="text-lg font-bold text-purple-700">
                        {((aiOverview.totalCost / 5000) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full"
                        style={{ width: `${(aiOverview.totalCost / 5000) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors"
                  >
                    Configure Budget Alerts
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FF]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Model
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Provider
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Requests
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Cost/Request
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Total Cost
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-text-primary uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0FB]">
                    {aiModels.map((model) => (
                      <tr key={model.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-text-primary">{model.name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{model.provider}</td>
                        <td className="px-6 py-4 text-sm text-text-primary text-right">
                          {model.requestsThisMonth.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary text-right">
                          ${model.costPerRequest.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-text-primary text-right">
                          ${model.totalCost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              model.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {model.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleConfigureModel(model.id)}
                            className="text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Usage Analytics Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Usage by Tool</h3>
                <div className="space-y-4">
                  {usageByTool.map((tool, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#EDF0FB] hover:bg-[#F5F7FF] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-semibold text-text-primary">{tool.toolName}</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              tool.trend === 'up'
                                ? 'bg-green-100 text-green-800'
                                : tool.trend === 'down'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {tool.trend === 'up' ? '↑' : tool.trend === 'down' ? '↓' : '→'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-text-muted">Requests</p>
                            <p className="text-sm font-medium text-text-primary">
                              {tool.requests.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Cost</p>
                            <p className="text-sm font-medium text-text-primary">
                              ${tool.cost.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                <h3 className="text-lg font-bold text-text-primary mb-4">Usage Policies</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Monthly Budget Limit
                    </label>
                    <input
                      type="number"
                      defaultValue="5000"
                      className="w-full px-4 py-3 border border-[#EDF0FB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Maximum AI spending per month (USD)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Rate limiting</p>
                      <p className="text-xs text-text-muted mt-1">
                        Limit AI requests per user per hour
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Content filtering</p>
                      <p className="text-xs text-text-muted mt-1">
                        Filter inappropriate AI-generated content
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Usage analytics</p>
                      <p className="text-xs text-text-muted mt-1">
                        Track and log all AI interactions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary-soft rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveAiPolicies}
                  className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium text-sm hover:bg-brand-primary-dark transition-colors"
                >
                  Save Policies
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Alert Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h2 className="text-xl font-bold text-text-primary">Configure Budget Alert</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Monthly Budget Limit ($)
                </label>
                <input
                  type="number"
                  value={budgetSettings.monthlyLimit}
                  onChange={(e) => setBudgetSettings({ ...budgetSettings, monthlyLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  value={budgetSettings.alertThreshold}
                  onChange={(e) => setBudgetSettings({ ...budgetSettings, alertThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={budgetSettings.notifyEmail}
                  onChange={(e) => setBudgetSettings({ ...budgetSettings, notifyEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="px-6 py-2 text-text-secondary font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-6 py-2 bg-brand-primary text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Save Budget Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Configuration Modal */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h2 className="text-xl font-bold text-text-primary">Configure AI Model</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-text-primary mb-2">
                  <span className="font-semibold">Model ID:</span> {showModelModal}
                </p>
                <p className="text-xs text-text-muted">
                  Configure model parameters, rate limits, and usage policies.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Tokens Per Request
                </label>
                <input
                  type="number"
                  defaultValue="2048"
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full px-4 py-2 border border-[#EDF0FB] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-primary">Enable for all users</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => setShowModelModal('')}
                className="px-6 py-2 text-text-secondary font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`✅ Model configuration saved for ${showModelModal}`);
                  setShowModelModal('');
                }}
                className="px-6 py-2 bg-brand-primary text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformOwnerAppLayout>
  );
};

export default AiGovernancePage;
