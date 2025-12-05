import React, { useState } from 'react';
import AdminAppLayout from '../../layouts/AdminAppLayout';
import LeadsFiltersBar from '../../components/admin/crm/LeadsFiltersBar';
import LeadsDatabaseTable from '../../components/admin/crm/LeadsDatabaseTable';
import LeadTagsManager from '../../components/admin/crm/LeadTagsManager';
import LeadScoreRulesPanel from '../../components/admin/crm/LeadScoreRulesPanel';
import BulkEmailCampaignsPanel from '../../components/admin/crm/BulkEmailCampaignsPanel';
import WhatsappBroadcastCenterPanel from '../../components/admin/crm/WhatsappBroadcastCenterPanel';
import FunnelsManagerPanel from '../../components/admin/crm/FunnelsManagerPanel';
import LandingPagesManagerPanel from '../../components/admin/crm/LandingPagesManagerPanel';

interface Lead {
  id: string;
  name: string;
  email: string;
  source: string;
  status: 'new' | 'engaged' | 'customer' | 'closed_lost';
  tags: string[];
  score: number;
  owner: string;
  createdAt: string;
  lastActivityAt: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  leadCount?: number;
  category?: 'source' | 'interest' | 'stage' | 'custom';
}

interface LeadScoreRule {
  id: string;
  label: string;
  conditionSummary: string;
  points: number;
  isActive: boolean;
}

interface EmailCampaign {
  id: string;
  name: string;
  segmentSummary: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  scheduledAt?: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
}

interface WhatsAppBroadcast {
  id: string;
  name: string;
  listSummary: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  scheduledAt?: string;
  deliveredCount: number;
  responseRate: number;
}

interface Funnel {
  id: string;
  name: string;
  entryPoint: string;
  keySteps: string[];
  status: 'active' | 'paused' | 'archived';
  leadsInFunnel: number;
  conversionRate: number;
}

interface LandingPage {
  id: string;
  name: string;
  url: string;
  status: 'draft' | 'published' | 'archived';
  variantCount: number;
  views: number;
  conversionRate: number;
}

interface FiltersValue {
  search: string;
  status: Lead['status'] | 'all';
  selectedTagIds: string[];
  scoreBand: 'hot' | 'warm' | 'cold' | 'all';
  source: string;
}

const AdminCrmMarketingPage: React.FC = () => {
  // Filters
  const [filters, setFilters] = useState<FiltersValue>({
    search: '',
    status: 'all',
    selectedTagIds: [],
    scoreBand: 'all',
    source: '',
  });

  // Tags
  const [tags, setTags] = useState<Tag[]>([
    {
      id: 'tag-1',
      name: 'UX Bootcamp Interest',
      color: '#304DB5',
      description: 'Interested in UX bootcamp',
      leadCount: 8,
      category: 'interest',
    },
    {
      id: 'tag-2',
      name: 'LinkedIn',
      color: '#059669',
      description: 'Source: LinkedIn',
      leadCount: 5,
      category: 'source',
    },
    {
      id: 'tag-3',
      name: 'High Intent',
      color: '#D97706',
      description: 'Showed high purchase intent',
      leadCount: 4,
      category: 'stage',
    },
    {
      id: 'tag-4',
      name: 'Webinar Attendee',
      color: '#7C3AED',
      description: 'Attended webinar',
      leadCount: 6,
      category: 'custom',
    },
    {
      id: 'tag-5',
      name: 'Google Ads',
      color: '#DC2626',
      description: 'Source: Google Ads',
      leadCount: 3,
      category: 'source',
    },
    {
      id: 'tag-6',
      name: 'Product Design Interest',
      color: '#304DB5',
      description: 'Interested in product design',
      leadCount: 3,
      category: 'interest',
    },
    {
      id: 'tag-7',
      name: 'Nurture Sequence',
      color: '#059669',
      description: 'In nurture email sequence',
      leadCount: 7,
      category: 'stage',
    },
    {
      id: 'tag-8',
      name: 'Free Trial User',
      color: '#D97706',
      description: 'Using free trial',
      leadCount: 2,
      category: 'custom',
    },
    {
      id: 'tag-9',
      name: 'Facebook',
      color: '#7C3AED',
      description: 'Source: Facebook',
      leadCount: 4,
      category: 'source',
    },
    {
      id: 'tag-10',
      name: 'Ready to Buy',
      color: '#DC2626',
      description: 'Ready to purchase',
      leadCount: 2,
      category: 'stage',
    },
    {
      id: 'tag-11',
      name: 'Corporate Training',
      color: '#304DB5',
      description: 'Interested in corporate training',
      leadCount: 3,
      category: 'interest',
    },
    {
      id: 'tag-12',
      name: 'Referral',
      color: '#059669',
      description: 'Came through referral',
      leadCount: 2,
      category: 'source',
    },
  ]);

  // Leads
  const [leads] = useState<Lead[]>([
    {
      id: 'lead-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      source: 'LinkedIn',
      status: 'engaged',
      tags: ['tag-1', 'tag-2', 'tag-3'],
      score: 85,
      owner: 'Sarah Kim',
      createdAt: '2024-01-10',
      lastActivityAt: '2024-01-15',
    },
    {
      id: 'lead-2',
      name: 'Bob Williams',
      email: 'bob@example.com',
      source: 'Google Ads',
      status: 'new',
      tags: ['tag-5', 'tag-6'],
      score: 45,
      owner: 'Unassigned',
      createdAt: '2024-01-12',
      lastActivityAt: '2024-01-12',
    },
    {
      id: 'lead-3',
      name: 'Carol Martinez',
      email: 'carol@example.com',
      source: 'Webinar',
      status: 'engaged',
      tags: ['tag-4', 'tag-7'],
      score: 72,
      owner: 'Sarah Kim',
      createdAt: '2024-01-08',
      lastActivityAt: '2024-01-14',
    },
    {
      id: 'lead-4',
      name: 'David Chen',
      email: 'david@example.com',
      source: 'Facebook',
      status: 'customer',
      tags: ['tag-9', 'tag-10', 'tag-1'],
      score: 95,
      owner: 'Michael Lee',
      createdAt: '2024-01-05',
      lastActivityAt: '2024-01-16',
    },
    {
      id: 'lead-5',
      name: 'Emma Davis',
      email: 'emma@example.com',
      source: 'LinkedIn',
      status: 'engaged',
      tags: ['tag-2', 'tag-11'],
      score: 68,
      owner: 'Sarah Kim',
      createdAt: '2024-01-11',
      lastActivityAt: '2024-01-13',
    },
    {
      id: 'lead-6',
      name: 'Frank Wilson',
      email: 'frank@example.com',
      source: 'Referral',
      status: 'new',
      tags: ['tag-12'],
      score: 40,
      owner: 'Unassigned',
      createdAt: '2024-01-14',
      lastActivityAt: '2024-01-14',
    },
    {
      id: 'lead-7',
      name: 'Grace Taylor',
      email: 'grace@example.com',
      source: 'Google Ads',
      status: 'engaged',
      tags: ['tag-5', 'tag-8'],
      score: 78,
      owner: 'Michael Lee',
      createdAt: '2024-01-07',
      lastActivityAt: '2024-01-15',
    },
    {
      id: 'lead-8',
      name: 'Henry Brown',
      email: 'henry@example.com',
      source: 'LinkedIn',
      status: 'closed_lost',
      tags: ['tag-2'],
      score: 25,
      owner: 'Sarah Kim',
      createdAt: '2024-01-06',
      lastActivityAt: '2024-01-10',
    },
    {
      id: 'lead-9',
      name: 'Ivy Garcia',
      email: 'ivy@example.com',
      source: 'Webinar',
      status: 'engaged',
      tags: ['tag-4', 'tag-3'],
      score: 82,
      owner: 'Michael Lee',
      createdAt: '2024-01-09',
      lastActivityAt: '2024-01-16',
    },
    {
      id: 'lead-10',
      name: 'Jack Miller',
      email: 'jack@example.com',
      source: 'Facebook',
      status: 'new',
      tags: ['tag-9'],
      score: 38,
      owner: 'Unassigned',
      createdAt: '2024-01-13',
      lastActivityAt: '2024-01-13',
    },
    {
      id: 'lead-11',
      name: 'Karen Lee',
      email: 'karen@example.com',
      source: 'Google Ads',
      status: 'customer',
      tags: ['tag-5', 'tag-10', 'tag-1'],
      score: 92,
      owner: 'Sarah Kim',
      createdAt: '2024-01-04',
      lastActivityAt: '2024-01-15',
    },
    {
      id: 'lead-12',
      name: 'Larry Anderson',
      email: 'larry@example.com',
      source: 'Referral',
      status: 'engaged',
      tags: ['tag-12', 'tag-7'],
      score: 65,
      owner: 'Michael Lee',
      createdAt: '2024-01-10',
      lastActivityAt: '2024-01-14',
    },
    {
      id: 'lead-13',
      name: 'Monica White',
      email: 'monica@example.com',
      source: 'LinkedIn',
      status: 'engaged',
      tags: ['tag-2', 'tag-6'],
      score: 74,
      owner: 'Sarah Kim',
      createdAt: '2024-01-08',
      lastActivityAt: '2024-01-16',
    },
    {
      id: 'lead-14',
      name: 'Nathan Scott',
      email: 'nathan@example.com',
      source: 'Facebook',
      status: 'new',
      tags: ['tag-9'],
      score: 42,
      owner: 'Unassigned',
      createdAt: '2024-01-15',
      lastActivityAt: '2024-01-15',
    },
    {
      id: 'lead-15',
      name: 'Olivia Harris',
      email: 'olivia@example.com',
      source: 'Webinar',
      status: 'engaged',
      tags: ['tag-4', 'tag-8'],
      score: 80,
      owner: 'Michael Lee',
      createdAt: '2024-01-06',
      lastActivityAt: '2024-01-14',
    },
    {
      id: 'lead-16',
      name: 'Paul Martinez',
      email: 'paul@example.com',
      source: 'Google Ads',
      status: 'closed_lost',
      tags: ['tag-5'],
      score: 28,
      owner: 'Sarah Kim',
      createdAt: '2024-01-05',
      lastActivityAt: '2024-01-09',
    },
    {
      id: 'lead-17',
      name: 'Quincy Roberts',
      email: 'quincy@example.com',
      source: 'LinkedIn',
      status: 'engaged',
      tags: ['tag-2', 'tag-11', 'tag-7'],
      score: 70,
      owner: 'Michael Lee',
      createdAt: '2024-01-11',
      lastActivityAt: '2024-01-15',
    },
    {
      id: 'lead-18',
      name: 'Rachel Young',
      email: 'rachel@example.com',
      source: 'Referral',
      status: 'customer',
      tags: ['tag-12', 'tag-10', 'tag-1'],
      score: 88,
      owner: 'Sarah Kim',
      createdAt: '2024-01-03',
      lastActivityAt: '2024-01-16',
    },
    {
      id: 'lead-19',
      name: 'Sam Turner',
      email: 'sam@example.com',
      source: 'Facebook',
      status: 'engaged',
      tags: ['tag-9', 'tag-3'],
      score: 76,
      owner: 'Michael Lee',
      createdAt: '2024-01-09',
      lastActivityAt: '2024-01-14',
    },
    {
      id: 'lead-20',
      name: 'Tina Walker',
      email: 'tina@example.com',
      source: 'Google Ads',
      status: 'new',
      tags: ['tag-5', 'tag-6'],
      score: 50,
      owner: 'Unassigned',
      createdAt: '2024-01-14',
      lastActivityAt: '2024-01-14',
    },
  ]);

  // Lead Score Rules
  const [scoreRules, setScoreRules] = useState<LeadScoreRule[]>([
    {
      id: 'rule-1',
      label: 'High Intent Tag',
      conditionSummary: 'Tag equals"High Intent"',
      points: 20,
      isActive: true,
    },
    {
      id: 'rule-2',
      label: 'Webinar Attendance',
      conditionSummary: 'Tag equals"Webinar Attendee"',
      points: 15,
      isActive: true,
    },
    {
      id: 'rule-3',
      label: 'Engaged Status',
      conditionSummary: 'Status equals"Engaged"',
      points: 10,
      isActive: true,
    },
    {
      id: 'rule-4',
      label: 'Recent Activity',
      conditionSummary: 'Last activity within 3 days',
      points: 10,
      isActive: true,
    },
    {
      id: 'rule-5',
      label: 'Ready to Buy Tag',
      conditionSummary: 'Tag equals"Ready to Buy"',
      points: 25,
      isActive: false,
    },
  ]);

  // Email Campaigns
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([
    {
      id: 'campaign-1',
      name: 'January UX Newsletter',
      segmentSummary: 'All leads with tag"UX Bootcamp Interest"',
      status: 'completed',
      scheduledAt: undefined,
      sentCount: 520,
      openRate: 32,
      clickRate: 8,
    },
    {
      id: 'campaign-2',
      name: 'Product Launch Announcement',
      segmentSummary: 'All leads with tag"High Intent"',
      status: 'scheduled',
      scheduledAt: '2024-01-20 10:00',
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
    },
    {
      id: 'campaign-3',
      name: 'Webinar Follow-up',
      segmentSummary: 'All leads with tag"Webinar Attendee"',
      status: 'completed',
      scheduledAt: undefined,
      sentCount: 150,
      openRate: 45,
      clickRate: 12,
    },
    {
      id: 'campaign-4',
      name: 'Corporate Training Promo',
      segmentSummary: 'All leads with tag"Corporate Training"',
      status: 'draft',
      scheduledAt: undefined,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
    },
  ]);

  // WhatsApp Broadcasts
  const [whatsAppBroadcasts, setWhatsAppBroadcasts] = useState<WhatsAppBroadcast[]>([
    {
      id: 'broadcast-1',
      name: 'Weekly UX Tips',
      listSummary: 'All leads with tag"UI/UX Interest"',
      status: 'completed',
      scheduledAt: undefined,
      deliveredCount: 280,
      responseRate: 18,
    },
    {
      id: 'broadcast-2',
      name: 'Flash Sale Alert',
      listSummary: 'All leads with tag"High Intent"',
      status: 'scheduled',
      scheduledAt: '2024-01-18 14:00',
      deliveredCount: 0,
      responseRate: 0,
    },
    {
      id: 'broadcast-3',
      name: 'New Course Announcement',
      listSummary: 'All engaged leads',
      status: 'draft',
      scheduledAt: undefined,
      deliveredCount: 0,
      responseRate: 0,
    },
  ]);

  // Funnels
  const [funnels, setFunnels] = useState<Funnel[]>([
    {
      id: 'funnel-1',
      name: 'UX Bootcamp Enrollment',
      entryPoint: 'Download Free Guide',
      keySteps: ['Email Series', 'Webinar Invite', 'Application Form'],
      status: 'active',
      leadsInFunnel: 85,
      conversionRate: 12,
    },
    {
      id: 'funnel-2',
      name: 'Free Trial to Paid',
      entryPoint: 'Sign up for Free Trial',
      keySteps: ['Onboarding Email', 'Feature Tour', 'Upgrade Offer'],
      status: 'active',
      leadsInFunnel: 42,
      conversionRate: 25,
    },
    {
      id: 'funnel-3',
      name: 'Corporate Training Leads',
      entryPoint: 'Request Demo',
      keySteps: ['Demo Call', 'Proposal', 'Contract'],
      status: 'paused',
      leadsInFunnel: 18,
      conversionRate: 35,
    },
  ]);

  // Landing Pages
  const [landingPages, setLandingPages] = useState<LandingPage[]>([
    {
      id: 'page-1',
      name: 'UX Bootcamp Promo',
      url: '/ux-bootcamp-2024',
      status: 'published',
      variantCount: 2,
      views: 3200,
      conversionRate: 8,
    },
    {
      id: 'page-2',
      name: 'Free Trial Sign-up',
      url: '/free-trial',
      status: 'published',
      variantCount: 3,
      views: 5400,
      conversionRate: 12,
    },
    {
      id: 'page-3',
      name: 'Webinar Registration',
      url: '/webinar-jan-2024',
      status: 'published',
      variantCount: 1,
      views: 1800,
      conversionRate: 22,
    },
    {
      id: 'page-4',
      name: 'Corporate Training Landing',
      url: '/corporate-training',
      status: 'draft',
      variantCount: 1,
      views: 0,
      conversionRate: 0,
    },
  ]);

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase()) && !lead.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    if (filters.status !== 'all' && lead.status !== filters.status) {
      return false;
    }

    if (filters.selectedTagIds.length > 0) {
      const hasAnyTag = filters.selectedTagIds.some((tagId) => lead.tags.includes(tagId));
      if (!hasAnyTag) return false;
    }

    if (filters.scoreBand !== 'all') {
      if (filters.scoreBand === 'hot' && lead.score < 80) return false;
      if (filters.scoreBand === 'warm' && (lead.score < 50 || lead.score >= 80)) return false;
      if (filters.scoreBand === 'cold' && lead.score >= 50) return false;
    }

    if (filters.source && lead.source !== filters.source) {
      return false;
    }

    return true;
  });

  const handleSelectLead = (leadId: string) => {
    console.log('Selected lead:', leadId);
    window.alert(`Lead details for ${leadId} coming soon!`);
  };

  const handleEditLeadTags = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    console.log('Edit tags for lead:', leadId);
    window.alert(`Edit tags for ${lead.name} - coming soon!`);
  };

  const handleAssignOwner = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    console.log('Assign owner for lead:', leadId);
    window.alert(`Assign owner for ${lead.name} - coming soon!`);
  };

  const handleFilterByTag = (tagId: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedTagIds: [tagId],
    }));
    console.log('Filtering by tag:', tagId);
  };

  const handleFiltersChange = (updatedFilters: {
    search: string;
    status: string;
    selectedTagIds: string[];
    scoreBand: string;
    source: string;
  }) => {
    setFilters(updatedFilters as FiltersValue);
  };

  return (
    <AdminAppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">CRM & Marketing</h1>
            <p className="text-sm text-[#9CA3B5] mt-1">
              Manage leads, campaigns, funnels, and landing pages
            </p>
          </div>
        </div>

        {/* Filters */}
        <LeadsFiltersBar value={filters} tags={tags} onChange={handleFiltersChange} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leads Database Table */}
            <LeadsDatabaseTable
              leads={filteredLeads}
              tags={tags}
              onSelectLead={handleSelectLead}
              onEditLeadTags={handleEditLeadTags}
              onAssignOwner={handleAssignOwner}
            />

            {/* Lead Score Rules */}
            <LeadScoreRulesPanel rules={scoreRules} onChange={setScoreRules} />
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Lead Tags Manager */}
            <LeadTagsManager
              tags={tags}
              onChange={setTags}
              onFilterByTag={handleFilterByTag}
            />

            {/* Bulk Email Campaigns */}
            <BulkEmailCampaignsPanel
              campaigns={emailCampaigns}
              onChange={setEmailCampaigns}
            />

            {/* WhatsApp Broadcast Center */}
            <WhatsappBroadcastCenterPanel
              broadcasts={whatsAppBroadcasts}
              onChange={setWhatsAppBroadcasts}
            />

            {/* Funnels Manager */}
            <FunnelsManagerPanel funnels={funnels} onChange={setFunnels} />

            {/* Landing Pages Manager */}
            <LandingPagesManagerPanel pages={landingPages} onChange={setLandingPages} />
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default AdminCrmMarketingPage;
