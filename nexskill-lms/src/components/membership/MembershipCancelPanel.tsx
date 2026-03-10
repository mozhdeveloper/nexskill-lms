import React, { useState } from 'react';

interface MembershipCancelPanelProps {
  onCancelConfirmed: () => void;
  expiresAt?: string | null;
}

const MembershipCancelPanel: React.FC<MembershipCancelPanelProps> = ({ onCancelConfirmed, expiresAt }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');

  const reasons = [
    'Too expensive',
    'Not using enough',
    'Found alternative',
    'Technical issues',
    'Other',
  ];

  const handleCancel = () => {
    setShowConfirm(true);
  };

  const handleConfirmCancel = () => {
    console.log('Cancellation reason:', reason);
    onCancelConfirmed();
  };

  const handleContactSupport = () => {
    console.log('Contact support clicked');
    alert('Support contact feature coming soon!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Cancel membership</h2>

      {!showConfirm ? (
        <>
          {/* Warning Message */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">What you'll lose</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Access to premium courses and materials</li>
                  <li>• AI Coach and 1:1 coaching credits</li>
                  <li>• Course certificates and verifications</li>
                  <li>• Live classes and priority support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Access Timeline */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-slate-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-slate-900">When access ends</p>
                <p className="text-sm text-slate-600">
                  You'll retain access until the end of your current billing period{expiresAt ? ` (${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})` : ''}.
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Help us improve (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
            >
              <option value="">Why are you cancelling?</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCancel}
              className="w-full py-3 px-6 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-all"
            >
              Cancel membership
            </button>
            <button
              onClick={handleContactSupport}
              className="w-full py-2.5 px-6 text-slate-700 font-medium rounded-full border border-slate-300 hover:bg-slate-50 transition-all text-sm"
            >
              Contact support instead
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Confirmation Step */}
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Are you sure?</h3>
                <p className="text-sm text-red-700">
                  This action will cancel your membership at the end of the current billing period. You can
                  always resubscribe later.
                </p>
              </div>
            </div>
          </div>

          {/* Final Confirmation Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmCancel}
              className="w-full py-3 px-6 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all"
            >
              Yes, cancel my membership
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-3 px-6 text-slate-700 font-medium rounded-full border-2 border-slate-300 hover:bg-slate-50 transition-all"
            >
              No, keep my membership
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MembershipCancelPanel;
