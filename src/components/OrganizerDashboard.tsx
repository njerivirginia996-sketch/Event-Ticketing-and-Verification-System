import React, { useState, useEffect } from 'react';
import { EventItem, TicketType, PromoCode, Order, Ticket } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Ticket as TicketIcon,
  Users,
  TrendingUp,
  Plus,
  Sparkles,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  CreditCard,
  X,
  Trash2,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  MapPin,
  Smartphone,
  Zap,
  Activity,
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface OrganizerDashboardProps {
  events: EventItem[];
  onRefreshEvents: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  onRefreshEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'events' | 'promos' | 'attendees' | 'payouts'>('overview');
  const [analyticsEventFilter, setAnalyticsEventFilter] = useState<string>('all');
  const [analyticsTimeWindow, setAnalyticsTimeWindow] = useState<'7d' | '24h' | 'event_day'>('7d');
  const [stats, setStats] = useState({
    totalGrossRevenue: 7850000,
    totalTicketsSold: 2840,
    totalCheckedIn: 920,
    checkInRate: 32,
    activeEventsCount: 2,
  });

  // AI Sales Insights State (FR42)
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Create Event Modal State (FR6, FR8, FR40)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'Concert' | 'Conference' | 'Festival' | 'Food & Drink'>('Concert');
  const [newEventVenue, setNewEventVenue] = useState('Carnivore Grounds, Nairobi');
  const [newEventStart, setNewEventStart] = useState('2026-12-12T16:00');
  const [aiGenKeywords, setAiGenKeywords] = useState('Nairobi sunset afrobeat festival, food trucks, international DJs');
  const [aiGenLoading, setAiGenLoading] = useState(false);

  // Dynamic ticket price & tier configuration during event creation
  const [newTicketTiers, setNewTicketTiers] = useState<Array<{ name: string; price: number; quantity: number; perks: string }>>([
    { name: 'Early Bird Pass', price: 1500, quantity: 500, perks: 'Main arena admission, early entry' },
    { name: 'Regular Admission', price: 2500, quantity: 1500, perks: 'Full festival access, drink token' },
    { name: 'VIP Golden Circle', price: 6000, quantity: 300, perks: 'VIP express gate, front stage terrace, private bar' },
  ]);

  // Payout Request Modal (FR37)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('350000');
  const [payoutDetails, setPayoutDetails] = useState('M-Pesa Business Till #542542');
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);

  // Promo Code Form
  const [promoCodeName, setPromoCodeName] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('15');
  const [promoType, setPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoLimit, setPromoLimit] = useState('200');
  const [promoStatus, setPromoStatus] = useState<string | null>(null);

  // Recharts Analytics Datasets
  const salesTrendsData = [
    { date: 'Mon 28/10', tickets: 120, revenue: 360000, mpesa: 280000, card: 80000 },
    { date: 'Tue 29/10', tickets: 210, revenue: 630000, mpesa: 490000, card: 140000 },
    { date: 'Wed 30/10', tickets: 340, revenue: 1020000, mpesa: 780000, card: 240000 },
    { date: 'Thu 31/10', tickets: 480, revenue: 1440000, mpesa: 1100000, card: 340000 },
    { date: 'Fri 01/11', tickets: 620, revenue: 1860000, mpesa: 1420000, card: 440000 },
    { date: 'Sat 02/11', tickets: 590, revenue: 1540000, mpesa: 1180000, card: 360000 },
    { date: 'Sun 03/11', tickets: 480, revenue: 1000000, mpesa: 750000, card: 250000 },
  ];

  const tierComparisonData = [
    { tier: 'Early Bird', sold: 840, capacity: 1000, revenue: 1260000, color: '#06b6d4' },
    { tier: 'Regular Pass', sold: 1420, capacity: 3000, revenue: 3550000, color: '#8b5cf6' },
    { tier: 'VIP Circle', sold: 520, capacity: 800, revenue: 3120000, color: '#f59e0b' },
    { tier: 'VVIP Lounge', sold: 180, capacity: 200, revenue: 1800000, color: '#ec4899' },
  ];

  const attendeeDemographicsLocation = [
    { region: 'Nairobi Urban', attendees: 1760, share: 62 },
    { region: 'Mombasa Coast', attendees: 397, share: 14 },
    { region: 'Nakuru Rift', attendees: 312, share: 11 },
    { region: 'Kisumu West', attendees: 227, share: 8 },
    { region: 'Diaspora (Intl)', attendees: 144, share: 5 },
  ];

  const paymentMethodsShare = [
    { name: 'M-Pesa STK Push', value: 74, color: '#10b981', amount: 'KES 5,809,000' },
    { name: 'Visa / Mastercard', value: 20, color: '#6366f1', amount: 'KES 1,570,000' },
    { name: 'Airtel Money', value: 6, color: '#f59e0b', amount: 'KES 471,000' },
  ];

  const ageDemographicsData = [
    { ageGroup: '18–24 yrs', percentage: 34, count: 965 },
    { ageGroup: '25–34 yrs', percentage: 48, count: 1363 },
    { ageGroup: '35–44 yrs', percentage: 14, count: 398 },
    { ageGroup: '45+ yrs', percentage: 4, count: 114 },
  ];

  const gateIngressFlow = [
    { time: '14:00', GateA: 45, GateB_VIP: 25, GateC_Crew: 15, total: 85 },
    { time: '15:00', GateA: 75, GateB_VIP: 45, GateC_Crew: 20, total: 140 },
    { time: '16:00', GateA: 110, GateB_VIP: 65, GateC_Crew: 35, total: 210 },
    { time: '17:00', GateA: 195, GateB_VIP: 125, GateC_Crew: 60, total: 380 },
    { time: '18:00', GateA: 250, GateB_VIP: 160, GateC_Crew: 80, total: 490 },
    { time: '19:00', GateA: 170, GateB_VIP: 105, GateC_Crew: 45, total: 320 },
    { time: '20:00', GateA: 60, GateB_VIP: 35, GateC_Crew: 15, total: 110 },
    { time: '21:00', GateA: 25, GateB_VIP: 15, GateC_Crew: 5, total: 45 },
  ];

  const gateLanesStats = [
    { gate: 'Gate A (Main South)', checkedIn: 930, capacity: 1800, rate: '8.4 passes/min', avgLatency: '0.55s', blocked: 3, status: 'Optimal' },
    { gate: 'Gate B (VIP Fast Track)', checkedIn: 570, capacity: 800, rate: '4.8 passes/min', avgLatency: '0.42s', blocked: 1, status: 'Optimal' },
    { gate: 'Gate C (Media & VIP Lounge)', checkedIn: 270, capacity: 400, rate: '2.1 passes/min', avgLatency: '0.45s', blocked: 0, status: 'Optimal' },
  ];

  // Fetch AI Sales Insights (FR42)
  const fetchAiInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/gemini/sales-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: 'org_sol' }),
      });
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.insights);
      }
    } catch {
      setAiInsights('Could not generate insights at this time.');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Generate Event Description with Gemini AI (FR40)
  const handleGenerateAiDescription = async () => {
    if (!newEventTitle) return;
    setAiGenLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          keywords: aiGenKeywords,
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setNewEventDesc(data.description);
      }
    } catch {
      console.error('Failed to generate description');
    } finally {
      setAiGenLoading(false);
    }
  };

  // Handle Create Event Submission with dynamic ticket prices and tiers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventVenue) return;

    const totalCapacity = newTicketTiers.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          category: newEventCategory,
          venue: newEventVenue,
          startAt: new Date(newEventStart).toISOString(),
          capacity: totalCapacity > 0 ? totalCapacity : 1000,
          ticketTiers: newTicketTiers.map((t) => ({
            name: t.name || 'General Admission',
            price: Number(t.price) || 1000,
            quantity: Number(t.quantity) || 100,
            perks: t.perks
              ? t.perks.split(',').map((p) => p.trim()).filter(Boolean)
              : ['General Admission'],
          })),
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        onRefreshEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Attendees to CSV (FR33)
  const exportAttendeesCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Ticket #', 'Holder Name', 'Email', 'Phone', 'Event', 'Tier', 'Status', 'Checked In'].join(','),
        ['TKP-SOL-88219', 'Amina Mwangi', 'amina.mwangi@example.com', '+254720998877', 'Sol Fest 2026', 'VIP Golden Circle', 'ACTIVE', 'No'].join(','),
        ['TKP-SOL-44102', 'David Omondi', 'david.omondi@example.com', '+254711223344', 'Sol Fest 2026', 'Regular Pass', 'USED', 'Gate A (18:42)'].join(','),
        ['TKP-TECH-10992', 'Mary Kariuki', 'mary.kariuki@africatech.io', '+254799000111', 'Silicon Savannah', 'Delegate Pass', 'ACTIVE', 'No'].join(','),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TiketiPass_Attendees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Payout Request (FR37)
  const handleRequestPayout = async () => {
    try {
      const res = await fetch('/api/organizer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          payoutDetails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutStatus('Payout request submitted for Super Admin review!');
        setTimeout(() => {
          setPayoutModalOpen(false);
          setPayoutStatus(null);
        }, 2000);
      }
    } catch {
      setPayoutStatus('Error submitting payout request.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
            Organizer Portal
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Sol Entertainment Africa</h1>
          <p className="text-xs text-slate-400">
            Real-time ticket sales, gate check-in throughput, and AI revenue optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-violet-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>

          <button
            onClick={exportAttendeesCsv}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Live Metrics & AI Insights</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'events'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Events ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'promos'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promo Codes</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'payouts'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Revenue Payouts</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & AI INSIGHTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Gross Ticket Sales</span>
              <p className="text-2xl font-black text-amber-400">
                KES {stats.totalGrossRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% this week</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Tickets Sold</span>
              <p className="text-2xl font-black text-white">
                {stats.totalTicketsSold.toLocaleString()} passes
              </p>
              <p className="text-[11px] text-slate-400">Across 3 published events</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Live Checked In (FR32)</span>
              <p className="text-2xl font-black text-emerald-400">
                {stats.totalCheckedIn.toLocaleString()} <span className="text-sm font-medium text-slate-400">({stats.checkInRate}%)</span>
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${stats.checkInRate}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Gate Throughput</span>
              <p className="text-2xl font-black text-violet-400">0.8s / scan</p>
              <p className="text-[11px] text-slate-400">Sub-second gate verification</p>
            </div>
          </div>

          {/* Gemini AI Sales Strategist Card (FR42) */}
          <div className="p-6 bg-gradient-to-br from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-800/50 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Gemini 3.8 Flash AI Sales Intelligence</h3>
                  <p className="text-xs text-slate-400">
                    Velocity forecasting and dynamic pricing recommendations.
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAiInsights}
                disabled={insightsLoading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-violet-600/20 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{insightsLoading ? 'Analyzing Data...' : 'Generate New Insights'}</span>
              </button>
            </div>

            {aiInsights ? (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {aiInsights}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Click "Generate New Insights" to analyze current tier velocity and get dynamic ticket pricing strategies.
              </p>
            )}
          </div>

          {/* Ticket Tier Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Ticket Tiers Sales Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-white">Early Bird Passes (KES 1,500)</span>
                  <span className="text-emerald-400">840 / 1,000 sold (84%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-white">Regular Passes (KES 2,500)</span>
                  <span className="text-violet-400">1,420 / 3,000 sold (47%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full" style={{ width: '47%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-white">VIP Golden Circle (KES 6,000)</span>
                  <span className="text-amber-400">520 / 800 sold (65%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS (Recharts Powered) */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Controls Bar & Filter Options */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Telemetry</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">Updated &lt;10s ago</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Event Performance & Demographics Analytics</h2>
              <p className="text-xs text-slate-400">
                Visualizing ticket conversion momentum, purchaser demographics, and stadium ingress flow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Event Filter */}
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                <Filter className="w-3.5 h-3.5 text-violet-400" />
                <select
                  value={analyticsEventFilter}
                  onChange={(e) => setAnalyticsEventFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Live Events</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id} className="bg-slate-900">
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Window Switcher */}
              <div className="flex items-center bg-slate-800/90 border border-slate-700 p-1 rounded-xl space-x-1 text-xs font-semibold">
                <button
                  onClick={() => setAnalyticsTimeWindow('7d')}
                  className={`px-3 py-1 rounded-lg transition ${
                    analyticsTimeWindow === '7d'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setAnalyticsTimeWindow('24h')}
                  className={`px-3 py-1 rounded-lg transition ${
                    analyticsTimeWindow === '24h'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => setAnalyticsTimeWindow('event_day')}
                  className={`px-3 py-1 rounded-lg transition ${
                    analyticsTimeWindow === 'event_day'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Event Gate Day
                </button>
              </div>
            </div>
          </div>

          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Gross Ticket Sales</span>
              <p className="text-2xl font-black text-amber-400">
                KES {stats.totalGrossRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% vs previous 7-day average</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Passes Checked In</span>
              <p className="text-2xl font-black text-emerald-400">
                1,770 <span className="text-xs text-slate-400 font-normal">/ 2,840 sold (62.3%)</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Cryptographic HMAC verified</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Peak Gate Ingress</span>
              <p className="text-2xl font-black text-violet-400">
                490 <span className="text-xs text-slate-400 font-normal">scans / hr</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>Peak entry window: 17:00 – 19:00</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Avg Verification Latency</span>
              <p className="text-2xl font-black text-cyan-400">
                0.48s
              </p>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero gate queue stalls</span>
              </p>
            </div>
          </div>

          {/* SECTION 1: TICKET SALES TRENDS & REVENUE VELOCITY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <span>Ticket Sales Trends & Revenue Trajectory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tracking daily revenue acceleration and volume across Kenyan payment gateways
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                Recharts Area & Bar
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Sales Trend AreaChart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Daily Revenue Velocity (KES)</h4>
                    <p className="text-[11px] text-slate-400">Comparison of daily gross checkout volume</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                      <span>Gross Revenue</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>M-Pesa STK</span>
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesTrendsData}
                      margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="mpesaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                                <p className="font-extrabold text-white text-sm">{label}</p>
                                {payload.map((entry: any, idx: number) => (
                                  <div key={`tip-${idx}`} className="flex items-center justify-between space-x-3">
                                    <span style={{ color: entry.color }} className="font-semibold">
                                      {entry.name}:
                                    </span>
                                    <span className="font-bold text-white">
                                      KES {Number(entry.value).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#salesRevenueGrad)"
                        name="Gross Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="mpesa"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#mpesaGrad)"
                        name="M-Pesa STK Share"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tier Comparison BarChart */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white">Inventory Conversion by Tier</h4>
                  <p className="text-[11px] text-slate-400">Sold units vs allocated capacity</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tierComparisonData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="tier"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                                <p className="font-extrabold text-white text-sm">{label}</p>
                                <p className="text-emerald-400 font-semibold">
                                  Sold: {data.sold} / {data.capacity} ({((data.sold / data.capacity) * 100).toFixed(0)}%)
                                </p>
                                <p className="text-amber-400 font-semibold">
                                  Revenue: KES {data.revenue.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="sold" name="Tickets Sold" radius={[6, 6, 0, 0]}>
                        {tierComparisonData.map((entry, index) => (
                          <Cell key={`tier-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Fastest Tier Conversion:</span>
                  <span className="font-bold text-emerald-400">VIP Circle (65%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ATTENDEE DEMOGRAPHICS & CHANNELS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Attendee Demographics & Channel Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Insights on attendee geography, payment preference, and age demographic segments
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Recharts Pie & Bar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Payment Methods Donut Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Payment Gateway Split</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Transaction distribution across methods</p>
                </div>

                <div className="h-48 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodsShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-xs space-y-0.5">
                                <p className="font-extrabold text-white">{d.name}</p>
                                <p className="text-emerald-400 font-bold">{d.value}% of checkouts</p>
                                <p className="text-slate-300 font-mono text-[10px]">{d.amount}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-black text-white">74%</span>
                    <span className="text-[10px] text-slate-400 font-bold">M-PESA</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  {paymentMethodsShare.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Distribution Horizontal Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Geographic Origin of Attendees</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Audience breakdown across counties & diaspora</p>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={attendeeDemographicsLocation}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        unit="%"
                      />
                      <YAxis
                        type="category"
                        dataKey="region"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        width={85}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-xs space-y-1">
                                <p className="font-extrabold text-white">{label}</p>
                                <p className="text-cyan-400 font-semibold">{d.attendees.toLocaleString()} attendees ({d.share}%)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="share" name="Share %" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                        {attendeeDemographicsLocation.map((_, index) => (
                          <Cell
                            key={`loc-cell-${index}`}
                            fill={index === 0 ? '#8b5cf6' : index === 1 ? '#06b6d4' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Primary Hub:</span>
                  <span className="font-bold text-violet-400">Nairobi Metropolis (62%)</span>
                </div>
              </div>

              {/* Age Demographics & User Profiling */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Age Cohort Demographics</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Buyer age group distribution</p>
                </div>

                <div className="space-y-3.5 my-auto">
                  {ageDemographicsData.map((item) => (
                    <div key={item.ageGroup} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-200">{item.ageGroup}</span>
                        <span className="text-amber-400">{item.percentage}% ({item.count} passes)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor:
                              item.percentage > 40
                                ? '#8b5cf6'
                                : item.percentage > 25
                                ? '#06b6d4'
                                : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Core Target Segment:</span>
                  <span className="font-bold text-white">25–34 Young Professionals (48%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: GATE CHECK-IN STATISTICS & INGRESS VELOCITY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Gate Check-in Statistics & Ingress Throughput</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hourly attendee arrival velocity, gate entrance load balancing, and anti-counterfeit logs
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Recharts Stacked Bar
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Ingress Bar Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Hourly Gate Check-In Velocity (Ingress Flow)</h4>
                    <p className="text-[11px] text-slate-400">Stacked scans per gate lane from gates open (14:00) to late entry (21:00)</p>
                  </div>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    <Clock className="w-3 h-3" />
                    <span>Peak 18:00 (490 scans/hr)</span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={gateIngressFlow}
                      margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const total = payload.reduce((acc, p) => acc + Number(p.value), 0);
                            return (
                              <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                                  <span className="font-extrabold text-white">{label} Window</span>
                                  <span className="font-black text-amber-400">{total} scans</span>
                                </div>
                                {payload.map((entry: any, i: number) => (
                                  <div key={`gate-tip-${i}`} className="flex items-center justify-between space-x-3">
                                    <span style={{ color: entry.color }} className="font-semibold">
                                      {entry.name}:
                                    </span>
                                    <span className="font-bold text-white">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="GateA" name="Gate A (General Arena)" fill="#8b5cf6" stackId="gate" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="GateB_VIP" name="Gate B (VIP Fast Track)" fill="#f59e0b" stackId="gate" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="GateC_Crew" name="Gate C (Media / Artists)" fill="#06b6d4" stackId="gate" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gate Lane Health Table & Security Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Gate Entrance Health & Diagnostics</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Live operational latency and security logs</p>
                </div>

                <div className="space-y-3">
                  {gateLanesStats.map((lane) => (
                    <div
                      key={lane.gate}
                      className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{lane.gate}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {lane.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <p className="text-slate-400">Scanned</p>
                          <p className="font-bold text-white mt-0.5">{lane.checkedIn} passes</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Throughput</p>
                          <p className="font-bold text-violet-300 mt-0.5">{lane.rate}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Avg Latency</p>
                          <p className="font-bold text-cyan-300 mt-0.5">{lane.avgLatency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-violet-950/40 border border-violet-800/40 rounded-2xl space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-violet-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Anti-Counterfeit Protection: 100% Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    4 duplicate/screenshot attempts flagged and denied entry automatically by cryptographic HMAC verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY EVENTS */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e) => (
            <div
              key={e.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {e.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">● Live on TiketiPass</span>
                </div>
                <h4 className="text-base font-bold text-white mt-2">{e.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{e.venue}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Capacity: {e.capacity.toLocaleString()}</span>
                <span className="font-bold text-violet-400">View Analytics</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PROMO CODES */}
      {activeTab === 'promos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="max-w-md space-y-3">
            <h3 className="text-base font-extrabold text-white">Create New Promo Code</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Promo Code</label>
              <input
                type="text"
                value={promoCodeName}
                onChange={(e) => setPromoCodeName(e.target.value.toUpperCase())}
                placeholder="e.g. FLASH25"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Discount %</label>
                <input
                  type="number"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={promoLimit}
                  onChange={(e) => setPromoLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setPromoStatus(`Code ${promoCodeName || 'VIPPROMO'} created successfully!`);
                setTimeout(() => setPromoStatus(null), 2500);
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold"
            >
              Save Promo Code
            </button>

            {promoStatus && <p className="text-xs text-emerald-400 font-bold">{promoStatus}</p>}
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE PAYOUTS (FR37) */}
      {activeTab === 'payouts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Organizer Payout Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Withdraw ticket sales revenues directly to your M-Pesa Till or Kenyan Bank Account.
              </p>
            </div>
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Request Payout</span>
            </button>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Recent Payout History</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
                <div>
                  <p className="font-bold text-white">Equity Bank Account #0810293847291</p>
                  <p className="text-slate-400 text-[11px]">Approved by Super Admin on 15 Oct 2026</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-emerald-400 text-sm">KES 450,000</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    APPROVED & SETTLED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal with Gemini AI Description Generator (FR40) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Create New Event</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Afrobeat Sunset Festival 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              {/* AI Description Generator Helper Box (FR40) */}
              <div className="p-3 bg-violet-950/40 border border-violet-800/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gemini AI Copywriter (FR40)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={aiGenLoading || !newEventTitle}
                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-bold disabled:opacity-50 transition"
                  >
                    {aiGenLoading ? 'Writing...' : 'Generate Description'}
                  </button>
                </div>
                <input
                  type="text"
                  value={aiGenKeywords}
                  onChange={(e) => setAiGenKeywords(e.target.value)}
                  placeholder="Keywords: live band, food market, craft beer, nairobi nightlife"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Event Description</label>
                <textarea
                  rows={3}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Full details of what attendees will experience..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={newEventCategory}
                    onChange={(e: any) => setNewEventCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="Concert">Concert</option>
                    <option value="Conference">Conference</option>
                    <option value="Festival">Festival</option>
                    <option value="Food & Drink">Food & Drink</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Venue & Location</label>
                <input
                  type="text"
                  value={newEventVenue}
                  onChange={(e) => setNewEventVenue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              {/* Dynamic Ticket Tiers & Pricing Builder */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TicketIcon className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">Configure Ticket Tiers & Prices</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Total Capacity: {newTicketTiers.reduce((s, t) => s + (Number(t.quantity) || 0), 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {newTicketTiers.map((tier, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-violet-300">Tier #{idx + 1}</span>
                        {newTicketTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewTicketTiers(newTicketTiers.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-red-400"
                            title="Remove tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Tier Name</label>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => {
                              const updated = [...newTicketTiers];
                              updated[idx].name = e.target.value;
                              setNewTicketTiers(updated);
                            }}
                            placeholder="e.g. Early Bird"
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Price (KES)</label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={tier.price}
                            onChange={(e) => {
                              const updated = [...newTicketTiers];
                              updated[idx].price = Number(e.target.value);
                              setNewTicketTiers(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-extrabold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Quantity / Stock</label>
                          <input
                            type="number"
                            min="1"
                            value={tier.quantity}
                            onChange={(e) => {
                              const updated = [...newTicketTiers];
                              updated[idx].quantity = Number(e.target.value);
                              setNewTicketTiers(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Perks (comma-separated)</label>
                        <input
                          type="text"
                          value={tier.perks}
                          onChange={(e) => {
                            const updated = [...newTicketTiers];
                            updated[idx].perks = e.target.value;
                            setNewTicketTiers(updated);
                          }}
                          placeholder="e.g. VIP Gate access, Welcome drink, Front terrace"
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNewTicketTiers([
                      ...newTicketTiers,
                      { name: 'VVIP Pass', price: 8000, quantity: 200, perks: 'VIP fast-track, private bar, lanyard' },
                    ])
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-700 rounded-xl text-xs font-bold text-violet-400 flex items-center justify-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Ticket Tier</span>
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold"
                >
                  Publish Event with Configured Tiers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Request Revenue Settlement</h3>
              <button onClick={() => setPayoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Amount to Withdraw (KES)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Payout Destination</label>
                <input
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder="M-Pesa Paybill / Till or Bank Details"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            {payoutStatus && <p className="text-xs text-emerald-400 font-bold">{payoutStatus}</p>}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
