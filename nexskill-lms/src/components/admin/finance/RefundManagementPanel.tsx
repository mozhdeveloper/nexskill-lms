import React, { useState } from 'react';

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

interface RefundManagementPanelProps {
  refunds: Refund[];
  onUpdateRefund: (refundId: string, updatedFields: Partial<Refund>) => void;
}

const RefundManagementPanel: React.FC<RefundManagementPanelProps> = ({
  refunds,
  onUpdateRefund,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'requested' | 'approved' | 'processed'>(
    'all'
  );

  const getStatusConfig = (status: Refund['status']) => {
    switch (status) {
      case 'requested':
        return {
          label: 'Requested',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
        };
      case 'approved':
        return {
          label: 'Approved',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
        };
      case 'declined':
        return {
          label: 'Declined',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
        };
      case 'processed':
        return {
          label: 'Processed',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#047857]',
        };
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    if (activeFilter === 'all') return true;
    return refund.status === activeFilter;
  });

  const openRequests = refunds.filter((r) => r.status === 'requested').length;
  const totalRefundedAmount = refunds
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalTransactionVolume = 150000; // Dummy total volume
  const refundRate = ((totalRefundedAmount / totalTransactionVolume) * 100).toFixed(1);

  const handleViewTransaction = (transactionId: string) => {
    console.log('Viewing transaction:', transactionId);
    window.alert(`Transaction ${transactionId} details would be displayed here.`);
  };

  const handleApprove = (refundId: string) => {
    console.log('Approving refund:', refundId);
    onUpdateRefund(refundId, { status: 'approved' });
    window.alert(`Refund ${refundId} has been approved.`);
  };

  const handleDecline = (refundId: string) => {
    console.log('Declining refund:', refundId);
    onUpdateRefund(refundId, { status: 'declined' });
    window.alert(`Refund ${refundId} has been declined.`);
  };

  const handleMarkProcessed = (refundId: string) => {
    console.log('Marking refund as processed:', refundId);
    onUpdateRefund(refundId, { status: 'processed' });
    window.alert(`Refund ${refundId} has been marked as processed.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">Refund Management</h2>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#304DB5] text-white'
              : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('requested')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'requested'
              ? 'bg-[#304DB5] text-white'
              : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
          }`}
        >
          Requested
        </button>
        <button
          onClick={() => setActiveFilter('approved')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'approved'
              ? 'bg-[#304DB5] text-white'
              : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveFilter('processed')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'processed'
              ? 'bg-[#304DB5] text-white'
              : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
          }`}
        >
          Processed
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-[#DBEAFE] to-white rounded-xl border border-[#93C5FD]">
          <p className="text-xs text-[#1E40AF] mb-1">Open Requests</p>
          <p className="text-sm font-bold text-[#111827]">{openRequests}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#FEE2E2] to-white rounded-xl border border-[#FCA5A5]">
          <p className="text-xs text-[#991B1B] mb-1">Total Refunded</p>
          <p className="text-sm font-bold text-[#111827]">₱{totalRefundedAmount.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-[#FEF3C7] to-white rounded-xl border border-[#FCD34D]">
          <p className="text-xs text-[#92400E] mb-1">Refund Rate</p>
          <p className="text-sm font-bold text-[#111827]">{refundRate}%</p>
        </div>
      </div>

      {/* Refund List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredRefunds.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No refunds found</p>
            <p className="text-xs text-[#9CA3B5]">No refunds match the selected filter</p>
          </div>
        )}
        {filteredRefunds.map((refund) => {
          const statusConfig = getStatusConfig(refund.status);

          return (
            <div
              key={refund.id}
              className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-[#111827] mb-0.5">{refund.userName}</div>
                  <div className="text-xs text-[#9CA3B5]">{refund.date}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Amount & Transaction */}
              <div className="mb-2">
                <div className="text-lg font-bold text-[#111827] mb-1">
                  ₱{refund.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[#5F6473]">
                  Txn: <span className="font-mono">{refund.transactionId}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <p className="text-xs text-[#5F6473] line-clamp-2">
                  <span className="font-semibold">Reason:</span> {refund.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs">
                <button
                  onClick={() => handleViewTransaction(refund.transactionId)}
                  className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                >
                  View Txn
                </button>

                {refund.status === 'requested' && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleApprove(refund.id)}
                      className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Approve
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleDecline(refund.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}

                {refund.status === 'approved' && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleMarkProcessed(refund.id)}
                      className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Mark Processed
                    </button>
                  </>
                )}

                {(refund.status === 'processed' || refund.status === 'declined') && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <span className="text-[#9CA3B5] italic">No actions available</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RefundManagementPanel;
