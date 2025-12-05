import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAppLayout from '../../../layouts/AdminAppLayout';
import FunnelDashboardFiltersBar from '../../../components/admin/funnels/FunnelDashboardFiltersBar';
import FunnelListTable from '../../../components/admin/funnels/FunnelListTable';
import FunnelCreateModal from '../../../components/admin/funnels/FunnelCreateModal';

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

interface Filters {
  search: string;
  status: string;
  objective: string;
  owner: string;
}

const FunnelDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    objective: 'all',
    owner: 'all',
  });

  const [funnels, setFunnels] = useState<Funnel[]>([
    {
      id: 'funnel-001',
      name: 'UX Bootcamp Lead Magnet',
      objective: 'Lead gen',
      status: 'active',
      entryPoint: 'Landing page /ux-bootcamp',
      trafficThisPeriod: 2450,
      conversionRate: 34.5,
      owner: 'Sarah Chen',
      lastUpdatedAt: '2025-12-02T14:30:00Z',
    },
    {
      id: 'funnel-002',
      name: 'Advanced React Course Enrollment',
      objective: 'Course enrollment',
      status: 'active',
      entryPoint: 'Course sales page /react-advanced',
      trafficThisPeriod: 1820,
      conversionRate: 18.2,
      owner: 'Marcus Johnson',
      lastUpdatedAt: '2025-12-01T09:15:00Z',
    },
    {
      id: 'funnel-003',
      name: 'AI Webinar Registration Flow',
      objective: 'Webinar signup',
      status: 'paused',
      entryPoint: 'Landing page /ai-webinar-dec',
      trafficThisPeriod: 890,
      conversionRate: 42.1,
      owner: 'Emily Rodriguez',
      lastUpdatedAt: '2025-11-28T16:45:00Z',
    },
    {
      id: 'funnel-004',
      name: 'Premium Membership Upsell',
      objective: 'Upsell',
      status: 'active',
      entryPoint: 'Checkout /membership-upgrade',
      trafficThisPeriod: 3200,
      conversionRate: 12.8,
      owner: 'David Kim',
      lastUpdatedAt: '2025-12-03T11:20:00Z',
    },
    {
      id: 'funnel-005',
      name: 'Data Science Bootcamp Draft',
      objective: 'Course enrollment',
      status: 'draft',
      entryPoint: 'Landing page /data-science',
      trafficThisPeriod: 0,
      conversionRate: 0,
      owner: 'Sarah Chen',
      lastUpdatedAt: '2025-11-25T10:00:00Z',
    },
  ]);

  const handleCreateFunnel = (funnelData: {
    name: string;
    objective: string;
    entryPointType: string;
    description?: string;
  }) => {
    const newFunnel: Funnel = {
      id: `funnel-${Date.now()}`,
      name: funnelData.name,
      objective: funnelData.objective as Funnel['objective'],
      status: 'draft',
      entryPoint: funnelData.entryPointType,
      trafficThisPeriod: 0,
      conversionRate: 0,
      owner: 'Current Admin',
      lastUpdatedAt: new Date().toISOString(),
    };
    
    setFunnels([newFunnel, ...funnels]);
    setCreateModalOpen(false);
    navigate(`/admin/funnels/${newFunnel.id}`);
  };

  const handleOpenBuilder = (funnelId: string) => {
    navigate(`/admin/funnels/${funnelId}`);
  };

  const handleDuplicate = (funnelId: string) => {
    const originalFunnel = funnels.find((f) => f.id === funnelId);
    if (!originalFunnel) return;

    const duplicatedFunnel: Funnel = {
      ...originalFunnel,
      id: `funnel-${Date.now()}`,
      name: `${originalFunnel.name} (Copy)`,
      status: 'draft',
      trafficThisPeriod: 0,
      conversionRate: 0,
      lastUpdatedAt: new Date().toISOString(),
    };

    setFunnels([duplicatedFunnel, ...funnels]);
  };

  const handleToggleStatus = (funnelId: string) => {
    setFunnels(
      funnels.map((funnel) => {
        if (funnel.id === funnelId) {
          return {
            ...funnel,
            status: funnel.status === 'active' ? 'paused' : 'active',
          };
        }
        return funnel;
      })
    );
  };

  // Apply filters
  const filteredFunnels = funnels.filter((funnel) => {
    if (filters.search && !funnel.name.toLowerCase().includes(filters.search.toLowerCase()) && !funnel.objective.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && funnel.status !== filters.status) {
      return false;
    }
    if (filters.objective !== 'all' && funnel.objective !== filters.objective) {
      return false;
    }
    if (filters.owner !== 'all' && funnel.owner !== filters.owner) {
      return false;
    }
    return true;
  });

  // Calculate KPIs
  const totalFunnels = funnels.length;
  const activeFunnels = funnels.filter((f) => f.status === 'active').length;
  const avgConversion = funnels.length > 0
    ? (funnels.reduce((sum, f) => sum + f.conversionRate, 0) / funnels.length).toFixed(1)
    : '0';
  const leadsCaptured = funnels.reduce((sum, f) => sum + Math.floor(f.trafficThisPeriod * (f.conversionRate / 100)), 0);

  return (
    <AdminAppLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-[#111827] mb-2">Funnels</h1>
          <p className="text-lg text-[#5F6473]">
            Monitor and optimize global funnels across NexSkill.
          </p>
        </div>

        {/* Top Controls Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <FunnelDashboardFiltersBar value={filters} onChange={setFilters} />
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            + Create Funnel
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-[#5F6473] font-semibold mb-1">Total Funnels</p>
            <p className="text-3xl font-bold text-[#111827]">{totalFunnels}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-[#5F6473] font-semibold mb-1">Active Funnels</p>
            <p className="text-3xl font-bold text-[#22C55E]">{activeFunnels}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-[#5F6473] font-semibold mb-1">Avg Funnel Conversion</p>
            <p className="text-3xl font-bold text-[#5E7BFF]">{avgConversion}%</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-[#5F6473] font-semibold mb-1">Leads Captured</p>
            <p className="text-3xl font-bold text-[#304DB5]">{leadsCaptured.toLocaleString()}</p>
            <p className="text-xs text-[#9CA3B5] mt-1">This period</p>
          </div>
        </div>

        {/* Main Table */}
        <FunnelListTable
          funnels={filteredFunnels}
          onOpenBuilder={handleOpenBuilder}
          onDuplicate={handleDuplicate}
          onToggleStatus={handleToggleStatus}
        />

        {/* Create Modal */}
        <FunnelCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateFunnel}
        />
      </div>
    </AdminAppLayout>
  );
};

export default FunnelDashboardPage;
