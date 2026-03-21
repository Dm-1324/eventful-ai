import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff, CalendarDays, Bell, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error.message); return; }
        navigate("/dashboard");
      } else {
        const { error } = await signUp(email, password, name);
        if (error) { toast.error(error.message); return; }
        toast.success("Account created! Check your email to confirm.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@eventassistant.com");
    setPassword("Demo@1234");
    setIsLogin(true);
  };

  const sampleCards = [
    { title: "Team Standup", time: "9:00 AM", color: "bg-primary/20 border-primary/30" },
    { title: "Product Review", time: "2:00 PM", color: "bg-success/20 border-success/30" },
    { title: "Design Sprint", time: "4:30 PM", color: "bg-destructive/20 border-destructive/30" },
  ];

  return (
    <div className="min-h-screen flex login-gradient-bg overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Athena</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-12">
            Hi, I'm Athena — your personal event assistant. Let me help you organize your world.
          </p>
        </motion.div>

        {/* Floating sample cards */}
        <div className="relative z-10 space-y-3 w-full max-w-xs">
          {sampleCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.2, duration: 0.5, ease: "easeOut" }}
              className={cn("glass-card rounded-lg p-4 border", card.color)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{card.title}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {card.time}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Athena</h1>
          </div>

          {/* Tab switcher with sliding indicator */}
          <div className="relative flex bg-muted rounded-lg p-1 mb-8">
            <motion.div
              className="absolute top-1 bottom-1 rounded-md bg-card shadow-sm"
              initial={false}
              animate={{ x: isLogin ? 0 : "100%", width: "calc(50% - 4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ left: 2 }}
            />
            {["Login", "Sign Up"].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === "Login")}
                className={cn(
                  "relative z-10 flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                  (tab === "Login" ? isLogin : !isLogin)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="h-10" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 active:scale-95 transition-transform" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button type="button" variant="outline" className="w-full h-10 active:scale-95 transition-transform" disabled>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Button>
            </motion.form>
          </AnimatePresence>

          {/* Demo credentials */}
          <div className="mt-6 text-center">
            <button
              onClick={fillDemo}
              className="pill bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer animate-pulse-gentle"
            >
              <Bell className="h-3 w-3 mr-1" /> Use Demo Credentials
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
