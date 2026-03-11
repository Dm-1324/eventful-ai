import { LayoutDashboard, CalendarDays, Calendar, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Events", url: "/events", icon: CalendarDays },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border flex items-center justify-around h-16 sm:hidden">
      {tabs.map((tab) => (
        <NavLink
          key={tab.url}
          to={tab.url}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
