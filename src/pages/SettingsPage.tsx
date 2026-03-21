import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Bell, Palette, Shield, Sparkles, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { profile, user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [notifPref, setNotifPref] = useState(profile?.notification_preference || "email");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await updateProfile({ name, phone, notification_preference: notifPref });
      console.log("[profile.update.response]", response);

      if (response.error) {
        toast.error(`Failed to save settings: ${response.error.message}`);
        return;
      }

      toast.success("Settings saved successfully");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); }
  };

  const themes: { key: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "claude", label: "Claude", icon: <Sparkles className="h-4 w-4" />, desc: "Warm amber tones" },
    { key: "dark", label: "Dark", icon: <Moon className="h-4 w-4" />, desc: "Pure dark mode" },
    { key: "light", label: "Light", icon: <Sun className="h-4 w-4" />, desc: "Clean & bright" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Profile</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>
        <div className="space-y-3">
          {["email", "whatsapp", "both"].map((pref) => (
            <div key={pref} className="flex items-center justify-between">
              <span className="capitalize text-sm">{pref === "both" ? "Email & WhatsApp" : pref}</span>
              <Switch checked={notifPref === pref} onCheckedChange={() => setNotifPref(pref)} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Appearance</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                theme === t.key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                {t.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Account</h2>
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button onClick={changePassword} disabled={!newPassword}>Update Password</Button>

        <div className="border-t border-border pt-4 mt-4">
          <p className="text-sm text-destructive font-medium mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">Account deletion is permanent and cannot be undone.</p>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled>
            Delete Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
