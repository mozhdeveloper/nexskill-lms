import React, { useState } from 'react';

interface AccountSettings {
  email: string;
  timezone: string;
  lastPasswordUpdate: string;
}

interface ProfileAccountSettingsFormProps {
  account: AccountSettings;
  onChange: (updated: AccountSettings) => void;
}

const timezones = [
  'Pacific Time (PST)',
  'Mountain Time (MST)',
  'Central Time (CST)',
  'Eastern Time (EST)',
  'UTC',
  'GMT',
  'CET',
  'JST',
  'Philippine Time (PHT)',
];

const ProfileAccountSettingsForm: React.FC<ProfileAccountSettingsFormProps> = ({
  account,
  onChange,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Account settings</h2>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={account.email}
            disabled
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 cursor-not-allowed"
          />
          <button
            onClick={() => alert('Change email feature coming soon!')}
            className="px-4 py-3 text-sm font-medium text-[#304DB5] border-2 border-[#304DB5] rounded-full hover:bg-blue-50 transition-all"
          >
            Change email
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Your email is used for login and notifications</p>
      </div>

      {/* Timezone */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Time zone</label>
        <select
          value={account.timezone}
          onChange={(e) => onChange({ ...account, timezone: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">Used for scheduling and deadlines</p>
      </div>

      {/* Password */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Password</div>
            <div className="text-xs text-slate-600 mt-1">
              Last updated: {account.lastPasswordUpdate}
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 text-sm font-medium text-[#304DB5] border-2 border-[#304DB5] rounded-full hover:bg-blue-50 transition-all"
          >
            Change password
          </button>
        </div>
      </div>

      {/* Simple password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Change password</h3>
            <p className="text-sm text-slate-600 mb-4">
              Password change functionality coming soon. For now, use the"Forgot password" link on the
              login page.
            </p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAccountSettingsForm;
