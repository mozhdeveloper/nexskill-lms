import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  description: string;
  bestFor: string;
  features: string[];
  isCurrent: boolean;
  isMostPopular: boolean;
  badgeLabel?: string;
}

interface MembershipPlanCardProps {
  plan: MembershipPlan;
  onSelectPlan: (planId: string) => void;
}

const MembershipPlanCard: React.FC<MembershipPlanCardProps> = ({ plan, onSelectPlan }) => {
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    if (plan.isCurrent) {
      navigate('/student/membership/manage');
    } else {
      onSelectPlan(plan.id);
      navigate('/student/membership/manage', { state: { targetPlanId: plan.id } });
    }
  };

  const getButtonLabel = () => {
    if (plan.isCurrent) return 'Manage plan';
    if (plan.price === 0) return 'Switch to Free';
    return 'Upgrade to this plan';
  };

  return (
    <div
      className={`relative bg-white rounded-3xl shadow-md p-6 flex flex-col transition-all hover:shadow-xl ${
        plan.isMostPopular ? 'border-2 border-[#5E7BFF]' : 'border border-slate-200'
      }`}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
        {plan.isMostPopular && (
          <span className="px-4 py-1.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-xs font-bold rounded-full shadow-md">
            Most Popular
          </span>
        )}
        {plan.isCurrent && (
          <span className="px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">
            Current Plan
          </span>
        )}
      </div>

      {/* Plan Name */}
      <div className="mt-4 mb-2">
        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[#304DB5]">
            ₱{plan.price.toLocaleString()}
          </span>
          <span className="text-lg text-slate-600">/ {plan.billingCycle}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{plan.description}</p>

      {/* Best For */}
      <div className="mb-6 p-3 bg-blue-50 rounded-xl">
        <p className="text-xs font-semibold text-[#304DB5] mb-1">Best for:</p>
        <p className="text-sm text-slate-700">{plan.bestFor}</p>
      </div>

      {/* Features */}
      <div className="flex-1 mb-6">
        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">What's included:</p>
        <ul className="space-y-2.5">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
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
              <span className="text-sm text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSelectPlan}
        className={`w-full py-3 px-6 font-semibold rounded-full transition-all ${
          plan.isCurrent
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : plan.isMostPopular
            ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
            : 'bg-[#304DB5] text-white hover:bg-[#5E7BFF]'
        }`}
      >
        {getButtonLabel()}
      </button>
    </div>
  );
};

export default MembershipPlanCard;
