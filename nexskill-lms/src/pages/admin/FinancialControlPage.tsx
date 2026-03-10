import React, { useState, useEffect } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import TransactionsTable from '../../components/admin/finance/TransactionsTable';
import PayoutManagementPanel from '../../components/admin/finance/PayoutManagementPanel';
import RefundManagementPanel from '../../components/admin/finance/RefundManagementPanel';
import CouponCreatorPanel from '../../components/admin/finance/CouponCreatorPanel';
import SubscriptionAnalyticsPanel from '../../components/admin/finance/SubscriptionAnalyticsPanel';
import { supabase } from '../../lib/supabaseClient';
import { PLATFORM_FEE_PERCENT, computeFees } from '../../config/platformFees';

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
  const [timeframe, setTimeframe] = useState('all_time');
  const [transactionType, setTransactionType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Payouts, refunds, coupons — local state (future Supabase tables)
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Subscription analytics placeholder
  const subscriptionAnalytics: SubscriptionAnalytics = {
    mrr: 0, arr: 0, activeSubscribers: 0, churnRate: 0,
    mrrTrend: [], plans: [],
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      const { data: txns, error } = await supabase
        .from('transactions')
        .select('id, created_at, amount, currency, status, type, payment_method, reference_id, user_id, buyer:profiles!transactions_user_id_fkey(first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
        return;
      }

      // Collect unique reference_ids for courses
      const courseIds = [...new Set((txns || []).filter((t: any) => t.type === 'course_purchase').map((t: any) => t.reference_id))];
      let courseMap = new Map<string, string>();
      if (courseIds.length > 0) {
        const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
        courseMap = new Map((courses || []).map((c: any) => [c.id, c.title]));
      }

      const mapped: Transaction[] = (txns || []).map((t: any) => {
        const buyer = t.buyer;
        const userName = buyer ? `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
        const userEmail = buyer?.email || '';
        const created = new Date(t.created_at);

        let itemType: Transaction['itemType'] = 'course';
        let itemName = courseMap.get(t.reference_id) || 'Course';
        if (t.type === 'coaching_session') {
          itemType = 'coaching';
          itemName = 'Coaching Session';
        } else if (t.type === 'membership') {
          itemType = 'subscription';
          itemName = 'Membership';
        }

        let status: Transaction['status'] = 'completed';
        if (t.status === 'succeeded') status = 'completed';
        else if (t.status === 'pending') status = 'pending';
        else if (t.status === 'refunded') status = 'refunded';
        else if (t.status === 'failed') status = 'failed';

        return {
          id: t.id,
          date: created.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          time: created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          userName,
          userEmail,
          itemType,
          itemName,
          amount: t.amount,
          currency: t.currency === 'PHP' ? '₱' : '$',
          status,
          paymentMethod: t.payment_method || 'Card',
        };
      });

      setTransactions(mapped);
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  // Filter by type
  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionType !== 'all') {
      if (transactionType === 'courses' && transaction.itemType !== 'course') return false;
      if (transactionType === 'coaching' && transaction.itemType !== 'coaching') return false;
      if (transactionType === 'subscriptions' && transaction.itemType !== 'subscription') return false;
      if (transactionType === 'refunds' && transaction.status !== 'refunded') return false;
    }
    return true;
  });

  // Summary metrics — computed from real data
  const completedTxns = transactions.filter((t) => t.status === 'completed');
  const totalVolume = completedTxns.reduce((sum, t) => sum + t.amount, 0);
  const refundedAmount = transactions.filter((t) => t.status === 'refunded').reduce((sum, t) => sum + t.amount, 0);
  const platformFeeRevenue = completedTxns.reduce((sum, t) => sum + computeFees(t.amount).platformFee, 0);
  const netRevenue = totalVolume - refundedAmount;
  const refundRate = totalVolume > 0 ? ((refundedAmount / totalVolume) * 100).toFixed(1) : '0.0';

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
          <h1 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">Financial Control</h1>
          <p className="text-sm text-[#5F6473] dark:text-gray-400">
            Monitor platform transactions, payouts, refunds, and subscription revenue
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#304DB5]" />
          </div>
        )}

        {/* Top Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm border border-[#E5E7EB] dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
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
              className="text-sm border border-[#E5E7EB] dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
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
            <div className="px-4 py-2 bg-gradient-to-br from-[#DBEAFE] to-white dark:from-blue-900/40 dark:to-gray-800 rounded-full border border-[#93C5FD] dark:border-blue-700">
              <p className="text-xs text-[#1E40AF] dark:text-blue-300 mb-0.5">Total Volume</p>
              <p className="text-sm font-bold text-[#111827] dark:text-white">
                ₱{totalVolume.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#F3E8FF] to-white dark:from-purple-900/40 dark:to-gray-800 rounded-full border border-[#C084FC] dark:border-purple-700">
              <p className="text-xs text-[#7C3AED] dark:text-purple-300 mb-0.5">Platform Fee ({PLATFORM_FEE_PERCENT}%)</p>
              <p className="text-sm font-bold text-[#111827] dark:text-white">
                ₱{platformFeeRevenue.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#D1FAE5] to-white dark:from-green-900/40 dark:to-gray-800 rounded-full border border-[#6EE7B7] dark:border-green-700">
              <p className="text-xs text-[#047857] dark:text-green-300 mb-0.5">Net Revenue</p>
              <p className="text-sm font-bold text-[#111827] dark:text-white">
                ₱{netRevenue.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#FEE2E2] to-white dark:from-red-900/40 dark:to-gray-800 rounded-full border border-[#FCA5A5] dark:border-red-700">
              <p className="text-xs text-[#991B1B] dark:text-red-300 mb-0.5">Refund Rate</p>
              <p className="text-sm font-bold text-[#111827] dark:text-white">{refundRate}%</p>
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
