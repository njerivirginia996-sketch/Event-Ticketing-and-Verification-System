import React, { useState, useEffect } from 'react';
import { User, UserRole, EventItem, TicketType, Ticket, Order } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { EventList } from './components/EventList';
import { EventDetail } from './components/EventDetail';
import { CheckoutModal } from './components/CheckoutModal';
import { MyTickets } from './components/MyTickets';
import { GateScanner } from './components/GateScanner';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ReactNativeHub } from './components/ReactNativeHub';
import { EventCalendar } from './components/EventCalendar';
import { RoleSwitchModal } from './components/RoleSwitchModal';
import { AuthModal } from './components/AuthModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { notificationService } from './services/notificationService';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | 'mobile_hub'>('attendee');
  const [activeView, setActiveView] = useState<string>('landing');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  // Events & Data State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);

  // Modals & Drawers
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [selectedCheckoutItems, setSelectedCheckoutItems] = useState<{ ticketTypeId: string; quantity: number }[]>([]);
  const [holdToken, setHoldToken] = useState<string | undefined>(undefined);
  const [myTicketsOpen, setMyTicketsOpen] = useState<boolean>(false);

  // Toast / Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Events
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
        notificationService.checkUpcomingInterestedEvents(data.events);
      }
    } catch (e) {
      console.error('Error fetching events:', e);
    }
  };

  // Fetch Tickets
  const fetchMyTickets = async () => {
    try {
      const res = await fetch('/api/tickets/my-tickets');
      const data = await res.json();
      if (data.success) {
        setMyTickets(data.tickets);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMyTickets();

    const unsubscribe = notificationService.subscribe((list) => {
      setUnreadNotificationCount(list.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  // When an event is clicked from listing or calendar
  const handleSelectEvent = async (event: EventItem) => {
    setSelectedEvent(event);
    try {
      const res = await fetch(`/api/events/${event.id}`);
      const data = await res.json();
      if (data.success) {
        setTicketTypes(data.ticketTypes);
        setActiveView('event_detail');
      }
    } catch {
      setActiveView('event_detail');
    }
  };

  // Start checkout flow from event detail
  const handleProceedToCheckout = (items: { ticketTypeId: string; quantity: number }[], token?: string) => {
    setSelectedCheckoutItems(items);
    setHoldToken(token);
    setCheckoutModalOpen(true);
  };

  // On successful order checkout
  const handleCheckoutSuccess = (order: Order, newTickets: Ticket[]) => {
    setCheckoutModalOpen(false);
    fetchMyTickets();
    fetchEvents();
    showToast(`Order #${order.paymentReference || order.id.slice(0, 8)} confirmed! ${newTickets.length} ticket(s) added to your wallet.`, 'success');
    setMyTicketsOpen(true);
  };

  // Handle Role Navigation & Portal Routing
  const handleSelectPortal = (role: UserRole | 'mobile_hub', destinationView: string) => {
    setCurrentRole(role);
    setActiveView(destinationView);
  };

  // Handle Authentication Success & Dynamic Role Routing
  const handleAuthSuccess = (user: User, message: string, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    setCurrentRole(user.role);
    showToast(message, 'success');
    if (user.role === 'attendee') {
      setActiveView('events');
    } else if (user.role === 'organizer') {
      setActiveView('organizer');
    } else if (user.role === 'gate_staff') {
      setActiveView('scanner');
    } else if (user.role === 'super_admin') {
      setActiveView('admin');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setCurrentRole('attendee');
    setActiveView('landing');
    setMyTickets([]);
    setMyTicketsOpen(false);
    showToast('You have been signed out.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Clean Navbar with User Profile Toggle Pill & Sign In */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onSignOut={handleSignOut}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Toast Alert */}
        {toast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-sm font-semibold flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-emerald-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* View Routing */}
        {activeView === 'landing' && (
          <LandingPage
            onSelectPortal={handleSelectPortal}
            onOpenAuth={(mode) => {
              setAuthInitialMode(mode || 'signup');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {activeView === 'events' && (
          <EventList
            events={events}
            onSelectEvent={handleSelectEvent}
            onRefreshEvents={fetchEvents}
          />
        )}

        {activeView === 'calendar' && (
          <EventCalendar
            events={events}
            onSelectEvent={handleSelectEvent}
            onRefreshEvents={fetchEvents}
          />
        )}

        {activeView === 'event_detail' && selectedEvent && (
          <EventDetail
            event={selectedEvent}
            ticketTypes={ticketTypes}
            onBack={() => setActiveView('events')}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {activeView === 'scanner' && (
          <GateScanner events={events} currentStaffName="Kiprono Gate Warden" />
        )}

        {activeView === 'organizer' && (
          <OrganizerDashboard events={events} onRefreshEvents={fetchEvents} />
        )}

        {activeView === 'admin' && authToken && (
          <SuperAdminDashboard authToken={authToken} />
        )}

        {activeView === 'mobile' && <ReactNativeHub />}
      </main>

      {/* Checkout Modal */}
      {checkoutModalOpen && selectedEvent && (
        <CheckoutModal
          event={selectedEvent}
          ticketTypes={ticketTypes}
          selectedItems={selectedCheckoutItems}
          holdToken={holdToken}
          onClose={() => setCheckoutModalOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* My Tickets Wallet Modal */}
      {myTicketsOpen && (
        <MyTickets
          tickets={myTickets}
          onTransferSuccess={() => {
            fetchMyTickets();
            showToast('Ticket transferred successfully! New QR token generated.', 'success');
          }}
          onRefundSuccess={() => {
            fetchMyTickets();
            fetchEvents();
            showToast('Ticket cancelled and refund processed.', 'info');
          }}
          onClose={() => setMyTicketsOpen(false)}
        />
      )}



      {/* RBAC Role Switch Modal */}
      <RoleSwitchModal
        currentRole={currentRole}
        currentUserRole={currentUser?.role ?? null}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSelectRole={(role, dest) => {
          handleSelectPortal(role, dest);
          showToast(`Switched active profile to ${role.replace('_', ' ').toUpperCase()}`, 'info');
        }}
        onGoHome={() => setActiveView('landing')}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Authentication Modal (Login, Signup, Google, Forgot/Reset Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authInitialMode}
      />

      {/* Browser & In-App Notification Center */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onViewEvent={(id) => {
          const ev = events.find((e) => e.id === id);
          if (ev) handleSelectEvent(ev);
        }}
      />

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">TiketiPass</span>
            <span>• High-Concurrency Event Ticketing & Gate Verification System</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400">HMAC-SHA256 Token Security</span>
            <span>•</span>
            <span className="text-slate-400">M-Pesa STK Push Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
