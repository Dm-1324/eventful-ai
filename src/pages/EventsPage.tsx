import { useState, useMemo } from "react";
import { useEvents, Event } from "@/hooks/useEvents";
import { EventFormModal } from "@/components/EventFormModal";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonEventCard } from "@/components/SkeletonCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Pencil, Trash2, Clock, Bell, CalendarDays } from "lucide-react";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { motion } from "framer-motion";

type Filter = "all" | "today" | "upcoming" | "past";
type SortBy = "date" | "title" | "created";

export default function EventsPage() {
  const { events, isLoading, deleteEvent } = useEvents();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = events.filter((e) => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      const d = parseISO(e.event_date);
      if (filter === "today") return isToday(d);
      if (filter === "upcoming") return isFuture(d) || isToday(d);
      if (filter === "past") return isPast(d) && !isToday(d);
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    return result;
  }, [events, filter, search, sortBy]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEvent.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => { setEditEvent(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="pl-9" />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="created">Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonEventCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description={search ? "Try a different search term" : "Create your first event to get started"}
          actionLabel="Create Event"
          onAction={() => { setEditEvent(null); setFormOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-lg p-4 hover-lift group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditEvent(event); setFormOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(event.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-3 w-3" />
                <span>{format(parseISO(event.event_date), "MMM d, yyyy")}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{event.start_time.slice(0, 5)}</span>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
              )}
              <div className="flex gap-2">
                <Badge variant="secondary" className="rounded-pill text-xs">
                  <Bell className="h-3 w-3 mr-1" />{event.reminder_minutes_before}m
                </Badge>
                <Badge variant="outline" className="rounded-pill text-xs capitalize">{event.notification_preference}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <EventFormModal open={formOpen} onOpenChange={setFormOpen} editEvent={editEvent} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The event will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
