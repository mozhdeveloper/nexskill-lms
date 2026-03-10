import React, { useState } from 'react';
import { PLATFORM_FEE_PERCENT, computeFees } from '../../../config/platformFees';

type PricingMode = 'free' | 'one-time' | 'subscription';

interface PricingData {
  mode: PricingMode;
  price: number;
  currency: string;
  salePrice?: number;
  subscriptionInterval?: 'monthly' | 'yearly';
}

interface CoursePricingFormProps {
  pricing: PricingData;
  onChange: (pricing: PricingData) => void;
  onSave?: () => Promise<void>;
}

const CoursePricingForm: React.FC<CoursePricingFormProps> = ({ pricing, onChange, onSave }) => {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        alert('Failed to save pricing');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Course pricing</h2>
      <p className="text-slate-600 dark:text-dark-text-secondary mb-6">
        Set how students will pay for your course.
      </p>

      <div className="space-y-6">
        {/* Pricing mode */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-3">
            Pricing model
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...pricing, mode: 'free', price: 0 })}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                pricing.mode === 'free'
                  ? 'border-[#304DB5] bg-blue-50'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🎁</div>
              <p className="font-semibold text-slate-900">Free</p>
              <p className="text-xs text-slate-600">No charge</p>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...pricing, mode: 'one-time' })}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                pricing.mode === 'one-time'
                  ? 'border-[#304DB5] bg-blue-50'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">💰</div>
              <p className="font-semibold text-slate-900">One-time</p>
              <p className="text-xs text-slate-600">Single payment</p>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...pricing, mode: 'subscription' })}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                pricing.mode === 'subscription'
                  ? 'border-[#304DB5] bg-blue-50'
                  : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🔄</div>
              <p className="font-semibold text-slate-900">Subscription</p>
              <p className="text-xs text-slate-600">Recurring</p>
            </button>
          </div>
        </div>

        {/* Price inputs (only if not free) */}
        {pricing.mode !== 'free' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={pricing.currency}
                  onChange={(e) => onChange({ ...pricing, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Base price
                </label>
                <input
                  type="number"
                  id="price"
                  value={pricing.price}
                  onChange={(e) =>
                    onChange({ ...pricing, price: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Subscription interval */}
            {pricing.mode === 'subscription' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                  Billing interval
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...pricing, subscriptionInterval: 'monthly' })
                    }
                    className={`flex-1 py-3 px-6 rounded-xl border-2 font-medium transition-all ${
                      pricing.subscriptionInterval === 'monthly'
                        ? 'border-[#304DB5] bg-blue-50 text-[#304DB5]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-700 dark:text-dark-text-primary hover:border-slate-300'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...pricing, subscriptionInterval: 'yearly' })
                    }
                    className={`flex-1 py-3 px-6 rounded-xl border-2 font-medium transition-all ${
                      pricing.subscriptionInterval === 'yearly'
                        ? 'border-[#304DB5] bg-blue-50 text-[#304DB5]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-700 dark:text-dark-text-primary hover:border-slate-300'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            )}

            {/* Sale price (optional) */}
            <div>
              <label htmlFor="salePrice" className="block text-sm font-semibold text-slate-700 dark:text-dark-text-primary mb-2">
                Sale price (optional)
              </label>
              <input
                type="number"
                id="salePrice"
                value={pricing.salePrice || ''}
                onChange={(e) =>
                  onChange({
                    ...pricing,
                    salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                min="0"
                step="0.01"
                placeholder="Leave empty for no sale"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1">
                If set, the sale price will be shown with strikethrough on the base price
              </p>
            </div>

            {/* Platform fee breakdown */}
            {pricing.price > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Earnings breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Course price</span>
                    <span className="font-medium text-slate-900 dark:text-white">₱{pricing.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span className="font-medium text-red-600">−₱{computeFees(pricing.price).platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span className="font-semibold text-slate-900 dark:text-white">You earn per sale</span>
                    <span className="font-bold text-green-600">₱{computeFees(pricing.price).coachEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Save button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save pricing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursePricingForm;
