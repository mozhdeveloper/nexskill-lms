import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAppLayout from '../../../layouts/AdminAppLayout';
import ContactsFiltersBar from '../../../components/admin/contacts/ContactsFiltersBar';
import ContactsTable from '../../../components/admin/contacts/ContactsTable';

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

interface Filters {
  search: string;
  status: string;
  tag: string;
  owner: string;
}

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    tag: 'all',
    owner: 'all',
  });

  const availableOwners = [
    'Sarah Chen',
    'Marcus Johnson',
    'Emily Rodriguez',
    'David Kim',
    'Jessica Martinez',
  ];

  const availableTags = [
    'High Priority',
    'Newsletter',
    'Webinar Attendee',
    'Trial User',
    'VIP',
    'Partner Program',
  ];

  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 'contact-001',
      name: 'Alex Thompson',
      email: 'alex.thompson@techcorp.com',
      phone: '+1 (555) 123-4567',
      tags: ['High Priority', 'Newsletter'],
      segment: 'Enterprise',
      owner: 'Sarah Chen',
      status: 'lead',
      createdAt: '2025-11-15T10:30:00Z',
      lastActivityAt: '2025-12-03T14:22:00Z',
    },
    {
      id: 'contact-002',
      name: 'Maria Garcia',
      email: 'maria.garcia@designstudio.io',
      phone: '+1 (555) 234-5678',
      tags: ['Webinar Attendee', 'Trial User'],
      segment: 'SMB',
      owner: 'Marcus Johnson',
      status: 'customer',
      createdAt: '2025-10-20T08:15:00Z',
      lastActivityAt: '2025-12-01T16:45:00Z',
    },
    {
      id: 'contact-003',
      name: 'James Chen',
      email: 'j.chen@innovate.com',
      phone: '+1 (555) 345-6789',
      tags: ['VIP', 'Partner Program'],
      segment: 'Enterprise',
      owner: 'Emily Rodriguez',
      status: 'partner',
      createdAt: '2025-09-05T12:00:00Z',
      lastActivityAt: '2025-11-28T09:30:00Z',
    },
    {
      id: 'contact-004',
      name: 'Sophia Williams',
      email: 'sophia.w@freelance.dev',
      tags: ['Newsletter', 'Trial User'],
      segment: 'Individual',
      status: 'lead',
      createdAt: '2025-11-28T14:20:00Z',
      lastActivityAt: '2025-11-30T11:10:00Z',
    },
    {
      id: 'contact-005',
      name: 'Michael Brown',
      email: 'mbrown@startuphub.co',
      phone: '+1 (555) 456-7890',
      tags: ['High Priority', 'Webinar Attendee'],
      segment: 'Startup',
      owner: 'David Kim',
      status: 'customer',
      createdAt: '2025-10-10T09:45:00Z',
      lastActivityAt: '2025-12-02T13:55:00Z',
    },
    {
      id: 'contact-006',
      name: 'Emily Davis',
      email: 'emily.davis@globaltech.com',
      phone: '+1 (555) 567-8901',
      tags: ['VIP', 'Newsletter'],
      segment: 'Enterprise',
      owner: 'Jessica Martinez',
      status: 'customer',
      createdAt: '2025-08-22T11:30:00Z',
      lastActivityAt: '2025-12-04T08:20:00Z',
    },
    {
      id: 'contact-007',
      name: 'Daniel Lee',
      email: 'dlee@consultant.pro',
      tags: ['Partner Program'],
      segment: 'Individual',
      owner: 'Sarah Chen',
      status: 'partner',
      createdAt: '2025-09-18T15:10:00Z',
      lastActivityAt: '2025-11-25T10:00:00Z',
    },
    {
      id: 'contact-008',
      name: 'Isabella Martinez',
      email: 'isabella@creativeagency.com',
      phone: '+1 (555) 678-9012',
      tags: ['Trial User', 'High Priority'],
      segment: 'SMB',
      status: 'lead',
      createdAt: '2025-12-01T13:00:00Z',
      lastActivityAt: '2025-12-03T17:30:00Z',
    },
  ]);

  // Filter logic
  const filteredContacts = contacts.filter((contact) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all' && contact.status !== filters.status) {
      return false;
    }

    // Tag filter
    if (filters.tag !== 'all' && !contact.tags.includes(filters.tag)) {
      return false;
    }

    // Owner filter
    if (filters.owner === 'unassigned' && contact.owner) {
      return false;
    }
    if (
      filters.owner !== 'all' &&
      filters.owner !== 'unassigned' &&
      contact.owner !== filters.owner
    ) {
      return false;
    }

    return true;
  });

  // KPI calculations
  const totalContacts = contacts.length;
  const taggedContacts = contacts.filter((c) => c.tags.length > 0).length;
  const contactsWithOwner = contacts.filter((c) => c.owner).length;
  const recentlyActive = contacts.filter((c) => {
    if (!c.lastActivityAt) return false;
    const activityDate = new Date(c.lastActivityAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return activityDate >= thirtyDaysAgo;
  }).length;

  const handleSelectContact = (contactId: string) => {
    navigate(`/admin/contacts/${contactId}`);
  };

  const handleChangeOwner = (contactId: string, newOwner: string | null) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? { ...contact, owner: newOwner || undefined }
          : contact
      )
    );
  };

  const handleImportContacts = () => {
    console.log('Import contacts clicked - UI placeholder');
    // TODO: Implement file upload modal in future iteration
  };

  const handleExportContacts = () => {
    console.log('Export contacts clicked - UI placeholder');
    // TODO: Implement CSV/Excel export in future iteration
  };

  return (
    <AdminAppLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Contacts</h1>
          <p className="text-[#5F6473]">
            Manage your global contact directory for NexSkill.
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1">
            <ContactsFiltersBar
              value={filters}
              availableTags={availableTags}
              availableOwners={availableOwners}
              onChange={setFilters}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleImportContacts}
              className="px-6 py-2.5 bg-[#304DB5] text-white rounded-full font-semibold hover:bg-[#152457] transition-colors shadow-md hover:shadow-lg"
            >
              Import contacts
            </button>
            <button
              onClick={handleExportContacts}
              className="px-6 py-2.5 bg-white text-[#304DB5] border-2 border-[#304DB5] rounded-full font-semibold hover:bg-[#F5F7FF] transition-colors"
            >
              Export contacts
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-[#9CA3B5] text-sm font-medium mb-1">
              Total contacts
            </p>
            <p className="text-3xl font-bold text-[#111827]">{totalContacts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-[#9CA3B5] text-sm font-medium mb-1">
              Tagged contacts
            </p>
            <p className="text-3xl font-bold text-[#111827]">{taggedContacts}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-[#9CA3B5] text-sm font-medium mb-1">
              Contacts with owner
            </p>
            <p className="text-3xl font-bold text-[#111827]">
              {contactsWithOwner}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-[#9CA3B5] text-sm font-medium mb-1">
              Recently active (30d)
            </p>
            <p className="text-3xl font-bold text-[#111827]">{recentlyActive}</p>
          </div>
        </div>

        {/* Contacts Table */}
        <ContactsTable
          contacts={filteredContacts}
          owners={availableOwners}
          onSelectContact={handleSelectContact}
          onChangeOwner={handleChangeOwner}
        />
      </div>
    </AdminAppLayout>
  );
};

export default ContactsPage;
