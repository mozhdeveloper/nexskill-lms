import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import MembershipPaymentSummary from '../../components/membership/MembershipPaymentSummary';

const MembershipConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get state from navigation
  const state = (location.state as any) || {};
  const { type, planName, price, billingCycle, currentPlanName } = state;

  const isChange = type === 'change';
  const isCancel = type === 'cancel';

  // Dummy payment summary for plan changes
  const paymentSummary = isChange
    ? {
        planName: planName || 'Pro',
        price: price || 29,
        billingCycle: billingCycle || 'month',
        paymentMethod: 'Visa •••• 4242',
        transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'succeeded' as const,
      }
    : null;

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Hero Confirmation Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8 md:p-12 mb-8">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  isChange
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}
              >
                {isChange ? (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              {/* Title & Subtitle */}
              {isChange && (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Your membership has been updated!
                  </h1>
                  <p className="text-lg text-slate-600">
                    You're now on the <span className="font-semibold text-[#304DB5]">{planName}</span>{' '}
                    plan
                  </p>
                </>
              )}

              {isCancel && (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Your membership has been cancelled
                  </h1>
                  <p className="text-lg text-slate-600">
                    You'll retain access to {currentPlanName} features until{' '}
                    <span className="font-semibold">January 4, 2026</span>
                  </p>
                </>
              )}
            </div>

            {/* What's Changed - Change Flow */}
            {isChange && (
              <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">What's changed:</h2>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      Your new plan is active immediately with full access
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      Your next billing date remains unchanged
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      All your progress and certificates are preserved
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* What Happens Next - Cancel Flow */}
            {isCancel && (
              <div className="mb-8 p-6 bg-orange-50 rounded-2xl border border-orange-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">What happens next:</h2>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      You'll have access until the end of your current billing period
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">No further charges will be made</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-slate-700">
                      You can resubscribe anytime to regain access
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Back to dashboard
              </button>
              <button
                onClick={() => navigate('/student/membership')}
                className="flex-1 py-3 px-6 text-[#304DB5] font-medium rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
              >
                View membership
              </button>
            </div>
          </div>

          {/* Payment Summary - Only for plan changes */}
          {isChange && paymentSummary && (
            <div className="mb-8">
              <MembershipPaymentSummary summary={paymentSummary} />
            </div>
          )}

          {/* Help Section */}
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200">
            <p className="text-sm text-slate-600 mb-3">
              Questions about your membership or billing?
            </p>
            <button
              onClick={() => console.log('Contact support')}
              className="text-sm font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
            >
              Contact our support team →
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default MembershipConfirmation;
