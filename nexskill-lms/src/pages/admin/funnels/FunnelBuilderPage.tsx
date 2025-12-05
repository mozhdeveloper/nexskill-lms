import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminAppLayout from '../../../layouts/AdminAppLayout';
import FunnelBuilderCanvas from '../../../components/admin/funnels/FunnelBuilderCanvas';
import FunnelStepSettingsPanel from '../../../components/admin/funnels/FunnelStepSettingsPanel';
import FunnelSplitTestPanel from '../../../components/admin/funnels/FunnelSplitTestPanel';
import FunnelAnalyticsPanel from '../../../components/admin/funnels/FunnelAnalyticsPanel';

interface FunnelStep {
  id: string;
  type: 'entry' | 'page' | 'email' | 'checkout' | 'webhook' | 'end';
  label: string;
  variantKey?: 'A' | 'B';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

interface Connection {
  id: string;
  fromStepId: string;
  toStepId: string;
  conditionLabel?: string;
}

const FunnelBuilderPage: React.FC = () => {
  const { funnelId } = useParams<{ funnelId: string }>();
  const navigate = useNavigate();

  // Dummy funnel data
  const funnelName = `Sample Funnel #${funnelId?.slice(-3)}`;

  // Initial funnel steps with default layout
  const [steps, setSteps] = useState<FunnelStep[]>([
    {
      id: 'step-1',
      type: 'entry',
      label: 'Landing Page',
      position: { x: 250, y: 50 },
    },
    {
      id: 'step-2',
      type: 'page',
      label: 'Sales Page',
      position: { x: 250, y: 180 },
    },
    {
      id: 'step-3',
      type: 'checkout',
      label: 'Checkout',
      position: { x: 250, y: 310 },
    },
    {
      id: 'step-4',
      type: 'end',
      label: 'Thank You Page',
      position: { x: 250, y: 440 },
    },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'conn-1', fromStepId: 'step-1', toStepId: 'step-2' },
    { id: 'conn-2', fromStepId: 'step-2', toStepId: 'step-3' },
    { id: 'conn-3', fromStepId: 'step-3', toStepId: 'step-4' },
  ]);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Split test configuration
  const [splitTestConfig, setSplitTestConfig] = useState({
    isEnabled: false,
    trafficSplit: { A: 50, B: 50 },
    metric: 'conversion_rate' as 'conversion_rate' | 'revenue_per_visitor' | 'click_through',
  });

  // Funnel metrics (dummy data)
  const [funnelMetrics] = useState({
    visitors: 5420,
    leads: 1870,
    customers: 342,
    revenue: 34200,
    conversionRate: 34.5,
    stepStats: [
      {
        stepId: 'step-1',
        name: 'Landing Page',
        visitors: 5420,
        dropOffRate: 23.4,
        conversionRate: 76.6,
      },
      {
        stepId: 'step-2',
        name: 'Sales Page',
        visitors: 4152,
        dropOffRate: 31.2,
        conversionRate: 68.8,
      },
      {
        stepId: 'step-3',
        name: 'Checkout',
        visitors: 2857,
        dropOffRate: 52.1,
        conversionRate: 47.9,
      },
      {
        stepId: 'step-4',
        name: 'Thank You Page',
        visitors: 1368,
        dropOffRate: 0,
        conversionRate: 100,
      },
    ],
  });

  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId || null);
  };

  const handleAddStep = (type: string) => {
    const newStep: FunnelStep = {
      id: `step-${Date.now()}`,
      type: type as FunnelStep['type'],
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      position: { x: 100, y: 100 }, // Default position
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (stepId: string) => {
    // Remove step
    setSteps(steps.filter((s) => s.id !== stepId));
    
    // Remove connections involving this step
    setConnections(
      connections.filter(
        (c) => c.fromStepId !== stepId && c.toStepId !== stepId
      )
    );
    
    // Clear selection if deleted step was selected
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const handleUpdateStepPosition = (stepId: string, position: { x: number; y: number }) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, position } : step
      )
    );
  };

  const handleUpdateStep = (stepId: string, patch: Partial<FunnelStep>) => {
    setSteps(
      steps.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step
      )
    );
  };

  const handleSave = () => {
    console.log('Saving funnel:', { funnelId, steps, connections });
    // TODO: Implement actual save logic
    alert('Changes saved (simulated)');
  };

  const handlePreview = () => {
    console.log('Previewing funnel path:', { funnelId, steps, connections });
    // TODO: Implement preview logic
  };

  return (
    <AdminAppLayout>
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          {/* Left: Funnel Name & Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/funnels')}
              className="w-10 h-10 rounded-full bg-[#EDF0FB] hover:bg-[#E0E5FF] flex items-center justify-center transition-colors"
              title="Back to funnels"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">{funnelName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-3 py-1 bg-[#9CA3B5]/10 text-[#5F6473] text-xs font-semibold rounded-full">
                  Status: Draft (simulated)
                </span>
                <span className="text-xs text-[#9CA3B5]">
                  • {steps.length} step{steps.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              className="px-5 py-2.5 bg-[#EDF0FB] text-[#5F6473] font-semibold rounded-full hover:bg-[#E0E5FF] transition-all text-sm"
            >
              👁️ Preview Path
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
            >
              💾 Save Changes
            </button>
          </div>
        </div>

        {/* Main Layout: Canvas + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Canvas */}
          <div className="h-[calc(100vh-220px)]">
            <FunnelBuilderCanvas
              steps={steps}
              connections={connections}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStep}
              onAddStep={handleAddStep}
              onRemoveStep={handleRemoveStep}
              onUpdateStepPosition={handleUpdateStepPosition}
            />
          </div>

          {/* Right: Sidebar with Placeholder Panels */}
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            {/* Step Settings Panel */}
            <FunnelStepSettingsPanel
              step={steps.find((s) => s.id === selectedStepId) ?? null}
              onUpdateStep={handleUpdateStep}
            />

            {/* Split Testing Panel */}
            <FunnelSplitTestPanel
              config={splitTestConfig}
              steps={steps}
              onChange={setSplitTestConfig}
            />

            {/* Analytics Panel */}
            <FunnelAnalyticsPanel
              metrics={funnelMetrics}
              splitTestConfig={splitTestConfig}
            />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default FunnelBuilderPage;
