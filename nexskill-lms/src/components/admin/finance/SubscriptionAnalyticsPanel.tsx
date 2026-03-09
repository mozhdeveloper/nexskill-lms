import React from 'react';

interface SubscriptionAnalytics {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  churnRate: number;
  mrrTrend: { monthLabel: string; value: number }[];
  plans: { name: string; subscribers: number; mrr: number; churnRate: number }[];
}

interface SubscriptionAnalyticsPanelProps {
  analytics: SubscriptionAnalytics;
}

const SubscriptionAnalyticsPanel: React.FC<SubscriptionAnalyticsPanelProps> = ({ analytics }) => {
  const maxMrr = Math.max(...analytics.mrrTrend.map((m) => m.value));

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-6">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">Subscription Analytics</h2>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-[#DBEAFE] to-white rounded-xl border border-[#93C5FD]">
          <p className="text-xs text-[#1E40AF] mb-1">MRR</p>
          <p className="text-xl font-bold text-[#111827]">
            ₱{(analytics.mrr / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#E0E7FF] to-white rounded-xl border border-[#C7D2FE]">
          <p className="text-xs text-[#3730A3] mb-1">ARR</p>
          <p className="text-xl font-bold text-[#111827]">
            ₱{(analytics.arr / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#D1FAE5] to-white rounded-xl border border-[#6EE7B7]">
          <p className="text-xs text-[#047857] mb-1">Active Subscribers</p>
          <p className="text-xl font-bold text-[#111827]">{analytics.activeSubscribers}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#FEF3C7] to-white rounded-xl border border-[#FCD34D]">
          <p className="text-xs text-[#92400E] mb-1">Churn Rate</p>
          <p className="text-xl font-bold text-[#111827]">{analytics.churnRate}%</p>
        </div>
      </div>

      {/* Trend Visualization */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-[#111827] mb-3">MRR Trend (Last 12 Months)</h3>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {analytics.mrrTrend.map((month, index) => {
            const heightPercent = (month.value / maxMrr) * 100;
            const isCurrentMonth = index === analytics.mrrTrend.length - 1;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center h-28 mb-1">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrentMonth
                        ? 'bg-gradient-to-t from-[#304DB5] to-[#5E7BFF]'
                        : 'bg-gradient-to-t from-[#93C5FD] to-[#BFDBFE]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${month.monthLabel}: ₱${month.value.toLocaleString()}`}
                  />
                </div>
                <p className="text-[10px] text-[#9CA3B5] font-medium">{month.monthLabel}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Plan */}
      <div>
        <h3 className="text-sm font-bold text-[#111827] mb-3">Breakdown by Plan</h3>
        <div className="space-y-3">
          {analytics.plans.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-[#9CA3B5]">No subscription plans data available</p>
            </div>
          )}
          {analytics.plans.map((plan, index) => {
            const mrrContribution = ((plan.mrr / analytics.mrr) * 100).toFixed(1);

            return (
              <div
                key={index}
                className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-[#111827] mb-0.5">{plan.name}</div>
                    <div className="text-xs text-[#9CA3B5]">
                      {plan.subscribers} active subscribers
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#111827]">
                      ₱{(plan.mrr / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-[#9CA3B5]">{mrrContribution}% of MRR</div>
                  </div>
                </div>

                {/* MRR Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-[#EDF0FB] rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] h-1.5 rounded-full transition-all"
                      style={{ width: `${mrrContribution}%` }}
                    />
                  </div>
                </div>

                {/* Churn Rate */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3B5]">Churn Rate:</span>
                  <span
                    className={`font-semibold ${
                      plan.churnRate > 5
                        ? 'text-[#DC2626]'
                        : plan.churnRate > 3
                        ? 'text-[#D97706]'
                        : 'text-[#059669]'
                    }`}
                  >
                    {plan.churnRate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAnalyticsPanel;
