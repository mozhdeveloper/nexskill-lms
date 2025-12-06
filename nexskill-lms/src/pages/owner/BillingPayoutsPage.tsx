import React, { useState } from 'react';
import PlatformOwnerAppLayout from '../../layouts/PlatformOwnerAppLayout';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  type: 'revenue' | 'payout' | 'refund';
}

interface CoachPayout {
  id: string;
  coachName: string;
  coachEmail: string;
  earnings: number;
  platformFee: number;
  netPayout: number;
  status: 'pending' | 'processing' | 'completed';
  dueDate: string;
}

const BillingPayoutsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payouts'>('overview');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [processingPayouts, setProcessingPayouts] = useState(false);

  const handleProcessPayouts = () => {
    console.log('Process payouts');
    setProcessingPayouts(true);
    setTimeout(() => {
      alert('✅ Payouts processed successfully!\n\nTotal payouts: $28,450\nCoaches paid: 12\nAll payments have been initiated.');
      setProcessingPayouts(false);
      setShowPayoutModal(false);
    }, 1500);
  };

  // Dummy financial overview data
  const financialOverview = {
    totalRevenue: 284500,
    revenueGrowth: '+12.5%',
    totalPayouts: 142250,
    pendingPayouts: 28450,
    platformRevenue: 142250,
    refunds: 5690,
    mrr: 284500,
    mrrGrowth: '+8.3%',
  };

  // Dummy transactions
  const transactions: Transaction[] = [
    {
      id: 'txn-1',
      date: 'Dec 4, 2025',
      description: 'Course purchase - Advanced React Patterns',
      amount: 299,
      status: 'completed',
      type: 'revenue',
    },
    {
      id: 'txn-2',
      date: 'Dec 4, 2025',
      description: 'Monthly subscription - Premium Plan',
      amount: 49,
      status: 'completed',
      type: 'revenue',
    },
    {
      id: 'txn-3',
      date: 'Dec 3, 2025',
      description: 'Coach payout - Sarah Johnson',
      amount: -1250,
      status: 'completed',
      type: 'payout',
    },
    {
      id: 'txn-4',
      date: 'Dec 3, 2025',
      description: 'Refund - JavaScript Fundamentals',
      amount: -99,
      status: 'completed',
      type: 'refund',
    },
    {
      id: 'txn-5',
      date: 'Dec 2, 2025',
      description: 'Course purchase - Python Mastery',
      amount: 199,
      status: 'completed',
      type: 'revenue',
    },
    {
      id: 'txn-6',
      date: 'Dec 1, 2025',
      description: 'Coach payout - David Chen',
      amount: -2100,
      status: 'processing',
      type: 'payout',
    },
  ];

  // Dummy coach payouts
  const coachPayouts: CoachPayout[] = [
    {
      id: 'payout-1',
      coachName: 'Sarah Johnson',
      coachEmail: 'sarah.j@example.com',
      earnings: 2500,
      platformFee: 500,
      netPayout: 2000,
      status: 'pending',
      dueDate: 'Dec 10, 2025',
    },
    {
      id: 'payout-2',
      coachName: 'David Chen',
      coachEmail: 'david.chen@example.com',
      earnings: 4200,
      platformFee: 840,
      netPayout: 3360,
      status: 'pending',
      dueDate: 'Dec 10, 2025',
    },
    {
      id: 'payout-3',
      coachName: 'Emma Wilson',
      coachEmail: 'emma.w@example.com',
      earnings: 1800,
      platformFee: 360,
      netPayout: 1440,
      status: 'processing',
      dueDate: 'Dec 5, 2025',
    },
    {
      id: 'payout-4',
      coachName: 'Michael Brown',
      coachEmail: 'michael.b@example.com',
      earnings: 3100,
      platformFee: 620,
      netPayout: 2480,
      status: 'completed',
      dueDate: 'Dec 3, 2025',
    },
  ];

  return (
    <PlatformOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Billing & Payouts</h1>
          <p className="text-sm text-text-secondary">
            Financial oversight, revenue tracking, and coach payouts
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
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'payouts'
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Coach Payouts
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {financialOverview.revenueGrowth}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    ${financialOverview.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Total Revenue</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {financialOverview.mrrGrowth}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    ${financialOverview.mrr.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">MRR</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">💸</span>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    ${financialOverview.platformRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Platform Revenue</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <span className="text-2xl mb-2 block">⏳</span>
                  <p className="text-2xl font-bold text-amber-600 mb-1">
                    ${financialOverview.pendingPayouts.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Pending Payouts</p>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#EDF0FB]">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Coach Payouts</span>
                      <span className="text-sm font-semibold text-text-primary">
                        ${financialOverview.totalPayouts.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F7FF] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: '50%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Platform Share</span>
                      <span className="text-sm font-semibold text-text-primary">
                        ${financialOverview.platformRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F7FF] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: '50%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Refunds</span>
                      <span className="text-sm font-semibold text-red-600">
                        ${financialOverview.refunds.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F7FF] rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: '2%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-bold text-text-primary mb-2">Payout Schedule</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Next payout batch scheduled for Dec 10, 2025
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                          Pending Payouts
                        </span>
                        <span className="text-lg font-bold text-amber-600">
                          ${financialOverview.pendingPayouts.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        {coachPayouts.filter((p) => p.status === 'pending').length} coaches
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="w-full py-3 bg-brand-primary text-white rounded-xl font-medium text-sm hover:bg-brand-primary-dark transition-colors"
                    >
                      Process All Payouts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FF]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Type
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-text-primary uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0FB]">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4 text-sm text-text-secondary">{txn.date}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-medium">
                          {txn.description}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              txn.type === 'revenue'
                                ? 'bg-green-100 text-green-800'
                                : txn.type === 'payout'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {txn.type}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-semibold text-right ${
                            txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              txn.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : txn.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FF]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Coach
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Earnings
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Platform Fee
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-primary uppercase">
                        Net Payout
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-text-primary uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-primary uppercase">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0FB]">
                    {coachPayouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {payout.coachName}
                            </p>
                            <p className="text-xs text-text-muted">{payout.coachEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary text-right">
                          ${payout.earnings.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary text-right">
                          -${payout.platformFee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-text-primary text-right">
                          ${payout.netPayout.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              payout.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : payout.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {payout.dueDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Process Payouts Confirmation Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#EDF0FB]">
              <h2 className="text-xl font-bold text-text-primary">Process Payouts</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Payout Summary</p>
                    <p className="text-xs text-text-muted">Review before processing</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Total Amount:</span>
                    <span className="text-lg font-bold text-amber-700">
                      ${financialOverview.pendingPayouts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Number of Coaches:</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {coachPayouts.filter((p) => p.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Processing Time:</span>
                    <span className="text-sm font-semibold text-text-primary">2-3 business days</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800">
                  ℹ️ Processing will initiate bank transfers to all pending coaches. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[#EDF0FB] flex justify-end gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                disabled={processingPayouts}
                className="px-6 py-2 text-text-secondary font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayouts}
                disabled={processingPayouts}
                className="px-6 py-2 bg-brand-primary text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processingPayouts ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Process Payouts'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlatformOwnerAppLayout>
  );
};

export default BillingPayoutsPage;
