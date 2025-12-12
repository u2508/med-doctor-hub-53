import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    console.log("Starting medication refill reminder check...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get medications with refill dates in the next 7 days that haven't received reminder
    const { data: medications, error } = await supabase
      .from("medications")
      .select(`
        id,
        name,
        dosage,
        frequency,
        refill_date,
        remaining_quantity,
        pharmacy,
        patient_id,
        refill_reminder_sent
      `)
      .eq("is_active", true)
      .eq("refill_reminder_sent", false)
      .not("refill_date", "is", null)
      .lte("refill_date", in7Days.toISOString().split("T")[0])
      .gte("refill_date", today.toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching medications:", error);
      throw error;
    }

    console.log(`Found ${medications?.length || 0} medications needing refill reminders`);

    const emailsSent: string[] = [];

    for (const med of medications || []) {
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", med.patient_id)
        .single();

      if (patientProfile?.email) {
        const refillDate = new Date(med.refill_date);
        const daysUntilRefill = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDate = refillDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        try {
          await resend.emails.send({
            from: "MentiBot Health <onboarding@resend.dev>",
            to: [patientProfile.email],
            subject: `💊 Medication Refill Reminder: ${med.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">💊 Medication Refill Reminder</h1>
                <p>Dear ${patientProfile.full_name},</p>
                <p>This is a reminder that your medication needs to be refilled soon.</p>
                <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                  <h3 style="margin: 0 0 10px; color: #1e40af;">${med.name}</h3>
                  <p style="margin: 5px 0;"><strong>Dosage:</strong> ${med.dosage}</p>
                  <p style="margin: 5px 0;"><strong>Frequency:</strong> ${med.frequency}</p>
                  <p style="margin: 5px 0;"><strong>Refill By:</strong> ${formattedDate}</p>
                  ${med.remaining_quantity ? `<p style="margin: 5px 0;"><strong>Remaining:</strong> ${med.remaining_quantity} pills/doses</p>` : ""}
                  ${med.pharmacy ? `<p style="margin: 5px 0;"><strong>Pharmacy:</strong> ${med.pharmacy}</p>` : ""}
                </div>
                <p style="color: ${daysUntilRefill <= 3 ? "#dc2626" : "#6b7280"};">
                  ${daysUntilRefill === 0 
                    ? "⚠️ Your refill is due <strong>today</strong>!" 
                    : daysUntilRefill === 1 
                      ? "⚠️ Your refill is due <strong>tomorrow</strong>!" 
                      : `You have <strong>${daysUntilRefill} days</strong> to refill your medication.`}
                </p>
                <p>Please contact your pharmacy or healthcare provider to arrange your refill.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br>MentiBot Health Team</p>
              </div>
            `,
          });

          await supabase
            .from("medications")
            .update({ refill_reminder_sent: true })
            .eq("id", med.id);

          emailsSent.push(`Refill reminder for ${med.name} to ${patientProfile.email}`);
          console.log(`Sent refill reminder for ${med.name} to ${patientProfile.email}`);
        } catch (emailError) {
          console.error(`Failed to send refill reminder to ${patientProfile.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        message: `Processed ${medications?.length || 0} medication refill reminders`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in medication-refill-reminders function:", error);
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
