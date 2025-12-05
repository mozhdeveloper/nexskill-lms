import React, { useState } from 'react';

interface Funnel {
  id: string;
  name: string;
  entryPoint: string;
  keySteps: string[];
  status: 'active' | 'paused' | 'archived';
  leadsInFunnel: number;
  conversionRate: number;
}

interface FunnelsManagerPanelProps {
  funnels: Funnel[];
  onChange: (updatedFunnels: Funnel[]) => void;
}

const FunnelsManagerPanel: React.FC<FunnelsManagerPanelProps> = ({ funnels, onChange }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    entryPoint: '',
    step1: '',
    step2: '',
    step3: '',
  });

  const getStatusConfig = (status: Funnel['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#047857]',
        };
      case 'paused':
        return {
          label: 'Paused',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
        };
      case 'archived':
        return {
          label: 'Archived',
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#6B7280]',
        };
    }
  };

  const handleSaveFunnel = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a funnel name.');
      return;
    }

    if (!formData.entryPoint.trim()) {
      window.alert('Please specify an entry point.');
      return;
    }

    const keySteps = [formData.step1, formData.step2, formData.step3].filter(
      (s) => s.trim() !== ''
    );

    if (keySteps.length === 0) {
      window.alert('Please add at least one funnel step.');
      return;
    }

    const newFunnel: Funnel = {
      id: `funnel-${Date.now()}`,
      name: formData.name,
      entryPoint: formData.entryPoint,
      keySteps,
      status: 'active',
      leadsInFunnel: 0,
      conversionRate: 0,
    };

    onChange([...funnels, newFunnel]);
    console.log('Created funnel:', newFunnel);

    // Reset form
    setFormData({
      name: '',
      entryPoint: '',
      step1: '',
      step2: '',
      step3: '',
    });
    setIsCreating(false);
    window.alert(`Funnel"${newFunnel.name}" has been created!`);
  };

  const handleToggleStatus = (funnelId: string) => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel) return;

    const newStatus: Funnel['status'] =
      funnel.status === 'active' ? 'paused' : funnel.status === 'paused' ? 'active' : 'paused';

    const updated = funnels.map((f) => (f.id === funnelId ? { ...f, status: newStatus } : f));
    onChange(updated);
    console.log('Toggled funnel status:', funnelId, 'to', newStatus);
    window.alert(`Funnel status changed to ${newStatus}`);
  };

  const handleEditSteps = (funnelId: string) => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel) return;

    const stepsString = window.prompt(
      'Edit steps (comma-separated):',
      funnel.keySteps.join(', ')
    );
    if (!stepsString) return;

    const newSteps = stepsString.split(',').map((s) => s.trim()).filter((s) => s !== '');

    if (newSteps.length === 0) {
      window.alert('At least one step is required.');
      return;
    }

    const updated = funnels.map((f) => (f.id === funnelId ? { ...f, keySteps: newSteps } : f));
    onChange(updated);
    console.log('Updated funnel steps:', funnelId, newSteps);
    window.alert('Funnel steps updated.');
  };

  const handleViewAnalytics = (funnelId: string) => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel) return;

    console.log('Viewing analytics for funnel:', funnelId);
    window.alert(`Analytics for"${funnel.name}":\n\nLeads in funnel: ${funnel.leadsInFunnel}\nConversion rate: ${funnel.conversionRate}%\n\nDetailed analytics coming soon!`);
  };

  const handleArchive = (funnelId: string) => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel) return;

    if (!window.confirm(`Archive funnel"${funnel.name}"?`)) return;

    const updated = funnels.map((f) =>
      f.id === funnelId ? { ...f, status: 'archived' as const } : f
    );
    onChange(updated);
    console.log('Archived funnel:', funnelId);
    window.alert('Funnel archived.');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">Funnels Manager</h2>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Create Funnel
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Funnel</h3>

          {/* Funnel Name */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Funnel Name</label>
            <input
              type="text"
              placeholder="e.g., UX Bootcamp Enrollment"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Entry Point */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Entry Point</label>
            <input
              type="text"
              placeholder="e.g., Download Free Guide"
              value={formData.entryPoint}
              onChange={(e) => setFormData({ ...formData, entryPoint: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Steps */}
          <div className="mb-3 space-y-2">
            <label className="block text-xs font-semibold text-[#5F6473]">Key Steps</label>
            <input
              type="text"
              placeholder="Step 1: e.g., Email Series"
              value={formData.step1}
              onChange={(e) => setFormData({ ...formData, step1: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
            <input
              type="text"
              placeholder="Step 2: e.g., Webinar Invite"
              value={formData.step2}
              onChange={(e) => setFormData({ ...formData, step2: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
            <input
              type="text"
              placeholder="Step 3: e.g., Application Form"
              value={formData.step3}
              onChange={(e) => setFormData({ ...formData, step3: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveFunnel}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Create Funnel
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

      {/* Funnels Grid */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {funnels.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🚀</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No funnels yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first conversion funnel</p>
          </div>
        )}
        {funnels.map((funnel) => {
          const statusConfig = getStatusConfig(funnel.status);

          return (
            <div
              key={funnel.id}
              className="p-4 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#111827] mb-1">{funnel.name}</div>
                  <div className="text-xs text-[#9CA3B5]">Entry: {funnel.entryPoint}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Steps */}
              <div className="mb-3 space-y-1.5">
                {funnel.keySteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-[#304DB5] text-white font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-[#5F6473]">{step}</div>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                  <div className="text-xs text-[#9CA3B5]">Leads in Funnel</div>
                  <div className="text-sm font-bold text-[#111827]">{funnel.leadsInFunnel}</div>
                </div>
                <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                  <div className="text-xs text-[#9CA3B5]">Conversion</div>
                  <div className="text-sm font-bold text-[#111827]">{funnel.conversionRate}%</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                {funnel.status !== 'archived' && (
                  <>
                    <button
                      onClick={() => handleToggleStatus(funnel.id)}
                      className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                    >
                      {funnel.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                <button
                  onClick={() => handleEditSteps(funnel.id)}
                  className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                >
                  Edit Steps
                </button>
                <span className="text-[#E5E7EB]">|</span>
                <button
                  onClick={() => handleViewAnalytics(funnel.id)}
                  className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                >
                  View Analytics
                </button>

                {funnel.status !== 'archived' && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleArchive(funnel.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelsManagerPanel;
