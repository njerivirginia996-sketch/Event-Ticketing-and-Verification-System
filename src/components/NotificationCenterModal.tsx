import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ticket,
  Sparkles,
  Volume2,
  Trash2,
  CheckCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { notificationService, AppNotification } from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewEvent?: (eventId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onViewEvent,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'orders' | 'reminders'>('all');

  useEffect(() => {
    setPermission(notificationService.getPermissionStatus());
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const result = await notificationService.requestPermission();
    setPermission(result);
    setIsRequesting(false);

    if (result === 'granted') {
      notificationService.send({
        type: 'system',
        title: '🔔 Browser Notifications Enabled!',
        body: 'You will receive immediate alerts when your ticket purchases confirm or when upcoming events are starting.',
      });
    }
  };

  const handleTestPurchaseNotification = () => {
    notificationService.sendTicketConfirmationNotification({
      orderId: 'ord_test_' + Math.floor(1000 + Math.random() * 9000),
      eventTitle: 'Sol Generation Festival 2026',
      ticketCount: 2,
      amount: 7000,
      paymentMethod: 'M-Pesa STK Push',
    });
  };

  const handleTestEventStartingNotification = () => {
    notificationService.sendEventStartingSoonNotification({
      eventId: 'evt_solfest',
      eventTitle: 'Sol Generation Festival 2026: Live at Uhuru Gardens',
      venue: 'Uhuru Gardens Arena, Nairobi',
      startAt: new Date().toISOString(),
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'orders') return n.type === 'order_confirmed';
    if (filter === 'reminders') return n.type === 'event_reminder';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Notifications & Alerts</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Real-time ticket confirmations & event countdowns</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Status Card */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              {permission === 'granted' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : permission === 'denied' ? (
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Web Browser Notification Status:</span>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      permission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : permission === 'denied'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {permission}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {permission === 'granted'
                    ? 'Native desktop/mobile OS notifications are fully active!'
                    : permission === 'denied'
                    ? 'Browser alerts are blocked in browser preferences. In-app audio & cards remain active.'
                    : 'Allow browser notifications so you never miss gate opening or ticket receipts.'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && permission !== 'unsupported' && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-violet-600/30 flex-shrink-0 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isRequesting ? 'Requesting...' : 'Enable Browser Alerts'}</span>
              </button>
            )}
          </div>

          {/* Quick Simulation / Test Buttons for the User */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Instant Test:</span>
            <button
              onClick={handleTestPurchaseNotification}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="Simulate a ticket purchase confirmation alert"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Test Purchase Confirmed</span>
            </button>

            <button
              onClick={handleTestEventStartingNotification}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/50 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="Simulate an event starting soon alert"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Test Event Starting Soon</span>
            </button>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-900/40">
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('orders')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'orders' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchases
            </button>
            <button
              onClick={() => setFilter('reminders')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filter === 'reminders' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Event Reminders
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={() => notificationService.markAllAsRead()}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 transition flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
                <button
                  onClick={() => notificationService.clearAll()}
                  className="px-2 py-1 text-slate-400 hover:text-red-400 transition flex items-center space-x-1"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 max-h-[360px] overflow-y-auto space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-semibold text-sm text-slate-300">No notifications in this view</p>
              <p className="text-xs text-slate-500 mt-1">
                Purchasing tickets or marking events as "Interested" triggers live alerts here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const dateStr = new Date(notif.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    notificationService.markAsRead(notif.id);
                    if (notif.eventId && onViewEvent) {
                      onViewEvent(notif.eventId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition flex items-start space-x-3 cursor-pointer ${
                    notif.read
                      ? 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                      : 'bg-violet-950/20 border-violet-800/40 text-white hover:bg-violet-900/30 ring-1 ring-violet-500/20'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notif.type === 'order_confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : notif.type === 'event_reminder'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    }`}
                  >
                    {notif.type === 'order_confirmed' ? (
                      <Ticket className="w-4 h-4" />
                    ) : notif.type === 'event_reminder' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{dateStr}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.body}</p>

                    {notif.eventId && (
                      <div className="mt-2 flex items-center space-x-1 text-[11px] text-violet-400 font-semibold hover:text-violet-300">
                        <span>View event details</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Audio chimes enabled via Web Audio API</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
