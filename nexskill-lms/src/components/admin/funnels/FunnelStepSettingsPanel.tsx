import React, { useState, useEffect } from 'react';

interface FunnelStep {
  id: string;
  type: 'entry' | 'page' | 'email' | 'checkout' | 'webhook' | 'end';
  label: string;
  variantKey?: 'A' | 'B';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

interface FunnelStepSettingsPanelProps {
  step: FunnelStep | null;
  onUpdateStep: (stepId: string, patch: Partial<FunnelStep>) => void;
}

const FunnelStepSettingsPanel: React.FC<FunnelStepSettingsPanelProps> = ({
  step,
  onUpdateStep,
}) => {
  const [formData, setFormData] = useState({
    label: '',
    urlPath: '',
    headline: '',
    ctaLabel: '',
    emailTemplate: 'welcome',
    emailSubject: '',
    sendDelay: 0,
    sendDelayUnit: 'minutes',
    offerName: '',
    price: '',
    paymentProvider: 'stripe',
    webhookUrl: '',
    httpMethod: 'POST',
    skipTracking: false,
    notes: '',
  });

  // Sync form data when step changes
  useEffect(() => {
    if (step) {
      setFormData({
        label: step.label,
        urlPath: step.settings?.urlPath || '',
        headline: step.settings?.headline || '',
        ctaLabel: step.settings?.ctaLabel || '',
        emailTemplate: step.settings?.emailTemplate || 'welcome',
        emailSubject: step.settings?.emailSubject || '',
        sendDelay: step.settings?.sendDelay || 0,
        sendDelayUnit: step.settings?.sendDelayUnit || 'minutes',
        offerName: step.settings?.offerName || '',
        price: step.settings?.price || '',
        paymentProvider: step.settings?.paymentProvider || 'stripe',
        webhookUrl: step.settings?.webhookUrl || '',
        httpMethod: step.settings?.httpMethod || 'POST',
        skipTracking: step.settings?.skipTracking || false,
        notes: step.settings?.notes || '',
      });
    }
  }, [step?.id]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    if (!step) return;

    const settings: Record<string, any> = {
      skipTracking: formData.skipTracking,
      notes: formData.notes,
    };

    // Add type-specific settings
    if (step.type === 'entry' || step.type === 'page') {
      settings.urlPath = formData.urlPath;
      settings.headline = formData.headline;
      settings.ctaLabel = formData.ctaLabel;
    } else if (step.type === 'email') {
      settings.emailTemplate = formData.emailTemplate;
      settings.emailSubject = formData.emailSubject;
      settings.sendDelay = formData.sendDelay;
      settings.sendDelayUnit = formData.sendDelayUnit;
    } else if (step.type === 'checkout') {
      settings.offerName = formData.offerName;
      settings.price = formData.price;
      settings.paymentProvider = formData.paymentProvider;
    } else if (step.type === 'webhook') {
      settings.webhookUrl = formData.webhookUrl;
      settings.httpMethod = formData.httpMethod;
    }

    onUpdateStep(step.id, {
      label: formData.label,
      settings,
    });
  };

  if (!step) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-[#EDF0FB] p-6">
        <h3 className="text-lg font-bold text-[#111827] mb-3 flex items-center gap-2">
          <span>⚙️</span> Step Settings
        </h3>
        <p className="text-sm text-[#9CA3B5]">
          Select a step on the canvas to configure it.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#EDF0FB] p-6">
      {/* Header */}
      <h3 className="text-lg font-bold text-[#111827] mb-2 flex items-center gap-2">
        <span>⚙️</span> Step Settings
      </h3>
      <p className="text-xs text-[#5F6473] mb-4">
        <span className="capitalize font-semibold">{step.type}</span> – {step.label}
      </p>

      {/* Form */}
      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Step Label
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
          />
        </div>

        {/* Type-specific fields */}
        {(step.type === 'entry' || step.type === 'page') && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                URL Path / Slug
              </label>
              <input
                type="text"
                value={formData.urlPath}
                onChange={(e) => handleChange('urlPath', e.target.value)}
                placeholder="/landing-page"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="Your compelling headline"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Primary CTA Label
              </label>
              <input
                type="text"
                value={formData.ctaLabel}
                onChange={(e) => handleChange('ctaLabel', e.target.value)}
                placeholder="Get Started"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
          </>
        )}

        {step.type === 'email' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Email Template
              </label>
              <select
                value={formData.emailTemplate}
                onChange={(e) => handleChange('emailTemplate', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] bg-white"
              >
                <option value="welcome">Welcome Email</option>
                <option value="followup">Follow-up Email</option>
                <option value="abandoned_cart">Abandoned Cart</option>
                <option value="upsell">Upsell Offer</option>
                <option value="custom">Custom Template</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.emailSubject}
                onChange={(e) => handleChange('emailSubject', e.target.value)}
                placeholder="Welcome to our course!"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Send Delay
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.sendDelay}
                  onChange={(e) => handleChange('sendDelay', parseInt(e.target.value) || 0)}
                  min="0"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
                />
                <select
                  value={formData.sendDelayUnit}
                  onChange={(e) => handleChange('sendDelayUnit', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] bg-white"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <p className="text-xs text-[#9CA3B5] mt-1">After previous step</p>
            </div>
          </>
        )}

        {step.type === 'checkout' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Offer Name
              </label>
              <input
                type="text"
                value={formData.offerName}
                onChange={(e) => handleChange('offerName', e.target.value)}
                placeholder="Premium Course Bundle"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Price
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="$99.00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Payment Provider
              </label>
              <select
                value={formData.paymentProvider}
                onChange={(e) => handleChange('paymentProvider', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] bg-white"
              >
                <option value="stripe">Stripe (simulated)</option>
                <option value="paypal">PayPal (simulated)</option>
                <option value="custom">Custom Gateway</option>
              </select>
            </div>
          </>
        )}

        {step.type === 'webhook' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Endpoint URL
              </label>
              <input
                type="text"
                value={formData.webhookUrl}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                HTTP Method
              </label>
              <select
                value={formData.httpMethod}
                onChange={(e) => handleChange('httpMethod', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] bg-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </>
        )}

        {/* Common fields */}
        <div className="pt-3 border-t border-[#EDF0FB]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.skipTracking}
              onChange={(e) => handleChange('skipTracking', e.target.checked)}
              className="w-4 h-4 rounded border-[#EDF0FB] text-[#304DB5] focus:ring-[#E0E5FF]"
            />
            <span className="text-xs font-medium text-[#111827]">
              Skip tracking for this step
            </span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Internal notes about this step..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#EDF0FB] focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-[#E0E5FF] resize-none"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          💾 Save Step Settings
        </button>
      </div>
    </div>
  );
};

export default FunnelStepSettingsPanel;
