'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  Briefcase,
  X,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
}

interface CalendarEvent {
  id: string;
  type: 'meeting' | 'task';
  title: string;
  start: string;
  end: string;
  location?: string;
  priority?: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
}

export default function CalendarPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { confirm, dialogProps } = useConfirmDialog();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Form state for new meeting
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchEvents = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      
      // Get first and last day of visible calendar
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Extend to include previous/next month days shown
      firstDay.setDate(firstDay.getDate() - firstDay.getDay());
      lastDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/meetings/calendar?start=${firstDay.toISOString()}&end=${lastDay.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, currentDate, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchEvents();
  }, [isLoaded, isSignedIn, fetchEvents]);

  const createMeeting = async () => {
    if (!newMeeting.title || !newMeeting.startTime || !newMeeting.endTime) return;
    
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/meetings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMeeting),
        }
      );
      
      if (res.ok) {
        setShowModal(false);
        setNewMeeting({ title: '', description: '', location: '', startTime: '', endTime: '' });
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
  };

  const deleteMeeting = async (id: string) => {
    const ok = await confirm({ title: 'Delete Meeting', message: 'Are you sure you want to delete this meeting?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    
    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/meetings/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month
    const startPad = firstDay.getDay();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month
    const endPad = 6 - lastDay.getDay();
    for (let i = 1; i <= endPad; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Week view helpers
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekViewDays = getWeekDays(currentDate);

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getHours() === hour
      );
    });
  };

  const navigateCalendar = (direction: number) => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + direction * 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + direction);
      setCurrentDate(d);
    }
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Calendar</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your meetings and tasks
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            const now = new Date();
            const start = new Date(now.getTime() + 60 * 60 * 1000);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            setNewMeeting({
              ...newMeeting,
              startTime: start.toISOString().slice(0, 16),
              endTime: end.toISOString().slice(0, 16),
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateCalendar(-1)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white min-w-[180px] text-center">
              {view === 'day'
                ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : view === 'week'
                ? `${weekViewDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekViewDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateCalendar(1)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Today
          </button>
          <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-600 overflow-hidden ml-2">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  view === v
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        {view === 'month' ? (
        <div className="grid grid-cols-7">
          {/* Weekday Headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700"
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[100px] p-2 border-b border-r border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors
                  ${!isCurrentMonth(date) ? 'bg-neutral-50 dark:bg-neutral-950' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1
                    ${isToday(date) ? 'bg-black text-white dark:bg-white dark:text-black' : ''}
                    ${!isCurrentMonth(date) ? 'text-neutral-400' : 'text-neutral-900 dark:text-white'}
                  `}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className={`text-xs p-1 rounded truncate cursor-pointer transition-colors
                        ${event.type === 'meeting' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50' 
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                        }
                      `}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-neutral-500 pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        ) : view === 'week' ? (
          /* Week View */
          <div className="overflow-auto max-h-[600px]">
            <div className="grid grid-cols-8 min-w-[800px]">
              {/* Header row */}
              <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 p-2 border-b border-r border-neutral-200 dark:border-neutral-700" />
              {weekViewDays.map((date, i) => (
                <div key={i} className={`sticky top-0 z-10 bg-white dark:bg-neutral-900 p-2 text-center border-b border-r border-neutral-200 dark:border-neutral-700 ${isToday(date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className="text-xs text-neutral-500">{weekDays[i]}</div>
                  <div className={`text-lg font-semibold ${isToday(date) ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>{date.getDate()}</div>
                </div>
              ))}
              {/* Hour rows */}
              {hours.filter(h => h >= 6 && h <= 22).map((hour) => (
                <>
                  <div key={`label-${hour}`} className="p-2 text-xs text-neutral-500 text-right border-r border-neutral-200 dark:border-neutral-700 h-16">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {weekViewDays.map((date, di) => {
                    const hourEvents = getEventsForHour(date, hour);
                    return (
                      <div key={`${hour}-${di}`} className={`border-b border-r border-neutral-100 dark:border-neutral-800 h-16 p-0.5 ${isToday(date) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        {hourEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`text-xs p-1 rounded truncate cursor-pointer mb-0.5 ${
                              ev.type === 'meeting'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            }`}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        ) : (
          /* Day View */
          <div className="overflow-auto max-h-[600px]">
            <div className="min-w-[400px]">
              {hours.filter(h => h >= 6 && h <= 22).map((hour) => {
                const hourEvents = getEventsForHour(currentDate, hour);
                return (
                  <div key={hour} className="flex border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-20 p-2 text-xs text-neutral-500 text-right flex-shrink-0">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    <div className="flex-1 min-h-[60px] p-1">
                      {hourEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`text-sm p-2 rounded cursor-pointer mb-1 ${
                            ev.type === 'meeting'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          <div className="font-medium">{ev.title}</div>
                          <div className="text-xs opacity-75">{formatTime(ev.start)} - {formatTime(ev.end)}</div>
                          {ev.location && <div className="text-xs opacity-75 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{ev.location}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mb-2 ${
                  selectedEvent.type === 'meeting' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {selectedEvent.type === 'meeting' ? 'Meeting' : 'Task'}
                </span>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                <Clock className="w-4 h-4" />
                <span>
                  {formatTime(selectedEvent.start)}
                  {selectedEvent.end && selectedEvent.start !== selectedEvent.end && ` - ${formatTime(selectedEvent.end)}`}
                </span>
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              
              {selectedEvent.customer && (
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <User className="w-4 h-4" />
                  <span>{selectedEvent.customer.name}</span>
                </div>
              )}
              
              {selectedEvent.deal && (
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{selectedEvent.deal.title}</span>
                </div>
              )}
            </div>

            {selectedEvent.type === 'meeting' && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => deleteMeeting(selectedEvent.id)}
                  className="flex-1 px-4 py-2 text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">New Meeting</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Meeting title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  rows={2}
                  placeholder="Meeting description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Location</label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Meeting location or link"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Start *</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">End *</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={createMeeting}
                disabled={!newMeeting.title || !newMeeting.startTime || !newMeeting.endTime}
                className="flex-1 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50"
              >
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
