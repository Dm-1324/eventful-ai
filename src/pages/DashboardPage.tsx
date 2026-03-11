import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEvents, Event } from "@/hooks/useEvents";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard, SkeletonEventCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { EventFormModal } from "@/components/EventFormModal";
import { CalendarDays, CalendarCheck, Calendar, Plus, Clock, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isFuture, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { events, isLoading } = useEvents();
  const [formOpen, setFormOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayEvents = useMemo(() => events.filter((e) => isToday(parseISO(e.event_date))), [events]);
  const weekEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const d = parseISO(e.event_date);
      return isWithinInterval(d, { start: startOfWeek(now), end: endOfWeek(now) });
    });
  }, [events]);

  const eventColors = ["border-l-primary", "border-l-success", "border-l-destructive", "border-l-secondary"];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold">{greeting}, {profile?.name || "there"} 👋</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={CalendarDays} label="Today's Events" value={todayEvents.length} />
          <StatCard icon={CalendarCheck} label="This Week" value={weekEvents.length} />
          <StatCard icon={Calendar} label="Total Events" value={events.length} />
        </div>
      )}

      {/* Today's Events Timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Events</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <SkeletonEventCard key={i} />)}</div>
        ) : todayEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events today"
            description="You have a free day! Create an event to get started."
            actionLabel="Create Event"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-lg p-4 border-l-4 ${eventColors[i % eventColors.length]} hover-lift`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{event.start_time.slice(0, 5)}</span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="rounded-pill text-xs shrink-0">
                    <Bell className="h-3 w-3 mr-1" />
                    {event.reminder_minutes_before}m
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <EventFormModal open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
