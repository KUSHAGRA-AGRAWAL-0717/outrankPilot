import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

interface CalendarEvent {
  id: string;
  briefId: string | null;
  title: string;
  date: string;
  status: 'scheduled' | 'published' | 'draft';
}

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Calendar() {
  const { currentProject } = useApp();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [autopilotEnabled] = useState(true); // You can connect this to your actual autopilot state

  /* ---------------- Fetch calendar events ---------------- */
  useEffect(() => {
    if (!currentProject) return;

    const fetchEvents = async () => {
      setLoading(true);

      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const start = startOfMonth.toISOString().split('T')[0];
      const end = endOfMonth.toISOString().split('T')[0];

      const { data } = await supabase
        .from('calendar_events')
        .select('id, title, scheduled_date, status, brief_id')
        .eq('project_id', currentProject.id)
        .gte('scheduled_date', start)
        .lte('scheduled_date', end);

      if (data) {
        setEvents(
          data.map(e => ({
            id: e.id,
            briefId: e.brief_id,
            title: e.title,
            date: e.scheduled_date,
            status: e.status as 'scheduled' | 'published' | 'draft',
          }))
        );
      }

      setLoading(false);
    };

    fetchEvents();
  }, [currentProject, currentDate]);

  /* ---------------- Calendar helpers ---------------- */
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

    return days;
  };

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];

    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter(e =>
      e.date === dateStr &&
      (statusFilter === 'all' || e.status === statusFilter)
    );
  };

  const getAutopilotPreviewDates = () => {
    if (!autopilotEnabled) return [];
    const previews: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      previews.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
      );
    }
    return previews;
  };

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = getDaysInMonth(currentDate);
  const autopilotDates = getAutopilotPreviewDates();

  /* ---------------- Drag & Drop Components ---------------- */
  function DraggableEvent({ event }: { event: CalendarEvent }) {
    // Prevent dragging published posts
    if (event.status === 'published') {
      return (
        <div
          onClick={() => {
            if (event.briefId) {
              navigate(`/briefs/${event.briefId}`);
            }
          }}
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs cursor-pointer bg-primary/10 text-primary`}
        >
          <FileText className="h-3 w-3" />
          <span className="truncate">{event.title}</span>
        </div>
      );
    }

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: event.id,
      data: event,
    });

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => {
          if (event.briefId) {
            navigate(`/briefs/${event.briefId}`);
          }
        }}
        style={{
          transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
        }}
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing ${
          event.status === 'scheduled'
            ? 'bg-blue-500/10 text-blue-500'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <FileText className="h-3 w-3" />
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  function DroppableDay({ date, children }: { date: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
      id: date,
    });

    return (
      <div 
        ref={setNodeRef} 
        className={`min-h-[120px] p-2 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}`}
      >
        {children}
      </div>
    );
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const newDate = over.id as string;
    const eventId = active.id as string;

    // Optimistic UI update
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId ? { ...e, date: newDate } : e
      )
    );

    // Persist to DB
    await supabase
      .from('calendar_events')
      .update({ scheduled_date: newDate })
      .eq('id', eventId);
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
            <p className="text-muted-foreground">
              Plan and schedule your content publishing
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => navigate('/briefs/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {(['all', 'draft', 'scheduled', 'published'] as StatusFilter[]).map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-secondary/30 p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid with Drag & Drop */}
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                const dateStr = day
                  ? `${currentDate.getFullYear()}-${String(
                      currentDate.getMonth() + 1
                    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  : '';

                const isAutopilotDate = dateStr && autopilotDates.includes(dateStr);

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] border-b border-r border-border ${
                      day ? 'hover:bg-secondary/30' : 'bg-secondary/10'
                    }`}
                  >
                    {day ? (
                      <DroppableDay date={dateStr}>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {day}
                        </span>

                        <div className="mt-1 space-y-1">
                          {dayEvents.map((event) => (
                            <DraggableEvent key={event.id} event={event} />
                          ))}

                          {isAutopilotDate && (
                            <div className="mt-1 rounded border border-dashed border-green-500 px-2 py-1 text-xs text-green-600">
                              ⚡ Autopilot
                            </div>
                          )}
                        </div>
                      </DroppableDay>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </DndContext>
        </div>
      </div>
    </DashboardLayout>
  );
}