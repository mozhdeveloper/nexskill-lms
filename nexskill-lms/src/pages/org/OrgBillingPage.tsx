import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

const OrgBillingPage: React.FC = () => {
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'invoices' | 'methods'>('overview');

  const invoices: Invoice[] = [
    { id: 'INV-2025-001', date: '2025-12-01', amount: 4850, status: 'paid', description: 'Monthly Subscription - December 2025' },
    { id: 'INV-2025-002', date: '2025-11-01', amount: 4850, status: 'paid', description: 'Monthly Subscription - November 2025' },
    { id: 'INV-2025-003', date: '2025-10-01', amount: 4650, status: 'paid', description: 'Monthly Subscription - October 2025' },
    { id: 'INV-2025-004', date: '2025-09-01', amount: 4650, status: 'paid', description: 'Monthly Subscription - September 2025' },
  ];

  const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'card', last4: '4242', expiry: '12/26', isDefault: true },
    { id: '2', type: 'bank', last4: '6789', isDefault: false },
  ];

  const currentPlan = {
    name: 'Business Plan',
    price: 4850,
    licenses: 200,
    nextBillingDate: '2026-01-01',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <OrgOwnerAppLayout>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Billing & Payments</h1>
              <p className="text-[#5F6473]">Manage your subscription, invoices, and payment methods</p>
            </div>
            <button 
              onClick={() => console.log('Download all invoices')}
              className="px-6 py-3 bg-white border border-[#E5E7EB] text-[#111827] font-semibold rounded-full hover:shadow-md transition-all"
            >
              📥 Download All
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[#E5E7EB]">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'overview'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('invoices')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'invoices'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setSelectedTab('methods')}
              className={`px-6 py-3 font-medium transition-all ${
                selectedTab === 'methods'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-[#5F6473] hover:text-[#111827]'
              }`}
            >
              Payment Methods
            </button>
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111827] mb-1">{currentPlan.name}</h2>
                    <p className="text-[#5F6473]">{currentPlan.licenses} licenses included</p>
                  </div>
                  <button 
                    onClick={() => console.log('Upgrade plan')}
                    className="px-4 py-2 bg-white border border-orange-300 text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-[#111827]">${currentPlan.price.toLocaleString()}</span>
                  <span className="text-[#5F6473]">per month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5F6473]">
                  <span>Next billing date:</span>
                  <span className="font-semibold text-[#111827]">
                    {new Date(currentPlan.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
                  <div className="text-2xl mb-1">💳</div>
                  <div className="text-3xl font-bold text-[#111827] mb-1">
                    ${(currentPlan.price * 12).toLocaleString()}
                  </div>
                  <div className="text-sm text-[#5F6473]">Annual Spend</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{invoices.filter(i => i.status === 'paid').length}</div>
                  <div className="text-sm text-[#5F6473]">Paid Invoices</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-3xl font-bold text-[#111827] mb-1">
                    ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-[#5F6473]">Total Spent</div>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#111827]">Recent Invoices</h3>
                  <button
                    onClick={() => setSelectedTab('invoices')}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">
                          📄
                        </div>
                        <div>
                          <p className="font-semibold text-[#111827]">{invoice.id}</p>
                          <p className="text-sm text-[#5F6473]">{invoice.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#111827]">${invoice.amount.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {selectedTab === 'invoices' && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F7FF] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-[#F5F7FF] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-[#111827]">{invoice.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#5F6473]">{new Date(invoice.date).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#111827]">{invoice.description}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#111827]">${invoice.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => console.log('Download invoice:', invoice.id)}
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {selectedTab === 'methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#111827]">Saved Payment Methods</h3>
                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  + Add Payment Method
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 relative">
                    {method.isDefault && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center text-2xl">
                        {method.type === 'card' ? '💳' : '🏦'}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#111827] mb-1">
                          {method.type === 'card' ? 'Credit Card' : 'Bank Account'}
                        </p>
                        <p className="text-[#5F6473] mb-2">•••• {method.last4}</p>
                        {method.expiry && (
                          <p className="text-sm text-[#5F6473]">Expires {method.expiry}</p>
                        )}
                        <div className="flex gap-2 mt-4">
                          {!method.isDefault && (
                            <button
                              onClick={() => console.log('Set as default:', method.id)}
                              className="px-3 py-1 border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => console.log('Remove method:', method.id)}
                            className="px-3 py-1 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111827]">Add Payment Method</h2>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-sm text-[#5F6473]">Set as default payment method</span>
              </label>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] text-[#111827] font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Payment method added');
                    setShowAddPaymentModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Add Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrgOwnerAppLayout>
  );
};

export default OrgBillingPage;
