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
import { useUser } from '../../context/UserContext';
import { Loader2 } from 'lucide-react';

interface EarningsSummary {
  currentMonth: number;
  lastMonth: number;
  allTime: number;
  pendingPayouts: number;
  deltaMonth: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'sale' | 'refund' | 'payout';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  courseTitle?: string;
  studentName?: string;
}

interface Payout {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'processing';
  method: string;
  reference?: string;
}

const EarningsDashboard: React.FC = () => {
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterState, setFilterState] = useState({
    timeframe: '30days',
    currency: 'PHP',
  });

  // Earnings data
  const [summary, setSummary] = useState<EarningsSummary>({
    currentMonth: 0,
    lastMonth: 0,
    allTime: 0,
    pendingPayouts: 0,
    deltaMonth: 0,
  });

  const [revenueData, setRevenueData] = useState<{ label: string; amount: number }[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coursesSold, setCoursesSold] = useState(0);
  const [avgTransaction, setAvgTransaction] = useState(0);

  // Fetch earnings data from database
  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!profile) {
        console.log('❌ No profile found');
        return;
      }

      console.log('🔄 Fetching earnings data for coach:', profile.id);

      try {
        setLoading(true);

        // 1. Fetch transactions from database
        console.log('📊 Step 1: Fetching transactions from database...');
        const { data: transactionsData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('coach_id', profile.id)
          .order('created_at', { ascending: false });

        if (txError) {
          console.error('❌ Error fetching transactions:', txError);
        } else {
          console.log('✅ Transactions fetched:', transactionsData?.length || 0, 'transactions');
          if (transactionsData && transactionsData.length > 0) {
            console.log('📝 Sample transaction:', transactionsData[0]);
          }
        }

        // 2. If no transactions exist, create them from enrollments
        if (!transactionsData || transactionsData.length === 0) {
          console.log('⚠️ No transactions found, creating from enrollments...');
          
          // Fetch all courses for this coach
          console.log('📚 Fetching courses for coach...');
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('id, title, price')
            .eq('coach_id', profile.id);

          if (coursesError) {
            console.error('❌ Error fetching courses:', coursesError);
          } else {
            console.log('✅ Courses fetched:', coursesData?.length || 0, 'courses');
          }

          if (!coursesData || coursesData.length === 0) {
            console.log('⚠️ No courses found for this coach');
            setLoading(false);
            return;
          }

          const courseIds = coursesData.map(c => c.id);
          const coursePriceMap = coursesData.reduce((acc, c) => {
            acc[c.id] = c.price || 0;
            return acc;
          }, {} as Record<string, number>);

          console.log('💰 Course price map:', coursePriceMap);

          // Fetch all enrollments for these courses
          console.log('👥 Fetching enrollments...');
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              *,
              profile:profiles!enrollments_profile_id_fkey(first_name, last_name, email)
            `)
            .in('course_id', courseIds)
            .order('enrolled_at', { ascending: false });

          if (enrollmentsError) {
            console.error('❌ Error fetching enrollments:', enrollmentsError);
          } else {
            console.log('✅ Enrollments fetched:', enrollmentsData?.length || 0, 'enrollments');
            if (enrollmentsData && enrollmentsData.length > 0) {
              console.log('📝 Sample enrollment:', enrollmentsData[0]);
            }
          }

          // Create transactions from enrollments
          if (enrollmentsData && enrollmentsData.length > 0) {
            console.log('➕ Creating transactions from enrollments...');
            const newTransactions = enrollmentsData.map((enrollment: any) => ({
              coach_id: profile.id,
              course_id: enrollment.course_id,
              enrollment_id: enrollment.id,
              type: 'sale' as const,
              amount: coursePriceMap[enrollment.course_id] || 0,
              currency: 'PHP',
              status: 'completed' as const,
              description: 'Course Enrollment',
              student_id: enrollment.profile_id,
              student_name: enrollment.profile ? 
                `${enrollment.profile.first_name || ''} ${enrollment.profile.last_name || ''}`.trim() 
                : 'Student',
              student_email: enrollment.profile?.email,
              course_title: coursesData.find(c => c.id === enrollment.course_id)?.title,
              platform_fee: (coursePriceMap[enrollment.course_id] || 0) * 0.05, // 5% fee
              created_at: enrollment.enrolled_at,
            }));

            console.log('📝 Transactions to insert:', newTransactions);

            // Insert transactions
            const { error: insertError } = await supabase
              .from('transactions')
              .insert(newTransactions);

            if (insertError) {
              console.error('❌ Error creating transactions:', insertError);
            } else {
              console.log('✅ Transactions created successfully!');
            }

            // Fetch the newly created transactions
            console.log('🔄 Fetching newly created transactions...');
            const { data: newTxDataResult, error: newTxError } = await supabase
              .from('transactions')
              .select('*')
              .eq('coach_id', profile.id)
              .order('created_at', { ascending: false });

            if (newTxError) {
              console.error('❌ Error fetching new transactions:', newTxError);
            } else {
              console.log('✅ New transactions fetched:', newTxDataResult?.length || 0);
            }

            // Use let instead of const for reassignment
            let finalTransactionsData = newTxDataResult || [];
            transactionsData = finalTransactionsData;
          } else {
            console.log('⚠️ No enrollments found');
          }
        }

        console.log('💰 Final transactions data:', transactionsData);

        // 3. Calculate earnings from transactions
        let currentMonthEarnings = 0;
        let lastMonthEarnings = 0;
        let allTimeEarnings = 0;
        const monthlyRevenue: Record<string, number> = {};
        const transactionList: Transaction[] = [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        console.log('📅 Current month:', currentMonth, 'Current year:', currentYear);
        console.log('📅 Last month:', lastMonth, 'Last year:', lastMonthYear);

        transactionsData?.forEach((tx: any) => {
          const txDate = new Date(tx.created_at);
          const amount = tx.type === 'refund' ? -tx.amount : tx.amount;
          const netAmount = tx.net_amount || (tx.amount - (tx.platform_fee || 0));
          
          console.log('💵 Processing transaction:', {
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            netAmount: netAmount,
            date: txDate,
          });
          
          // Add to all-time earnings (only sales)
          if (tx.type === 'sale') {
            allTimeEarnings += netAmount;
          }

          // Add to monthly revenue
          const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          if (tx.type === 'sale') {
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + netAmount;
          }

          // Current month
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            if (tx.type === 'sale') {
              currentMonthEarnings += netAmount;
            }
          }

          // Last month
          if (txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear) {
            if (tx.type === 'sale') {
              lastMonthEarnings += netAmount;
            }
          }

          // Add to transaction list
          const dateStr = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          transactionList.push({
            id: tx.id,
            date: dateStr,
            time: timeStr,
            studentName: tx.student_name || 'Student',
            course: tx.course_title || 'Course',
            type: tx.type === 'sale' ? 'Course purchase' : tx.type === 'refund' ? 'Refund' : 'Course purchase',
            amount: tx.type === 'refund' ? -tx.amount : (tx.net_amount || tx.amount),
            status: tx.status === 'completed' ? 'Completed' : tx.status === 'pending' ? 'Pending' : 'Refunded',
            transactionId: tx.id.substring(0, 8).toUpperCase(),
          });
        });

        console.log('💰 Earnings calculated:', {
          currentMonth: currentMonthEarnings,
          lastMonth: lastMonthEarnings,
          allTime: allTimeEarnings,
          monthlyRevenue,
        });

        // 4. Calculate delta
        const deltaMonth = lastMonthEarnings > 0 
          ? Math.round(((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
          : currentMonthEarnings > 0 ? 100 : 0;

        // 5. Build revenue chart data (last 12 months)
        const revenueChartData: { label: string; amount: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          revenueChartData.push({
            label: monthLabel,
            amount: monthlyRevenue[monthKey] || 0,
          });
        }

        // 6. Calculate average transaction
        const salesTransactions = transactionsData?.filter(tx => tx.type === 'sale') || [];
        const avgTxn = salesTransactions.length > 0
          ? allTimeEarnings / salesTransactions.length
          : 0;

        // 7. Calculate pending payouts
        const pendingPayouts = currentMonthEarnings * 0.1; // 10% held for payouts
        
        // 8. Format last month's payout
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonthLabel = lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // 9. Fetch existing payouts or create sample
        console.log('💸 Fetching payouts...');
        const { data: payoutTransactions, error: payoutError } = await supabase
          .from('transactions')
          .select('*')
          .eq('coach_id', profile.id)
          .eq('type', 'payout')
          .order('created_at', { ascending: false })
          .limit(5);

        if (payoutError) {
          console.error('❌ Error fetching payouts:', payoutError);
        } else {
          console.log('✅ Payouts fetched:', payoutTransactions?.length || 0);
        }

        const payoutsList = payoutTransactions?.map(tx => ({
          id: tx.id,
          monthLabel: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          gross: tx.amount,
          fees: tx.platform_fee || 0,
          refunds: 0,
          net: tx.net_amount || tx.amount,
          status: tx.status === 'completed' ? 'Sent' : 'Pending',
          payoutDate: tx.status === 'completed' ? new Date(tx.processed_at || tx.created_at).toLocaleDateString() : '—',
        })) || [];

        // Add sample payout if none exist
        if (payoutsList.length === 0 && lastMonthEarnings > 0) {
          console.log('➕ Creating sample payout');
          payoutsList.push({
            id: '1',
            monthLabel: lastMonthLabel,
            gross: lastMonthEarnings,
            fees: lastMonthEarnings * 0.05,
            refunds: 0,
            net: lastMonthEarnings * 0.95,
            status: 'Pending',
            payoutDate: '—',
          });
        }

        console.log('💸 Final payouts list:', payoutsList);
        console.log('📊 Final transactions list:', transactionList.slice(0, 5));

        // Update state
        setSummary({
          currentMonth: currentMonthEarnings,
          lastMonth: lastMonthEarnings,
          allTime: allTimeEarnings,
          pendingPayouts,
          deltaMonth: deltaMonth,
        });

        setRevenueData(revenueChartData);
        setTransactions(transactionList.slice(0, 20)); // Last 20 transactions
        setCoursesSold(salesTransactions.length);
        setAvgTransaction(avgTxn);
        setPayouts(payoutsList);

        console.log('✅ State updated:', {
          summary: {
            currentMonth: currentMonthEarnings,
            lastMonth: lastMonthEarnings,
            allTime: allTimeEarnings,
          },
          coursesSold: salesTransactions.length,
          transactionsCount: transactionList.length,
          payoutsCount: payoutsList.length,
        });

      } catch (error) {
        console.error('❌ Error fetching earnings data:', error);
      } finally {
        setLoading(false);
        console.log('✅ Loading complete');
      }
    };

    fetchEarningsData();
  }, [profile]);

  return (
    <CoachAppLayout>
      <div className="p-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#304DB5]" />
          </div>
        ) : (
          <>
            {/* Header with KPIs and Filters */}
            <EarningsOverviewHeader
              summary={summary}
              filterState={filterState}
              onFilterChange={setFilterState}
            />

            {/* Row 1: Revenue Chart + Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart
                  data={revenueData}
                  timeframe={filterState.timeframe}
                  currency={filterState.currency}
                />
              </div>
              <div className="space-y-6">
                {/* Quick Stats Card */}
                <div className="bg-white dark:bg-dark-background-card rounded-2xl border border-[#EDF0FB] dark:border-gray-700 p-6 shadow-md">
                  <h3 className="text-sm font-semibold text-[#5F6473] uppercase tracking-wider mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#5F6473]">Courses Sold</p>
                      <p className="text-lg font-bold text-[#111827]">{coursesSold}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#5F6473]">Avg. Transaction</p>
                      <p className="text-lg font-bold text-[#304DB5]">
                        ₱{avgTransaction.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#EDF0FB] dark:border-gray-700">
                      <p className="text-sm text-[#5F6473]">Success Rate</p>
                      <p className="text-lg font-bold text-[#22C55E]">100%</p>
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
          </>
        )}
      </div>
    </CoachAppLayout>
  );
};

export default EarningsDashboard;
