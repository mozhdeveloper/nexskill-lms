import React, { useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import EarningsOverviewHeader from '../../components/coach/earnings/EarningsOverviewHeader';
import RevenueChart from '../../components/coach/earnings/RevenueChart';
import MonthlyPayoutTable from '../../components/coach/earnings/MonthlyPayoutTable';
import TransactionHistoryTable from '../../components/coach/earnings/TransactionHistoryTable';
import AffiliateEarningsPanel from '../../components/coach/earnings/AffiliateEarningsPanel';
import RefundRequestsPanel from '../../components/coach/earnings/RefundRequestsPanel';
import TaxFormsPanel from '../../components/coach/earnings/TaxFormsPanel';

const EarningsDashboard: React.FC = () => {
  // Filter state
  const [filterState, setFilterState] = useState({
    timeframe: '30days',
    currency: 'USD',
  });

  // No earnings table yet — real data pending payment integration
  const summary = {
    currentMonth: 0,
    lastMonth: 0,
    allTime: 0,
    pendingPayouts: 0,
    deltaMonth: 0,
  };

  const revenueData: { label: string; amount: number }[] = [];
  const payouts: any[] = [];

  const transactions: any[] = [];
  const affiliates: any[] = [];
  const refunds: any[] = [];

  return (
    <CoachAppLayout>
      <div className="p-8 space-y-8">
        {/* Header with KPIs and Filters */}
        <EarningsOverviewHeader
          summary={summary}
          filterState={filterState}
          onFilterChange={setFilterState}
        />

        {/* Row 1: Revenue Chart + Compact Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart
              data={revenueData}
              timeframe={filterState.timeframe}
              currency={filterState.currency}
            />
          </div>
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
              <h3 className="text-sm font-semibold text-[#5F6473] uppercase tracking-wider mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Courses Sold</p>
                  <p className="text-lg font-bold text-[#111827]">0</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Coaching Sessions</p>
                  <p className="text-lg font-bold text-[#111827]">0</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Avg. Transaction</p>
                  <p className="text-lg font-bold text-[#304DB5]">—</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EDF0FB] dark:border-gray-700">
                  <p className="text-sm text-[#5F6473]">Success Rate</p>
                  <p className="text-lg font-bold text-[#22C55E]">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Monthly Payouts + Affiliate Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyPayoutTable payouts={payouts} currency={filterState.currency} />
          </div>
          <div>
            <AffiliateEarningsPanel affiliates={affiliates} currency={filterState.currency} />
          </div>
        </div>

        {/* Row 3: Transaction History + Refunds + Tax Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionHistoryTable
              transactions={transactions}
              currency={filterState.currency}
            />
          </div>
          <div className="space-y-6">
            <RefundRequestsPanel refunds={refunds} currency={filterState.currency} />
            <TaxFormsPanel />
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default EarningsDashboard;
