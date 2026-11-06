import React, { useState, useMemo, useEffect } from 'react';
import { EventItem } from '../types';
import { EventCalendar } from './EventCalendar';
import { notificationService } from '../services/notificationService';
import {
  Calendar,
  MapPin,
  Tag,
  Search,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Zap,
  LayoutGrid,
  X,
  SlidersHorizontal,
  Bell,
  BellRing,
  RotateCcw,
  Check
} from 'lucide-react';

interface EventListProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onRefreshEvents?: () => void;
  initialMode?: 'cards' | 'calendar';
}

const CATEGORIES = ['All', 'Concert', 'Conference', 'Food & Drink', 'Festival', 'Sports'];

export const EventList: React.FC<EventListProps> = ({
  events,
  onSelectEvent,
  onRefreshEvents = () => {},
  initialMode = 'cards',
}) => {
  const [displayMode, setDisplayMode] = useState<'cards' | 'calendar'>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'weekend' | 'this_month' | 'next_month'>('all');
  const [interestedEventIds, setInterestedEventIds] = useState<string[]>([]);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Load interested event IDs
  useEffect(() => {
    setInterestedEventIds(notificationService.getInterestedEventIds());
    // Periodically check if any interested events start soon
    notificationService.checkUpcomingInterestedEvents(events);
  }, [events]);

  // Extract unique locations/cities from events
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    events.forEach((e) => {
      if (e.location) {
        // Look for common Kenya city/region tokens or use the full location
        const parts = e.location.split(',');
        const city = parts[parts.length - 2]?.trim() || parts[0]?.trim();
        if (city) locSet.add(city);
      }
      if (e.venue) {
        const venueFirstWord = e.venue.split(' ')[0];
        if (venueFirstWord) locSet.add(venueFirstWord);
      }
    });
    return ['All', ...Array.from(locSet)];
  }, [events]);

  // Toggle Interested Event (FR: alert when event they are interested in is about to start)
  const handleToggleInterested = (e: React.MouseEvent, event: EventItem) => {
    e.stopPropagation();
    const isNowInterested = notificationService.toggleInterestedEvent(event.id, event.title);
    setInterestedEventIds(notificationService.getInterestedEventIds());

    if (isNowInterested) {
      setNotificationToast(`Reminder active! We'll alert you before "${event.title}" starts.`);
    } else {
      setNotificationToast(`Reminder removed for "${event.title}".`);
    }
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Immediate simulation of "Event Starting Soon" alert for this event
  const handleSimulateStartAlert = (e: React.MouseEvent, event: EventItem) => {
    e.stopPropagation();
    notificationService.sendEventStartingSoonNotification({
      eventId: event.id,
      eventTitle: event.title,
      venue: event.venue,
      startAt: event.startAt,
    });
    setNotificationToast(`Browser alert triggered for "${event.title}"!`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Robust Filtering Logic: Title, Location/Venue, or Date
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // 1. Category Filter
      if (selectedCategory !== 'All' && e.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 2. Specific Location Filter
      if (selectedLocation !== 'All') {
        const locLower = selectedLocation.toLowerCase();
        const matchesLoc =
          e.location.toLowerCase().includes(locLower) || e.venue.toLowerCase().includes(locLower);
        if (!matchesLoc) return false;
      }

      // 3. Specific Date Picker Filter (YYYY-MM-DD match)
      if (selectedDate) {
        const eventDateStr = e.startAt.split('T')[0]; // "2026-11-20"
        if (eventDateStr !== selectedDate) {
          return false;
        }
      }

      // 4. Quick Date Preset Filter
      if (datePreset !== 'all') {
        const evtDate = new Date(e.startAt);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (datePreset === 'weekend') {
          // Saturday (6) or Sunday (0)
          const day = evtDate.getDay();
          if (day !== 0 && day !== 6) return false;
        } else if (datePreset === 'this_month') {
          // Match November 2026 or current active month
          if (evtDate.getMonth() !== 10 && evtDate.getMonth() !== currentMonth) return false;
        } else if (datePreset === 'next_month') {
          // Match December 2026
          if (evtDate.getMonth() !== 11) return false;
        }
      }

      // 5. Robust Text Search: Title, Venue, Location, and Date formatting strings
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const evtDate = new Date(e.startAt);
        const monthName = evtDate.toLocaleString('default', { month: 'long' }).toLowerCase();
        const monthShort = evtDate.toLocaleString('default', { month: 'short' }).toLowerCase();
        const dayOfWeek = evtDate.toLocaleString('default', { weekday: 'long' }).toLowerCase();
        const yearStr = evtDate.getFullYear().toString();
        const dayOfMonth = evtDate.getDate().toString();

        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesVenue = e.venue.toLowerCase().includes(q);
        const matchesLocation = e.location.toLowerCase().includes(q);
        const matchesCategory = e.category.toLowerCase().includes(q);
        const matchesDate =
          monthName.includes(q) ||
          monthShort.includes(q) ||
          dayOfWeek.includes(q) ||
          yearStr.includes(q) ||
          dayOfMonth === q ||
          `${dayOfMonth} ${monthShort}`.includes(q) ||
          `${monthShort} ${dayOfMonth}`.includes(q);

        if (!matchesTitle && !matchesVenue && !matchesLocation && !matchesCategory && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedCategory, selectedLocation, selectedDate, datePreset, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedLocation !== 'All' ||
    selectedDate !== '' ||
    datePreset !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLocation('All');
    setSelectedDate('');
    setDatePreset('all');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Real-time Notification Banner Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-violet-900/95 border border-violet-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md">
            <BellRing className="w-5 h-5 text-amber-400 animate-bounce flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{notificationToast}</span>
          </div>
        </div>
      )}

      {/* Hero Banner with African Fintech / Event vibe */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-slate-900 to-indigo-950 border border-violet-800/40 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-Time High Concurrency Ticketing & Verification</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Discover Live Events & Get{' '}
            <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Verified Digital Passes
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Seamless checkout with M-Pesa STK Push and card. Instant HMAC-signed QR tickets delivered to your phone with sub-second gate check-in and browser alerts.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Anti-Fraud</p>
                <p className="text-sm font-bold text-white">HMAC Signed</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Checkout</p>
                <p className="text-sm font-bold text-white">M-Pesa STK Push</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Gate Verification</p>
                <p className="text-sm font-bold text-white">&lt;1s Scan Speed</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Ticket Integrity</p>
                <p className="text-sm font-bold text-white">Dynamic Refresh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main View Switcher & Robust Search Control Section */}
      <div className="space-y-4">
        {/* View Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-md">
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDisplayMode('cards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer ${
                displayMode === 'cards'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Featured Event Cards</span>
            </button>

            <button
              onClick={() => setDisplayMode('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer ${
                displayMode === 'calendar'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Calendar Schedule & Prices</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>High-concurrency ticket traffic active</span>
          </div>
        </div>

        {/* Robust Real-Time Search & Filter Box (Title, Location, Date) */}
        {displayMode === 'cards' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            {/* Top Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* 1. Universal Search Input (Title, Venue, Location, Date text) */}
              <div className="relative md:col-span-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, artist, venue, or keywords..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-2xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 2. Real-Time Location Filter Dropdown */}
              <div className="relative md:col-span-3">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-2xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
                >
                  <option value="All">All Locations & Cities</option>
                  {uniqueLocations
                    .filter((l) => l !== 'All')
                    .map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>

              {/* 3. Real-Time Specific Date Picker Filter */}
              <div className="relative md:col-span-4 flex items-center space-x-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      if (e.target.value) setDatePreset('all');
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-2xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition [color-scheme:dark]"
                    title="Filter events on a specific calendar date"
                  />
                </div>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="Clear date filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Date Presets & Categories */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-500/50'
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Date Presets */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 hidden lg:inline">Quick Dates:</span>
                <button
                  onClick={() => {
                    setDatePreset('all');
                    setSelectedDate('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    datePreset === 'all' && !selectedDate
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => {
                    setDatePreset('weekend');
                    setSelectedDate('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    datePreset === 'weekend'
                      ? 'bg-amber-600/80 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Weekends
                </button>
                <button
                  onClick={() => {
                    setDatePreset('this_month');
                    setSelectedDate('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    datePreset === 'this_month'
                      ? 'bg-amber-600/80 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  November
                </button>
                <button
                  onClick={() => {
                    setDatePreset('next_month');
                    setSelectedDate('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    datePreset === 'next_month'
                      ? 'bg-amber-600/80 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  December
                </button>
              </div>
            </div>

            {/* Real-time Filter Feedback Bar & Active Filters */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-bold text-white">
                  Showing {filteredEvents.length} of {events.length} events
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-violet-900/60 text-violet-300 border border-violet-700/50 text-[11px]">
                    <span>Search: "{searchQuery}"</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedLocation !== 'All' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[11px]">
                    <span>Location: {selectedLocation}</span>
                    <button onClick={() => setSelectedLocation('All')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedDate && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-900/60 text-amber-300 border border-amber-700/50 text-[11px]">
                    <span>Date: {selectedDate}</span>
                    <button onClick={() => setSelectedDate('')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {datePreset !== 'all' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-900/60 text-amber-300 border border-amber-700/50 text-[11px]">
                    <span>Preset: {datePreset.replace('_', ' ')}</span>
                    <button onClick={() => setDatePreset('all')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-700/50 text-[11px]">
                    <span>Category: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('All')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center space-x-1 text-slate-400 hover:text-white font-semibold transition cursor-pointer flex-shrink-0 ml-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conditionally Render Calendar View */}
      {displayMode === 'calendar' ? (
        <EventCalendar
          events={events}
          onSelectEvent={onSelectEvent}
          onRefreshEvents={onRefreshEvents}
        />
      ) : (
        <>
          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const startDate = new Date(event.startAt);
              const formattedDate = startDate.toLocaleDateString('en-KE', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = startDate.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isInterested = interestedEventIds.includes(event.id);

              return (
                <div
                  key={event.id}
                  className="group relative bg-slate-800/60 rounded-2xl border border-slate-700/70 overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/40 flex flex-col"
                >
                  {/* Event Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-violet-300 font-bold text-xs border border-violet-500/30">
                      {event.category}
                    </span>

                    {/* Interested / Remind Me Bell Action */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleToggleInterested(e, event)}
                        className={`p-2 rounded-xl backdrop-blur-md transition shadow-md cursor-pointer ${
                          isInterested
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                            : 'bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60'
                        }`}
                        title={
                          isInterested
                            ? 'Tracking active! Click to remove reminder'
                            : 'Set reminder: Alert me in browser when event starts'
                        }
                      >
                        {isInterested ? (
                          <BellRing className="w-4 h-4 animate-pulse text-slate-950" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </button>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-400 font-semibold text-xs border border-emerald-500/30">
                        {event.capacity.toLocaleString()} Cap
                      </span>
                    </div>

                    {isInterested && (
                      <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                        <BellRing className="w-3 h-3" />
                        <span>Reminder Alert Active</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center text-xs font-semibold text-violet-400 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-violet-400" />
                        <span>
                          {formattedDate} • {formattedTime}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                        {event.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-700/60">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center space-x-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate" title={event.location}>
                            {event.venue}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          by {event.organizerName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1.5">
                          {/* Quick test reminder alert simulation */}
                          <button
                            onClick={(e) => handleSimulateStartAlert(e, event)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 text-xs border border-slate-700 transition cursor-pointer"
                            title="Test alert: Simulate 'Event Starting Soon' browser notification right now"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Get Tickets Button */}
                        <button
                          onClick={() => onSelectEvent(event)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-violet-700/20 transition transform active:scale-95 cursor-pointer"
                        >
                          <span>Get Tickets</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Tag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No events match your search criteria</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  We couldn't find any events matching your selected filters for title, location, category, or date.
                </p>
              </div>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold inline-flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-violet-600/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
