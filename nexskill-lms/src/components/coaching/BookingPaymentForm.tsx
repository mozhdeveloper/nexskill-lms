import React, { useState } from 'react';

interface BookingPaymentFormProps {
  price: number;
  onConfirm: () => void;
  isProcessing?: boolean;
}

const BookingPaymentForm: React.FC<BookingPaymentFormProps> = ({
  price,
  onConfirm,
  isProcessing = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const creditAmount = 15;
  const finalPrice = Math.max(0, price - creditAmount);

  const handleConfirm = () => {
    if (paymentMethod === 'card') {
      if (!cardName || !cardNumber || !expiry || !cvc) {
        alert('Please fill in all card details');
        return;
      }
    }
    onConfirm();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Payment details</h3>

      {/* Price summary */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-600">Session price</span>
          <span className="font-semibold text-slate-900">₱{price}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-600 text-sm">Membership coaching credit</span>
          <span className="font-semibold text-green-600">-₱{creditAmount}</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-bold text-2xl text-slate-900">₱{finalPrice}</span>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment method</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50">
            <input
              type="radio"
              name="paymentMethod"
              value="credit"
              checked={paymentMethod === 'credit'}
              onChange={() => setPaymentMethod('credit')}
              className="w-4 h-4 text-[#304DB5]"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900">Use coaching credit</div>
              <div className="text-sm text-slate-600">You have ₱{creditAmount} available</div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Free
            </span>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="w-4 h-4 text-[#304DB5]"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900">Pay by card</div>
              <div className="text-sm text-slate-600">Credit or debit card</div>
            </div>
          </label>
        </div>
      </div>

      {/* Card details (conditional) */}
      {paymentMethod === 'card' && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name on card</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Card number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={isProcessing}
        className={`w-full py-3 px-6 rounded-full font-semibold transition-all ${
          isProcessing
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Confirm booking'}
      </button>

      {/* Security note */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secure payment processed by Stripe</span>
      </div>
    </div>
  );
};

export default BookingPaymentForm;
