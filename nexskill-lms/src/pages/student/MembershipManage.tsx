import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import MembershipChangeFlow from '../../components/membership/MembershipChangeFlow';
import MembershipCancelPanel from '../../components/membership/MembershipCancelPanel';

// Tier pricing config (same as in MembershipPlans)
const allPlans = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'month',
    features: [
      'Access to all free courses',
      'Community discussions',
      'Limited AI Coach',
      'Basic progress tracking',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingCycle: 'month',
    features: [
      'Full access to premium courses',
      'Unlimited AI Coach access',
      '2 coaching credits per month',
      'Course certificates',
      'Live classes access',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 79,
    billingCycle: 'month',
    features: [
      '10 coaching credits per month',
      'Blockchain-verified certificates',
      'Priority support',
      'Career services & job placement',
      'Exclusive masterclasses',
    ],
  },
};

const MembershipManage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get target plan from router state, or default to 'elite'
  const targetPlanId = (location.state as any)?.targetPlanId || 'elite';

  const [currentTier] = useState<string>('free');
  useEffect(() => {
    // membership_tier column not yet in DB — default to 'free'
    // When the column is added, uncomment the Supabase query below
    // supabase.auth.getUser().then(async ({ data }) => {
    //   if (!data?.user) return;
    //   const { data: sp } = await supabase
    //     .from('student_profiles').select('membership_tier')
    //     .eq('user_id', data.user.id).maybeSingle();
    //   if (sp?.membership_tier) setCurrentTier(sp.membership_tier);
    // });
  }, []);

  const currentPlan = allPlans[currentTier as keyof typeof allPlans] || allPlans.free;
  const targetPlan = allPlans[targetPlanId as keyof typeof allPlans] || allPlans.elite;

  const handleConfirmChange = () => {
    // Membership features not yet available — no membership tables in DB
    navigate('/student/membership/confirmation', {
      state: {
        type: 'change',
        newPlanId: targetPlan.id,
        planName: targetPlan.name,
        price: targetPlan.price,
        billingCycle: targetPlan.billingCycle,
      },
    });
  };

  const handleBack = () => {
    navigate('/student/membership');
  };

  const handleCancelConfirmed = () => {
    // Membership features not yet available — no membership tables in DB
    navigate('/student/membership/confirmation', {
      state: {
        type: 'cancel',
        currentPlanName: currentPlan.name,
      },
    });
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to plans
          </button>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Manage membership</h1>
          <p className="text-lg text-slate-600">Change your plan or cancel your subscription</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🚀</span>
          <div>
            <p className="font-semibold text-amber-800">Membership Management — Coming Soon</p>
            <p className="text-sm text-amber-700">Plan upgrades and billing are not yet available. All features are currently free.</p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Plan Change Flow */}
          <div>
            <MembershipChangeFlow
              currentPlan={currentPlan}
              targetPlan={targetPlan}
              onConfirmChange={handleConfirmChange}
              onBack={handleBack}
            />
          </div>

          {/* Right Column - Cancel Panel */}
          <div>
            <MembershipCancelPanel onCancelConfirmed={handleCancelConfirmed} />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#304DB5] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Need help deciding?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Our support team is here to answer your questions about plans, billing, and features.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/student/support')}
                  className="px-5 py-2 bg-white text-[#304DB5] font-medium rounded-full border-2 border-[#304DB5] hover:bg-blue-50 transition-all text-sm"
                >
                  Contact support
                </button>
                <button
                  onClick={() => navigate('/student/support')}
                  className="px-5 py-2 text-slate-700 font-medium rounded-full border border-slate-300 hover:bg-white transition-all text-sm"
                >
                  View FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default MembershipManage;
