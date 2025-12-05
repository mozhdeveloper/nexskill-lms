import React from 'react';
import AssignOwnerDropdown from './AssignOwnerDropdown';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  segment?: string;
  owner?: string;
  status: 'lead' | 'customer' | 'partner' | 'other';
  createdAt: string;
  lastActivityAt?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  owners: string[];
  onSelectContact: (contactId: string) => void;
  onChangeOwner: (contactId: string, owner: string | null) => void;
}

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  owners,
  onSelectContact,
  onChangeOwner,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-[#FEF3C7] text-[#92400E]';
      case 'customer':
        return 'bg-[#D1FAE5] text-[#065F46]';
      case 'partner':
        return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'other':
        return 'bg-[#E5E7EB] text-[#374151]';
      default:
        return 'bg-[#F3F4F6] text-[#6B7280]';
    }
  };

  const getTagColor = (index: number) => {
    const colors = [
      'bg-[#E0E5FF] text-[#304DB5]',
      'bg-[#FCE7F3] text-[#BE185D]',
      'bg-[#CCFBF1] text-[#115E59]',
      'bg-[#FEF3C7] text-[#92400E]',
      'bg-[#E0F2FE] text-[#075985]',
      'bg-[#FAE8FF] text-[#86198F]',
    ];
    return colors[index % colors.length];
  };

  const formatLastActivity = (lastActivityAt?: string) => {
    if (!lastActivityAt) return 'No activity yet';
    
    const activityDate = new Date(lastActivityAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - activityDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-[#F5F7FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            No contacts found
          </h3>
          <p className="text-[#5F6473]">
            Try adjusting your filters or add new contacts to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F7FF] border-b border-[#EDF0FB]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0FB]">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-[#FAFBFF] transition-colors cursor-pointer"
                  onClick={() => onSelectContact(contact.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-[#111827]">
                        {contact.name}
                      </div>
                      <div className="text-sm text-[#5F6473]">
                        {contact.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5F6473]">
                    {contact.phone || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        contact.status
                      )}`}
                    >
                      {contact.status.charAt(0).toUpperCase() +
                        contact.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.length > 0 ? (
                        contact.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTagColor(
                              idx
                            )}`}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#9CA3B5]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AssignOwnerDropdown
                      value={contact.owner}
                      owners={owners}
                      onChange={(newOwner) =>
                        onChangeOwner(contact.id, newOwner)
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5F6473]">
                    {formatLastActivity(contact.lastActivityAt)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectContact(contact.id);
                      }}
                      className="text-[#304DB5] hover:text-[#152457] font-semibold text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            className="bg-white rounded-2xl shadow-md p-4 space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
          >
            {/* Contact Name & Email */}
            <div>
              <h3 className="font-semibold text-[#111827] mb-1">
                {contact.name}
              </h3>
              <p className="text-sm text-[#5F6473]">{contact.email}</p>
              {contact.phone && (
                <p className="text-sm text-[#5F6473] mt-1">{contact.phone}</p>
              )}
            </div>

            {/* Status & Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  contact.status
                )}`}
              >
                {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
              </span>
              {contact.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTagColor(
                    idx
                  )}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Owner & Last Activity */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EDF0FB]">
              <div>
                <p className="text-xs text-[#9CA3B5] mb-1">Owner</p>
                <AssignOwnerDropdown
                  value={contact.owner}
                  owners={owners}
                  onChange={(newOwner) => onChangeOwner(contact.id, newOwner)}
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9CA3B5] mb-1">Last Activity</p>
                <p className="text-sm text-[#5F6473]">
                  {formatLastActivity(contact.lastActivityAt)}
                </p>
              </div>
            </div>

            {/* View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectContact(contact.id);
              }}
              className="w-full py-2 bg-[#304DB5] text-white rounded-full font-semibold hover:bg-[#152457] transition-colors text-sm"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ContactsTable;
