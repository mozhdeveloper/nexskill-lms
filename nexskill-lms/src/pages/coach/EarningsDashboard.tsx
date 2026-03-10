import React, { useState, useEffect } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import EarningsOverviewHeader from '../../components/coach/earnings/EarningsOverviewHeader';
import RevenueChart from '../../components/coach/earnings/RevenueChart';
import MonthlyPayoutTable from '../../components/coach/earnings/MonthlyPayoutTable';
import TransactionHistoryTable from '../../components/coach/earnings/TransactionHistoryTable';
import AffiliateEarningsPanel from '../../components/coach/earnings/AffiliateEarningsPanel';
import RefundRequestsPanel from '../../components/coach/earnings/RefundRequestsPanel';
import TaxFormsPanel from '../../components/coach/earnings/TaxFormsPanel';
import { supabase } from '../../lib/supabaseClient';
import { computeFees } from '../../config/platformFees';

interface RawTxn {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  type: 'Course purchase' | 'Coaching session' | 'Refund';
  studentName: string;
  course: string;
}

const EarningsDashboard: React.FC = () => {
  const [filterState, setFilterState] = useState({ timeframe: '30days', currency: 'PHP' });
  const [summary, setSummary] = useState({ currentMonth: 0, lastMonth: 0, allTime: 0, pendingPayouts: 0, deltaMonth: 0 });
  const [revenueData, setRevenueData] = useState<{ label: string; amount: number }[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({ coursesSold: 0, coachingSessions: 0, avgTransaction: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // 1. Coach's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('coach_id', user.id);
      const courseMap = new Map((courses || []).map((c: any) => [c.id, c.title]));
      const courseIds = (courses || []).map((c: any) => c.id);

      const allRaw: RawTxn[] = [];

      // 2. Course purchase transactions
      if (courseIds.length > 0) {
        const { data: courseTxns } = await supabase
          .from('transactions')
          .select('id, created_at, amount, status, reference_id, buyer:profiles!transactions_user_id_fkey(first_name, last_name)')
          .in('reference_id', courseIds)
          .eq('type', 'course_purchase');
        (courseTxns || []).forEach((t: any) => {
          allRaw.push({
            id: t.id,
            created_at: t.created_at,
            amount: t.amount,
            status: t.status,
            type: 'Course purchase',
            studentName: t.buyer ? `${t.buyer.first_name || ''} ${t.buyer.last_name || ''}`.trim() : 'Student',
            course: courseMap.get(t.reference_id) || 'Course',
          });
        });
      }

      // 3. Coaching bookings → session transactions
      const { data: bookings } = await supabase
        .from('coaching_bookings')
        .select('id, session_date, student:profiles!coaching_bookings_student_id_fkey(first_name, last_name)')
        .eq('coach_id', user.id);
      const bookingIds = (bookings || []).map((b: any) => b.id);
      const bookingMap = new Map((bookings || []).map((b: any) => [b.id, b]));

      if (bookingIds.length > 0) {
        const { data: sessionTxns } = await supabase
          .from('transactions')
          .select('id, created_at, amount, status, reference_id')
          .in('reference_id', bookingIds)
          .eq('type', 'coaching_session');
        (sessionTxns || []).forEach((t: any) => {
          const booking = bookingMap.get(t.reference_id);
          const student = booking?.student;
          allRaw.push({
            id: t.id,
            created_at: t.created_at,
            amount: t.amount,
            status: t.status,
            type: 'Coaching session',
            studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'Student',
            course: `Coaching · ${booking?.session_date || ''}`,
          });
        });
      }

      allRaw.sort((a, b) => b.created_at.localeCompare(a.created_at));

      // Summary
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLast = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLast = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const succeeded = allRaw.filter(t => t.status === 'succeeded');
      const currentMonth = succeeded.filter(t => t.created_at >= startOfMonth).reduce((s, t) => s + computeFees(t.amount).coachEarnings, 0);
      const lastMonth = succeeded.filter(t => t.created_at >= startOfLast && t.created_at <= endOfLast).reduce((s, t) => s + computeFees(t.amount).coachEarnings, 0);
      const allTime = succeeded.reduce((s, t) => s + computeFees(t.amount).coachEarnings, 0);
      setSummary({ currentMonth, lastMonth, allTime, pendingPayouts: 0, deltaMonth: currentMonth - lastMonth });

      // Revenue chart (last 6 months)
      const monthBuckets = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          start: d.toISOString(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        };
      });
      setRevenueData(monthBuckets.map(m => ({
        label: m.label,
        amount: succeeded.filter(t => t.created_at >= m.start && t.created_at <= m.end).reduce((s, t) => s + computeFees(t.amount).coachEarnings, 0),
      })));

      // Monthly payouts
      const payoutMap = new Map<string, number>();
      succeeded.forEach(t => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        payoutMap.set(key, (payoutMap.get(key) || 0) + t.amount);
      });
      setPayouts(
        Array.from(payoutMap.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 6)
          .map(([key, total]) => {
            const [yr, mo] = key.split('-');
            const d = new Date(parseInt(yr), parseInt(mo) - 1, 1);
            const { platformFee, coachEarnings } = computeFees(total);
            return {
              id: key,
              monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              gross: total, fees: platformFee, refunds: 0, net: coachEarnings,
              status: 'Sent' as const,
              payoutDate: new Date(parseInt(yr), parseInt(mo), 15).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            };
          })
      );

      // Transaction history table
      setTransactions(allRaw.map(t => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        studentName: t.studentName,
        course: t.course,
        type: t.type,
        amount: t.amount,
        status: t.status === 'succeeded' ? 'Completed' : t.status === 'refunded' ? 'Refunded' : t.status === 'failed' ? 'Failed' : 'Pending',
        transactionId: t.id.slice(0, 8).toUpperCase(),
      })));

      // Quick stats
      const nSucceeded = succeeded.length;
      const allTimeNet = succeeded.reduce((s, t) => s + computeFees(t.amount).coachEarnings, 0);
      setQuickStats({
        coursesSold: succeeded.filter(t => t.type === 'Course purchase').length,
        coachingSessions: succeeded.filter(t => t.type === 'Coaching session').length,
        avgTransaction: nSucceeded > 0 ? allTimeNet / nSucceeded : 0,
      });

      setLoading(false);
    };
    fetchEarnings();
  }, []);

  return (
    <CoachAppLayout>
      <div className="p-8 space-y-8">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#304DB5]" />
          </div>
        )}

        {/* Header with KPIs and Filters */}
        <EarningsOverviewHeader
          summary={summary}
          filterState={filterState}
          onFilterChange={setFilterState}
        />

        {/* Row 1: Revenue Chart + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={revenueData} timeframe={filterState.timeframe} currency={filterState.currency} />
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
              <h3 className="text-sm font-semibold text-[#5F6473] uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Courses Sold</p>
                  <p className="text-lg font-bold text-[#111827] dark:text-white">{quickStats.coursesSold}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Coaching Sessions</p>
                  <p className="text-lg font-bold text-[#111827] dark:text-white">{quickStats.coachingSessions}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#5F6473]">Avg. Transaction</p>
                  <p className="text-lg font-bold text-[#304DB5]">
                    {quickStats.avgTransaction > 0 ? `₱${quickStats.avgTransaction.toFixed(0)}` : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EDF0FB] dark:border-gray-700">
                  <p className="text-sm text-[#5F6473]">Success Rate</p>
                  <p className="text-lg font-bold text-[#22C55E]">{transactions.length > 0 ? '100%' : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Monthly Payouts + Affiliate Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyPayoutTable payouts={payouts} currency={filterState.currency} />
          </div>
          <div>
            <AffiliateEarningsPanel affiliates={[]} currency={filterState.currency} />
          </div>
        </div>

        {/* Row 3: Transaction History + Refunds + Tax Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionHistoryTable
              transactions={transactions}
              currency={filterState.currency}
            />
          </div>
          <div className="space-y-6">
            <RefundRequestsPanel refunds={[]} currency={filterState.currency} />
            <TaxFormsPanel />
          </div>
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default EarningsDashboard;
