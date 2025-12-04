import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting appointment reminder check...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Get appointments in the next 24 hours that haven't received 24h reminder
    const { data: appointments24h, error: error24h } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        status,
        patient_id,
        doctor_id,
        reminder_24h_sent
      `)
      .eq("status", "confirmed")
      .eq("reminder_24h_sent", false)
      .gte("appointment_date", now.toISOString())
      .lte("appointment_date", in24Hours.toISOString());

    if (error24h) {
      console.error("Error fetching 24h appointments:", error24h);
      throw error24h;
    }

    console.log(`Found ${appointments24h?.length || 0} appointments for 24h reminder`);

    // Get appointments in the next hour that haven't received 1h reminder
    const { data: appointments1h, error: error1h } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        status,
        patient_id,
        doctor_id,
        reminder_1h_sent
      `)
      .eq("status", "confirmed")
      .eq("reminder_1h_sent", false)
      .gte("appointment_date", now.toISOString())
      .lte("appointment_date", in1Hour.toISOString());

    if (error1h) {
      console.error("Error fetching 1h appointments:", error1h);
      throw error1h;
    }

    console.log(`Found ${appointments1h?.length || 0} appointments for 1h reminder`);

    const emailsSent: string[] = [];

    // Send 24h reminders
    for (const apt of appointments24h || []) {
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", apt.patient_id)
        .single();

      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", apt.doctor_id)
        .single();

      if (patientProfile?.email) {
        const appointmentDate = new Date(apt.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        try {
          await resend.emails.send({
            from: "MentiBot Health <onboarding@resend.dev>",
            to: [patientProfile.email],
            subject: "Appointment Reminder - Tomorrow",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Appointment Reminder</h1>
                <p>Dear ${patientProfile.full_name},</p>
                <p>This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
                  <p style="margin: 10px 0 0;"><strong>Doctor:</strong> ${doctorProfile?.full_name || "Your Doctor"}</p>
                </div>
                <p>Please arrive 10-15 minutes early for check-in.</p>
                <p>If you need to reschedule, please do so at your earliest convenience.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>MentiBot Health Team</p>
              </div>
            `,
          });

          await supabase
            .from("appointments")
            .update({ reminder_24h_sent: true })
            .eq("id", apt.id);

          emailsSent.push(`24h reminder to ${patientProfile.email}`);
          console.log(`Sent 24h reminder to ${patientProfile.email}`);
        } catch (emailError) {
          console.error(`Failed to send 24h reminder to ${patientProfile.email}:`, emailError);
        }
      }
    }

    // Send 1h reminders
    for (const apt of appointments1h || []) {
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", apt.patient_id)
        .single();

      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", apt.doctor_id)
        .single();

      if (patientProfile?.email) {
        const appointmentDate = new Date(apt.appointment_date);
        const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        try {
          await resend.emails.send({
            from: "MentiBot Health <onboarding@resend.dev>",
            to: [patientProfile.email],
            subject: "⏰ Appointment in 1 Hour!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #dc2626;">⏰ Your Appointment is Soon!</h1>
                <p>Dear ${patientProfile.full_name},</p>
                <p>This is a final reminder that your appointment is in <strong>approximately 1 hour</strong>.</p>
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <p style="margin: 0;"><strong>Time:</strong> ${formattedTime}</p>
                  <p style="margin: 10px 0 0;"><strong>Doctor:</strong> ${doctorProfile?.full_name || "Your Doctor"}</p>
                </div>
                <p>Please make sure you're prepared and on your way!</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>MentiBot Health Team</p>
              </div>
            `,
          });

          await supabase
            .from("appointments")
            .update({ reminder_1h_sent: true })
            .eq("id", apt.id);

          emailsSent.push(`1h reminder to ${patientProfile.email}`);
          console.log(`Sent 1h reminder to ${patientProfile.email}`);
        } catch (emailError) {
          console.error(`Failed to send 1h reminder to ${patientProfile.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        message: `Processed ${appointments24h?.length || 0} 24h reminders and ${appointments1h?.length || 0} 1h reminders`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
