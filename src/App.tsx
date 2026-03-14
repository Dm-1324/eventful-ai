import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import EventsPage from "@/pages/EventsPage";
import CalendarPage from "@/pages/CalendarPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("VITE_SUPABASE_URL:", SUPABASE_URL);
console.log("VITE_SUPABASE_PUBLISHABLE_KEY:", SUPABASE_PUBLISHABLE_KEY);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("[react-query][query][error]", error);
      toast.error(`Request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("[react-query][mutation][error]", error);
      toast.error(`Action failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  }),
});

function DatabaseConnectionBanner() {
  if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[1000] bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground">
      Database not connected
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route path="/login" element={<PublicGate><LoginPage /></PublicGate>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AuthGate><AppLayout /></AuthGate>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <DatabaseConnectionBanner />
        <Sonner position="bottom-right" />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
