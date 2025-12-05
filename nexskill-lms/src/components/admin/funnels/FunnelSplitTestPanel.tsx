import React from 'react';

interface FunnelStep {
  id: string;
  type: 'entry' | 'page' | 'email' | 'checkout' | 'webhook' | 'end';
  label: string;
  variantKey?: 'A' | 'B';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

interface SplitTestConfig {
  isEnabled: boolean;
  trafficSplit: { A: number; B: number };
  metric: 'conversion_rate' | 'revenue_per_visitor' | 'click_through';
}

interface FunnelSplitTestPanelProps {
  config: SplitTestConfig;
  steps: FunnelStep[];
  onChange: (nextConfig: SplitTestConfig) => void;
}

const FunnelSplitTestPanel: React.FC<FunnelSplitTestPanelProps> = ({
  config,
  steps,
  onChange,
}) => {
  const handleToggle = () => {
    onChange({
      ...config,
      isEnabled: !config.isEnabled,
      trafficSplit: config.isEnabled ? config.trafficSplit : { A: 50, B: 50 },
    });
  };

  const handleTrafficSplitChange = (variant: 'A' | 'B', value: number) => {
    const constrainedValue = Math.max(0, Math.min(100, value));
    const otherVariant = variant === 'A' ? 'B' : 'A';
    const otherValue = 100 - constrainedValue;

    onChange({
      ...config,
      trafficSplit: {
        [variant]: constrainedValue,
        [otherVariant]: otherValue,
      } as { A: number; B: number },
    });
  };

  const handleMetricChange = (metric: SplitTestConfig['metric']) => {
    onChange({
      ...config,
      metric,
    });
  };

  // Count steps by variant
  const variantACounts = steps.filter((s) => s.variantKey === 'A').length;
  const variantBCounts = steps.filter((s) => s.variantKey === 'B').length;
  const unassignedCounts = steps.filter((s) => !s.variantKey).length;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#EDF0FB] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
          <span>🔀</span> Split Test (A/B)
        </h3>
        
        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.isEnabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[#EDF0FB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#E0E5FF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#304DB5]"></div>
        </label>
      </div>

      {/* Description */}
      {!config.isEnabled && (
        <div className="mb-4">
          <p className="text-sm text-[#5F6473] mb-3">
            A/B testing lets you compare two variants of your funnel to see which performs better.
          </p>
          <div className="bg-[#F5F7FF] rounded-lg p-4">
            <p className="text-xs text-[#5F6473] italic">
              Enable split testing to configure traffic allocation and metrics.
            </p>
          </div>
        </div>
      )}

      {/* Controls (when enabled) */}
      {config.isEnabled && (
        <div className="space-y-4">
          {/* Traffic Split */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-2">
              Traffic Split
            </label>
            <div className="space-y-3">
              {/* Variant A */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#5F6473]">Variant A</span>
                  <span className="text-xs font-bold text-[#304DB5]">{config.trafficSplit.A}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.trafficSplit.A}
                  onChange={(e) => handleTrafficSplitChange('A', parseInt(e.target.value))}
                  className="w-full h-2 bg-[#EDF0FB] rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #304DB5 0%, #304DB5 ${config.trafficSplit.A}%, #EDF0FB ${config.trafficSplit.A}%, #EDF0FB 100%)`,
                  }}
                />
              </div>

              {/* Variant B */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#5F6473]">Variant B</span>
                  <span className="text-xs font-bold text-[#5E7BFF]">{config.trafficSplit.B}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.trafficSplit.B}
                  onChange={(e) => handleTrafficSplitChange('B', parseInt(e.target.value))}
                  className="w-full h-2 bg-[#EDF0FB] rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #5E7BFF 0%, #5E7BFF ${config.trafficSplit.B}%, #EDF0FB ${config.trafficSplit.B}%, #EDF0FB 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Primary Metric */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-2">
              Primary Metric
            </label>
            <select
              value={config.metric}
              onChange={(e) => handleMetricChange(e.target.value as SplitTestConfig['metric'])}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] bg-white"
            >
              <option value="conversion_rate">Conversion Rate</option>
              <option value="revenue_per_visitor">Revenue per Visitor</option>
              <option value="click_through">Click-through Rate</option>
            </select>
          </div>

          {/* Variant Summary */}
          <div className="pt-3 border-t border-[#EDF0FB]">
            <p className="text-xs font-semibold text-[#111827] mb-2">
              Variant Distribution
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6473]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#304DB5] mr-2"></span>
                  Variant A
                </span>
                <span className="font-semibold text-[#111827]">
                  {variantACounts} step{variantACounts !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6473]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#5E7BFF] mr-2"></span>
                  Variant B
                </span>
                <span className="font-semibold text-[#111827]">
                  {variantBCounts} step{variantBCounts !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5F6473]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#9CA3B5] mr-2"></span>
                  Unassigned
                </span>
                <span className="font-semibold text-[#111827]">
                  {unassignedCounts} step{unassignedCounts !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#9CA3B5] italic mt-3">
              Assign variant keys to steps via step settings to track A/B performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelSplitTestPanel;
