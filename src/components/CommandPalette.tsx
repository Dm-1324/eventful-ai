import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarDays, LayoutDashboard, Calendar, Settings } from "lucide-react";
import { format, parseISO } from "date-fns";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { events } = useEvents();

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search events, navigate pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/events")}>
            <CalendarDays className="mr-2 h-4 w-4" /> Events
          </CommandItem>
          <CommandItem onSelect={() => go("/calendar")}>
            <Calendar className="mr-2 h-4 w-4" /> Calendar
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        {events.length > 0 && (
          <CommandGroup heading="Events">
            {events.slice(0, 8).map((event) => (
              <CommandItem key={event.id} onSelect={() => go("/events")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                <span className="flex-1">{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(event.event_date), "MMM d")}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
