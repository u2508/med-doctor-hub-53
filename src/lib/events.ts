import { supabase } from "@/integrations/supabase/client";

export type ProductEventName =
  | "pitch_page_viewed"
  | "triage_started"
  | "triage_completed"
  | "report_downloaded"
  | "find_doctors_clicked"
  | "doctor_routing_clicked"
  | "appointment_booked_from_triage"
  | "follow_up_response_saved";

export async function trackEvent(
  eventName: ProductEventName,
  properties: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;

    if (!userId) {
      return;
    }

    await supabase.from("product_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
    });
  } catch (error) {
    console.error("trackEvent failed", error);
  }
}
