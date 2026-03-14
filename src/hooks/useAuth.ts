import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string) => {
      const response = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("[profiles.select.response]", response);

      if (!isMounted) return;

      if (response.error) {
        console.error("[profiles.select.error]", response.error);
        setProfile(null);
        return;
      }

      setProfile(response.data ?? null);
    };

    const handleSession = (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void loadProfile(nextSession.user.id).finally(() => {
        if (isMounted) setLoading(false);
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("[auth.getSession.error]", error);
          if (isMounted) setLoading(false);
          return;
        }

        handleSession(session);
      })
      .catch((error) => {
        console.error("[auth.getSession.catch]", error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Tables<"profiles">>) => {
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const updateResponse = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (updateResponse.error) {
      return updateResponse;
    }

    if (updateResponse.data) {
      setProfile(updateResponse.data);
      return updateResponse;
    }

    const insertResponse = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        name: updates.name ?? user.user_metadata?.name ?? "",
        phone: updates.phone ?? null,
        notification_preference: updates.notification_preference ?? "email",
      })
      .select()
      .single();

    if (!insertResponse.error) {
      setProfile(insertResponse.data);
    }

    return insertResponse;
  };

  return { user, session, profile, loading, signIn, signUp, signOut, updateProfile };
}
