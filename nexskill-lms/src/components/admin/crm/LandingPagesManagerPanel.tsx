import React, { useState } from 'react';

interface LandingPage {
  id: string;
  name: string;
  url: string;
  status: 'draft' | 'published' | 'archived';
  variantCount: number;
  views: number;
  conversionRate: number;
}

interface LandingPagesManagerPanelProps {
  pages: LandingPage[];
  onChange: (updatedPages: LandingPage[]) => void;
}

const LandingPagesManagerPanel: React.FC<LandingPagesManagerPanelProps> = ({
  pages,
  onChange,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });

  const getStatusConfig = (status: LandingPage['status']) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#6B7280]',
        };
      case 'published':
        return {
          label: 'Published',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#047857]',
        };
      case 'archived':
        return {
          label: 'Archived',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
        };
    }
  };

  const handleSavePage = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a page name.');
      return;
    }

    if (!formData.url.trim()) {
      window.alert('Please enter a URL.');
      return;
    }

    const newPage: LandingPage = {
      id: `page-${Date.now()}`,
      name: formData.name,
      url: formData.url,
      status: 'draft',
      variantCount: 1,
      views: 0,
      conversionRate: 0,
    };

    onChange([...pages, newPage]);
    console.log('Created landing page:', newPage);

    // Reset form
    setFormData({
      name: '',
      url: '',
    });
    setIsCreating(false);
    window.alert(`Landing page"${newPage.name}" has been created!`);
  };

  const handlePublish = (pageId: string) => {
    const updated = pages.map((p) =>
      p.id === pageId ? { ...p, status: 'published' as const } : p
    );
    onChange(updated);
    console.log('Published page:', pageId);
    window.alert('Landing page published!');
  };

  const handleUnpublish = (pageId: string) => {
    const updated = pages.map((p) => (p.id === pageId ? { ...p, status: 'draft' as const } : p));
    onChange(updated);
    console.log('Unpublished page:', pageId);
    window.alert('Landing page unpublished.');
  };

  const handleEditUrl = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const newUrl = window.prompt('Edit URL:', page.url);
    if (!newUrl) return;

    const updated = pages.map((p) => (p.id === pageId ? { ...p, url: newUrl } : p));
    onChange(updated);
    console.log('Updated page URL:', pageId, newUrl);
    window.alert('URL updated.');
  };

  const handleManageVariants = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const variantCountStr = window.prompt(
      'How many A/B test variants for this page?',
      page.variantCount.toString()
    );
    if (!variantCountStr) return;

    const variantCount = parseInt(variantCountStr, 10);
    if (isNaN(variantCount) || variantCount < 1) {
      window.alert('Please enter a valid number >= 1');
      return;
    }

    const updated = pages.map((p) => (p.id === pageId ? { ...p, variantCount } : p));
    onChange(updated);
    console.log('Updated page variants:', pageId, variantCount);
    window.alert(`Variant count set to ${variantCount}`);
  };

  const handleViewAnalytics = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    console.log('Viewing analytics for page:', pageId);
    window.alert(
      `Analytics for"${page.name}":\n\nURL: ${page.url}\nViews: ${page.views}\nConversion Rate: ${page.conversionRate}%\nVariants: ${page.variantCount}\n\nDetailed analytics coming soon!`
    );
  };

  const handleArchive = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    if (!window.confirm(`Archive landing page"${page.name}"?`)) return;

    const updated = pages.map((p) => (p.id === pageId ? { ...p, status: 'archived' as const } : p));
    onChange(updated);
    console.log('Archived page:', pageId);
    window.alert('Landing page archived.');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <h2 className="text-lg font-bold text-[#111827] mb-4">Landing Pages Manager</h2>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Create Landing Page
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Landing Page</h3>

          {/* Page Name */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Page Name</label>
            <input
              type="text"
              placeholder="e.g., UX Bootcamp Promo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* URL */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">URL Path</label>
            <input
              type="text"
              placeholder="e.g., /ux-bootcamp-2024"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSavePage}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Create Page
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

      {/* Pages List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {pages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No landing pages yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first landing page</p>
          </div>
        )}
        {pages.map((page) => {
          const statusConfig = getStatusConfig(page.status);

          return (
            <div
              key={page.id}
              className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#111827] mb-1">{page.name}</div>
                  <div className="text-xs text-[#304DB5] hover:underline">
                    <a href={page.url} target="_blank" rel="noopener noreferrer">
                      {page.url}
                    </a>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                  <div className="text-xs text-[#9CA3B5]">Views</div>
                  <div className="text-sm font-bold text-[#111827]">{page.views}</div>
                </div>
                <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                  <div className="text-xs text-[#9CA3B5]">Conversion</div>
                  <div className="text-sm font-bold text-[#111827]">{page.conversionRate}%</div>
                </div>
                <div className="text-center p-2 bg-[#F5F7FF] rounded-lg">
                  <div className="text-xs text-[#9CA3B5]">Variants</div>
                  <div className="text-sm font-bold text-[#111827]">{page.variantCount}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs flex-wrap">
                {page.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handlePublish(page.id)}
                      className="font-semibold text-[#059669] hover:text-[#10B981] transition-colors"
                    >
                      Publish
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                {page.status === 'published' && (
                  <>
                    <button
                      onClick={() => handleUnpublish(page.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Unpublish
                    </button>
                    <span className="text-[#E5E7EB]">|</span>
                  </>
                )}

                <button
                  onClick={() => handleEditUrl(page.id)}
                  className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
                >
                  Edit URL
                </button>
                <span className="text-[#E5E7EB]">|</span>
                <button
                  onClick={() => handleManageVariants(page.id)}
                  className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
                >
                  Variants
                </button>
                <span className="text-[#E5E7EB]">|</span>
                <button
                  onClick={() => handleViewAnalytics(page.id)}
                  className="font-semibold text-[#7C3AED] hover:text-[#A78BFA] transition-colors"
                >
                  Analytics
                </button>

                {page.status !== 'archived' && (
                  <>
                    <span className="text-[#E5E7EB]">|</span>
                    <button
                      onClick={() => handleArchive(page.id)}
                      className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LandingPagesManagerPanel;
