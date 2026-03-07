import React from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import ProfileBillingHistory from '../../components/profile/ProfileBillingHistory';
import ProfilePaymentMethods from '../../components/profile/ProfilePaymentMethods';

// No billing/payment table in DB yet — pass empty arrays so components render their own empty states

const StudentBilling: React.FC = () => {
  return (
    <StudentAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Billing & payments</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Review your invoices and manage payment methods
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Billing History (2/3 width) */}
          <div className="lg:col-span-2">
            <ProfileBillingHistory transactions={[]} />
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
