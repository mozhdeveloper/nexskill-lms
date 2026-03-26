import React, { useState, useEffect, useRef } from "react";
import { formatPrice } from "../../utils/formatPrice";
import { supabase } from "../../lib/supabaseClient"; // adjust path to your Supabase client

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  price: number;
  originalPrice?: number;
  userId: string;
  onPaymentSuccess: () => void;
}

type PaymentMethod = "card" | "paypal";
type CardType = "visa" | "mastercard" | "amex" | "unknown";

interface BillingForm {
  fullName: string;
  country: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface CardForm {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
];

function detectCardType(number: string): CardType {
  const raw = number.replace(/\s/g, "");
  if (/^4/.test(raw)) return "visa";
  if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return "mastercard";
  if (/^3[47]/.test(raw)) return "amex";
  return "unknown";
}

function formatCardNumber(value: string, cardType: CardType): string {
  const raw = value.replace(/\D/g, "");
  if (cardType === "amex") {
    // 4-6-5 format
    return raw
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(" ")
      );
  }
  // 4-4-4-4 format
  return raw
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const raw = value.replace(/\D/g, "").slice(0, 4);
  if (raw.length >= 3) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
  return raw;
}

function isExpiryValid(expiry: string): boolean {
  const [mm, yy] = expiry.split("/");
  if (!mm || !yy || yy.length < 2) return false;
  const month = parseInt(mm, 10);
  const year = parseInt(`20${yy}`, 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1)
  );
}

// ─── Card Type Icons (SVG inline) ─────────────────────────────────────────────

const VisaIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 48 30"
    className={`w-10 h-6 transition-opacity ${active ? "opacity-100" : "opacity-30"}`}
    aria-label="Visa"
  >
    <rect width="48" height="30" rx="4" fill="#1A1F71" />
    <text x="7" y="22" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">
      VISA
    </text>
  </svg>
);

const MastercardIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 48 30"
    className={`w-10 h-6 transition-opacity ${active ? "opacity-100" : "opacity-30"}`}
    aria-label="Mastercard"
  >
    <rect width="48" height="30" rx="4" fill="#252525" />
    <circle cx="18" cy="15" r="9" fill="#EB001B" />
    <circle cx="30" cy="15" r="9" fill="#F79E1B" />
    <path d="M24 7.8a9 9 0 0 1 0 14.4A9 9 0 0 1 24 7.8z" fill="#FF5F00" />
  </svg>
);

const AmexIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 48 30"
    className={`w-10 h-6 transition-opacity ${active ? "opacity-100" : "opacity-30"}`}
    aria-label="American Express"
  >
    <rect width="48" height="30" rx="4" fill="#2E77BC" />
    <text x="5" y="20" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">
      AMERICAN
    </text>
    <text x="5" y="27" fill="white" fontSize="5.5" fontFamily="Arial" letterSpacing="1">
      EXPRESS
    </text>
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wide">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const baseInput =
  "w-full px-4 py-2.5 rounded-xl border border-[#EDF0FB] dark:border-gray-700 bg-white dark:bg-dark-background text-text-primary dark:text-dark-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all";

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  price,
  originalPrice,
  userId,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [billing, setBilling] = useState<BillingForm>({
    fullName: "",
    country: "PH",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const [card, setCard] = useState<CardForm>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  });

  const [billingErrors, setBillingErrors] = useState<Partial<BillingForm>>({});
  const [cardErrors, setCardErrors] = useState<Partial<CardForm>>({});

  const cardType = detectCardType(card.cardNumber);
  const savings = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // ── Close on outside click / Escape ──
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // ── Validation ──
  const validateBilling = (): boolean => {
    const errs: Partial<BillingForm> = {};
    if (!billing.fullName.trim()) errs.fullName = "Full name is required";
    if (!billing.street.trim()) errs.street = "Street address is required";
    if (!billing.city.trim()) errs.city = "City is required";
    if (!billing.state.trim()) errs.state = "State/Province is required";
    if (!billing.zip.trim()) errs.zip = "ZIP/Postal code is required";
    setBillingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCard = (): boolean => {
    const errs: Partial<CardForm> = {};
    const rawNum = card.cardNumber.replace(/\s/g, "");
    const expectedLen = cardType === "amex" ? 15 : 16;
    if (rawNum.length !== expectedLen) errs.cardNumber = "Enter a valid card number";
    if (!isExpiryValid(card.expiry)) errs.expiry = "Enter a valid expiry date";
    const cvvLen = cardType === "amex" ? 4 : 3;
    if (!/^\d{3,4}$/.test(card.cvv) || card.cvv.length !== cvvLen)
      errs.cvv = `CVV must be ${cvvLen} digits`;
    if (!card.cardholderName.trim()) errs.cardholderName = "Cardholder name is required";
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    const billingOk = validateBilling();
    const cardOk = paymentMethod === "card" ? validateCard() : true;
    if (!billingOk || !cardOk) return;

    setProcessing(true);
    setTransactionError(null);

    try {
      console.log('═══════════════════════════════════════════════════════');
      console.log('💳 PAYMENT PROCESS STARTED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📋 Payment Details:');
      console.log('   - Course ID:', courseId);
      console.log('   - Course Title:', courseTitle);
      console.log('   - Price:', price);
      console.log('   - User ID:', userId);
      console.log('   - Payment Method:', paymentMethod);
      console.log('═══════════════════════════════════════════════════════');

      // 1. Fetch course details to get coach_id and course title
      console.log('📚 Step 1: Fetching course details...');
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("coach_id, title")
        .eq("id", courseId)
        .single();

      console.log('   Response:', { 
        data: courseData, 
        error: courseError 
      });

      if (courseError) {
        console.error('❌ Step 1 FAILED:', courseError);
        throw courseError;
      }
      if (!courseData) {
        console.error('❌ Step 1 FAILED: Course not found');
        throw new Error("Course not found");
      }
      console.log('✅ Step 1 SUCCESS - Coach ID:', courseData.coach_id);

      // 2. Fetch student profile for name
      console.log('👤 Step 2: Fetching student profile...');
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .single();

      console.log('   Response:', { 
        data: studentProfile, 
        error: profileError 
      });

      if (profileError) {
        console.error('❌ Step 2 FAILED:', profileError);
        throw profileError;
      }
      console.log('✅ Step 2 SUCCESS - Student:', studentProfile?.first_name);

      const studentName = studentProfile 
        ? `${studentProfile.first_name || ""} ${studentProfile.last_name || ""}`.trim() || "Student"
        : "Student";

      // 3. Create transaction record FIRST (before enrollment)
      console.log('💳 Step 3: Creating transaction record...');
      const transactionPayload = {
        coach_id: courseData.coach_id,
        course_id: courseId,
        student_id: userId,
        student_name: studentName,
        student_email: studentProfile?.email,
        course_title: courseData.title,
        type: "sale",
        amount: Number(price),
        currency: "PHP",
        status: "pending",
        description: `Course purchase: ${courseTitle}`,
        payment_method: paymentMethod,
        payment_reference: `TXN-${Date.now()}`,
        platform_fee: Number(price) * 0.05,
        net_amount: Number(price) * 0.95,
        created_at: new Date().toISOString(),
      };

      console.log('   Payload:', JSON.stringify(transactionPayload, null, 2));

      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionPayload)
        .select("id, status")
        .single();

      console.log('   Response:', { 
        data: transactionData, 
        error: transactionError 
      });

      if (transactionError) {
        console.error('❌ Step 3 FAILED - Transaction Insert Error:');
        console.error('   Code:', transactionError.code);
        console.error('   Message:', transactionError.message);
        console.error('   Details:', transactionError.details);
        console.error('   Hint:', transactionError.hint);
        console.error('');
        console.error('   🔍 LIKELY CAUSE: RLS Policy is blocking INSERT');
        console.error('   ✅ SOLUTION: Run this SQL in Supabase:');
        console.error('   ────────────────────────────────────────────────');
        console.error('   DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;');
        console.error('   CREATE POLICY "Anyone can insert transactions" ON transactions');
        console.error('       FOR INSERT');
        console.error('       WITH CHECK (true);');
        console.error('   ────────────────────────────────────────────────');
        throw transactionError;
      }

      if (!transactionData) {
        console.error('❌ Step 3 FAILED: No data returned');
        throw new Error("Failed to create transaction record");
      }

      console.log('✅ Step 3 SUCCESS - Transaction ID:', transactionData.id);

      // 4. Simulate payment processing
      console.log('⏳ Step 4: Processing payment (simulating gateway)...');
      await new Promise((res) => setTimeout(res, 2000));
      
      // In production: Call real payment gateway (Stripe, PayMongo, etc.)
      const paymentGatewaySucceeded = true;
      console.log('   Payment Gateway Result:', paymentGatewaySucceeded);

      if (!paymentGatewaySucceeded) {
        console.log('   ❌ Payment failed, marking transaction as failed...');
        await supabase
          .from("transactions")
          .update({ status: "failed" })
          .eq("id", transactionData.id);

        throw new Error("Payment was declined. Please check your details and try again.");
      }

      // 5. Update transaction to completed
      console.log('✅ Step 5: Marking transaction as completed...');
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ 
          status: "completed",
          processed_at: new Date().toISOString()
        })
        .eq("id", transactionData.id);

      console.log('   Update Response:', { error: updateError });

      if (updateError) {
        console.error('❌ Step 5 FAILED:', updateError);
        throw updateError;
      }
      console.log('✅ Step 5 SUCCESS');

      // 6. Verify transaction is completed before enrolling
      console.log('🔍 Step 6: Verifying transaction status...');
      const { data: verifiedTransaction, error: verifyError } = await supabase
        .from("transactions")
        .select("status, id")
        .eq("id", transactionData.id)
        .single();

      console.log('   Verification Response:', { 
        data: verifiedTransaction, 
        error: verifyError 
      });

      if (verifyError) {
        console.error('❌ Step 6 FAILED:', verifyError);
        throw verifyError;
      }

      if (!verifiedTransaction || verifiedTransaction.status !== "completed") {
        console.error('❌ Step 6 FAILED: Transaction not completed');
        console.error('   Status:', verifiedTransaction?.status);
        throw new Error("Transaction verification failed. Payment not confirmed.");
      }

      console.log('✅ Step 6 SUCCESS - Transaction Verified:', verifiedTransaction.id);

      // 7. NOW create the enrollment (only after successful payment)
      console.log('🎓 Step 7: Creating enrollment...');
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .insert({
          profile_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
        })
        .select("profile_id, course_id, enrolled_at")
        .single();

      console.log('   Enrollment Response:', { 
        data: enrollmentData, 
        error: enrollmentError 
      });

      if (enrollmentError) {
        console.error('❌ Step 7 FAILED:', enrollmentError);
        throw enrollmentError;
      }
      console.log('✅ Step 7 SUCCESS - Enrollment Created');

      // 8. Show success and call parent callback
      console.log('🎉 Step 8: Payment complete!');
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ PAYMENT SUCCESSFUL');
      console.log('   Transaction ID:', transactionData.id);
      console.log('   Enrollment:', enrollmentData);
      console.log('═══════════════════════════════════════════════════════');
      
      setProcessing(false);
      setSuccess(true);
      await new Promise((res) => setTimeout(res, 1200));
      onPaymentSuccess();

    } catch (err: unknown) {
      console.log('❌ PAYMENT FAILED');
      console.log('═══════════════════════════════════════════════════════');
      setProcessing(false);
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setTransactionError(message);
      console.error("Full Error:", err);
      console.log('═══════════════════════════════════════════════════════');
    }
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Payment"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-background-card rounded-3xl shadow-2xl"
      >
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-dark-background-card rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-bounce">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Payment Successful!
            </h2>
            <p className="text-text-muted text-sm">Enrolling you now…</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EDF0FB] dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
              Complete Your Purchase
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Secure checkout — your info is encrypted
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EDF0FB] dark:bg-gray-700 text-text-secondary dark:text-dark-text-secondary hover:bg-[#dde2f7] dark:hover:bg-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-0">
          {/* ── Left: Form ── */}
          <div className="p-6 space-y-8">

            {/* Billing Address */}
            <section>
              <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Billing Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <InputField label="Full Name" error={billingErrors.fullName}>
                    <input
                      type="text"
                      placeholder="Juan dela Cruz"
                      value={billing.fullName}
                      onChange={(e) =>
                        setBilling((b) => ({ ...b, fullName: e.target.value }))
                      }
                      className={baseInput}
                    />
                  </InputField>
                </div>

                <div className="sm:col-span-2">
                  <InputField label="Country">
                    <select
                      value={billing.country}
                      onChange={(e) =>
                        setBilling((b) => ({ ...b, country: e.target.value }))
                      }
                      className={baseInput}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </InputField>
                </div>

                <div className="sm:col-span-2">
                  <InputField label="Street Address" error={billingErrors.street}>
                    <input
                      type="text"
                      placeholder="123 Rizal Avenue"
                      value={billing.street}
                      onChange={(e) =>
                        setBilling((b) => ({ ...b, street: e.target.value }))
                      }
                      className={baseInput}
                    />
                  </InputField>
                </div>

                <InputField label="City" error={billingErrors.city}>
                  <input
                    type="text"
                    placeholder="Makati City"
                    value={billing.city}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, city: e.target.value }))
                    }
                    className={baseInput}
                  />
                </InputField>

                <InputField label="State / Province" error={billingErrors.state}>
                  <input
                    type="text"
                    placeholder="Metro Manila"
                    value={billing.state}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, state: e.target.value }))
                    }
                    className={baseInput}
                  />
                </InputField>

                <InputField label="ZIP / Postal Code" error={billingErrors.zip}>
                  <input
                    type="text"
                    placeholder="1200"
                    value={billing.zip}
                    onChange={(e) =>
                      setBilling((b) => ({ ...b, zip: e.target.value }))
                    }
                    className={baseInput}
                  />
                </InputField>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Payment Method
              </h3>

              {/* Method Toggle */}
              <div className="flex gap-3 mb-5">
                {(["card", "paypal"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === m
                        ? "border-brand-primary bg-brand-primary-soft dark:bg-blue-900/20 text-brand-primary"
                        : "border-[#EDF0FB] dark:border-gray-700 text-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/40"
                    }`}
                  >
                    {m === "card" ? "💳 Credit / Debit Card" : "🅿️ PayPal"}
                  </button>
                ))}
              </div>

              {/* Card Form */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <VisaIcon active={cardType === "visa"} />
                    <MastercardIcon active={cardType === "mastercard"} />
                    <AmexIcon active={cardType === "amex"} />
                  </div>

                  <InputField label="Card Number" error={cardErrors.cardNumber}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={card.cardNumber}
                      onChange={(e) => {
                        const type = detectCardType(e.target.value);
                        setCard((c) => ({
                          ...c,
                          cardNumber: formatCardNumber(e.target.value, type),
                        }));
                      }}
                      className={baseInput}
                      maxLength={cardType === "amex" ? 17 : 19}
                    />
                  </InputField>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Expiry (MM/YY)" error={cardErrors.expiry}>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            expiry: formatExpiry(e.target.value),
                          }))
                        }
                        className={baseInput}
                        maxLength={5}
                      />
                    </InputField>

                    <InputField
                      label={`CVV (${cardType === "amex" ? "4" : "3"} digits)`}
                      error={cardErrors.cvv}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={cardType === "amex" ? "4-digit" : "3-digit"}
                        value={card.cvv}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, cardType === "amex" ? 4 : 3),
                          }))
                        }
                        className={baseInput}
                        maxLength={4}
                      />
                    </InputField>
                  </div>

                  <InputField label="Cardholder Name" error={cardErrors.cardholderName}>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={card.cardholderName}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cardholderName: e.target.value }))
                      }
                      className={baseInput}
                    />
                  </InputField>
                </div>
              )}

              {/* PayPal */}
              {paymentMethod === "paypal" && (
                <div className="rounded-2xl border-2 border-[#EDF0FB] dark:border-gray-700 p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto">
                    <span className="text-3xl">🅿️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      Pay with PayPal
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      You'll be redirected to PayPal to complete your payment securely.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFC439] hover:bg-[#F0B429] text-[#003087] font-bold text-sm rounded-full cursor-pointer transition-colors">
                    <span>Pay with</span>
                    <span className="font-black tracking-tight">Pay</span>
                    <span className="font-black tracking-tight text-[#003087]/50">Pal</span>
                  </div>
                  <p className="text-xs text-text-muted italic">
                    (PayPal integration coming soon — clicking Buy Now will simulate success)
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="p-6 bg-[#F8F9FF] dark:bg-gray-800/50 rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl border-t md:border-t-0 md:border-l border-[#EDF0FB] dark:border-gray-700">
            <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4 uppercase tracking-wide">
              Order Summary
            </h3>

            <div className="rounded-2xl bg-white dark:bg-dark-background-card border border-[#EDF0FB] dark:border-gray-700 p-4 mb-4">
              <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary leading-snug mb-3">
                {courseTitle}
              </p>

              {originalPrice && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-muted">Original price</span>
                  <span className="text-text-muted line-through">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
              )}
              {originalPrice && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-green-600">Discount</span>
                  <span className="text-green-600 font-medium">-{savings}%</span>
                </div>
              )}

              <div className="border-t border-[#EDF0FB] dark:border-gray-700 mt-3 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                  Total
                </span>
                <span className="text-lg font-bold text-text-primary dark:text-dark-text-primary">
                  {formatPrice(price)}
                </span>
              </div>
            </div>

            {/* Security badges */}
            <div className="space-y-2 mb-6">
              {["🔒 SSL Encrypted Checkout", "✓ 30-day money-back guarantee", "✓ Instant access after payment"].map(
                (badge) => (
                  <p key={badge} className="text-xs text-text-muted flex items-start gap-1.5">
                    <span>{badge}</span>
                  </p>
                )
              )}
            </div>

            {/* Transaction Error */}
            {transactionError && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 mb-3 flex items-start gap-2">
                <span className="text-red-500 mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs text-red-600 dark:text-red-400">{transactionError}</p>
              </div>
            )}

            {/* Buy Now Button */}
            <button
              onClick={handleSubmit}
              disabled={processing || success}
              className="w-full py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Processing payment…
                </span>
              ) : (
                `Buy Now · ${formatPrice(price)}`
              )}
            </button>

            <p className="text-center text-xs text-text-muted mt-3">
              By purchasing, you agree to our{" "}
              <span className="underline cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;