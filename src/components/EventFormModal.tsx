import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Bell, Mail, MessageSquare } from "lucide-react";
import { useEvents, Event } from "@/hooks/useEvents";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Event | null;
}

const DRAFT_KEY = "event-draft";

export function EventFormModal({ open, onOpenChange, editEvent }: EventFormModalProps) {
  const isMobile = useIsMobile();
  const { createEvent, updateEvent } = useEvents();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [reminder, setReminder] = useState("15");
  const [notifPref, setNotifPref] = useState("email");

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDate(editEvent.event_date);
      setTime(editEvent.start_time.slice(0, 5));
      setDescription(editEvent.description || "");
      setReminder(String(editEvent.reminder_minutes_before));
      setNotifPref(editEvent.notification_preference);
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const d = JSON.parse(draft);
          setTitle(d.title || "");
          setDate(d.date || "");
          setTime(d.time || "");
          setDescription(d.description || "");
          setReminder(d.reminder || "15");
          setNotifPref(d.notifPref || "email");
        } catch { /* ignore */ }
      }
    }
  }, [editEvent, open]);

  useEffect(() => {
    if (!editEvent && open) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, date, time, description, reminder, notifPref }));
    }
  }, [title, date, time, description, reminder, notifPref, editEvent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      event_date: date,
      start_time: time + ":00",
      description: description || null,
      reminder_minutes_before: parseInt(reminder),
      notification_preference: notifPref,
    };

    if (editEvent) {
      await updateEvent.mutateAsync({ id: editEvent.id, ...payload });
    } else {
      await createEvent.mutateAsync(payload);
      localStorage.removeItem(DRAFT_KEY);
    }
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle(""); setDate(""); setTime(""); setDescription(""); setReminder("15"); setNotifPref("email");
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="h-10" />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="desc" className="flex items-center justify-between">
            Description
            <span className="text-xs text-muted-foreground">{description.length}/500</span>
          </Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="Event description..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Bell className="h-3 w-3" /> Reminder</Label>
          <Select value={reminder} onValueChange={setReminder}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes before</SelectItem>
              <SelectItem value="10">10 minutes before</SelectItem>
              <SelectItem value="15">15 minutes before</SelectItem>
              <SelectItem value="30">30 minutes before</SelectItem>
              <SelectItem value="60">1 hour before</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notification</Label>
          <div className="flex gap-2">
            {[
              { val: "email", label: "Email", icon: Mail },
              { val: "whatsapp", label: "WhatsApp", icon: MessageSquare },
              { val: "both", label: "Both", icon: Bell },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setNotifPref(opt.val)}
                className={cn(
                  "pill border transition-colors min-h-[36px]",
                  notifPref === opt.val ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                )}
              >
                <opt.icon className="h-3 w-3 mr-1" /> {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      {title && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Preview</p>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">
            {date && format(parseISO(date), "MMM d, yyyy")} {time && `at ${time}`}
          </p>
          {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
          <div className="flex gap-2 pt-1">
            <Badge variant="secondary" className="rounded-full text-xs">{reminder} min reminder</Badge>
            <Badge variant="outline" className="rounded-full text-xs capitalize">{notifPref}</Badge>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-4 active:scale-95">Cancel</Button>
        <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending} className="h-10 px-4 active:scale-95">
          {editEvent ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editEvent ? "Edit Event" : "Create Event"}</SheetTitle>
          </SheetHeader>
          <div className="pt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
