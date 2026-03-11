import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if demo user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find(u => u.email === "demo@eventassistant.com");

    let userId: string;

    if (demoUser) {
      userId = demoUser.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: "demo@eventassistant.com",
        password: "Demo@1234",
        email_confirm: true,
        user_metadata: { name: "Demo User" },
      });
      if (error) throw error;
      userId = data.user.id;
    }

    // Check if events already seeded
    const { data: existingEvents } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return new Response(JSON.stringify({ message: "Demo data already seeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const addDays = (d: Date, n: number) => {
      const result = new Date(d);
      result.setDate(result.getDate() + n);
      return result;
    };

    const events = [
      { title: "Team Standup", description: "Daily team sync to discuss progress and blockers", event_date: formatDate(today), start_time: "09:00:00", reminder_minutes_before: 10, notification_preference: "email" },
      { title: "Product Review", description: "Review Q1 product roadmap and priorities", event_date: formatDate(today), start_time: "14:00:00", reminder_minutes_before: 15, notification_preference: "both" },
      { title: "Design Sprint Kickoff", description: "Begin the 5-day design sprint for the new feature", event_date: formatDate(addDays(today, 1)), start_time: "10:00:00", reminder_minutes_before: 30, notification_preference: "email" },
      { title: "Client Call - Acme Corp", description: "Quarterly business review with Acme Corporation", event_date: formatDate(addDays(today, 3)), start_time: "11:30:00", reminder_minutes_before: 15, notification_preference: "whatsapp" },
      { title: "Team Happy Hour", description: "Casual team gathering to celebrate recent wins", event_date: formatDate(addDays(today, 5)), start_time: "17:00:00", reminder_minutes_before: 60, notification_preference: "both" },
    ];

    const { error: insertError } = await supabaseAdmin
      .from("events")
      .insert(events.map(e => ({ ...e, user_id: userId })));

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: "Demo data seeded successfully", userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
