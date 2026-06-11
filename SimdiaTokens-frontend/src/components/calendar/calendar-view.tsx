"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { CalendarEvent, fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users,
  Plus, Trash2, Edit3, Loader2, X, Check, ArrowLeft,
} from "lucide-react";

type ViewType = "month" | "week" | "day";

interface CalendarViewProps {
  tokenId: string;
  onBack: () => void;
}

export default function CalendarView({ tokenId, onBack }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [eventSubject, setEventSubject] = useState("");
  const [eventBody, setEventBody] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAttendees, setEventAttendees] = useState("");
  const [eventIsAllDay, setEventIsAllDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      const data = await fetchCalendarEvents(tokenId, start, end);
      setEvents(data.events || []);
    } catch (err: any) {
      toast.error("Failed to load calendar events", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId, currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    setEventStartDate(dateStr);
    setEventEndDate(dateStr);
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setCreateDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!tokenId || !eventSubject.trim()) return;
    setSaving(true);
    try {
      const startDateTime = `${eventStartDate}T${eventStartTime}:00`;
      const endDateTime = `${eventEndDate}T${eventEndTime}:00`;
      const attendees = eventAttendees.split(",").map(e => e.trim()).filter(Boolean);
      
      await createCalendarEvent(tokenId, {
        subject: eventSubject.trim(),
        body: eventBody.trim(),
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        time_zone: "UTC",
        location: eventLocation.trim(),
        attendees: attendees.length > 0 ? attendees : undefined,
        is_all_day: eventIsAllDay,
      });
      
      toast.success("Event created");
      setCreateDialogOpen(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      toast.error("Failed to create event", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!tokenId || !confirm("Delete this event?")) return;
    try {
      await deleteCalendarEvent(tokenId, eventId);
      toast.success("Event deleted");
      setEventDialogOpen(false);
      loadEvents();
    } catch (err: any) {
      toast.error("Failed to delete event", { description: err.message });
    }
  };

  const resetForm = () => {
    setEventSubject("");
    setEventBody("");
    setEventStartDate("");
    setEventStartTime("");
    setEventEndDate("");
    setEventEndTime("");
    setEventLocation("");
    setEventAttendees("");
    setEventIsAllDay(false);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventDate = parseISO(event.start.dateTime);
      return isSameDay(eventDate, date);
    });
  };

  // Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isToday(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDateClick(day)}
            className={cn(
              "min-h-[100px] border border-[#2a2e37] p-2 cursor-pointer transition-colors hover:bg-[#1a1d24]",
              !isCurrentMonth && "bg-[#0a0c10] text-[#475569]",
              isCurrentMonth && "bg-[#0f1115]",
              isTodayDate && "bg-[#0f6cbd]/10 border-[#0f6cbd]/30",
              isSelected && "bg-[#0f6cbd]/20 border-[#0f6cbd]"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-xs font-medium",
                isTodayDate ? "text-[#0f6cbd]" : "text-[#94a3b8]",
                !isCurrentMonth && "text-[#475569]"
              )}>
                {format(day, "d")}
              </span>
              {dayEvents.length > 0 && (
                <Badge variant="outline" className="text-[9px] bg-[#0f6cbd]/20 text-[#0f6cbd] border-[#0f6cbd]/30">
                  {dayEvents.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(event);
                  }}
                  className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#0f6cbd]/20 text-[#0f6cbd] cursor-pointer hover:bg-[#0f6cbd]/30"
                >
                  {event.subject || "(No title)"}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[9px] text-[#64748b] px-1.5">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-[#2a2e37]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-[#64748b] uppercase">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Grid */}
        <div className="flex-1">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e37]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Mail
          </button>
          <div className="h-4 w-px bg-[#2a2e37]" />
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-1 rounded hover:bg-[#2a2e37] transition-colors">
              <ChevronLeft className="h-4 w-4 text-[#94a3b8]" />
            </button>
            <h2 className="text-sm font-semibold text-[#e2e8f0] min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button onClick={handleNextMonth} className="p-1 rounded hover:bg-[#2a2e37] transition-colors">
              <ChevronRight className="h-4 w-4 text-[#94a3b8]" />
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handleToday} className="border-[#2a2e37] text-[#94a3b8] hover:bg-[#2a2e37] h-7 text-xs">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#1a1d24] rounded-lg border border-[#2a2e37] p-0.5">
            {(["month", "week", "day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium capitalize transition-colors",
                  view === v ? "bg-[#0f6cbd] text-white" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setSelectedDate(new Date()); handleDateClick(new Date()); }} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white h-7 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> New Event
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-[#0f6cbd]" />
          </div>
        ) : (
          renderMonthView()
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#e2e8f0]">{selectedEvent.subject || "(No title)"}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#94a3b8]">
                  <Clock className="h-4 w-4" />
                  <span>
                    {selectedEvent.start?.dateTime ? format(parseISO(selectedEvent.start.dateTime), "MMM d, yyyy h:mm a") : "No start time"}
                    {" - "}
                    {selectedEvent.end?.dateTime ? format(parseISO(selectedEvent.end.dateTime), "MMM d, yyyy h:mm a") : "No end time"}
                  </span>
                </div>
                {selectedEvent.location?.displayName && (
                  <div className="flex items-center gap-2 text-[#94a3b8]">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location.displayName}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-[#94a3b8]">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.attendees.length} attendee(s)</span>
                  </div>
                )}
              </div>
              {selectedEvent.body?.content && (
                <div className="text-sm text-[#94a3b8] border-t border-[#2a2e37] pt-3">
                  <div dangerouslySetInnerHTML={{ __html: selectedEvent.body.content }} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEventDialogOpen(false)} className="border-[#2a2e37]">Close</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-[#94a3b8]">Subject</label>
              <Input
                value={eventSubject}
                onChange={(e) => setEventSubject(e.target.value)}
                placeholder="Event title"
                className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Start Date</label>
                <Input type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Start Time</label>
                <Input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">End Date</label>
                <Input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">End Time</label>
                <Input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Location</label>
              <Input
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Add location"
                className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Attendees (comma-separated)</label>
              <Input
                value={eventAttendees}
                onChange={(e) => setEventAttendees(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Description</label>
              <textarea
                value={eventBody}
                onChange={(e) => setEventBody(e.target.value)}
                placeholder="Add description"
                rows={3}
                className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEventIsAllDay(!eventIsAllDay)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors border",
                  eventIsAllDay ? "bg-[#0f6cbd]/20 text-[#0f6cbd] border-[#0f6cbd]/30" : "bg-[#0f1115] text-[#94a3b8] border-[#2a2e37]"
                )}
              >
                {eventIsAllDay ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                All day event
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setCreateDialogOpen(false); resetForm(); }} className="border-[#2a2e37]">Cancel</Button>
            <Button size="sm" onClick={handleCreateEvent} disabled={saving || !eventSubject.trim()} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Plus className="h-3.5 w-3.5" /> Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
