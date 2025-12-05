import React, { useState } from 'react';

interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  leadCount?: number;
  category?: 'source' | 'interest' | 'stage' | 'custom';
}

interface LeadTagsManagerProps {
  tags: Tag[];
  onChange: (updatedTags: Tag[]) => void;
  onFilterByTag: (tagId: string) => void;
}

const LeadTagsManager: React.FC<LeadTagsManagerProps> = ({ tags, onChange, onFilterByTag }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'custom' as 'source' | 'interest' | 'stage' | 'custom',
    color: '#304DB5',
    description: '',
  });

  const colorOptions = [
    { value: '#304DB5', label: 'Blue' },
    { value: '#059669', label: 'Green' },
    { value: '#D97706', label: 'Orange' },
    { value: '#DC2626', label: 'Red' },
    { value: '#7C3AED', label: 'Purple' },
  ];

  const handleCreateTag = () => {
    if (!formData.name.trim()) {
      window.alert('Please enter a tag name.');
      return;
    }

    // Check for duplicate
    if (tags.some((t) => t.name.toLowerCase() === formData.name.toLowerCase())) {
      window.alert('A tag with this name already exists.');
      return;
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      color: formData.color,
      description: formData.description || undefined,
      leadCount: 0,
    };

    onChange([...tags, newTag]);
    console.log('Created tag:', newTag);

    // Reset form
    setFormData({
      name: '',
      category: 'custom',
      color: '#304DB5',
      description: '',
    });
    setIsCreating(false);
    window.alert(`Tag"${newTag.name}" created successfully!`);
  };

  const handleRename = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    const newName = window.prompt('Enter new tag name:', tag.name);
    if (!newName || newName.trim() === '') return;

    const updated = tags.map((t) => (t.id === tagId ? { ...t, name: newName.trim() } : t));
    onChange(updated);
    console.log('Renamed tag:', tagId, 'to', newName);
  };

  const handleChangeCategory = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    const categories = ['source', 'interest', 'stage', 'custom'];
    const newCategory = window.prompt(
      `Select category (${categories.join(', ')}):`,
      tag.category || 'custom'
    );

    if (!newCategory || !categories.includes(newCategory)) return;

    const updated = tags.map((t) =>
      t.id === tagId
        ? { ...t, category: newCategory as 'source' | 'interest' | 'stage' | 'custom' }
        : t
    );
    onChange(updated);
    console.log('Changed tag category:', tagId, 'to', newCategory);
  };

  const handleDelete = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    if (!window.confirm(`Delete tag"${tag.name}"?`)) return;

    const updated = tags.filter((t) => t.id !== tagId);
    onChange(updated);
    console.log('Deleted tag:', tagId);
    window.alert(`Tag"${tag.name}" has been deleted.`);
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'source':
        return 'Source';
      case 'interest':
        return 'Interest';
      case 'stage':
        return 'Lifecycle Stage';
      case 'custom':
        return 'Custom';
      default:
        return 'Uncategorized';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md p-5">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#111827] mb-1">Lead Tags</h2>
        <p className="text-xs text-[#5F6473]">
          Standardize how you segment leads across the platform
        </p>
      </div>

      {/* Create Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mb-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
        >
          + Add Tag
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F5F7FF] to-white rounded-xl border border-[#EDF0FB]">
          <h3 className="text-sm font-bold text-[#111827] mb-3">New Tag</h3>

          {/* Tag Name */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Tag Name</label>
            <input
              type="text"
              placeholder="e.g., Hot Lead"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as 'source' | 'interest' | 'stage' | 'custom',
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            >
              <option value="source">Source</option>
              <option value="interest">Interest</option>
              <option value="stage">Lifecycle Stage</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Color */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, color: option.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === option.value
                      ? 'border-[#111827] scale-110'
                      : 'border-[#E5E7EB]'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#5F6473] mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="Brief description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#304DB5]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCreateTag}
              className="flex-1 py-2 text-sm font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-full hover:shadow-md transition-shadow"
            >
              Create Tag
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

      {/* Tags List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {tags.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏷️</div>
            <p className="text-sm font-semibold text-[#111827] mb-1">No tags created yet</p>
            <p className="text-xs text-[#9CA3B5]">Create your first tag to get started</p>
          </div>
        )}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="p-3 rounded-xl border border-[#EDF0FB] bg-gradient-to-br from-[#F5F7FF] to-white"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
                <span className="text-xs text-[#9CA3B5]">{getCategoryLabel(tag.category)}</span>
              </div>
              {tag.leadCount !== undefined && (
                <span className="text-xs font-semibold text-[#5F6473]">
                  {tag.leadCount} leads
                </span>
              )}
            </div>

            {/* Description */}
            {tag.description && (
              <p className="text-xs text-[#5F6473] mb-2">{tag.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]/50 text-xs">
              <button
                onClick={() => onFilterByTag(tag.id)}
                className="font-semibold text-[#304DB5] hover:text-[#5E7BFF] transition-colors"
              >
                Filter Leads
              </button>
              <span className="text-[#E5E7EB]">|</span>
              <button
                onClick={() => handleRename(tag.id)}
                className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
              >
                Rename
              </button>
              <span className="text-[#E5E7EB]">|</span>
              <button
                onClick={() => handleChangeCategory(tag.id)}
                className="font-semibold text-[#5F6473] hover:text-[#111827] transition-colors"
              >
                Category
              </button>
              <span className="text-[#E5E7EB]">|</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="font-semibold text-[#DC2626] hover:text-[#EF4444] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadTagsManager;
