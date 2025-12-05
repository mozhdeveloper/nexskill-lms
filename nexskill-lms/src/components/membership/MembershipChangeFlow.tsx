import React from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
}

interface MembershipChangeFlowProps {
  currentPlan: Plan;
  targetPlan: Plan;
  onConfirmChange: () => void;
  onBack: () => void;
}

const MembershipChangeFlow: React.FC<MembershipChangeFlowProps> = ({
  currentPlan,
  targetPlan,
  onConfirmChange,
  onBack,
}) => {
  const priceDelta = targetPlan.price - currentPlan.price;
  const isUpgrade = priceDelta > 0;
  const isDowngrade = priceDelta < 0;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'} your plan
      </h2>

      {/* Plan Comparison */}
      <div className="space-y-4 mb-6">
        {/* Current Plan */}
        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">Current</span>
            <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">{currentPlan.name}</h3>
          <p className="text-2xl font-bold text-slate-700">
            ${currentPlan.price}
            <span className="text-sm font-normal text-slate-600"> / {currentPlan.billingCycle}</span>
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <svg className="w-8 h-8 text-[#5E7BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* New Plan */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-[#5E7BFF]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#304DB5] uppercase">New</span>
            <span className="px-3 py-1 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-xs font-bold rounded-full">
              {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Switch'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">{targetPlan.name}</h3>
          <p className="text-2xl font-bold text-[#304DB5]">
            ${targetPlan.price}
            <span className="text-sm font-normal text-slate-600"> / {targetPlan.billingCycle}</span>
          </p>
        </div>
      </div>

      {/* Price Delta */}
      {priceDelta !== 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Monthly price change:</span>
            <span
              className={`text-lg font-bold ${
                isUpgrade ? 'text-orange-600' : 'text-green-600'
              }`}
            >
              {isUpgrade ? '+' : ''}${priceDelta.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {isUpgrade
              ? 'You will be charged the prorated amount immediately.'
              : 'Your credit will be applied to future billing periods.'}
          </p>
        </div>
      )}

      {/* New Features Highlight */}
      {targetPlan.features && targetPlan.features.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {isUpgrade ?"What you'll gain:" : "What you'll keep:"}
          </h3>
          <ul className="space-y-2">
            {targetPlan.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Effective Date */}
      <div className="mb-6 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-[#304DB5] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-slate-900">Effective immediately</p>
            <p className="text-xs text-slate-600">
              Your new plan will be active as soon as you confirm this change.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConfirmChange}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
        >
          Confirm plan change
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 px-6 text-slate-700 font-medium rounded-full border-2 border-slate-300 hover:bg-slate-50 transition-all"
        >
          Back to plans
        </button>
      </div>
    </div>
  );
};

export default MembershipChangeFlow;
