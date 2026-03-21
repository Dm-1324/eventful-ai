import { Search, Sun, Moon, Sparkles, LogOut, User, Command } from "lucide-react";
import { useTheme, Theme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  onOpenSearch: () => void;
}

const themeIcons: Record<Theme, React.ReactNode> = {
  claude: <Sparkles className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  light: <Sun className="h-4 w-4" />,
};

const themeLabels: Record<Theme, string> = {
  claude: "Claude",
  dark: "Dark",
  light: "Light",
};

const themeOrder: Theme[] = ["claude", "dark", "light"];

export function Navbar({ onOpenSearch }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 glass-card sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="mr-2" />
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm hidden sm:block">Athena</span>
      </div>

      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm hover:bg-muted transition-colors max-w-xs w-full sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search events...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted border border-border">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={cycleTheme} className="rounded-lg" title={`Theme: ${themeLabels[theme]}`}>
          {themeIcons[theme]}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
