import React from 'react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Refunded';
}

interface ProfileBillingHistoryProps {
  transactions: Transaction[];
}

const ProfileBillingHistory: React.FC<ProfileBillingHistoryProps> = ({ transactions }) => {
  const getStatusColor = (status: string) => {
    return status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Billing history</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-lg text-slate-600">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-600 pb-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-600 pb-3">Description</th>
                <th className="text-right text-xs font-semibold text-slate-600 pb-3">Amount</th>
                <th className="text-center text-xs font-semibold text-slate-600 pb-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-600 pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-slate-100">
                  <td className="py-4 text-sm text-slate-700">{transaction.date}</td>
                  <td className="py-4 text-sm text-slate-900">{transaction.description}</td>
                  <td className="py-4 text-sm font-semibold text-slate-900 text-right">
                    ₱{transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => console.log('Download receipt:', transaction.id)}
                      className="text-sm text-[#304DB5] hover:text-[#5E7BFF] font-medium"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProfileBillingHistory;
