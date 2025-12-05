import React from 'react';

interface Funnel {
  id: string;
  name: string;
  objective: 'Lead gen' | 'Course enrollment' | 'Webinar signup' | 'Upsell';
  status: 'active' | 'paused' | 'draft' | 'archived';
  entryPoint: string;
  trafficThisPeriod: number;
  conversionRate: number;
  owner: string;
  lastUpdatedAt: string;
}

interface FunnelListTableProps {
  funnels: Funnel[];
  onOpenBuilder: (funnelId: string) => void;
  onDuplicate: (funnelId: string) => void;
  onToggleStatus: (funnelId: string) => void;
}

const FunnelListTable: React.FC<FunnelListTableProps> = ({
  funnels,
  onOpenBuilder,
  onDuplicate,
  onToggleStatus,
}) => {
  const getStatusColor = (status: Funnel['status']) => {
    switch (status) {
      case 'active':
        return 'bg-[#22C55E]/10 text-[#22C55E]';
      case 'paused':
        return 'bg-[#F97316]/10 text-[#F97316]';
      case 'draft':
        return 'bg-[#9CA3B5]/10 text-[#5F6473]';
      case 'archived':
        return 'bg-[#5F6473]/10 text-[#5F6473]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getObjectiveColor = (objective: Funnel['objective']) => {
    switch (objective) {
      case 'Lead gen':
        return 'bg-[#5E7BFF]/10 text-[#304DB5]';
      case 'Course enrollment':
        return 'bg-[#38BDF8]/10 text-[#0284C7]';
      case 'Webinar signup':
        return 'bg-[#A78BFA]/10 text-[#7C3AED]';
      case 'Upsell':
        return 'bg-[#F59E0B]/10 text-[#D97706]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (funnels.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-12 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-[#111827] mb-2">No funnels found</h3>
        <p className="text-[#5F6473]">Try adjusting your filters or create a new funnel.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5F7FF] to-[#FFF9F5] border-b border-[#EDF0FB]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Funnel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Entry Point
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Traffic
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0FB]">
              {funnels.map((funnel) => (
                <tr
                  key={funnel.id}
                  className="hover:bg-[#F5F7FF]/30 transition-colors cursor-pointer"
                  onClick={() => onOpenBuilder(funnel.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#111827] mb-1">{funnel.name}</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getObjectiveColor(
                          funnel.objective
                        )}`}
                      >
                        {funnel.objective}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#5F6473]">{funnel.entryPoint}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                        funnel.status
                      )}`}
                    >
                      {funnel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#111827]">
                      {funnel.trafficThisPeriod.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#9CA3B5]">sessions</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#304DB5] mb-1">
                      {funnel.conversionRate}%
                    </p>
                    {/* Tiny sparkline bar */}
                    <div className="w-16 h-1.5 bg-[#EDF0FB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full"
                        style={{ width: `${Math.min(funnel.conversionRate, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-white text-xs font-bold">
                        {funnel.owner.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <p className="text-sm text-[#5F6473]">{funnel.owner}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#5F6473]">{formatDate(funnel.lastUpdatedAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenBuilder(funnel.id)}
                        className="px-3 py-1.5 bg-[#304DB5] text-white text-xs font-semibold rounded-full hover:bg-[#5E7BFF] transition-colors"
                        title="Open builder"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => onDuplicate(funnel.id)}
                        className="px-3 py-1.5 bg-[#EDF0FB] text-[#5F6473] text-xs font-semibold rounded-full hover:bg-[#E0E5FF] transition-colors"
                        title="Duplicate"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => onToggleStatus(funnel.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                          funnel.status === 'active'
                            ? 'bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20'
                            : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                        }`}
                        title={funnel.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {funnel.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {funnels.map((funnel) => (
          <div
            key={funnel.id}
            className="bg-white rounded-2xl shadow-md p-6 space-y-4"
            onClick={() => onOpenBuilder(funnel.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-[#111827] mb-2">{funnel.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getObjectiveColor(
                      funnel.objective
                    )}`}
                  >
                    {funnel.objective}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                      funnel.status
                    )}`}
                  >
                    {funnel.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Entry Point</p>
                <p className="text-[#5F6473] font-medium">{funnel.entryPoint}</p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Owner</p>
                <p className="text-[#5F6473] font-medium">{funnel.owner}</p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Traffic</p>
                <p className="text-[#111827] font-bold">
                  {funnel.trafficThisPeriod.toLocaleString()} sessions
                </p>
              </div>
              <div>
                <p className="text-[#9CA3B5] text-xs mb-1">Conversion</p>
                <p className="text-[#304DB5] font-bold">{funnel.conversionRate}%</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDF0FB] flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onOpenBuilder(funnel.id)}
                className="flex-1 px-4 py-2 bg-[#304DB5] text-white text-sm font-semibold rounded-full hover:bg-[#5E7BFF] transition-colors"
              >
                Open Builder
              </button>
              <button
                onClick={() => onDuplicate(funnel.id)}
                className="px-4 py-2 bg-[#EDF0FB] text-[#5F6473] text-sm font-semibold rounded-full hover:bg-[#E0E5FF] transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={() => onToggleStatus(funnel.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  funnel.status === 'active'
                    ? 'bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20'
                    : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                }`}
              >
                {funnel.status === 'active' ? 'Pause' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default FunnelListTable;
