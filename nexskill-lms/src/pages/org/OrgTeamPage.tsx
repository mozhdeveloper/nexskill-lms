import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';
import OrgTeamTable from '../../components/org/OrgTeamTable';

const OrgTeamPage: React.FC = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Sub-Coach',
    seats: 10,
  });

  const handleInvite = () => {
    console.log('Inviting member:', inviteForm);
    setShowInviteModal(false);
    // Reset form
    setInviteForm({ email: '', role: 'Sub-Coach', seats: 10 });
  };

  return (
    <OrgOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Team Members</h1>
            <p className="text-sm text-text-secondary">
              Manage your organization's team members and their roles
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
          >
            + Invite Member
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Total Members</span>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">5</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Active</span>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-green-600">4</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Pending Invites</span>
                <span className="text-2xl">📧</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">1</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Seats Managed</span>
                <span className="text-2xl">🎫</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">100</p>
            </div>
          </div>

          {/* Team Table */}
          <OrgTeamTable />
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="colleague@acme.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option value="Manager">Manager</option>
                  <option value="Sub-Coach">Sub-Coach</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              {/* Seats Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Assigned Seats
                </label>
                <input
                  type="number"
                  value={inviteForm.seats}
                  onChange={(e) => setInviteForm({ ...inviteForm, seats: parseInt(e.target.value) })}
                  min="0"
                  max="58"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <p className="text-xs text-text-muted mt-1">Available: 58 seats</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrgOwnerAppLayout>
  );
};

export default OrgTeamPage;
