import React, { useState } from 'react';

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

interface BulkEmailCampaignsPanelProps {
  campaigns: EmailCampaign[];
  onChange: (updatedCampaigns: EmailCampaign[]) => void;
}

const BulkEmailCampaignsPanel: React.FC<BulkEmailCampaignsPanelProps> = ({
  campaigns,
  onChange,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    segmentSummary: '',
    subject: '',
    sendTiming: 'now' as 'now' | 'schedule',
    scheduledAt: '',
  });

  const getStatusConfig = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#6B7280]',
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
        };
      case 'sending':
        return {
          label: 'Sending',
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#047857]',
        };
    }
  };

  const handleSaveCampaign = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a campaign name.');
      return;
    }

    if (!formData.segmentSummary.trim()) {
      window.alert('Please specify a segment.');
      return;
    }

    if (!formData.subject.trim()) {
      window.alert('Please enter a subject line.');
      return;
    }

    const newCampaign: EmailCampaign = {
      id: `campaign-${Date.now()}`,
      name: formData.name,
      segmentSummary: formData.segmentSummary,
      status: formData.sendTiming === 'now' ? 'sending' : 'scheduled',
      scheduledAt: formData.sendTiming === 'schedule' ? formData.scheduledAt : undefined,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
    };

    onChange([...campaigns, newCampaign]);
    console.log('Created campaign:', newCampaign);

    // Reset form
    setFormData({
      name: '',
      segmentSummary: '',
      subject: '',
      sendTiming: 'now',
      scheduledAt: '',
    });
    setIsCreating(false);
    window.alert(`Campaign"${newCampaign.name}" has been saved!`);
  };

  const handleSendTest = (campaignId: string) => {
    console.log('Sending test email for campaign:', campaignId);
    window.alert('Test email sent to your account!');
  };

  const handleSchedule = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    const dateTime = window.prompt('Enter schedule date/time (YYYY-MM-DD HH:MM):');
    if (!dateTime) return;

    const updated = campaigns.map((c) =>
      c.id === campaignId ? { ...c, status: 'scheduled' as const, scheduledAt: dateTime } : c
    );
    onChange(updated);
    console.log('Scheduled campaign:', campaignId, 'for', dateTime);
    window.alert(`Campaign scheduled for ${dateTime}`);
  };

  const handleCancelSchedule = (campaignId: string) => {
    const updated = campaigns.map((c) =>
      c.id === campaignId ? { ...c, status: 'draft' as const, scheduledAt: undefined } : c
    );
    onChange(updated);
    console.log('Cancelled schedule for campaign:', campaignId);
    window.alert('Schedule cancelled. Campaign moved to draft.');
  };

  const handleDuplicate = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    const duplicated: EmailCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      name: `${campaign.name} (Copy)`,
      status: 'draft',
      scheduledAt: undefined,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
    };

    onChange([...campaigns, duplicated]);
    console.log('Duplicated campaign:', campaignId);
    window.alert(`Campaign duplicated as"${duplicated.name}"`);
  };

  const handleArchive = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    if (!window.confirm(`Archive campaign"${campaign.name}"?`)) return;

    const updated = campaigns.filter((c) => c.id !== campaignId);
    onChange(updated);
    console.log('Archived campaign:', campaignId);
    window.alert('Campaign archived.');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">Bulk Email Campaigns</h2>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Create Campaign
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Campaign</h3>

          {/* Campaign Name */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              placeholder="e.g., Monthly Newsletter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Segment */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Target Segment
            </label>
            <input
              type="text"
              placeholder="e.g., All leads with tag 'UX Bootcamp Interest'"
              value={formData.segmentSummary}
              onChange={(e) => setFormData({ ...formData, segmentSummary: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Subject Line */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Subject Line</label>
            <input
              type="text"
              placeholder="Enter email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Send Timing */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Send Timing</label>
            <select
              value={formData.sendTiming}
              onChange={(e) =>
                setFormData({ ...formData, sendTiming: e.target.value as 'now' | 'schedule' })
              }
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20 mb-2"
            >
              <option value="now">Send Now</option>
              <option value="schedule">Schedule for Later</option>
            </select>

            {formData.sendTiming === 'schedule' && (
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveCampaign}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Save Campaign
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {campaigns.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📧</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No campaigns yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first email campaign</p>
          </div>
        )}
        {campaigns.map((campaign) => {
          const statusConfig = getStatusConfig(campaign.status);

          return (
            <div
              key={campaign.id}
              className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#111827] mb-1">{campaign.name}</div>
                  <div className="text-xs text-[#9CA3B5]">{campaign.segmentSummary}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Scheduled Date */}
              {campaign.scheduledAt && (
                <div className="text-xs text-[#5F6473] mb-2">
                  Scheduled for: {campaign.scheduledAt}
                </div>
              )}

              {/* Performance Metrics */}
              {campaign.status === 'completed' && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                    <div className="text-xs text-[#9CA3B5]">Sent</div>
                    <div className="text-sm font-bold text-[#111827]">{campaign.sentCount}</div>
                  </div>
                  <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                    <div className="text-xs text-[#9CA3B5]">Open Rate</div>
                    <div className="text-sm font-bold text-[#111827]">{campaign.openRate}%</div>
                  </div>
                  <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                    <div className="text-xs text-[#9CA3B5]">Click Rate</div>
                    <div className="text-sm font-bold text-[#111827]">{campaign.clickRate}%</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                {campaign.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleSendTest(campaign.id)}
                      className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                    >
                      Send Test
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleSchedule(campaign.id)}
                      className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Schedule
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                {campaign.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleCancelSchedule(campaign.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Cancel Schedule
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                <button
                  onClick={() => handleDuplicate(campaign.id)}
                  className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                >
                  Duplicate
                </button>
                <span className="text-[#E5E7EB]">|</span>
                <button
                  onClick={() => handleArchive(campaign.id)}
                  className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                >
                  Archive
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkEmailCampaignsPanel;
