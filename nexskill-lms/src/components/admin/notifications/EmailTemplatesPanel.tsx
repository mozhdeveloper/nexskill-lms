import React, { useState } from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'system';
  subject: string;
  previewText: string;
  body?: string;
  status: 'active' | 'draft' | 'archived';
  lastUpdatedAt?: string;
}

interface EmailTemplatesPanelProps {
  templates: EmailTemplate[];
  onChange: (updatedTemplates: EmailTemplate[]) => void;
  onOpenEditor: (template?: EmailTemplate) => void;
}

const EmailTemplatesPanel: React.FC<EmailTemplatesPanelProps> = ({
  templates,
  onChange,
  onOpenEditor,
}) => {
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
  });

  const getCategoryConfig = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'transactional':
        return { label: 'Transactional', bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' };
      case 'marketing':
        return { label: 'Marketing', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
      case 'system':
        return { label: 'System', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };
    }
  };

  const getStatusConfig = (status: EmailTemplate['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Active', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' };
      case 'draft':
        return { label: 'Draft', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };
      case 'archived':
        return { label: 'Archived', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' };
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (filters.category !== 'all' && template.category !== filters.category) return false;
    if (filters.status !== 'all' && template.status !== filters.status) return false;
    if (
      filters.search &&
      !template.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !template.subject.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleDuplicate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const duplicated: EmailTemplate = {
      ...template,
      id: `email-${Date.now()}`,
      name: `${template.name} (Copy)`,
      status: 'draft',
    };

    onChange([...templates, duplicated]);
    console.log('Duplicated template:', templateId);
    window.alert(`Template"${template.name}" duplicated successfully!`);
  };

  const handleToggleStatus = (templateId: string) => {
    const updated = templates.map((t) => {
      if (t.id === templateId) {
        const newStatus: EmailTemplate['status'] = t.status === 'active' ? 'archived' : 'active';
        return { ...t, status: newStatus };
      }
      return t;
    });
    onChange(updated);
    console.log('Toggled template status:', templateId);
  };

  const handleSendTest = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    console.log('Sending test email for template:', templateId);
    window.alert(`Test email sent (simulated) for"${template.name}"!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-[#EDF0FB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Email Templates</h2>
            <p className="text-sm text-[#9CA3B5] mt-1">
              Manage email notification templates
            </p>
          </div>
          <button
            onClick={() => onOpenEditor()}
            className="px-5 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full hover:shadow-md transition-shadow"
          >
            + Create Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
          >
            <option value="all">All Categories</option>
            <option value="transactional">Transactional</option>
            <option value="marketing">Marketing</option>
            <option value="system">System</option>
          </select>

          {/* Status Filter Pills */}
          <div className="flex gap-2">
            {['all', 'active', 'draft', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setFilters({ ...filters, status })}
                className={`px-3 py-2 text-xs font-semibold rounded-full transition-all ${
                  filters.status === status
                    ? 'bg-[#304DB5] text-white'
                    : 'bg-[#F5F7FF] text-[#5F6473] hover:bg-[#EDF0FB]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or subject..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="p-6">
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📧</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No templates found</p>
            <p className="text-xs text-[#9CA3B5]">
              {filters.search || filters.category !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first email template'}
            </p>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EDF0FB]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Subject
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Last Updated
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#9CA3B5] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => {
                const categoryConfig = getCategoryConfig(template.category);
                const statusConfig = getStatusConfig(template.status);

                return (
                  <tr key={template.id} className="border-b border-[#EDF0FB] hover:bg-[#F5F7FF]">
                    <td className="py-4 px-4">
                      <div className="text-sm font-semibold text-[#111827]">{template.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryConfig.bg} ${categoryConfig.text}`}
                      >
                        {categoryConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-[#5F6473] max-w-xs truncate">
                        {template.subject}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-[#9CA3B5]">{template.lastUpdatedAt}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenEditor(template)}
                          className="text-xs font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-[#E5E7EB]">|</span>
                        <button
                          onClick={() => handleDuplicate(template.id)}
                          className="text-xs font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                        >
                          Duplicate
                        </button>
                        <span className="text-[#E5E7EB]">|</span>
                        <button
                          onClick={() => handleToggleStatus(template.id)}
                          className="text-xs font-semibold text-[#D97706] hover:text-[#F59E0B] transition-colors"
                        >
                          {template.status === 'active' ? 'Archive' : 'Activate'}
                        </button>
                        <span className="text-[#E5E7EB]">|</span>
                        <button
                          onClick={() => handleSendTest(template.id)}
                          className="text-xs font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                        >
                          Send Test
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {filteredTemplates.map((template) => {
            const categoryConfig = getCategoryConfig(template.category);
            const statusConfig = getStatusConfig(template.status);

            return (
              <div
                key={template.id}
                className="p-4 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-[#111827] mb-1">{template.name}</div>
                    <div className="text-xs text-[#5F6473] mb-2">{template.subject}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${categoryConfig.bg} ${categoryConfig.text}`}
                  >
                    {categoryConfig.label}
                  </span>
                  <span className="text-xs text-[#9CA3B5]">{template.lastUpdatedAt}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                  <button
                    onClick={() => onOpenEditor(template)}
                    className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                  >
                    Duplicate
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleToggleStatus(template.id)}
                    className="font-semibold text-[#D97706] hover:text-[#F59E0B] transition-colors"
                  >
                    {template.status === 'active' ? 'Archive' : 'Activate'}
                  </button>
                  <span className="text-[#E5E7EB]">|</span>
                  <button
                    onClick={() => handleSendTest(template.id)}
                    className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesPanel;
