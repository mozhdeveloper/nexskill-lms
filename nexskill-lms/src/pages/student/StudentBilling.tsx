import React, { useState, useEffect } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileBillingHistory from '../../components/profile/ProfileBillingHistory';
import ProfilePaymentMethods from '../../components/profile/ProfilePaymentMethods';
import { supabase } from '../../lib/supabaseClient';

interface BillingTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
}

const StudentBilling: React.FC = () => {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('transactions')
        .select('id, created_at, description, amount, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTransactions(
        (data || []).map((t: any) => ({
          id: t.id,
          date: new Date(t.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          description: t.description || 'Transaction',
          amount: t.amount,
          status: t.status === 'succeeded' ? 'Paid' : t.status === 'refunded' ? 'Refunded' : t.status === 'failed' ? 'Failed' : 'Pending',
        }))
      );
    };
    fetchTransactions();
  }, []);

  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Billing &amp; payments</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Review your invoices and manage payment methods
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Billing History (2/3 width) */}
          <div className="lg:col-span-2">
            <ProfileBillingHistory transactions={transactions} />
          </div>

          {/* Right column - Payment Methods (1/3 width) */}
          <div>
            <ProfilePaymentMethods methods={[]} onChange={() => {}} />
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentBilling;
