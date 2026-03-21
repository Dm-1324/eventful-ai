import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard, SkeletonEventCard } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { EventFormModal } from "@/components/EventFormModal";
import { CalendarDays, CalendarCheck, Calendar, Plus, Clock, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, isFuture, formatDistanceToNow, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function getNotifBorderColor(pref: string) {
  if (pref === "whatsapp") return "border-l-success";
  if (pref === "both") return "border-l-destructive";
  return "border-l-primary";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { events, isLoading } = useEvents();
  const [formOpen, setFormOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date()), "yyyy-MM-dd");

  const todayEvents = useMemo(() => events.filter((e) => e.event_date === todayStr), [events, todayStr]);
  const weekEvents = useMemo(() => events.filter((e) => e.event_date >= weekStart && e.event_date <= weekEnd), [events, weekStart, weekEnd]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.event_date >= todayStr).sort((a, b) => a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time)), [events, todayStr]);

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const cardVariant = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold">{greeting}, {profile?.name || "there"}</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={cardVariant}>
            <StatCard icon={CalendarDays} label="Today's Events" value={todayEvents.length} onClick={() => navigate("/events", { state: { filter: "today" } })} />
          </motion.div>
          <motion.div variants={cardVariant}>
            <StatCard icon={CalendarCheck} label="This Week" value={weekEvents.length} onClick={() => navigate("/events", { state: { filter: "upcoming" } })} />
          </motion.div>
          <motion.div variants={cardVariant}>
            <StatCard icon={Calendar} label="Total Events" value={events.length} onClick={() => navigate("/events", { state: { filter: "all" } })} />
          </motion.div>
        </motion.div>
      )}

      {/* Today's Events */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Today's Events</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map((i) => <SkeletonEventCard key={i} />)}</div>
        ) : todayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No events today</p>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn("glass-card rounded-lg p-4 border-l-4 hover-lift", getNotifBorderColor(event.notification_preference))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {event.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>{format(parseISO(event.event_date), "MMM d")} at {event.start_time.slice(0, 5)}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-xs shrink-0">
                    <Bell className="h-3 w-3 mr-1" />
                    {event.reminder_minutes_before}m
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      {!isLoading && upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {upcomingEvents.slice(0, 10).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn("glass-card rounded-lg p-4 border-l-4 hover-lift", getNotifBorderColor(event.notification_preference))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {event.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <CalendarDays className="h-3 w-3" />
                          <span>{format(parseISO(event.event_date), "MMM d, yyyy")} at {event.start_time.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="rounded-full text-xs">
                        {event.event_date === todayStr ? "today" : formatDistanceToNow(parseISO(event.event_date), { addSuffix: true })}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        {event.reminder_minutes_before}m
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to get started."
          actionLabel="Create Event"
          onAction={() => setFormOpen(true)}
        />
      )}

      {/* FAB */}
      <Button
        onClick={() => setFormOpen(!formOpen)}
        className="fixed bottom-20 sm:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 active:scale-95 transition-transform"
        size="icon"
      >
        <motion.div animate={{ rotate: formOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </Button>

      <EventFormModal open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
