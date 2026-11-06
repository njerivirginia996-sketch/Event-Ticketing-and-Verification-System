import React, { useState, useMemo } from 'react';
import { EventItem, TicketType } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Tag,
  Ticket as TicketIcon,
  Edit3,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface EventCalendarProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onRefreshEvents: () => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  events,
  onSelectEvent,
  onRefreshEvents,
}) => {
  // Calendar state - default to current month of sample events (November 2026)
  const [currentDate, setCurrentDate] = useState(() => {
    // If events exist, default to the month of the first event, otherwise current date
    if (events.length > 0 && events[0].startAt) {
      const d = new Date(events[0].startAt);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date();
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    if (events.length > 0 && events[0].startAt) {
      return events[0].startAt.split('T')[0];
    }
    return null;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Edit Pricing Modal State
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editableTiers, setEditableTiers] = useState<Array<{ id?: string; name: string; price: number; quantity: number }>>([]);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [pricingErrorMsg, setPricingErrorMsg] = useState<string | null>(null);

  const categories = ['All', 'Concert', 'Conference', 'Food & Drink', 'Festival'];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Filter events by category
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory === 'All') return true;
      return e.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [events, selectedCategory]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const ev of filteredEvents) {
      const dateKey = ev.startAt.split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(ev);
    }
    return map;
  }, [filteredEvents]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Days array for grid
  const calendarDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: EventItem[];
    }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Next month filler days to complete grid (42 cells = 6 rows)
    const remaining = 42 - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        events: eventsByDate[dateStr] || [],
      });
    }

    return days;
  }, [year, month, firstDayIndex, daysInMonth, daysInPrevMonth, eventsByDate]);

  // Selected Day's events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return eventsByDate[selectedDateStr] || [];
  }, [selectedDateStr, eventsByDate]);

  // Open Edit Pricing Modal
  const handleOpenEditPricing = (ev: EventItem) => {
    setEditingEvent(ev);
    const tiers = ev.ticketTypes && ev.ticketTypes.length > 0
      ? ev.ticketTypes.map(t => ({ id: t.id, name: t.name, price: t.price, quantity: t.quantity }))
      : [
          { name: 'Standard Admission', price: ev.minPrice || 2000, quantity: ev.capacity || 1000 },
          { name: 'VIP Pass', price: (ev.minPrice || 2000) * 2, quantity: 200 },
        ];
    setEditableTiers(tiers);
    setPricingSuccessMsg(null);
    setPricingErrorMsg(null);
  };

  // Add new tier in modal
  const handleAddTier = () => {
    setEditableTiers([
      ...editableTiers,
      { name: 'New Tier Pass', price: 2000, quantity: 250 },
    ]);
  };

  // Remove tier in modal
  const handleRemoveTier = (idx: number) => {
    if (editableTiers.length <= 1) return;
    setEditableTiers(editableTiers.filter((_, i) => i !== idx));
  };

  // Save updated pricing to server
  const handleSavePricing = async () => {
    if (!editingEvent) return;
    setIsSavingPricing(true);
    setPricingErrorMsg(null);

    try {
      const res = await fetch(`/api/events/${editingEvent.id}/ticket-types`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketTypes: editableTiers,
          editorName: 'Event Organizer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPricingErrorMsg(data.error || 'Failed to update ticket pricing');
        return;
      }

      setPricingSuccessMsg('Ticket prices updated and saved successfully!');
      onRefreshEvents();
      setTimeout(() => {
        setEditingEvent(null);
        setPricingSuccessMsg(null);
      }, 1500);
    } catch {
      setPricingErrorMsg('Error saving ticket prices. Please check connection.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Category Color badges
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concert':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
      case 'conference':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'food & drink':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'festival':
        return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Event Calendar & Price Planner</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Upcoming Events Schedule
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Browse upcoming performances, summits, and festivals by date. View and dynamically edit ticket prices in real-time.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'grid'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'timeline'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chronological Agenda
          </button>
        </div>
      </div>

      {/* Filter and Month Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        {/* Month Navigation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-black text-white min-w-[160px] text-center">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            Today
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Grid (7 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2 border-b border-slate-800">
              <span className="text-red-400">Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const hasEvents = cell.events.length > 0;
                const isSelected = selectedDateStr === cell.dateStr;
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(cell.dateStr);
                    }}
                    className={`min-h-[74px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-500 bg-violet-950/40 ring-2 ring-violet-500/50'
                        : hasEvents
                        ? 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-800'
                        : cell.isCurrentMonth
                        ? 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-850'
                        : 'border-transparent bg-slate-950/30 opacity-30 hover:opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : isSelected
                            ? 'bg-violet-600 text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {hasEvents && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-violet-500/30 text-violet-300">
                          {cell.events.length}
                        </span>
                      )}
                    </div>

                    {/* Events pills or price preview in date cell */}
                    {hasEvents ? (
                      <div className="space-y-1 mt-1">
                        {cell.events.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="text-[10px] truncate px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-violet-500/30 text-white font-medium"
                          >
                            <span className="text-violet-400 font-bold block truncate">
                              {ev.title}
                            </span>
                            <span className="text-amber-400 font-bold text-[9px]">
                              {ev.minPrice ? `KES ${ev.minPrice.toLocaleString()}` : 'Free'}
                            </span>
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <span className="text-[9px] text-slate-400 font-semibold pl-1">
                            +{cell.events.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Inspector Panel (5 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                Schedule Inspector
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {selectedDateStr
                  ? new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-KE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a Date'}
              </h3>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No events on this day</p>
                <p className="text-xs text-slate-500">
                  Select a highlighted date on the calendar to view events, venue logistics, and ticket pricing.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayEvents.map((ev) => {
                  const startTime = new Date(ev.startAt).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endTime = new Date(ev.endAt).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={ev.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-4"
                    >
                      {/* Event Banner & Badge */}
                      <div className="relative h-28 rounded-xl overflow-hidden">
                        <img
                          src={ev.bannerUrl}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold border ${getCategoryBadgeClass(
                            ev.category
                          )}`}
                        >
                          {ev.category}
                        </span>
                      </div>

                      {/* Title & Timing */}
                      <div>
                        <h4 className="font-extrabold text-white text-base leading-snug">
                          {ev.title}
                        </h4>
                        <div className="flex items-center text-xs text-slate-400 mt-1 space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          <span>
                            {startTime} - {endTime}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-slate-400 mt-1 space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>

                      {/* Ticket Pricing Section */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                            <TicketIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ticket Tiers & Pricing</span>
                          </span>

                          {/* Edit Price Button */}
                          <button
                            onClick={() => handleOpenEditPricing(ev)}
                            className="px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 border border-violet-500/30 transition"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Prices</span>
                          </button>
                        </div>

                        {/* List of Tiers */}
                        <div className="space-y-1.5 pt-1">
                          {ev.ticketTypes && ev.ticketTypes.length > 0 ? (
                            ev.ticketTypes.map((tier) => (
                              <div
                                key={tier.id}
                                className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/60 last:border-0"
                              >
                                <span className="text-slate-300 truncate max-w-[150px]">
                                  {tier.name}
                                </span>
                                <span className="font-extrabold text-amber-400">
                                  KES {tier.price.toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between text-xs font-extrabold">
                              <span className="text-slate-300">Admission</span>
                              <span className="text-amber-400">
                                KES {ev.minPrice ? ev.minPrice.toLocaleString() : '2,000'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => onSelectEvent(ev)}
                        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-violet-600/20 transition active:scale-98"
                      >
                        <span>Book Passes for this Event</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIMELINE AGENDA VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {Object.entries(eventsByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, evList]) => {
              const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-KE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-violet-600 text-white">
                      {formattedDate}
                    </span>
                    <div className="h-px bg-slate-800 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evList.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-violet-500/50 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                                ev.category
                              )}`}
                            >
                              {ev.category}
                            </span>
                            <span className="text-xs font-extrabold text-amber-400">
                              From KES {ev.minPrice ? ev.minPrice.toLocaleString() : '2,000'}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-white mt-2 line-clamp-1">
                            {ev.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {ev.venue} • {ev.location}
                          </p>
                        </div>

                        {/* Price breakdown pill */}
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {ev.ticketTypes?.length || 1} Tier(s) available
                          </span>
                          <button
                            onClick={() => handleOpenEditPricing(ev)}
                            className="text-violet-400 hover:text-violet-300 font-bold flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Pricing</span>
                          </button>
                        </div>

                        <button
                          onClick={() => onSelectEvent(ev)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                        >
                          <span>View Details & Tickets</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* EDIT TICKET PRICING MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  Price Planner & Editor
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{editingEvent.title}</h3>
              </div>

              <button
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Modify ticket tier names, quantities, and pricing in Kenyan Shillings (KES). Changes take effect instantly for attendees purchasing passes.
            </p>

            {pricingErrorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{pricingErrorMsg}</span>
              </div>
            )}

            {pricingSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{pricingSuccessMsg}</span>
              </div>
            )}

            {/* Editable Tiers List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {editableTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Tier #{idx + 1}</span>
                    {editableTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Remove tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const updated = [...editableTiers];
                          updated[idx].name = e.target.value;
                          setEditableTiers(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Price (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...editableTiers];
                          updated[idx].price = Number(e.target.value);
                          setEditableTiers(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-extrabold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Stock Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => {
                          const updated = [...editableTiers];
                          updated[idx].quantity = Number(e.target.value);
                          setEditableTiers(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Tier Button */}
            <button
              type="button"
              onClick={handleAddTier}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 rounded-xl text-xs font-bold text-violet-400 flex items-center justify-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Ticket Tier</span>
            </button>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePricing}
                disabled={isSavingPricing}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
              >
                {isSavingPricing ? 'Saving Changes...' : 'Save & Apply Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
