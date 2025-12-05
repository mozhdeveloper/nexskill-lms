import React from 'react';

interface StepStat {
  stepId: string;
  name: string;
  visitors: number;
  dropOffRate: number;
  conversionRate: number;
}

interface FunnelMetrics {
  visitors: number;
  leads: number;
  customers: number;
  revenue: number;
  conversionRate: number;
  stepStats: StepStat[];
}

interface SplitTestConfig {
  isEnabled: boolean;
  trafficSplit: { A: number; B: number };
  metric: 'conversion_rate' | 'revenue_per_visitor' | 'click_through';
}

interface FunnelAnalyticsPanelProps {
  metrics: FunnelMetrics;
  splitTestConfig: SplitTestConfig;
}

const FunnelAnalyticsPanel: React.FC<FunnelAnalyticsPanelProps> = ({
  metrics,
  splitTestConfig,
}) => {
  // Dummy variant comparison data (would come from real analytics)
  const variantAConversion = 34.2;
  const variantBConversion = 38.7;
  const leadingVariant = variantBConversion > variantAConversion ? 'B' : 'A';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#EDF0FB] p-6">
      {/* Header */}
      <h3 className="text-lg font-bold text-[#111827] mb-1 flex items-center gap-2">
        <span>📊</span> Funnel Analytics
      </h3>
      <p className="text-xs text-[#5F6473] mb-4">
        Simulated performance metrics for this funnel.
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#F5F7FF] rounded-lg p-3">
          <p className="text-xs text-[#5F6473] mb-1">Visitors</p>
          <p className="text-lg font-bold text-[#111827]">
            {metrics.visitors.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#F5F7FF] rounded-lg p-3">
          <p className="text-xs text-[#5F6473] mb-1">Leads</p>
          <p className="text-lg font-bold text-[#22C55E]">
            {metrics.leads.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#F5F7FF] rounded-lg p-3">
          <p className="text-xs text-[#5F6473] mb-1">Customers</p>
          <p className="text-lg font-bold text-[#304DB5]">
            {metrics.customers.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#F5F7FF] rounded-lg p-3">
          <p className="text-xs text-[#5F6473] mb-1">Revenue</p>
          <p className="text-lg font-bold text-[#F59E0B]">
            ${metrics.revenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Overall Conversion */}
      <div className="bg-gradient-to-br from-[#304DB5]/5 to-[#5E7BFF]/5 rounded-lg p-4 mb-4">
        <p className="text-xs text-[#5F6473] mb-1">Overall Conversion Rate</p>
        <p className="text-2xl font-bold text-[#304DB5]">
          {metrics.conversionRate.toFixed(1)}%
        </p>
        <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full"
            style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Step Breakdown */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#111827] mb-3">
          Step Performance
        </p>
        <div className="space-y-3">
          {metrics.stepStats.map((stat) => (
            <div key={stat.stepId} className="border border-[#EDF0FB] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#111827]">{stat.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5F6473]">
                    {stat.visitors.toLocaleString()} visitors
                  </span>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <span className="text-[#9CA3B5]">Drop-off:</span>{' '}
                  <span className="font-semibold text-[#EF4444]">
                    {stat.dropOffRate.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3B5]">CVR:</span>{' '}
                  <span className="font-semibold text-[#22C55E]">
                    {stat.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="flex gap-1 h-1.5">
                <div
                  className="bg-[#22C55E] rounded-full"
                  style={{ width: `${stat.conversionRate}%` }}
                  title={`${stat.conversionRate}% converted`}
                />
                <div
                  className="bg-[#EF4444] rounded-full"
                  style={{ width: `${stat.dropOffRate}%` }}
                  title={`${stat.dropOffRate}% dropped off`}
                />
                <div
                  className="bg-[#EDF0FB] rounded-full flex-1"
                  title="In progress"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Comparison (if split testing enabled) */}
      {splitTestConfig.isEnabled && (
        <div className="pt-4 border-t border-[#EDF0FB]">
          <p className="text-xs font-semibold text-[#111827] mb-3">
            Variant Comparison
          </p>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between p-2 bg-[#F5F7FF] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#304DB5]"></span>
                <span className="text-xs font-medium text-[#111827]">Variant A</span>
              </div>
              <span className="text-xs font-bold text-[#304DB5]">
                {variantAConversion.toFixed(1)}% CVR
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#F5F7FF] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5E7BFF]"></span>
                <span className="text-xs font-medium text-[#111827]">Variant B</span>
              </div>
              <span className="text-xs font-bold text-[#5E7BFF]">
                {variantBConversion.toFixed(1)}% CVR
              </span>
            </div>
          </div>
          
          {/* Winner Badge */}
          <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#22C55E]/5 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-[#22C55E]">
              🏆 Variant {leadingVariant} currently leading
            </p>
            <p className="text-xs text-[#5F6473] mt-1">
              +{Math.abs(variantBConversion - variantAConversion).toFixed(1)}% higher conversion
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelAnalyticsPanel;
