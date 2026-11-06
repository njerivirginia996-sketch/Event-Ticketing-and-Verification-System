import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { generateQrDataUrl } from '../utils/qrcode';
import {
  Ticket as TicketIcon,
  QrCode,
  RotateCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Shield,
  Calendar,
  MapPin,
  X,
  UserCheck
} from 'lucide-react';

interface MyTicketsProps {
  tickets: Ticket[];
  onTransferSuccess: () => void;
  onRefundSuccess: () => void;
  onClose: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  tickets,
  onTransferSuccess,
  onRefundSuccess,
  onClose,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0] || null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [rotatingActive, setRotatingActive] = useState(false);
  const [rotateSeconds, setRotateSeconds] = useState(30);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // PDF / Printable view
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Generate QR code when selected ticket changes or rotates
  useEffect(() => {
    if (!selectedTicket) return;

    let mounted = true;
    generateQrDataUrl(selectedTicket.qrToken).then((url) => {
      if (mounted) setQrDataUrl(url);
    });

    return () => {
      mounted = false;
    };
  }, [selectedTicket]);

  // 30-Second Dynamic Rotating Security QR Token (FR22)
  useEffect(() => {
    if (!rotatingActive || !selectedTicket || selectedTicket.status !== 'ACTIVE') return;

    const interval = setInterval(async () => {
      setRotateSeconds((prev) => {
        if (prev <= 1) {
          // Rotate token
          fetch(`/api/tickets/${selectedTicket.id}/rotate-qr`, { method: 'POST' })
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.qrToken) {
                generateQrDataUrl(data.qrToken).then((url) => setQrDataUrl(url));
              }
            })
            .catch(() => {});
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rotatingActive, selectedTicket]);

  // Handle Ticket Transfer (FR21)
  const handleTransfer = async () => {
    if (!selectedTicket || !recipientEmail || !recipientName) return;
    setTransferLoading(true);
    setTransferMsg(null);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail, recipientName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTransferMsg({ text: data.error || 'Transfer failed', error: true });
        return;
      }
      setTransferMsg({ text: data.message });
      setTimeout(() => {
        setTransferModalOpen(false);
        onTransferSuccess();
      }, 1800);
    } catch {
      setTransferMsg({ text: 'Error contacting server', error: true });
    } finally {
      setTransferLoading(false);
    }
  };

  // Handle Refund Request (FR36)
  const handleRefund = async () => {
    if (!selectedTicket) return;
    setRefundLoading(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/request-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setRefundModalOpen(false);
        onRefundSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefundLoading(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACTIVE PASS</span>
          </span>
        );
      case 'USED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            CHECKED IN / USED
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            TRANSFERRED (REVOKED)
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">My Digital Wallet</h2>
              <p className="text-xs text-slate-400">
                {tickets.length} total pass{tickets.length === 1 ? '' : 'es'} in your account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Tickets list selector */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Your Tickets
            </h3>

            {tickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800">
                <TicketIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No tickets yet</p>
                <p className="text-xs text-slate-500 mt-1">Book an event to view your digital pass here.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? 'border-violet-500 bg-violet-950/30 ring-1 ring-violet-500/50'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-violet-400">
                      {t.ticketNumber}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{t.eventTitle}</h4>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                    <span className="font-medium text-slate-300">{t.ticketTypeName}</span>
                    <span className="font-bold text-amber-400">KES {t.price.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Selected Ticket Boarding Pass Card */}
          {selectedTicket ? (
            <div className="md:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Boarding Pass Header */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                    TiketiPass Verified Entry
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                <h3 className="text-xl font-black text-white">{selectedTicket.eventTitle}</h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Attendee Name</span>
                    <p className="font-bold text-white text-sm mt-0.5">{selectedTicket.holderName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tier / Section</span>
                    <p className="font-bold text-violet-300 text-sm mt-0.5">
                      {selectedTicket.ticketTypeName}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Presentation (High contrast for phone screen scanning) */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner relative overflow-hidden">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Ticket QR Code" className="w-56 h-56 object-contain" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-300 animate-pulse" />
                  </div>
                )}

                {/* Rotating Timer indicator */}
                {rotatingActive && selectedTicket.status === 'ACTIVE' && (
                  <div className="mt-2 flex items-center space-x-1.5 text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Auto-refreshing in {rotateSeconds}s (Anti-screenshot)</span>
                  </div>
                )}
              </div>

              {/* Ticket Security Barcode Info */}
              <div className="text-center space-y-1">
                <p className="font-mono text-sm font-extrabold tracking-widest text-slate-200">
                  {selectedTicket.ticketNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs mx-auto">
                  HMAC: {selectedTicket.signature.slice(0, 24)}...
                </p>
              </div>

              {/* Actions & Controls */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                {/* 30-Sec Rotating QR Toggle */}
                {selectedTicket.status === 'ACTIVE' && (
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-violet-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Dynamic 30s Security QR</p>
                        <p className="text-[10px] text-slate-400">Rotates token to block screenshot fraud</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRotatingActive(!rotatingActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                        rotatingActive
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rotatingActive ? 'ACTIVE' : 'ENABLE'}
                    </button>
                  </div>
                )}

                {/* Secondary Actions: Print PDF, Transfer, Refund */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>

                  <button
                    onClick={() => setTransferModalOpen(true)}
                    disabled={selectedTicket.status !== 'ACTIVE'}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-40 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>

                  <button
                    onClick={() => setRefundModalOpen(true)}
                    disabled={selectedTicket.status !== 'ACTIVE'}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 disabled:opacity-40 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Refund</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Transfer Modal */}
        {transferModalOpen && selectedTicket && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Send className="w-4 h-4 text-violet-400" />
                  <span>Transfer Ticket to Another Person</span>
                </h3>
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                ⚠️ Transferring this ticket permanently revokes the current QR code and issues a newly signed digital ticket directly to the recipient.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Mary Kariuki"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="mary.kariuki@africatech.io"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              {transferMsg && (
                <p
                  className={`text-xs font-bold ${
                    transferMsg.error ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {transferMsg.text}
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferLoading || !recipientEmail || !recipientName}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {transferLoading ? 'Transferring...' : 'Confirm & Transfer Pass'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Request Modal */}
        {refundModalOpen && selectedTicket && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Request Ticket Refund</h3>
                <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You are requesting a refund for <span className="font-bold text-white">{selectedTicket.ticketTypeName}</span> (KES {selectedTicket.price.toLocaleString()}).
                Once approved, the ticket status will be marked as REFUNDED and entry will be barred.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for refund</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Schedule clash or medical emergency"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {refundLoading ? 'Processing...' : 'Submit Refund Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Ticket / PDF View Modal */}
        {isPrintModalOpen && selectedTicket && (
          <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 my-auto print:shadow-none">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    Tiketi<span className="text-violet-600">Pass</span>
                  </h2>
                  <p className="text-xs text-slate-500">Official Electronic Ticket & Gate Entry Pass</p>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-800 print:hidden"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-violet-700 uppercase tracking-widest">
                  Event Pass
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedTicket.eventTitle}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-y py-4">
                <div>
                  <p className="text-slate-500">Pass Holder</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedTicket.holderName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ticket Category</p>
                  <p className="font-bold text-violet-700 text-sm">{selectedTicket.ticketTypeName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Amount Paid</p>
                  <p className="font-bold text-slate-900 text-sm">KES {selectedTicket.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ticket Number</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{selectedTicket.ticketNumber}</p>
                </div>
              </div>

              <div className="text-center space-y-3">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                <p className="text-[11px] text-slate-500 font-mono">
                  HMAC Security Verification Token: {selectedTicket.signature.slice(0, 32)}
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center print:hidden">
                <p className="text-xs text-slate-500">Present this QR code on arrival at the gate.</p>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
