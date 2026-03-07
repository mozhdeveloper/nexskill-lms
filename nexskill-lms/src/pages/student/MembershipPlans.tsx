import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import MembershipPlanCard from '../../components/membership/MembershipPlanCard';
import MembershipFeatureCompare from '../../components/membership/MembershipFeatureCompare';

// Plan definitions — static config
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'month',
    description: 'Perfect for exploring NexSkill and trying out courses.',
    bestFor: 'Casual learners and those getting started',
    features: [
      'Access to all free courses',
      'Community discussions',
      'Limited AI Coach (10 queries/month)',
      'Basic progress tracking',
    ],
    isMostPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingCycle: 'month',
    description: 'Unlock premium courses and advanced learning tools.',
    bestFor: 'Dedicated learners building new skills',
    features: [
      'Everything in Free, plus:',
      'Full access to premium courses',
      'Unlimited AI Coach access',
      '2 coaching credits per month',
      'Course certificates',
      'Live classes access',
      'Download courses offline',
    ],
    isMostPopular: true,
    badgeLabel: 'Most Popular',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 79,
    billingCycle: 'month',
    description: 'Premium experience with career services and priority support.',
    bestFor: 'Serious professionals and career changers',
    features: [
      'Everything in Pro, plus:',
      '10 coaching credits per month',
      'Blockchain-verified certificates',
      'Priority support (24h response)',
      'Career services & job placement',
      'Resume reviews & interview prep',
      'Exclusive masterclasses',
    ],
    isMostPopular: false,
  },
];

const MembershipPlans: React.FC = () => {
  const navigate = useNavigate();
  // membership_tier column not yet in DB — default to 'free'
  const [currentTier] = useState<string>('free');

  useEffect(() => {
    // membership_tier column not yet in DB — stays on 'free' default
  }, []);

  const membershipPlans = PLANS.map(p => ({ ...p, isCurrent: p.id === currentTier }));
  const currentPlan = membershipPlans.find(p => p.isCurrent);

  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
    const selectedPlan = membershipPlans.find(p => p.id === planId);
    if (selectedPlan) {
      alert(`✅ ${selectedPlan.name} Plan Selected!\n\nPrice: $${selectedPlan.price}/${selectedPlan.billingCycle}\n\nProceeding to checkout...`);
      navigate('/student/membership/manage', { state: { targetPlanId: planId } });
    }
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Membership plans</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Choose the plan that matches your learning goals</p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan && (
          <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-[#5E7BFF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#304DB5] dark:text-blue-400 mb-1">Current Plan</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentPlan.name} · ${currentPlan.price}/{currentPlan.billingCycle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/membership/manage')}
                className="px-6 py-2.5 bg-white text-[#304DB5] font-semibold rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
              >
                Manage plan
              </button>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {membershipPlans.map((plan) => (
              <MembershipPlanCard key={plan.id} plan={plan} onSelectPlan={handleSelectPlan} />
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-8">
          <MembershipFeatureCompare />
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Not sure which plan to choose?</h2>
          <p className="text-lg mb-6 opacity-90">
            Our team can help you find the perfect plan for your learning goals.
          </p>
          <button
            onClick={() => alert('📞 Contact our team\n\nOur sales team will reach out within 24 hours to discuss your needs.\n\nEmail: sales@nexskill.com\nPhone: 1-800-NEXSKILL')}
            className="px-8 py-3 bg-white text-[#304DB5] font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Talk to our team
          </button>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default MembershipPlans;
