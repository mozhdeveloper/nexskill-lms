import React from 'react';

interface FilterValue {
  search: string;
  status: string;
  objective: string;
  owner: string;
}

interface FunnelDashboardFiltersBarProps {
  value: FilterValue;
  onChange: (updated: FilterValue) => void;
}

const FunnelDashboardFiltersBar: React.FC<FunnelDashboardFiltersBarProps> = ({
  value,
  onChange,
}) => {
  const handleChange = (field: keyof FilterValue, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search funnels by name or objective"
          value={value.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm"
        />
      </div>

      {/* Status Dropdown */}
      <select
        value={value.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>

      {/* Objective Dropdown */}
      <select
        value={value.objective}
        onChange={(e) => handleChange('objective', e.target.value)}
        className="px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
      >
        <option value="all">All objectives</option>
        <option value="Lead gen">Lead gen</option>
        <option value="Course enrollment">Course enrollment</option>
        <option value="Webinar signup">Webinar signup</option>
        <option value="Upsell">Upsell</option>
      </select>

      {/* Owner Dropdown */}
      <select
        value={value.owner}
        onChange={(e) => handleChange('owner', e.target.value)}
        className="px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
      >
        <option value="all">All owners</option>
        <option value="Sarah Chen">Sarah Chen</option>
        <option value="Marcus Johnson">Marcus Johnson</option>
        <option value="Emily Rodriguez">Emily Rodriguez</option>
        <option value="David Kim">David Kim</option>
        <option value="Current Admin">Current Admin</option>
      </select>
    </div>
  );
};

export default FunnelDashboardFiltersBar;
