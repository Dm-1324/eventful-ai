import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Event = Tables<"events">;
export type EventInsert = TablesInsert<"events">;
export type EventUpdate = TablesUpdate<"events">;

async function getAuthenticatedUser() {
  const authResponse = await supabase.auth.getUser();
  console.log("[auth.getUser.response]", authResponse);

  if (authResponse.error) {
    throw authResponse.error;
  }

  if (!authResponse.data.user) {
    throw new Error("User not authenticated");
  }

  return authResponse.data.user;
}

export function useEvents() {
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const authResponse = await supabase.auth.getUser();
      console.log("[events.select.auth.response]", authResponse);

      if (authResponse.error) {
        console.log("[events.select.response]", { data: null, error: authResponse.error });
        throw authResponse.error;
      }

      if (!authResponse.data.user) {
        console.log("[events.select.response]", { data: [], error: null });
        return [] as Event[];
      }

      const response = await supabase
        .from("events")
        .select("*")
        .eq("user_id", authResponse.data.user.id)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

      console.log("[events.select.response]", response);

      if (response.error) {
        throw response.error;
      }

      if ((response.data ?? []).length === 0) {
        console.warn("[events.select.empty] No events returned. If unexpected, verify events SELECT RLS policy allows auth.uid() = user_id.");
      }

      return (response.data ?? []) as Event[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<EventInsert, "user_id">) => {
      const user = await getAuthenticatedUser();

      const response = await supabase
        .from("events")
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      console.log("[events.create.response]", response);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
    onError: (e: Error) => toast.error(`Failed to create event: ${e.message}`),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      if (!id) throw new Error("Missing event id");

      const user = await getAuthenticatedUser();
      const response = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      console.log("[events.update.response]", { ...response, id, updates });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
    },
    onError: (e: Error) => toast.error(`Failed to update event: ${e.message}`),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error("Missing event id");

      const user = await getAuthenticatedUser();
      const response = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      console.log("[events.delete.response]", { ...response, id });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(`Failed to delete event: ${e.message}`),
  });

  return {
    events: eventsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
