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
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Payment Options: 'mpesa' | 'card'
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [stkPromptVisible, setStkPromptVisible] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [canSimulatePayment, setCanSimulatePayment] = useState(false);
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
        setErrorMsg(data.error || 'Unable to create pending order');
        return;
      }

      setPendingOrder(data.order);
      setCanSimulatePayment(data.canSimulatePayment === true);
      setStkPromptVisible(true);

      if (paymentMethod === 'mpesa') {
        const paymentRes = await fetch('/api/payments/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.order.id }),
        });
        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) {
          setErrorMsg(paymentData.error || 'Payment request could not be sent. Your order is still pending.');
        }
      }

    } catch {
      setErrorMsg('Network error starting payment. The order may still be pending; check its status before retrying.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async () => {
    if (!pendingOrder || !canSimulatePayment) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/orders/${pendingOrder.id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationConfirmed: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Payment has not been confirmed');
        return;
      }

      // Trigger celebration only after payment confirmation.
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6'],
        });
      } catch {}

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

      setStkPromptVisible(false);
      onSuccess(data.order, data.tickets);
    } catch {
      setErrorMsg('Network error confirming payment. The order remains pending.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
              Choose How to Pay
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
                disabled={!!pendingOrder}
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    Safaricom Daraja
                  </span>
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <p className="font-extrabold text-sm text-white">M-Pesa STK Push</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Awaiting payment confirmation</p>
                </div>
              </button>

              {/* Card Option */}
              <button
                type="button"
                disabled={!!pendingOrder}
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-violet-500 bg-violet-950/20 ring-2 ring-violet-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400">
                    Visa / Mastercard
                  </span>
                  <CreditCard className="w-5 h-5 text-violet-400" />
                </div>
                <div className="mt-3">
                  <p className="font-extrabold text-sm text-white">Credit / Debit Card</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Awaiting payment confirmation</p>
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
            onClick={() => {
              if (pendingOrder) {
                setStkPromptVisible(true);
              } else {
                handleInitiatePayment();
              }
            }}
            disabled={isProcessing || (!pendingOrder && secondsRemaining <= 0)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <span>{isProcessing ? 'Starting Payment...' : pendingOrder ? 'View Payment Status' : `Pay KES ${total.toLocaleString()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Payment remains pending until the server confirms success. */}
        {stkPromptVisible && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-950 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setStkPromptVisible(false)}
                aria-label="Close payment status and return to checkout"
                title="Return to checkout"
                className="absolute top-3 right-3 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-wider">
                  Payment Pending
                </span>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  {paymentMethod === 'mpesa' ? `Awaiting M-Pesa payment from ${buyerPhone}` : 'Awaiting card payment'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  No ticket has been issued. Your order will remain pending until payment is confirmed.
                </p>
                <p className="text-sm font-bold text-amber-300 mt-2">
                  Order total: KES {pendingOrder?.total.toLocaleString() ?? total.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                {canSimulatePayment ? (
                  <>
                    <p className="text-xs text-slate-300">
                      Development simulator only. This does not charge a card or request an M-Pesa PIN.
                    </p>
                    <button
                      type="button"
                      onClick={confirmPayment}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-emerald-600/30 disabled:opacity-50"
                    >
                      {isProcessing ? 'Waiting for confirmation...' : 'Simulate Successful Payment'}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-amber-200">
                    The payment provider is not configured for this deployment. This order will not be marked paid until a provider confirms it.
                  </p>
                )}
                {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
