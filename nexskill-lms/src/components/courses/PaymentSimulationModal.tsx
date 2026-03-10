import React, { useState } from 'react';
import { PLATFORM_FEE_PERCENT, computeFees } from '../../config/platformFees';

interface PaymentSimulationModalProps {
  courseTitle: string;
  price: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const PaymentSimulationModal: React.FC<PaymentSimulationModalProps> = ({
  courseTitle,
  price,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { platformFee, coachEarnings } = computeFees(price);

  const isFormValid =
    agreed &&
    (paymentMethod === 'card'
      ? cardName.trim() && cardNumber.trim() && expiry.trim() && cvc.trim()
      : gcashNumber.trim().length >= 11);

  const handleSubmit = () => {
    if (!isFormValid || isProcessing) return;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complete payment</h2>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Enrolling in: <span className="font-medium text-slate-700 dark:text-gray-300">{courseTitle}</span></p>
        </div>

        <div className="p-6 space-y-6">
          {/* Price breakdown */}
          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-gray-400">Course price</span>
              <span className="font-semibold text-slate-900 dark:text-white">₱{price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500">
              <span>Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span>₱{platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500">
              <span>Coach receives</span>
              <span>₱{coachEarnings.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-gray-700 flex justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">Total</span>
              <span className="font-bold text-xl text-slate-900 dark:text-white">₱{price.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment method tabs */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Payment method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === 'card'
                    ? 'border-[#304DB5] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                }`}
              >
                <div className="text-lg mb-1">💳</div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Credit / Debit Card</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === 'gcash'
                    ? 'border-[#304DB5] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                }`}
              >
                <div className="text-lg mb-1">📱</div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">GCash</p>
              </button>
            </div>
          </div>

          {/* Card form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Name on card</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Card number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Expiry</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GCash form */}
          {paymentMethod === 'gcash' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">GCash number</label>
              <input
                type="text"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                placeholder="09XX XXX XXXX"
                maxLength={13}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">You will receive a simulated OTP confirmation</p>
            </div>
          )}

          {/* Agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#304DB5] focus:ring-[#304DB5]"
            />
            <span className="text-xs text-slate-600 dark:text-gray-400">
              I agree to pay <strong>₱{price.toLocaleString()}</strong> for this course. This is a simulated payment for demonstration purposes.
            </span>
          </label>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isProcessing}
            className={`w-full py-3 px-6 rounded-full font-semibold transition-all ${
              !isFormValid || isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing payment...
              </span>
            ) : (
              `Pay ₱${price.toLocaleString()}`
            )}
          </button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Simulated secure payment · No real charges</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulationModal;
