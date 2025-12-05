import React, { useState } from 'react';
import OrgOwnerAppLayout from '../../layouts/OrgOwnerAppLayout';
import OrgSeatsSummaryCard from '../../components/org/OrgSeatsSummaryCard';

interface SeatAllocation {
  id: number;
  memberName: string;
  role: string;
  seatsAssigned: number;
  seatsUsed: number;
  avatar: string;
}

const OrgSeatsPage: React.FC = () => {
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<SeatAllocation | null>(null);

  const [allocations] = useState<SeatAllocation[]>([
    { id: 1, memberName: 'Sarah Johnson', role: 'Manager', seatsAssigned: 25, seatsUsed: 23, avatar: 'SJ' },
    { id: 2, memberName: 'Michael Chen', role: 'Sub-Coach', seatsAssigned: 35, seatsUsed: 35, avatar: 'MC' },
    { id: 3, memberName: 'Emily Rodriguez', role: 'Sub-Coach', seatsAssigned: 28, seatsUsed: 24, avatar: 'ER' },
    { id: 4, memberName: 'David Kim', role: 'Support', seatsAssigned: 12, seatsUsed: 7, avatar: 'DK' },
    { id: 5, memberName: 'Unassigned Pool', role: '-', seatsAssigned: 58, seatsUsed: 0, avatar: '🎫' },
  ]);

  const handleReassign = (allocation: SeatAllocation) => {
    setSelectedAllocation(allocation);
    setShowReassignModal(true);
  };

  const handleRemoveSeat = (allocation: SeatAllocation) => {
    console.log('Remove seat from:', allocation);
  };

  const confirmReassign = () => {
    console.log('Reassign seats for:', selectedAllocation);
    setShowReassignModal(false);
    setSelectedAllocation(null);
  };

  const handlePurchaseSeats = () => {
    console.log('Opening purchase modal...');
    alert('Purchase seats modal would open here');
  };

  return (
    <OrgOwnerAppLayout>
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Seats & Licenses</h1>
            <p className="text-sm text-text-secondary">
              Manage license allocation across your organization
            </p>
          </div>
          <button 
            onClick={handlePurchaseSeats}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold"
          >
            🛒 Purchase More Seats
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6">
          {/* Summary Card */}
          <OrgSeatsSummaryCard />

          {/* Allocation Table */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-bold text-text-primary">Seat Allocation by Team Member</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Used
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Utilization
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allocations.map((allocation) => {
                    const available = allocation.seatsAssigned - allocation.seatsUsed;
                    const utilization = allocation.seatsAssigned > 0 
                      ? (allocation.seatsUsed / allocation.seatsAssigned) * 100 
                      : 0;
                    const isUnassigned = allocation.memberName === 'Unassigned Pool';

                    return (
                      <tr key={allocation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {isUnassigned ? (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                                {allocation.avatar}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-semibold text-sm">
                                {allocation.avatar}
                              </div>
                            )}
                            <span className={`text-sm font-medium ${isUnassigned ? 'text-text-muted italic' : 'text-text-primary'}`}>
                              {allocation.memberName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-text-secondary">{allocation.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-text-primary">{allocation.seatsAssigned}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-green-600">{allocation.seatsUsed}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-orange-600">{available}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[100px]">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    utilization >= 90 ? 'bg-red-500' : 
                                    utilization >= 70 ? 'bg-orange-500' : 
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${utilization}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-text-muted">
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {!isUnassigned && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReassign(allocation)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                Reassign
                              </button>
                              <button
                                onClick={() => handleRemoveSeat(allocation)}
                                className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                💡
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary mb-2">Seat Management Tips</h3>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Reassign unused seats to maximize your license utilization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Team members at 90%+ utilization may need additional seats</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Purchase more seats when your unassigned pool runs low</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Reassign Seats</h2>
              <button
                onClick={() => setShowReassignModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-text-muted mb-1">Current Allocation</p>
                <p className="text-lg font-bold text-text-primary">{selectedAllocation.memberName}</p>
                <p className="text-sm text-text-secondary">
                  {selectedAllocation.seatsAssigned} seats assigned ({selectedAllocation.seatsUsed} used)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  New Seat Count
                </label>
                <input
                  type="number"
                  defaultValue={selectedAllocation.seatsAssigned}
                  min={selectedAllocation.seatsUsed}
                  max="200"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
                <p className="text-xs text-text-muted mt-1">
                  Minimum: {selectedAllocation.seatsUsed} (currently used)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-text-primary rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReassign}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OrgOwnerAppLayout>
  );
};

export default OrgSeatsPage;
