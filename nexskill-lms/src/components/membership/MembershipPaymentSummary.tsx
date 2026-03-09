import React from 'react';

interface PaymentSummary {
  planName: string;
  price: number;
  billingCycle: string;
  paymentMethod: string;
  transactionId: string;
  date: string;
  status: 'succeeded' | 'pending' | 'failed';
}

interface MembershipPaymentSummaryProps {
  summary: PaymentSummary;
}

const MembershipPaymentSummary: React.FC<MembershipPaymentSummaryProps> = ({ summary }) => {
  const getStatusColor = () => {
    switch (summary.status) {
      case 'succeeded':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = () => {
    switch (summary.status) {
      case 'succeeded':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Payment summary</h2>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${getStatusColor()}`}
        >
          {getStatusIcon()}
          {summary.status.charAt(0).toUpperCase() + summary.status.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        {/* Plan & Amount */}
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-slate-600">Plan</span>
            <span className="text-lg font-bold text-slate-900">{summary.planName}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-600">Amount charged</span>
            <span className="text-2xl font-bold text-[#304DB5]">
              ₱{summary.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-600"> / {summary.billingCycle}</span>
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Payment method</span>
            <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {summary.paymentMethod}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Transaction ID</span>
            <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded">
              {summary.transactionId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Date</span>
            <span className="text-sm font-medium text-slate-900">{summary.date}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-slate-600">
              A receipt has been sent to your email. You can view all billing history in your account
              settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipPaymentSummary;
