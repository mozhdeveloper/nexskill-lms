import React, { useState } from 'react';

interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'event' | 'schedule';
  triggerSummary: string;
  channels: string[];
  status: 'enabled' | 'disabled';
  lastRunAt?: string;
  priority: number;
}

interface AutomationRulesPanelProps {
  rules: AutomationRule[];
  emailTemplates: Array<{ id: string; name: string }>;
  smsTemplates: Array<{ id: string; name: string }>;
  pushConfigs: Array<{ id: string; name: string }>;
  onChange: (updatedRules: AutomationRule[]) => void;
}

const AutomationRulesPanel: React.FC<AutomationRulesPanelProps> = ({
  rules,
  emailTemplates,
  smsTemplates,
  pushConfigs,
  onChange,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'event' as 'event' | 'schedule',
    trigger: '',
    channels: {
      email: false,
      sms: false,
      push: false,
    },
    emailTemplate: '',
    smsTemplate: '',
    pushConfig: '',
    priority: 3,
    status: 'enabled' as 'enabled' | 'disabled',
  });

  const eventTriggers = [
    { value: 'user_signup', label: 'User signs up' },
    { value: 'course_enrolled', label: 'Course enrolled' },
    { value: 'lesson_completed', label: 'Lesson completed' },
    { value: 'payment_failed', label: 'Payment failed' },
    { value: 'certificate_earned', label: 'Certificate earned' },
  ];

  const scheduleTriggers = [
    { value: 'daily_9am', label: 'Daily at 9:00 AM' },
    { value: 'weekly_monday_9am', label: 'Weekly on Monday at 9:00 AM' },
    { value: 'monthly_1st_9am', label: 'Monthly on 1st at 9:00 AM' },
  ];

  const getStatusConfig = (status: AutomationRule['status']) => {
    switch (status) {
      case 'enabled':
        return { label: 'Enabled', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' };
      case 'disabled':
        return { label: 'Disabled', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };
    }
  };

  const getTriggerTypeConfig = (triggerType: AutomationRule['triggerType']) => {
    switch (triggerType) {
      case 'event':
        return { label: 'Event', bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', icon: '⚡' };
      case 'schedule':
        return { label: 'Schedule', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', icon: '⏰' };
    }
  };

  const activeRulesCount = rules.filter((r) => r.status === 'enabled').length;
  const eventsCovered = new Set(rules.map((r) => r.triggerSummary)).size;

  const handleCreateRule = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a rule name.');
      return;
    }

    if (!formData.trigger) {
      window.alert('Please select a trigger.');
      return;
    }

    if (!formData.channels.email && !formData.channels.sms && !formData.channels.push) {
      window.alert('Please select at least one notification channel.');
      return;
    }

    const selectedChannels: string[] = [];
    if (formData.channels.email) selectedChannels.push('email');
    if (formData.channels.sms) selectedChannels.push('sms');
    if (formData.channels.push) selectedChannels.push('push');

    const triggerLabel =
      formData.triggerType === 'event'
        ? eventTriggers.find((t) => t.value === formData.trigger)?.label || formData.trigger
        : scheduleTriggers.find((t) => t.value === formData.trigger)?.label || formData.trigger;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: formData.name,
      triggerType: formData.triggerType,
      triggerSummary: `${formData.triggerType === 'event' ? 'When' : 'On schedule'}: ${triggerLabel}`,
      channels: selectedChannels,
      status: formData.status,
      priority: formData.priority,
    };

    onChange([...rules, newRule]);
    console.log('Created automation rule:', newRule);

    // Reset form
    setFormData({
      name: '',
      triggerType: 'event',
      trigger: '',
      channels: { email: false, sms: false, push: false },
      emailTemplate: '',
      smsTemplate: '',
      pushConfig: '',
      priority: 3,
      status: 'enabled',
    });
    setIsCreating(false);
    window.alert(`Automation rule"${newRule.name}" created successfully!`);
  };

  const handleDuplicate = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const duplicated: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      status: 'disabled',
    };

    onChange([...rules, duplicated]);
    console.log('Duplicated rule:', ruleId);
    window.alert(`Rule"${rule.name}" duplicated successfully!`);
  };

  const handleToggleStatus = (ruleId: string) => {
    const updated = rules.map((r) => {
      if (r.id === ruleId) {
        const newStatus: AutomationRule['status'] = r.status === 'enabled' ? 'disabled' : 'enabled';
        return { ...r, status: newStatus };
      }
      return r;
    });
    onChange(updated);
    console.log('Toggled rule status:', ruleId);
  };

  const handleSimulateRun = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    console.log('Simulating rule run:', ruleId);
    window.alert(
      `Rule"${rule.name}" simulated (no real sends)!\n\nChannels: ${rule.channels.join(', ')}`
    );
  };

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    console.log('Editing rule:', ruleId);
    window.alert(`Edit rule"${rule.name}" - coming soon!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-[#EDF0FB]">
        <h2 className="text-xl font-bold text-[#111827]">Automation Rules</h2>
        <p className="text-sm text-[#9CA3B5] mt-1">
          Define event-based and scheduled notifications across email, SMS, and push
        </p>
      </div>

      {/* KPI Strip */}
      <div className="p-6 border-b border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-xl border border-[#EDF0FB]">
            <div className="text-xs text-[#9CA3B5] mb-1">Active Rules</div>
            <div className="text-2xl font-bold text-[#304DB5]">{activeRulesCount}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl border border-[#EDF0FB]">
            <div className="text-xs text-[#9CA3B5] mb-1">Events Covered</div>
            <div className="text-2xl font-bold text-[#304DB5]">{eventsCovered}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl border border-[#EDF0FB]">
            <div className="text-xs text-[#9CA3B5] mb-1">Last Run</div>
            <div className="text-sm font-bold text-[#5F6473]">2 min ago</div>
          </div>
        </div>
      </div>

      {/* Add Rule Button */}
      {!isCreating && (
        <div className="p-6 border-b border-[#EDF0FB]">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full hover:shadow-md transition-shadow"
          >
            + Add Automation Rule
          </button>
        </div>
      )}

      {/* Create Rule Form */}
      {isCreating && (
        <div className="p-6 border-b border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white">
          <h3 className="text-sm font-bold text-[#111827] mb-4">New Automation Rule</h3>

          <div className="space-y-4">
            {/* Rule Name */}
            <div>
              <label className="block text-xs font-semibold text-[#5F6473] mb-2">Rule Name</label>
              <input
                type="text"
                placeholder="e.g., Welcome email for new users"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              />
            </div>

            {/* Step 1: Trigger Type */}
            <div>
              <label className="block text-xs font-semibold text-[#5F6473] mb-2">
                Step 1: Trigger Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setFormData({ ...formData, triggerType: 'event', trigger: '' })
                  }
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold border transition-all ${
                    formData.triggerType === 'event'
                      ? 'bg-[#304DB5] text-white border-[#304DB5]'
                      : 'bg-white text-[#5F6473] border-[#E5E7EB] hover:border-[#304DB5]'
                  }`}
                >
                  ⚡ Event-based
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, triggerType: 'schedule', trigger: '' })
                  }
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold border transition-all ${
                    formData.triggerType === 'schedule'
                      ? 'bg-[#304DB5] text-white border-[#304DB5]'
                      : 'bg-white text-[#5F6473] border-[#E5E7EB] hover:border-[#304DB5]'
                  }`}
                >
                  ⏰ Scheduled
                </button>
              </div>
            </div>

            {/* Step 2: Trigger Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#5F6473] mb-2">
                Step 2: Select Trigger
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              >
                <option value="">-- Select trigger --</option>
                {(formData.triggerType === 'event' ? eventTriggers : scheduleTriggers).map(
                  (trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Step 3: Channels & Templates */}
            <div>
              <label className="block text-xs font-semibold text-[#5F6473] mb-2">
                Step 3: Notification Channels
              </label>
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-start gap-3 p-3 border border-[#E5E7EB] rounded-lg">
                  <input
                    type="checkbox"
                    id="channel-email"
                    checked={formData.channels.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channels: { ...formData.channels, email: e.target.checked },
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="channel-email" className="text-sm font-semibold text-[#111827]">
                      📧 Email
                    </label>
                    {formData.channels.email && (
                      <select
                        value={formData.emailTemplate}
                        onChange={(e) => setFormData({ ...formData, emailTemplate: e.target.value })}
                        className="w-full mt-2 px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
                      >
                        <option value="">-- Select email template --</option>
                        {emailTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* SMS */}
                <div className="flex items-start gap-3 p-3 border border-[#E5E7EB] rounded-lg">
                  <input
                    type="checkbox"
                    id="channel-sms"
                    checked={formData.channels.sms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channels: { ...formData.channels, sms: e.target.checked },
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="channel-sms" className="text-sm font-semibold text-[#111827]">
                      💬 SMS
                    </label>
                    {formData.channels.sms && (
                      <select
                        value={formData.smsTemplate}
                        onChange={(e) => setFormData({ ...formData, smsTemplate: e.target.value })}
                        className="w-full mt-2 px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
                      >
                        <option value="">-- Select SMS template --</option>
                        {smsTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Push */}
                <div className="flex items-start gap-3 p-3 border border-[#E5E7EB] rounded-lg">
                  <input
                    type="checkbox"
                    id="channel-push"
                    checked={formData.channels.push}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        channels: { ...formData.channels, push: e.target.checked },
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="channel-push" className="text-sm font-semibold text-[#111827]">
                      🔔 Push
                    </label>
                    {formData.channels.push && (
                      <select
                        value={formData.pushConfig}
                        onChange={(e) => setFormData({ ...formData, pushConfig: e.target.value })}
                        className="w-full mt-2 px-2 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
                      >
                        <option value="">-- Select push config --</option>
                        {pushConfigs.map((config) => (
                          <option key={config.id} value={config.id}>
                            {config.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5F6473] mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
                >
                  <option value={1}>P1 (Highest)</option>
                  <option value={2}>P2 (High)</option>
                  <option value={3}>P3 (Medium)</option>
                  <option value={4}>P4 (Low)</option>
                  <option value={5}>P5 (Lowest)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F6473] mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'enabled' | 'disabled',
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCreateRule}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full hover:shadow-md transition-shadow"
              >
                Create Rule
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 text-sm font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="p-6">
        {rules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⚙️</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No automation rules yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first automation rule</p>
          </div>
        )}

        <div className="space-y-3">
          {rules.map((rule) => {
            const statusConfig = getStatusConfig(rule.status);
            const triggerTypeConfig = getTriggerTypeConfig(rule.triggerType);

            return (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#111827] mb-1">{rule.name}</div>
                    <div className="text-xs text-[#5F6473] mb-2">{rule.triggerSummary}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${triggerTypeConfig.bg} ${triggerTypeConfig.text}`}
                  >
                    {triggerTypeConfig.icon} {triggerTypeConfig.label}
                  </span>
                  {rule.channels.map((channel) => (
                    <span
                      key={channel}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DBEAFE] text-[#1E40AF]"
                    >
                      {channel === 'email' ? '📧' : channel === 'sms' ? '💬' : '🔔'} {channel}
                    </span>
                  ))}
                  <span className="text-xs text-[#9CA3B5]">P{rule.priority}</span>
                  {rule.lastRunAt && (
                    <span className="text-xs text-[#9CA3B5]">Last run: {rule.lastRunAt}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                  <button
                    onClick={() => handleEditRule(rule.id)}
                    className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                  >
                    Edit Rule
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleDuplicate(rule.id)}
                    className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                  >
                    Duplicate
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleToggleStatus(rule.id)}
                    className="font-semibold text-[#D97706] hover:text-[#F59E0B] transition-colors"
                  >
                    {rule.status === 'enabled' ? 'Disable' : 'Enable'}
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleSimulateRun(rule.id)}
                    className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                  >
                    Simulate Run
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

export default AutomationRulesPanel;
