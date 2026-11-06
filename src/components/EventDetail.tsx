import React, { useState } from 'react';
import { EventItem, TicketType } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Lock,
  Share2,
  Bell,
  BellRing
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface EventDetailProps {
  event: EventItem;
  ticketTypes: TicketType[];
  onBack: () => void;
  onProceedToCheckout: (selectedItems: { ticketTypeId: string; quantity: number }[], holdToken?: string) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({
  event,
  ticketTypes,
  onBack,
  onProceedToCheckout,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInterested, setIsInterested] = useState(() => notificationService.isEventInterested(event.id));

  const handleToggleReminder = () => {
    const updated = notificationService.toggleInterestedEvent(event.id, event.title);
    setIsInterested(updated);
  };

  const handleQuantityChange = (tierId: string, delta: number, maxAvailable: number, maxPerOrder: number) => {
    const current = quantities[tierId] || 0;
    const next = Math.max(0, Math.min(current + delta, maxAvailable, maxPerOrder));
    setQuantities((prev) => ({
      ...prev,
      [tierId]: next,
    }));
  };

  const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalPrice = ticketTypes.reduce((sum, tt) => {
    const q = quantities[tt.id] || 0;
    return sum + tt.price * q;
  }, 0);

  const handleStartCheckout = async () => {
    if (totalSelected === 0) return;
    setHolding(true);
    setHoldError(null);

    const items = Object.entries(quantities)
      .filter(([_, q]) => q > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await fetch(`/api/events/${event.id}/hold-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHoldError(data.error || 'Failed to hold tickets');
        return;
      }

      onProceedToCheckout(items, data.holdToken);
    } catch (err: any) {
      setHoldError('Network error holding tickets. Please try again.');
    } finally {
      setHolding(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to All Events</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleReminder}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition cursor-pointer ${
              isInterested
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Set browser reminder notification before event starts"
          >
            {isInterested ? (
              <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isInterested ? 'Reminder Active' : 'Set Reminder'}</span>
          </button>

          <button
            onClick={copyShareLink}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="relative h-72 sm:h-96 w-full">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-violet-600 text-white font-bold text-xs uppercase tracking-wider shadow">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 font-bold text-xs border border-emerald-500/30">
              Verified Event
            </span>
            {event.allowReentry && (
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md text-cyan-300 font-semibold text-xs border border-cyan-500/30">
                Re-entry Permitted
              </span>
            )}
          </div>

          {/* Title & Metadata Overlay */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>
            <p className="text-slate-300 text-sm font-medium">
              Organized by <span className="text-violet-400 font-bold">{event.organizerName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Ticket Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description, Venue, Logistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400">Date & Schedule</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {startDate.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-400">
                  {startDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400">Venue & Gate Location</p>
                <p className="text-sm font-bold text-white mt-0.5">{event.venue}</p>
                <p className="text-xs text-slate-400">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">About the Event</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Verification & Security Guarantee */}
          <div className="bg-slate-900/80 border border-violet-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-violet-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>TiketiPass Security Guarantee</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>HMAC-SHA256 signed QR code eliminates counterfeit and duplicate tickets.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Dynamic 30-second rotating security token prevents screenshot sharing.</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>High-concurrency inventory reservation locks tickets for 10 minutes during checkout.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Col: Ticket Selection Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Select Tickets</h2>
              <p className="text-xs text-slate-400 mt-1">
                Prices shown in Kenyan Shillings (KES). Tax included.
              </p>
            </div>

            {holdError && (
              <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{holdError}</span>
              </div>
            )}

            {/* Ticket Tier Cards */}
            <div className="space-y-3">
              {ticketTypes.map((tier) => {
                const available = tier.quantity - (tier.sold + tier.held);
                const isSoldOut = available <= 0;
                const currentQty = quantities[tier.id] || 0;

                return (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-xl border transition-all ${
                      currentQty > 0
                        ? 'border-violet-500 bg-violet-950/30'
                        : 'border-slate-800 bg-slate-800/40'
                    } ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white text-sm">{tier.name}</h3>
                        <p className="text-lg font-extrabold text-amber-400 mt-0.5">
                          KES {tier.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Remaining counter */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          available < 50
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {isSoldOut ? 'Sold Out' : `${available} left`}
                      </span>
                    </div>

                    {/* Perks list */}
                    {tier.perks && tier.perks.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                        {tier.perks.map((perk, i) => (
                          <div key={i} className="flex items-center text-[11px] text-slate-300 space-x-1.5">
                            <span className="w-1 h-1 rounded-full bg-violet-400" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quantity Selector */}
                    {!isSoldOut && (
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-xs text-slate-400 font-medium">Quantity</span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(tier.id, -1, available, tier.maxPerOrder)}
                            disabled={currentQty === 0}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-sm text-white w-5 text-center">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(tier.id, 1, available, tier.maxPerOrder)}
                            disabled={currentQty >= available || currentQty >= tier.maxPerOrder}
                            className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selected Tickets</span>
                <span className="font-semibold text-white">{totalSelected}</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-white">
                <span>Subtotal</span>
                <span className="text-amber-400">KES {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={handleStartCheckout}
              disabled={totalSelected === 0 || holding}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              <Lock className="w-4 h-4" />
              <span>{holding ? 'Reserving Tickets (10m)...' : `Proceed to Checkout (${totalSelected})`}</span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              ⚡ High-traffic protection: Selected tickets are reserved for 10 minutes during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
