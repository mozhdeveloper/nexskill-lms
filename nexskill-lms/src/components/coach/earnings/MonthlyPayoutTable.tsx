import React, { useState } from 'react';

interface MonthlyPayout {
  id: string;
  monthLabel: string;
  gross: number;
  fees: number;
  refunds: number;
  net: number;
  status: 'Sent' | 'Pending' | 'On hold';
  payoutDate?: string;
}

interface MonthlyPayoutTableProps {
  payouts: MonthlyPayout[];
  currency: string;
}

const MonthlyPayoutTable: React.FC<MonthlyPayoutTableProps> = ({ payouts, currency }) => {
  const [selectedYear, setSelectedYear] = useState('2025');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-[#22C55E] text-white';
      case 'Pending':
        return 'bg-[#F97316] text-white';
      case 'On hold':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const handleRowClick = (payout: MonthlyPayout) => {
    console.log('Payout details:', payout);
  };

  const years = ['2025', '2024', '2023'];
  const filteredPayouts = payouts.filter((p) => p.monthLabel && p.monthLabel.includes(selectedYear));

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#111827]">Monthly Payouts</h3>
          <p className="text-sm text-[#5F6473] mt-1">Review your monthly payout summaries</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#EDF0FB] bg-white text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EDF0FB]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Month
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Gross
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Fees
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Refunds
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Net Payout
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Status
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                Payout Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map((payout) => (
              <tr
                key={payout.id}
                onClick={() => handleRowClick(payout)}
                className="border-b border-[#EDF0FB] hover:bg-[#F5F7FF] cursor-pointer transition-colors"
              >
                <td className="py-4 px-4">
                  <p className="font-semibold text-[#111827]">{payout.monthLabel}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="text-[#111827]">{formatCurrency(payout.gross)}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="text-[#F97316]">-{formatCurrency(payout.fees)}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="text-[#F97316]">-{formatCurrency(payout.refunds)}</p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-bold text-[#111827]">{formatCurrency(payout.net)}</p>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      payout.status
                    )}`}
                  >
                    {payout.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="text-sm text-[#5F6473]">
                    {payout.payoutDate || '—'}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredPayouts.map((payout) => (
          <div
            key={payout.id}
            onClick={() => handleRowClick(payout)}
            className="bg-[#F5F7FF] rounded-xl p-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#111827]">{payout.monthLabel}</h4>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  payout.status
                )}`}
              >
                {payout.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Gross</p>
                <p className="font-medium text-[#111827]">{formatCurrency(payout.gross)}</p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Net Payout</p>
                <p className="font-bold text-[#111827]">{formatCurrency(payout.net)}</p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Fees</p>
                <p className="text-[#F97316]">-{formatCurrency(payout.fees)}</p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Refunds</p>
                <p className="text-[#F97316]">-{formatCurrency(payout.refunds)}</p>
              </div>
            </div>
            {payout.payoutDate && (
              <div className="pt-3 border-t border-[#EDF0FB]">
                <p className="text-xs text-[#9CA3B5]">
                  Paid on {payout.payoutDate}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPayouts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-lg text-[#5F6473] mb-2">No payouts for {selectedYear}</p>
          <p className="text-sm text-[#9CA3B5]">
            Select a different year or start earning
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyPayoutTable;
