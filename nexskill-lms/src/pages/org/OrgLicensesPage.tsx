import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';

interface License {
  id: string;
  type: 'standard' | 'premium' | 'enterprise';
  total: number;
  used: number;
  price: number;
  renewalDate: string;
  status: 'active' | 'expiring' | 'expired';
}

const OrgLicensesPage: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const licenses: License[] = [
    {
      id: '1',
      type: 'standard',
      total: 100,
      used: 87,
      price: 29,
      renewalDate: '2026-03-15',
      status: 'active'
    },
    {
      id: '2',
      type: 'premium',
      total: 50,
      used: 43,
      price: 49,
      renewalDate: '2026-03-15',
      status: 'active'
    },
    {
      id: '3',
      type: 'enterprise',
      total: 50,
      used: 12,
      price: 99,
      renewalDate: '2025-12-20',
      status: 'expiring'
    }
  ];

  const totalLicenses = licenses.reduce((sum, l) => sum + l.total, 0);
  const usedLicenses = licenses.reduce((sum, l) => sum + l.used, 0);
  const monthlyCost = licenses.reduce((sum, l) => sum + (l.total * l.price), 0);

  const getLicenseIcon = (type: string) => {
    switch (type) {
      case 'standard': return '🥉';
      case 'premium': return '🥈';
      case 'enterprise': return '🥇';
      default: return '🎫';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expiring': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
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
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Licenses Management</h1>
              <p className="text-[#5F6473]">Manage your organization's learning licenses</p>
            </div>
            <button 
              onClick={() => setShowPurchaseModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              + Purchase Licenses
            </button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">🎫</div>
              <div className="text-3xl font-bold text-[#111827] mb-1">{totalLicenses}</div>
              <div className="text-sm text-[#5F6473]">Total Licenses</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">{usedLicenses}</div>
              <div className="text-sm text-[#5F6473]">Licenses Used</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{totalLicenses - usedLicenses}</div>
              <div className="text-sm text-[#5F6473]">Available</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-2xl font-bold text-[#111827] mb-1">${monthlyCost.toLocaleString()}</div>
              <div className="text-sm text-[#5F6473]">Monthly Cost</div>
            </div>
          </div>

          {/* License Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#111827] mb-4">License Breakdown</h2>
            <div className="space-y-4">
              {licenses.map((license) => (
                <div key={license.id} className="border border-[#E5E7EB] rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getLicenseIcon(license.type)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-[#111827] capitalize">{license.type} License</h3>
                        <p className="text-sm text-[#5F6473]">${license.price}/user/month</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                      {license.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-[#5F6473] mb-1">Total Licenses</p>
                      <p className="text-2xl font-bold text-[#111827]">{license.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#5F6473] mb-1">Used</p>
                      <p className="text-2xl font-bold text-green-600">{license.used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#5F6473] mb-1">Available</p>
                      <p className="text-2xl font-bold text-blue-600">{license.total - license.used}</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[#5F6473]">Usage</span>
                      <span className="font-semibold text-[#111827]">
                        {Math.round((license.used / license.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${(license.used / license.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                    <div>
                      <p className="text-sm text-[#5F6473]">Renewal Date</p>
                      <p className="font-semibold text-[#111827]">{new Date(license.renewalDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => console.log('Manage license:', license.id)}
                        className="px-4 py-2 border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Manage
                      </button>
                      <button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Add More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Alerts */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-[#111827] mb-1">License Usage Alert</h3>
                <p className="text-sm text-[#5F6473] mb-3">
                  Your Standard licenses are at 87% capacity. Consider purchasing additional licenses to accommodate team growth.
                </p>
                <button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Purchase Now
                </button>
              </div>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#111827] mb-4">Expiring Soon</h2>
            <div className="space-y-3">
              {licenses.filter(l => l.status === 'expiring').map((license) => (
                <div key={license.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getLicenseIcon(license.type)}</span>
                    <div>
                      <p className="font-semibold text-[#111827] capitalize">{license.type} License ({license.total} seats)</p>
                      <p className="text-sm text-[#5F6473]">Expires on {new Date(license.renewalDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => console.log('Renew license:', license.id)}
                    className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Renew Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111827]">Purchase Licenses</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* License Type Selection */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-3">
                  Select License Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['standard', 'premium', 'enterprise'].map((type) => (
                    <button
                      key={type}
                      className="p-4 border-2 border-orange-500 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">{getLicenseIcon(type)}</div>
                      <p className="font-bold text-[#111827] capitalize mb-1">{type}</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ${type === 'standard' ? '29' : type === 'premium' ? '49' : '99'}
                      </p>
                      <p className="text-xs text-[#5F6473]">per user/month</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Number of Licenses
                </label>
                <input
                  type="number"
                  min="1"
                  defaultValue="10"
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Billing Period */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Billing Period
                </label>
                <select className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Monthly</option>
                  <option>Quarterly (5% off)</option>
                  <option>Annual (15% off)</option>
                </select>
              </div>

              {/* Summary */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#5F6473]">Subtotal</span>
                  <span className="font-semibold text-[#111827]">$290.00</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#5F6473]">Tax</span>
                  <span className="font-semibold text-[#111827]">$29.00</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-orange-300">
                  <span className="font-bold text-[#111827]">Total</span>
                  <span className="text-2xl font-bold text-orange-600">$319.00</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] text-[#111827] font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Purchase confirmed');
                    setShowPurchaseModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#111827]">Add More Licenses</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Number of Additional Licenses
                </label>
                <input
                  type="number"
                  min="1"
                  defaultValue="10"
                  className="w-full px-4 py-3 bg-[#F5F7FF] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <p className="text-sm text-[#5F6473] mb-1">Estimated Cost</p>
                <p className="text-2xl font-bold text-orange-600">$290.00/month</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] text-[#111827] font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Upgrade confirmed');
                    setShowUpgradeModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Add Licenses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrgOwnerAppLayout>
  );
};

export default OrgLicensesPage;
