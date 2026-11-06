import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { EventItem, TicketType, Order, Ticket } from '../types';
import { notificationService } from '../services/notificationService';
import {
  X,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Tag,
  ArrowRight,
  Download,
  Receipt
} from 'lucide-react';

interface CheckoutModalProps {
  event: EventItem;
  ticketTypes: TicketType[];
  selectedItems: { ticketTypeId: string; quantity: number }[];
  holdToken?: string;
  onClose: () => void;
  onSuccess: (order: Order, tickets: Ticket[]) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  event,
  ticketTypes,
  selectedItems,
  holdToken,
  onClose,
  onSuccess,
}) => {
  // Buyer Details
  const [buyerName, setBuyerName] = useState('Amina Mwangi');
  const [buyerEmail, setBuyerEmail] = useState('amina.mwangi@example.com');
  const [buyerPhone, setBuyerPhone] = useState('0720998877');

  // Payment Options: 'mpesa' | 'card'
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkPromptVisible, setStkPromptVisible] = useState(false);
  const [stkCountdown, setStkCountdown] = useState(15);
  const [mpesaPin, setMpesaPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 10-minute hold timer (FR12)
  const [secondsRemaining, setSecondsRemaining] = useState(600); // 10 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculations
  const subtotal = selectedItems.reduce((sum, item) => {
    const tt = ticketTypes.find((t) => t.id === item.ticketTypeId);
    return sum + (tt?.price || 0) * item.quantity;
  }, 0);

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discount = Math.round((subtotal * appliedPromo.value) / 100);
    } else {
      discount = Math.min(subtotal, appliedPromo.value);
    }
  }

  const platformFee = Math.round((subtotal - discount) * 0.03); // 3%
  const total = Math.max(0, subtotal - discount + platformFee);

  // Apply Promo Code
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoError(null);

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCodeInput.trim(), eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Invalid code');
        return;
      }
      setAppliedPromo(data.promo);
    } catch {
      setPromoError('Failed to validate promo code');
    }
  };

  // Checkout submission
  const handleInitiatePayment = async () => {
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setErrorMsg('Please provide your name, email, and phone number.');
      return;
    }

    if (secondsRemaining <= 0) {
      setErrorMsg('Your 10-minute hold reservation has expired. Please reselect tickets.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    if (paymentMethod === 'mpesa') {
      // Show simulated STK push prompt on user's phone
      setStkPromptVisible(true);
      setStkCountdown(15);
    } else {
      // Process card payment directly
      await finalizeOrder();
    }
  };

  // Finalize order API call after payment confirmation (FR15)
  const finalizeOrder = async () => {
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerPhone,
          eventId: event.id,
          items: selectedItems,
          promoCode: appliedPromo?.code,
          paymentMethod,
          holdToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Payment failed');
        setIsProcessing(false);
        setStkPromptVisible(false);
        return;
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6'],
        });
      } catch {}

      // Trigger Browser & In-App Notification
      try {
        notificationService.sendTicketConfirmationNotification({
          orderId: data.order.id,
          eventTitle: event.title,
          ticketCount: data.tickets?.length || selectedItems.reduce((acc, it) => acc + it.quantity, 0),
          amount: total,
          paymentMethod: paymentMethod === 'mpesa' ? 'M-Pesa STK Push' : 'Card',
        });
      } catch (e) {
        console.warn('Failed to send ticket confirmation notification:', e);
      }

      onSuccess(data.order, data.tickets);
    } catch (e: any) {
      setErrorMsg('Network error completing transaction. Please retry.');
      setIsProcessing(false);
      setStkPromptVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
              Secure Checkout
            </span>
            <h2 className="text-xl font-extrabold text-white">{event.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Minute Reservation Hold Alert Banner */}
        <div className="bg-amber-950/40 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-amber-300 font-semibold">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Tickets reserved for you</span>
          </div>
          <span className="font-mono font-bold text-amber-400 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/40">
            {formatTimer(secondsRemaining)} remaining
          </span>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Attendee Details Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-violet-400" />
              <span>1. Attendee Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  placeholder="e.g. Amina Mwangi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email (Tickets sent here)
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  placeholder="name@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Phone Number (for M-Pesa STK Push / SMS)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +254
                  </span>
                  <input
                    type="tel"
                    value={buyerPhone.replace(/^\+?254/, '')}
                    onChange={(e) => setBuyerPhone('254' + e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-14 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="712 345 678"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2. Select Payment Gateway</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* M-Pesa Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Safaricom Daraja
                  </span>
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <p className="font-extrabold text-sm text-white">M-Pesa STK Push</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Instant mobile PIN prompt</p>
                </div>
              </button>

              {/* Card Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-violet-500 bg-violet-950/20 ring-2 ring-violet-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400">
                    Visa / Mastercard
                  </span>
                  <CreditCard className="w-5 h-5 text-violet-400" />
                </div>
                <div className="mt-3">
                  <p className="font-extrabold text-sm text-white">Credit / Debit Card</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Paystack 3D Secure</p>
                </div>
              </button>
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-violet-400" />
                <span>Promo / Discount Code</span>
              </label>
              <span className="text-[10px] text-violet-400">Try code: JAMBO20</span>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="e.g. JAMBO20 or VIP500"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs uppercase text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
              >
                Apply
              </button>
            </div>

            {appliedPromo && (
              <p className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Code applied! {appliedPromo.value}
                  {appliedPromo.type === 'percentage' ? '%' : ' KES'} discount saved.
                </span>
              </p>
            )}

            {promoError && <p className="text-xs text-red-400">{promoError}</p>}
          </div>

          {/* Order Summary & Pricing Breakdown (FR18) */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2.5 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm mb-2">Order Breakdown</h4>

            {selectedItems.map((item) => {
              const tt = ticketTypes.find((t) => t.id === item.ticketTypeId);
              return (
                <div key={item.ticketTypeId} className="flex justify-between">
                  <span>
                    {item.quantity}x {tt?.name}
                  </span>
                  <span className="font-semibold text-white">
                    KES {((tt?.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}

            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span>Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({appliedPromo?.code})</span>
                <span>- KES {discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Platform Service Fee (3%)</span>
              <span>KES {platformFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-700 text-sm font-extrabold text-white">
              <span>Total Payable</span>
              <span className="text-amber-400 text-base">KES {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Amount to pay</p>
            <p className="text-xl font-extrabold text-amber-400">KES {total.toLocaleString()}</p>
          </div>

          <button
            type="button"
            onClick={handleInitiatePayment}
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <span>{isProcessing ? 'Connecting Gateway...' : `Pay KES ${total.toLocaleString()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* M-Pesa Interactive STK Push Phone Simulation Modal */}
        {stkPromptVisible && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-950 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl relative">
              {/* Phone vibration ring animation */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                  M-Pesa STK Push Sent
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">Prompt sent to {buyerPhone}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Check your mobile handset to authorize payment of{' '}
                  <span className="text-emerald-400 font-bold">KES {total.toLocaleString()}</span> to TiketiPass.
                </p>
              </div>

              {/* Interactive PIN Pad Simulator for Instant Testing */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <p className="text-xs font-semibold text-slate-300">
                  📱 Handset Simulation: Enter PIN to Confirm
                </p>
                <input
                  type="password"
                  maxLength={4}
                  value={mpesaPin}
                  onChange={(e) => setMpesaPin(e.target.value)}
                  placeholder="••••"
                  className="w-32 mx-auto text-center tracking-widest text-xl py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
                <button
                  type="button"
                  onClick={finalizeOrder}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-emerald-600/30"
                >
                  Confirm M-Pesa Payment
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStkPromptVisible(false);
                  setIsProcessing(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 font-medium"
              >
                Cancel STK Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
