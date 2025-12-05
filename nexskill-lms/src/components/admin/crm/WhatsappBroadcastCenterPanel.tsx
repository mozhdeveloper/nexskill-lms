import React, { useState } from 'react';

interface WhatsAppBroadcast {
  id: string;
  name: string;
  listSummary: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  scheduledAt?: string;
  deliveredCount: number;
  responseRate: number;
}

interface WhatsappBroadcastCenterPanelProps {
  broadcasts: WhatsAppBroadcast[];
  onChange: (updatedBroadcasts: WhatsAppBroadcast[]) => void;
}

const WhatsappBroadcastCenterPanel: React.FC<WhatsappBroadcastCenterPanelProps> = ({
  broadcasts,
  onChange,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    listSummary: '',
    message: '',
    sendTiming: 'now' as 'now' | 'schedule',
    scheduledAt: '',
  });

  const getStatusConfig = (status: WhatsAppBroadcast['status']) => {
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

  const handleSaveBroadcast = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a broadcast name.');
      return;
    }

    if (!formData.listSummary.trim()) {
      window.alert('Please specify a contact list.');
      return;
    }

    if (!formData.message.trim()) {
      window.alert('Please enter a message.');
      return;
    }

    const newBroadcast: WhatsAppBroadcast = {
      id: `broadcast-${Date.now()}`,
      name: formData.name,
      listSummary: formData.listSummary,
      status: formData.sendTiming === 'now' ? 'sending' : 'scheduled',
      scheduledAt: formData.sendTiming === 'schedule' ? formData.scheduledAt : undefined,
      deliveredCount: 0,
      responseRate: 0,
    };

    onChange([...broadcasts, newBroadcast]);
    console.log('Created broadcast:', newBroadcast);

    // Reset form
    setFormData({
      name: '',
      listSummary: '',
      message: '',
      sendTiming: 'now',
      scheduledAt: '',
    });
    setIsCreating(false);
    window.alert(`Broadcast"${newBroadcast.name}" has been saved!`);
  };

  const handleSendTest = (broadcastId: string) => {
    console.log('Sending test WhatsApp message for broadcast:', broadcastId);
    window.alert('Test message sent to your WhatsApp number!');
  };

  const handleSchedule = (broadcastId: string) => {
    const broadcast = broadcasts.find((b) => b.id === broadcastId);
    if (!broadcast) return;

    const dateTime = window.prompt('Enter schedule date/time (YYYY-MM-DD HH:MM):');
    if (!dateTime) return;

    const updated = broadcasts.map((b) =>
      b.id === broadcastId ? { ...b, status: 'scheduled' as const, scheduledAt: dateTime } : b
    );
    onChange(updated);
    console.log('Scheduled broadcast:', broadcastId, 'for', dateTime);
    window.alert(`Broadcast scheduled for ${dateTime}`);
  };

  const handleCancelSchedule = (broadcastId: string) => {
    const updated = broadcasts.map((b) =>
      b.id === broadcastId ? { ...b, status: 'draft' as const, scheduledAt: undefined } : b
    );
    onChange(updated);
    console.log('Cancelled schedule for broadcast:', broadcastId);
    window.alert('Schedule cancelled. Broadcast moved to draft.');
  };

  const handleDuplicate = (broadcastId: string) => {
    const broadcast = broadcasts.find((b) => b.id === broadcastId);
    if (!broadcast) return;

    const duplicated: WhatsAppBroadcast = {
      ...broadcast,
      id: `broadcast-${Date.now()}`,
      name: `${broadcast.name} (Copy)`,
      status: 'draft',
      scheduledAt: undefined,
      deliveredCount: 0,
      responseRate: 0,
    };

    onChange([...broadcasts, duplicated]);
    console.log('Duplicated broadcast:', broadcastId);
    window.alert(`Broadcast duplicated as"${duplicated.name}"`);
  };

  const handleArchive = (broadcastId: string) => {
    const broadcast = broadcasts.find((b) => b.id === broadcastId);
    if (!broadcast) return;

    if (!window.confirm(`Archive broadcast"${broadcast.name}"?`)) return;

    const updated = broadcasts.filter((b) => b.id !== broadcastId);
    onChange(updated);
    console.log('Archived broadcast:', broadcastId);
    window.alert('Broadcast archived.');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">WhatsApp Broadcast Center</h2>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Create Broadcast
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Broadcast</h3>

          {/* Broadcast Name */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Broadcast Name
            </label>
            <input
              type="text"
              placeholder="e.g., Weekly UX Tips"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Contact List */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Target Contact List
            </label>
            <input
              type="text"
              placeholder="e.g., All leads with tag 'UI/UX Interest'"
              value={formData.listSummary}
              onChange={(e) => setFormData({ ...formData, listSummary: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Message */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Message Content
            </label>
            <textarea
              placeholder="Enter your message (max 1600 chars)"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              maxLength={1600}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20 resize-none"
            />
            <div className="text-xs text-right text-[#9CA3B5] mt-1">
              {formData.message.length}/1600 characters
            </div>
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
              onClick={handleSaveBroadcast}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Save Broadcast
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

      {/* Broadcasts List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {broadcasts.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No broadcasts yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first WhatsApp broadcast</p>
          </div>
        )}
        {broadcasts.map((broadcast) => {
          const statusConfig = getStatusConfig(broadcast.status);

          return (
            <div
              key={broadcast.id}
              className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#111827] mb-1">{broadcast.name}</div>
                  <div className="text-xs text-[#9CA3B5]">{broadcast.listSummary}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Scheduled Date */}
              {broadcast.scheduledAt && (
                <div className="text-xs text-[#5F6473] mb-2">
                  Scheduled for: {broadcast.scheduledAt}
                </div>
              )}

              {/* Performance Metrics */}
              {broadcast.status === 'completed' && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                    <div className="text-xs text-[#9CA3B5]">Delivered</div>
                    <div className="text-sm font-bold text-[#111827]">
                      {broadcast.deliveredCount}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                    <div className="text-xs text-[#9CA3B5]">Response Rate</div>
                    <div className="text-sm font-bold text-[#111827]">
                      {broadcast.responseRate}%
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                {broadcast.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleSendTest(broadcast.id)}
                      className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                    >
                      Send Test
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleSchedule(broadcast.id)}
                      className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Schedule
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                {broadcast.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleCancelSchedule(broadcast.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Cancel Schedule
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                <button
                  onClick={() => handleDuplicate(broadcast.id)}
                  className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                >
                  Duplicate
                </button>
                <span className="text-[#E5E7EB]">|</span>
                <button
                  onClick={() => handleArchive(broadcast.id)}
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

export default WhatsappBroadcastCenterPanel;
