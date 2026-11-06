/**
 * Browser-based notification service with Web Notifications API,
 * in-app notification center persistence, and audio cues.
 */

import { sound } from '../utils/sound';

export interface AppNotification {
  id: string;
  type: 'order_confirmed' | 'event_reminder' | 'gate_scan' | 'system';
  title: string;
  body: string;
  eventId?: string;
  orderId?: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

const STORAGE_KEY = 'tiketi_notifications_v1';
const INTERESTED_KEY = 'tiketi_interested_events_v1';
const NOTIFIED_EVENTS_KEY = 'tiketi_already_notified_events_v1';

class NotificationService {
  private listeners: Array<(notifications: AppNotification[]) => void> = [];

  constructor() {
    // Listen for storage events across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  // Check current browser Notification permission
  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  // Request browser Notification permission
  async requestPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return Notification.permission || 'denied';
    }
  }

  // Get all notifications from localStorage
  getNotifications(): AppNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Save notifications
  private saveNotifications(items: AppNotification[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50))); // Keep last 50
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }

  // Subscribe to changes
  subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getNotifications());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    const items = this.getNotifications();
    this.listeners.forEach((cb) => cb(items));
  }

  // Dispatch both Native Browser Notification and In-App notification
  async send(params: {
    type: AppNotification['type'];
    title: string;
    body: string;
    eventId?: string;
    orderId?: string;
    icon?: string;
  }): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: params.type,
      title: params.title,
      body: params.body,
      eventId: params.eventId,
      orderId: params.orderId,
      timestamp: new Date().toISOString(),
      read: false,
      icon: params.icon || '/assets/aistudio/ticket_badge.png',
    };

    // 1. Play auditory chime
    try {
      sound.playSuccess();
    } catch {}

    // 2. Browser native Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const nativeNotification = new Notification(params.title, {
            body: params.body,
            icon: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=128&auto=format&fit=crop&q=80',
            tag: newNotif.id,
            badge: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=96&auto=format&fit=crop&q=80',
          });

          nativeNotification.onclick = () => {
            window.focus();
            nativeNotification.close();
          };
        } catch (e) {
          console.warn('Native Notification instantiation failed (e.g., sandboxed iframe):', e);
        }
      }
    }

    // 3. Store in local notifications list
    const current = this.getNotifications();
    this.saveNotifications([newNotif, ...current]);

    return newNotif;
  }

  // Specialized: Ticket Purchase Confirmation Notification
  async sendTicketConfirmationNotification(params: {
    orderId: string;
    eventTitle: string;
    ticketCount: number;
    amount?: number;
    paymentMethod?: string;
  }) {
    const formattedAmount = params.amount ? `KES ${params.amount.toLocaleString()}` : '';
    const body = `Your order for "${params.eventTitle}" is confirmed! ${params.ticketCount} digital HMAC pass${
      params.ticketCount > 1 ? 'es are' : ' is'
    } ready in your wallet${formattedAmount ? ` (${formattedAmount})` : ''}.`;

    return this.send({
      type: 'order_confirmed',
      title: '🎟️ Ticket Purchase Confirmed!',
      body,
      orderId: params.orderId,
    });
  }

  // Specialized: Event Starting Soon Notification
  async sendEventStartingSoonNotification(params: {
    eventId: string;
    eventTitle: string;
    venue: string;
    startAt?: string;
  }) {
    const body = `"${params.eventTitle}" at ${params.venue} is starting soon! Ensure your digital pass QR is ready for gate check-in.`;

    return this.send({
      type: 'event_reminder',
      title: '⏰ Event Starting Soon!',
      body,
      eventId: params.eventId,
    });
  }

  // Mark all as read
  markAllAsRead() {
    const current = this.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  // Mark single as read
  markAsRead(id: string) {
    const current = this.getNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(updated);
  }

  // Clear all notifications
  clearAll() {
    this.saveNotifications([]);
  }

  // --- Interested Events Tracking & Reminders ---

  getInterestedEventIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(INTERESTED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  isEventInterested(eventId: string): boolean {
    return this.getInterestedEventIds().includes(eventId);
  }

  toggleInterestedEvent(eventId: string, eventTitle?: string): boolean {
    const current = this.getInterestedEventIds();
    const exists = current.includes(eventId);
    let updated: string[];

    if (exists) {
      updated = current.filter((id) => id !== eventId);
    } else {
      updated = [...current, eventId];
      // When user stars/marks an event, confirm that alert is active
      if (eventTitle) {
        this.send({
          type: 'event_reminder',
          title: '🔔 Event Reminder Set',
          body: `You are now tracking "${eventTitle}". We will send you a browser alert before gates open!`,
          eventId,
        });
      }
    }

    try {
      localStorage.setItem(INTERESTED_KEY, JSON.stringify(updated));
    } catch {}

    return !exists;
  }

  // Check if any interested events start soon (within next 48 hours or simulated)
  checkUpcomingInterestedEvents(events: Array<{ id: string; title: string; venue: string; startAt: string }>) {
    if (typeof window === 'undefined') return;
    const interestedIds = this.getInterestedEventIds();
    if (interestedIds.length === 0) return;

    let alreadyNotified: string[] = [];
    try {
      const raw = localStorage.getItem(NOTIFIED_EVENTS_KEY);
      alreadyNotified = raw ? JSON.parse(raw) : [];
    } catch {}

    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;

    events.forEach((evt) => {
      if (interestedIds.includes(evt.id) && !alreadyNotified.includes(evt.id)) {
        const startTime = new Date(evt.startAt).getTime();
        const diff = startTime - now;

        // If the event starts within the next 48 hours (or today)
        if (diff > 0 && diff <= fortyEightHours) {
          this.sendEventStartingSoonNotification({
            eventId: evt.id,
            eventTitle: evt.title,
            venue: evt.venue,
            startAt: evt.startAt,
          });

          alreadyNotified.push(evt.id);
          try {
            localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(alreadyNotified));
          } catch {}
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
