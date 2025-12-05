import React from 'react';

interface AssignOwnerDropdownProps {
  value: string | null | undefined;
  owners: string[];
  onChange: (nextOwner: string | null) => void;
}

const AssignOwnerDropdown: React.FC<AssignOwnerDropdownProps> = ({
  value,
  owners,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue === 'unassigned' ? null : newValue);
  };

  return (
    <select
      value={value || 'unassigned'}
      onChange={handleChange}
      className="px-3 py-1 text-sm rounded-full bg-slate-50 border border-[#EDF0FB] hover:border-[#304DB5] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] cursor-pointer transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="unassigned">Unassigned</option>
      {owners.map((owner) => (
        <option key={owner} value={owner}>
          {owner}
        </option>
      ))}
    </select>
  );
};

export default AssignOwnerDropdown;
