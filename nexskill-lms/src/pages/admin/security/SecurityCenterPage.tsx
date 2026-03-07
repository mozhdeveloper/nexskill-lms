import { useState } from 'react';
import AdminAppLayout from '../../../layouts/AdminAppLayout';
import TwoFactorSettingsCard from '../../../components/admin/security/TwoFactorSettingsCard';
import PasswordRulesCard from '../../../components/admin/security/PasswordRulesCard';
import SecurityActivitySummaryCard from '../../../components/admin/security/SecurityActivitySummaryCard';

interface TwoFactorState {
  enabled: boolean;
  method: 'auth_app' | 'sms' | 'email';
  lastChangedAt?: string;
}

interface PasswordRules {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  requireRotationDays?: number;
}

interface SecurityActivity {
  lastLoginLocation: string;
  lastLoginDevice: string;
  lastPasswordChangeAt?: string;
  failedLoginAttemptsLast7d: number;
  activeSessionsCount: number;
}

const SecurityCenterPage: React.FC = () => {
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    enabled: false,
    method: 'auth_app',
    lastChangedAt: undefined,
  });

  const [passwordRules, setPasswordRules] = useState<PasswordRules>({
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false,
    requireRotationDays: 0,
  });

  const securityActivity: SecurityActivity = {
    lastLoginLocation: 'Manila, Philippines',
    lastLoginDevice: 'Chrome on macOS',
    lastPasswordChangeAt: '2025-11-15',
    failedLoginAttemptsLast7d: 0,
    activeSessionsCount: 2,
  };

  return (
    <AdminAppLayout>
      <div className="m-5 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Security Center</h1>
          <p className="text-base text-[#5F6473]">
            Configure 2FA, password rules, and monitor security posture for NexSkill.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2FA & Password */}
          <div className="lg:col-span-2 space-y-6">
            <TwoFactorSettingsCard state={twoFactorState} onChange={setTwoFactorState} />
            <PasswordRulesCard rules={passwordRules} onChange={setPasswordRules} />
          </div>

          {/* Right Column - Activity */}
          <div className="lg:col-span-1">
            <SecurityActivitySummaryCard activity={securityActivity} />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default SecurityCenterPage;
