import React, { useState } from 'react';
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

  // Transactions dummy data
  const [transactions] = useState<Transaction[]>([
    {
      id: 'TXN-2025-001',
      date: '2025-01-15',
      time: '14:32',
      userName: 'Sarah Johnson',
      userEmail: 'sarah.johnson@example.com',
      itemType: 'course',
      itemName: 'Complete Python Programming Bootcamp',
      amount: 149.99,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-002',
      date: '2025-01-15',
      time: '13:15',
      userName: 'Michael Chen',
      userEmail: 'michael.chen@example.com',
      itemType: 'coaching',
      itemName: '1-on-1 Career Coaching Session',
      amount: 200.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'GCash',
    },
    {
      id: 'TXN-2025-003',
      date: '2025-01-15',
      time: '11:45',
      userName: 'Dr. Emily Rodriguez',
      userEmail: 'emily.rodriguez@example.com',
      itemType: 'subscription',
      itemName: 'Premium Monthly Plan',
      amount: 49.99,
      currency: '$',
      status: 'completed',
      paymentMethod: 'PayPal',
    },
    {
      id: 'TXN-2025-004',
      date: '2025-01-14',
      time: '16:20',
      userName: 'Alex Martinez',
      userEmail: 'alex.martinez@example.com',
      itemType: 'course',
      itemName: 'Data Science with R and Python',
      amount: 299.0,
      currency: '$',
      status: 'refunded',
      paymentMethod: 'Credit Card',
      refundId: 'REF-001',
    },
    {
      id: 'TXN-2025-005',
      date: '2025-01-14',
      time: '15:10',
      userName: 'Kevin Park',
      userEmail: 'kevin.park@example.com',
      itemType: 'course',
      itemName: 'Advanced JavaScript ES6+',
      amount: 89.99,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-006',
      date: '2025-01-14',
      time: '10:30',
      userName: 'Jessica Lee',
      userEmail: 'jessica.lee@example.com',
      itemType: 'subscription',
      itemName: 'Pro Annual Plan',
      amount: 499.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: 'TXN-2025-007',
      date: '2025-01-13',
      time: '14:55',
      userName: 'David Thompson',
      userEmail: 'david.thompson@example.com',
      itemType: 'coaching',
      itemName: 'Technical Interview Prep Session',
      amount: 150.0,
      currency: '$',
      status: 'pending',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-008',
      date: '2025-01-13',
      time: '12:40',
      userName: 'Dr. Rachel Kim',
      userEmail: 'rachel.kim@example.com',
      itemType: 'course',
      itemName: 'Machine Learning Fundamentals',
      amount: 199.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-009',
      date: '2025-01-13',
      time: '09:15',
      userName: 'Unknown User',
      userEmail: 'test@example.com',
      itemType: 'course',
      itemName: 'Web Development Course',
      amount: 49.99,
      currency: '$',
      status: 'failed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-010',
      date: '2025-01-12',
      time: '17:25',
      userName: 'Linda Brown',
      userEmail: 'linda.brown@example.com',
      itemType: 'subscription',
      itemName: 'Premium Monthly Plan',
      amount: 49.99,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-011',
      date: '2025-01-12',
      time: '15:50',
      userName: 'James Wilson',
      userEmail: 'james.wilson@example.com',
      itemType: 'course',
      itemName: 'UX/UI Design Masterclass',
      amount: 179.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'PayPal',
    },
    {
      id: 'TXN-2025-012',
      date: '2025-01-12',
      time: '11:20',
      userName: 'Maria Garcia',
      userEmail: 'maria.garcia@example.com',
      itemType: 'coaching',
      itemName: 'Portfolio Review Session',
      amount: 175.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'GCash',
    },
    {
      id: 'TXN-2025-013',
      date: '2025-01-11',
      time: '13:35',
      userName: 'Robert Taylor',
      userEmail: 'robert.taylor@example.com',
      itemType: 'course',
      itemName: 'Digital Marketing Strategy 2025',
      amount: 129.0,
      currency: '$',
      status: 'refunded',
      paymentMethod: 'Credit Card',
      refundId: 'REF-003',
    },
    {
      id: 'TXN-2025-014',
      date: '2025-01-11',
      time: '10:10',
      userName: 'Sophie Anderson',
      userEmail: 'sophie.anderson@example.com',
      itemType: 'subscription',
      itemName: 'Premium Monthly Plan',
      amount: 49.99,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'TXN-2025-015',
      date: '2025-01-10',
      time: '16:45',
      userName: 'Daniel White',
      userEmail: 'daniel.white@example.com',
      itemType: 'course',
      itemName: 'Cloud Computing with AWS',
      amount: 249.0,
      currency: '$',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
    },
  ]);

  // Payouts dummy data
  const [payouts, setPayouts] = useState<Payout[]>([
    {
      id: 'PAYOUT-W01',
      periodLabel: 'Jan 2025 – Week 1',
      totalAmount: 12500,
      status: 'scheduled',
      scheduledDate: '2025-01-20',
      destinationSummary: 'GCash •••• 1234',
    },
    {
      id: 'PAYOUT-W02',
      periodLabel: 'Dec 2024 – Week 4',
      totalAmount: 18750,
      status: 'processing',
      scheduledDate: '2025-01-13',
      destinationSummary: 'Bank •••• 5678',
    },
    {
      id: 'PAYOUT-W03',
      periodLabel: 'Dec 2024 – Week 3',
      totalAmount: 15200,
      status: 'paid',
      scheduledDate: '2025-01-06',
      paidDate: '2025-01-08',
      destinationSummary: 'PayPal •••• 9012',
    },
    {
      id: 'PAYOUT-W04',
      periodLabel: 'Dec 2024 – Week 2',
      totalAmount: 9800,
      status: 'on_hold',
      scheduledDate: '2024-12-30',
      destinationSummary: 'GCash •••• 3456',
    },
  ]);

  // Refunds dummy data
  const [refunds, setRefunds] = useState<Refund[]>([
    {
      id: 'REF-001',
      transactionId: 'TXN-2025-004',
      date: '2025-01-14',
      userName: 'Alex Martinez',
      amount: 299.0,
      reason: 'Changed mind - Not satisfied with course content',
      status: 'requested',
      method: 'original_payment',
    },
    {
      id: 'REF-002',
      transactionId: 'TXN-2025-007',
      date: '2025-01-13',
      userName: 'Lisa Anderson',
      amount: 149.99,
      reason: 'Technical issues - Unable to access course materials',
      status: 'approved',
      method: 'original_payment',
    },
    {
      id: 'REF-003',
      transactionId: 'TXN-2025-013',
      date: '2025-01-11',
      userName: 'Robert Taylor',
      amount: 129.0,
      reason: 'Duplicate purchase by mistake',
      status: 'processed',
      method: 'original_payment',
    },
    {
      id: 'REF-004',
      transactionId: 'TXN-2024-998',
      date: '2025-01-10',
      userName: 'Emily White',
      amount: 89.99,
      reason: 'Course quality not as advertised',
      status: 'requested',
      method: 'original_payment',
    },
    {
      id: 'REF-005',
      transactionId: 'TXN-2024-985',
      date: '2025-01-09',
      userName: 'James Brown',
      amount: 199.0,
      reason: 'Financial hardship',
      status: 'declined',
      method: 'original_payment',
    },
    {
      id: 'REF-006',
      transactionId: 'TXN-2024-972',
      date: '2025-01-08',
      userName: 'Maria Santos',
      amount: 49.99,
      reason: 'Course not compatible with my schedule',
      status: 'processed',
      method: 'original_payment',
    },
  ]);

  // Coupons dummy data
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      code: 'LAUNCH25',
      type: 'percentage',
      value: 25,
      appliesTo: 'all_courses',
      usageLimit: 500,
      usedCount: 342,
      status: 'active',
      endDate: '2025-02-28',
    },
    {
      code: 'EARLYBIRD',
      type: 'percentage',
      value: 50,
      appliesTo: 'all_courses',
      usageLimit: 100,
      usedCount: 98,
      status: 'active',
      endDate: '2025-01-31',
    },
    {
      code: 'FREEMONTH',
      type: 'fixed',
      value: 29,
      appliesTo: 'subscriptions',
      usageLimit: 200,
      usedCount: 156,
      status: 'active',
      endDate: '2025-03-15',
    },
    {
      code: 'NEWYEAR2025',
      type: 'percentage',
      value: 30,
      appliesTo: 'all_courses',
      usageLimit: 1000,
      usedCount: 1000,
      status: 'expired',
      endDate: '2025-01-10',
    },
    {
      code: 'COACHING20',
      type: 'percentage',
      value: 20,
      appliesTo: 'single_course',
      usageLimit: 50,
      usedCount: 12,
      status: 'scheduled',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    },
  ]);

  // Subscription analytics dummy data
  const subscriptionAnalytics: SubscriptionAnalytics = {
    mrr: 48000,
    arr: 576000,
    activeSubscribers: 520,
    churnRate: 3.2,
    mrrTrend: [
      { monthLabel: 'Jan', value: 32000 },
      { monthLabel: 'Feb', value: 35000 },
      { monthLabel: 'Mar', value: 37500 },
      { monthLabel: 'Apr', value: 39000 },
      { monthLabel: 'May', value: 41000 },
      { monthLabel: 'Jun', value: 42500 },
      { monthLabel: 'Jul', value: 43800 },
      { monthLabel: 'Aug', value: 45000 },
      { monthLabel: 'Sep', value: 46200 },
      { monthLabel: 'Oct', value: 46800 },
      { monthLabel: 'Nov', value: 47500 },
      { monthLabel: 'Dec', value: 48000 },
    ],
    plans: [
      { name: 'Basic Monthly', subscribers: 280, mrr: 13920, churnRate: 4.2 },
      { name: 'Premium Monthly', subscribers: 180, mrr: 17820, churnRate: 2.8 },
      { name: 'Pro Annual', subscribers: 60, mrr: 16260, churnRate: 1.5 },
    ],
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionType !== 'all') {
      if (transactionType === 'courses' && transaction.itemType !== 'course') return false;
      if (transactionType === 'coaching' && transaction.itemType !== 'coaching') return false;
      if (transactionType === 'subscriptions' && transaction.itemType !== 'subscription')
        return false;
      if (transactionType === 'refunds' && transaction.status !== 'refunded') return false;
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
  const refundRate = ((refundedAmount / totalVolume) * 100).toFixed(1);

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
                ${totalVolume.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#D1FAE5] to-white rounded-full border border-[#6EE7B7]">
              <p className="text-xs text-[#047857] mb-0.5">Net Revenue</p>
              <p className="text-sm font-bold text-[#111827]">
                ${netRevenue.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-br from-[#FEE2E2] to-white rounded-full border border-[#FCA5A5]">
              <p className="text-xs text-[#991B1B] mb-0.5">Refund Rate</p>
              <p className="text-sm font-bold text-[#111827]">{refundRate}%</p>
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
