import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import MembershipChangeFlow from '../../components/membership/MembershipChangeFlow';
import MembershipCancelPanel from '../../components/membership/MembershipCancelPanel';
import { supabase } from '../../lib/supabaseClient';
import { getPlan } from '../../config/membershipPlans';

const MembershipManage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get target plan from router state, or default to 'elite'
  const targetPlanId = (location.state as any)?.targetPlanId || 'elite';

  const [currentTier, setCurrentTier] = useState<string>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_memberships')
        .select('tier, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.tier) setCurrentTier(data.tier);
      if (data?.expires_at) setExpiresAt(data.expires_at);
    };
    fetchTier();
  }, []);

  const currentPlan = getPlan(currentTier);
  const targetPlan = getPlan(targetPlanId);

  const handleConfirmChange = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert user_memberships
    const expiresAt = targetPlan.price > 0
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const { data: membership, error: mErr } = await supabase
      .from('user_memberships')
      .upsert({ user_id: user.id, tier: targetPlan.id, started_at: new Date().toISOString(), expires_at: expiresAt }, { onConflict: 'user_id' })
      .select('id')
      .single();
    if (mErr) { alert('Failed to update membership. Please try again.'); console.error(mErr); return; }

    // Insert transaction
    const { data: txn, error: tErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'membership',
        amount: targetPlan.price,
        currency: 'PHP',
        status: 'succeeded',
        description: `Membership: ${targetPlan.name} plan`,
        reference_id: membership.id,
        payment_method: 'card',
      })
      .select('id')
      .single();
    if (tErr) { alert('Membership updated but billing record failed. Contact support.'); console.error(tErr); return; }

    navigate('/student/membership/confirmation', {
      state: {
        type: 'change',
        newPlanId: targetPlan.id,
        planName: targetPlan.name,
        price: targetPlan.price,
        billingCycle: targetPlan.billingCycle,
        transactionId: txn.id,
      },
    });
  };

  const handleBack = () => {
    navigate('/student/membership');
  };

  const handleCancelConfirmed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_memberships')
        .update({ tier: 'free', cancelled_at: new Date().toISOString(), expires_at: null })
        .eq('user_id', user.id);
    }
    navigate('/student/membership/confirmation', {
      state: { type: 'cancel', currentPlanName: currentPlan.name, expiresAt },
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
            <MembershipCancelPanel onCancelConfirmed={handleCancelConfirmed} expiresAt={expiresAt} />
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
