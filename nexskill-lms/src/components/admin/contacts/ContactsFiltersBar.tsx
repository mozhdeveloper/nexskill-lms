import React from 'react';

interface FilterValue {
  search: string;
  status: string;
  tag: string;
  owner: string;
}

interface ContactsFiltersBarProps {
  value: FilterValue;
  availableTags: string[];
  availableOwners: string[];
  onChange: (updated: FilterValue) => void;
}

const ContactsFiltersBar: React.FC<ContactsFiltersBarProps> = ({
  value,
  availableTags,
  availableOwners,
  onChange,
}) => {
  const handleChange = (field: keyof FilterValue, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 min-w-[240px]">
        <input
          type="text"
          placeholder="Search contacts by name, email, or phone"
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
        <option value="lead">Lead</option>
        <option value="customer">Customer</option>
        <option value="partner">Partner</option>
        <option value="other">Other</option>
      </select>

      {/* Tag Dropdown */}
      <select
        value={value.tag}
        onChange={(e) => handleChange('tag', e.target.value)}
        className="px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
      >
        <option value="all">All tags</option>
        {availableTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>

      {/* Owner Dropdown */}
      <select
        value={value.owner}
        onChange={(e) => handleChange('owner', e.target.value)}
        className="px-4 py-2 rounded-full border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
      >
        <option value="all">All owners</option>
        <option value="unassigned">Unassigned</option>
        {availableOwners.map((owner) => (
          <option key={owner} value={owner}>
            {owner}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ContactsFiltersBar;
