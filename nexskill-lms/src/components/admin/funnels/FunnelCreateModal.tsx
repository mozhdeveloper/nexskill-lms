import React, { useState } from 'react';

interface FunnelCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (funnelData: {
    name: string;
    objective: string;
    entryPointType: string;
    description?: string;
  }) => void;
}

const FunnelCreateModal: React.FC<FunnelCreateModalProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    objective: 'Lead gen',
    entryPointType: 'Landing page',
    description: '',
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'name' && errors.name) {
      setErrors({ ...errors, name: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Funnel name is required' });
      return;
    }

    onCreate({
      name: formData.name.trim(),
      objective: formData.objective,
      entryPointType: formData.entryPointType,
      description: formData.description.trim() || undefined,
    });

    // Reset form
    setFormData({
      name: '',
      objective: 'Lead gen',
      entryPointType: 'Landing page',
      description: '',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      objective: 'Lead gen',
      entryPointType: 'Landing page',
      description: '',
    });
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Create Funnel</h2>
          <p className="text-sm text-[#5F6473]">
            Set up your funnel details before building the journey.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Funnel Name */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Funnel Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., UX Bootcamp Lead Magnet"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.name
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-[#EDF0FB] focus:border-[#304DB5] focus:ring-[#E0E5FF]'
              } focus:outline-none focus:ring-2 text-sm`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Objective
            </label>
            <select
              value={formData.objective}
              onChange={(e) => handleChange('objective', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
            >
              <option value="Lead gen">Lead gen</option>
              <option value="Course enrollment">Course enrollment</option>
              <option value="Webinar signup">Webinar signup</option>
              <option value="Upsell">Upsell</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Entry Point Type */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Entry Point Type
            </label>
            <select
              value={formData.entryPointType}
              onChange={(e) => handleChange('entryPointType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm bg-white cursor-pointer"
            >
              <option value="Landing page">Landing page</option>
              <option value="Existing course sales page">Existing course sales page</option>
              <option value="Checkout">Checkout</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this funnel's purpose..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] text-sm resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-[#EDF0FB] text-[#5F6473] font-semibold rounded-full hover:bg-[#E0E5FF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Create & Open Builder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FunnelCreateModal;
