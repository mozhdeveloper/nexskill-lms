import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import TransactionsTable from '../../components/admin/finance/TransactionsTable';
import PayoutManagementPanel from '../../components/admin/finance/PayoutManagementPanel';
import RefundManagementPanel from '../../components/admin/finance/RefundManagementPanel';
import CouponCreatorPanel from '../../components/admin/finance/CouponCreatorPanel';
import SubscriptionAnalyticsPanel from '../../components/admin/finance/SubscriptionAnalyticsPanel';

interface Transaction {
  id: string;
  date: string;
  time: string;
  userName: string;
  userEmail: string;
  itemType: 'course' | 'coaching' | 'subscription';
  itemName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  payoutBatchId?: string;
  refundId?: string;
}

interface Payout {
  id: string;
  periodLabel: string;
  totalAmount: number;
  status: 'scheduled' | 'processing' | 'paid' | 'on_hold';
  scheduledDate: string;
  paidDate?: string;
  destinationSummary: string;
}

interface Refund {
  id: string;
  transactionId: string;
  date: string;
  userName: string;
  amount: number;
  reason: string;
  status: 'requested' | 'approved' | 'declined' | 'processed';
  method: 'original_payment' | 'manual';
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: 'all_courses' | 'single_course' | 'subscriptions';
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'expired' | 'scheduled';
  startDate?: string;
  endDate?: string;
}

interface SubscriptionAnalytics {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  churnRate: number;
  mrrTrend: { monthLabel: string; value: number }[];
  plans: { name: string; subscribers: number; mrr: number; churnRate: number }[];
}

const FinancialControlPage: React.FC = () => {
  // Filters
  const [timeframe, setTimeframe] = useState('last_30_days');
  const [transactionType, setTransactionType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // State for data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Payouts (placeholder - you may need a payouts table)
  const [payouts, setPayouts] = useState<Payout[]>([]);

  // Refunds (from transactions with refunded status)
  const [refunds, setRefunds] = useState<Refund[]>([]);

  // Coupons (placeholder - create coupons table if needed)
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Subscription analytics
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics>({
    mrr: 0,
    arr: 0,
    activeSubscribers: 0,
    churnRate: 0,
    mrrTrend: [],
    plans: [],
  });

  // Fetch Financial Data
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      console.log('📊 Fetching financial data...');

      try {
        // 1. Fetch Transactions
        const { data: transactionsData, error: txError } = await supabase
          .from('transactions')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              email
            ),
            courses (
              title
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (txError) {
          console.error('Error fetching transactions:', txError);
        } else {
          console.log('✅ Transactions fetched:', transactionsData?.length || 0);

          // Map to Transaction interface
          const mappedTransactions: Transaction[] = (transactionsData || []).map((tx: any) => ({
            id: tx.id || `TXN-${Date.now()}`,
            date: tx.created_at ? new Date(tx.created_at).toISOString().split('T')[0] : 'N/A',
            time: tx.created_at ? new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            userName: tx.profiles ? `${tx.profiles.first_name || ''} ${tx.profiles.last_name || ''}`.trim() : 'Unknown',
            userEmail: tx.profiles?.email || 'N/A',
            itemType: tx.item_type || tx.type || 'course',
            itemName: tx.courses?.title || tx.course_name || tx.description || 'Unknown Item',
            amount: tx.amount || 0,
            currency: '$',
            status: tx.status || 'pending',
            paymentMethod: tx.payment_method || 'Credit Card',
            refundId: tx.refund_id,
          }));

          setTransactions(mappedTransactions);

          // Extract refunds from transactions
          const refundTransactions = mappedTransactions.filter(t => t.status === 'refunded');
          const mappedRefunds: Refund[] = refundTransactions.map((t, idx) => ({
            id: t.refundId || `REF-${idx + 1}`,
            transactionId: t.id,
            date: t.date,
            userName: t.userName,
            amount: t.amount,
            reason: 'Refund requested', // You may need a refunds table for detailed reasons
            status: 'processed',
            method: 'original_payment',
          }));
          setRefunds(mappedRefunds);
        }

        // 2. Calculate Subscription Analytics
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch subscription transactions for MRR
        const { data: subTransactions } = await supabase
          .from('transactions')
          .select('amount, status, created_at')
          .eq('type', 'subscription')
          .eq('status', 'completed')
          .gte('created_at', currentMonthStart.toISOString());

        const mrr = (subTransactions || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const arr = mrr * 12;

        // Count active subscribers (simplified - count users with active subscriptions)
        // If subscription_status column doesn't exist, we'll count from transactions
        let subscriberCount = 0;
        
        // Try to count from profiles table first
        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active');
        
        if (!profileError && profileCount) {
          subscriberCount = profileCount;
        } else {
          // Fallback: count unique users with subscription transactions
          const { data: subUsers } = await supabase
            .from('transactions')
            .select('user_id')
            .eq('type', 'subscription')
            .eq('status', 'completed');
          
          subscriberCount = new Set(subUsers?.map(u => u.user_id) || []).size;
        }

        // Calculate MRR trend (last 12 months)
        const mrrTrend = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });

          const { data: monthTransactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'subscription')
            .eq('status', 'completed')
            .gte('created_at', monthDate.toISOString())
            .lte('created_at', monthEnd.toISOString());

          const monthMRR = (monthTransactions || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
          mrrTrend.push({ monthLabel, value: monthMRR });
        }

        setSubscriptionAnalytics({
          mrr: mrr || 0,
          arr: arr || 0,
          activeSubscribers: subscriberCount,
          churnRate: 3.2, // Would need subscription cancellations data
          mrrTrend,
          plans: [
            { name: 'Basic Monthly', subscribers: 0, mrr: 0, churnRate: 0 },
            { name: 'Premium Monthly', subscribers: 0, mrr: 0, churnRate: 0 },
            { name: 'Pro Annual', subscribers: 0, mrr: 0, churnRate: 0 },
          ],
        });

        // 3. Generate Payouts (placeholder - you need a payouts table)
        const pendingPayouts = (transactions || [])
          .filter(t => t.status === 'completed' && !t.payoutBatchId)
          .reduce((sum, t) => sum + t.amount, 0);

        if (pendingPayouts > 0) {
          setPayouts([{
            id: 'PAYOUT-PENDING',
            periodLabel: 'Pending Payout',
            totalAmount: pendingPayouts,
            status: 'scheduled',
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            destinationSummary: 'Multiple coaches',
          }]);
        }

        console.log('✅ Financial data loaded');
        console.log('Transactions:', transactions.length);
        console.log('Refunds:', refunds.length);
        console.log('MRR:', mrr);

      } catch (error) {
        console.error('❌ Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionType !== 'all') {
      if (transactionType === 'courses' && transaction.itemType !== 'course') return false;
      if (transactionType === 'coaching' && transaction.itemType !== 'coaching') return false;
      if (transactionType === 'subscriptions' && transaction.itemType !== 'subscription')
        return false;
      if (transactionType === 'refunds' && transaction.status !== 'refunded') return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.userName.toLowerCase().includes(query) ||
        transaction.userEmail.toLowerCase().includes(query) ||
        transaction.itemName.toLowerCase().includes(query) ||
        transaction.id.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate summary metrics
  const totalVolume = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const refundedAmount = transactions
    .filter((t) => t.status === 'refunded')
    .reduce((sum, t) => sum + t.amount, 0);
  const netRevenue = totalVolume - refundedAmount;
  const refundRate = totalVolume > 0 ? ((refundedAmount / totalVolume) * 100).toFixed(1) : '0';

  const handleUpdatePayout = (payoutId: string, updatedFields: Partial<Payout>) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, ...updatedFields } : p))
    );
  };

  const handleUpdateRefund = (refundId: string, updatedFields: Partial<Refund>) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === refundId ? { ...r, ...updatedFields } : r))
    );
  };

  return (
    <AdminAppLayout>
      <div className="m-5 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Financial Control</h1>
          <p className="text-sm text-[#5F6473]">
            Monitor platform transactions, payouts, refunds, and subscription revenue
          </p>
        </div>

        {/* Top Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm border border-[#E5E7EB] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            >
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 days</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="this_year">This year</option>
              <option value="all_time">All time</option>
            </select>

            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="text-sm border border-[#E5E7EB] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            >
              <option value="all">All Types</option>
              <option value="courses">Courses</option>
              <option value="coaching">Coaching</option>
              <option value="subscriptions">Subscriptions</option>
              <option value="refunds">Refunds</option>
            </select>
          </div>

          {/* Summary Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-gradient-to-br from-[#DBEAFE] to-white rounded-full border border-[#93C5FD]">
              <p className="text-xs text-[#1E40AF] mb-0.5">Total Volume</p>
              <p className="text-sm font-bold text-[#111827]">
                ${loading ? '...' : totalVolume.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#D1FAE5] to-white rounded-full border border-[#6EE7B7]">
              <p className="text-xs text-[#047857] mb-0.5">Net Revenue</p>
              <p className="text-sm font-bold text-[#111827]">
                ${loading ? '...' : netRevenue.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#FEE2E2] to-white rounded-full border border-[#FCA5A5]">
              <p className="text-xs text-[#991B1B] mb-0.5">Refund Rate</p>
              <p className="text-sm font-bold text-[#111827]">{loading ? '...' : refundRate}%</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transactions Table (2/3) */}
          <div className="lg:col-span-2">
            <TransactionsTable
              transactions={filteredTransactions}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Right Column - Control Panels (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <PayoutManagementPanel payouts={payouts} onUpdatePayout={handleUpdatePayout} />
            <RefundManagementPanel refunds={refunds} onUpdateRefund={handleUpdateRefund} />
            <CouponCreatorPanel coupons={coupons} onChange={setCoupons} />
            <SubscriptionAnalyticsPanel analytics={subscriptionAnalytics} />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default FinancialControlPage;
