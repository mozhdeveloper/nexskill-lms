import React, { useState } from 'react';

interface LeadScoreRule {
  id: string;
  label: string;
  conditionSummary: string;
  points: number;
  isActive: boolean;
}

interface LeadScoreRulesPanelProps {
  rules: LeadScoreRule[];
  onChange: (updatedRules: LeadScoreRule[]) => void;
}

const LeadScoreRulesPanel: React.FC<LeadScoreRulesPanelProps> = ({ rules, onChange }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    conditionType: 'tag' as 'tag' | 'status' | 'activity',
    conditionValue: '',
    points: 10,
  });

  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const maxPossibleScore = rules.filter((r) => r.isActive).reduce((sum, r) => sum + r.points, 0);

  const handleCreateRule = () => {
    if (!formData.label.trim()) {
      window.alert('Please enter a rule label.');
      return;
    }

    let conditionSummary = '';
    switch (formData.conditionType) {
      case 'tag':
        conditionSummary = `Tag ="${formData.conditionValue}"`;
        break;
      case 'status':
        conditionSummary = `Status = ${formData.conditionValue}`;
        break;
      case 'activity':
        conditionSummary = `Last activity within ${formData.conditionValue} days`;
        break;
    }

    const newRule: LeadScoreRule = {
      id: `rule-${Date.now()}`,
      label: formData.label,
      conditionSummary,
      points: formData.points,
      isActive: true,
    };

    onChange([...rules, newRule]);
    console.log('Created rule:', newRule);

    // Reset form
    setFormData({
      label: '',
      conditionType: 'tag',
      conditionValue: '',
      points: 10,
    });
    setIsCreating(false);
    window.alert(`Rule"${newRule.label}" created successfully!`);
  };

  const handleToggleActive = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    onChange(updated);
    console.log('Toggled rule active status:', ruleId);
  };

  const handleEdit = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const newLabel = window.prompt('Enter new rule label:', rule.label);
    if (!newLabel || newLabel.trim() === '') return;

    const newPoints = window.prompt('Enter new points value:', rule.points.toString());
    if (!newPoints || isNaN(parseInt(newPoints))) return;

    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, label: newLabel.trim(), points: parseInt(newPoints) } : r
    );
    onChange(updated);
    console.log('Edited rule:', ruleId);
    window.alert('Rule updated successfully!');
  };

  const handleDelete = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    if (!window.confirm(`Delete rule"${rule.label}"?`)) return;

    const updated = rules.filter((r) => r.id !== ruleId);
    onChange(updated);
    console.log('Deleted rule:', ruleId);
    window.alert(`Rule"${rule.label}" has been deleted.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#111827] mb-1">Lead Score Rules</h2>
        <p className="text-xs text-[#5F6473]">
          Define how NexSkill calculates lead quality scores
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-[#DBEAFE] to-white rounded-xl border border-[#93C5FD]">
          <p className="text-xs text-[#1E40AF] mb-1">Active Rules</p>
          <p className="text-xl font-bold text-[#111827]">{activeRulesCount}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#D1FAE5] to-white rounded-xl border border-[#6EE7B7]">
          <p className="text-xs text-[#047857] mb-1">Max Score</p>
          <p className="text-xl font-bold text-[#111827]">{maxPossibleScore}</p>
        </div>
      </div>

      {/* Add Rule Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Add Rule
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Rule</h3>

          {/* Label */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Rule Label</label>
            <input
              type="text"
              placeholder="e.g., Opened last 3 campaigns"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Condition Type */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Condition Type
            </label>
            <select
              value={formData.conditionType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditionType: e.target.value as 'tag' | 'status' | 'activity',
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            >
              <option value="tag">Tag equals</option>
              <option value="status">Status equals</option>
              <option value="activity">Last activity within days</option>
            </select>
          </div>

          {/* Condition Value */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Condition Value
            </label>
            {formData.conditionType === 'status' ? (
              <select
                value={formData.conditionValue}
                onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              >
                <option value="">Select status</option>
                <option value="Engaged">Engaged</option>
                <option value="Customer">Customer</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder={
                  formData.conditionType === 'tag' ? 'e.g., Hot Lead' : 'e.g., 7 (days)'
                }
                value={formData.conditionValue}
                onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              />
            )}
          </div>

          {/* Points */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Points Awarded
            </label>
            <input
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCreateRule}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Create Rule
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {rules.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No rules defined yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first scoring rule</p>
          </div>
        )}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-bold text-[#111827]">{rule.label}</div>
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                      rule.isActive
                        ? 'bg-[#D1FAE5] text-[#047857]'
                        : 'bg-[#F3F4F6] text-[#6B7280]'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p className="text-xs text-[#5F6473]">{rule.conditionSummary}</p>
              </div>
              <div className="text-lg font-bold text-[#059669]">+{rule.points}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs">
              <button
                onClick={() => handleEdit(rule.id)}
                className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
              >
                Edit
              </button>
              <span className="text-[#E5E7EB]">|</span>
              <button
                onClick={() => handleDelete(rule.id)}
                className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadScoreRulesPanel;
