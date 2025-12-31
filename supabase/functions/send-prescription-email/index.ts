import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "diagnosis_update" | "prescription_update" | "prescription_complete";
  appointment_id: string;
  patient_email: string;
  patient_name: string;
  doctor_name: string;
  diagnosis?: string;
  prescription?: string;
  prescription_file_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-prescription-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, appointment_id, patient_email, patient_name, doctor_name, diagnosis, prescription, prescription_file_url }: EmailRequest = await req.json();

    console.log(`Processing ${type} email for appointment ${appointment_id}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "diagnosis_update":
        subject = `Diagnosis Update from Dr. ${doctor_name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Diagnosis Update</h1>
            <p>Dear ${patient_name},</p>
            <p>Dr. ${doctor_name} has updated your diagnosis for your recent appointment.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Diagnosis:</h3>
              <p>${diagnosis || "No diagnosis provided"}</p>
            </div>
            <p>Please log in to your patient portal to view the full details.</p>
            <p>Best regards,<br>MentiBot Healthcare Team</p>
          </div>
        `;
        break;

      case "prescription_update":
        subject = `Prescription Update from Dr. ${doctor_name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Prescription Update</h1>
            <p>Dear ${patient_name},</p>
            <p>Dr. ${doctor_name} has updated your prescription for your recent appointment.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Prescription:</h3>
              <p>${prescription || "No prescription provided"}</p>
            </div>
            <p>Please log in to your patient portal to view the full details.</p>
            <p>Best regards,<br>MentiBot Healthcare Team</p>
          </div>
        `;
        break;

      case "prescription_complete":
        subject = `Appointment Completed - Prescription from Dr. ${doctor_name}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Appointment Completed</h1>
            <p>Dear ${patient_name},</p>
            <p>Your appointment with Dr. ${doctor_name} has been marked as completed.</p>
            ${diagnosis ? `
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                <h3 style="margin-top: 0; color: #2563eb;">Diagnosis:</h3>
                <p>${diagnosis}</p>
              </div>
            ` : ""}
            ${prescription ? `
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                <h3 style="margin-top: 0; color: #16a34a;">Prescription:</h3>
                <p>${prescription}</p>
              </div>
            ` : ""}
            ${prescription_file_url ? `
              <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ca8a04;">
                <h3 style="margin-top: 0; color: #ca8a04;">Prescription Document:</h3>
                <p>A prescription document has been attached to your appointment. Please log in to your patient portal to download it.</p>
              </div>
            ` : ""}
            <p>Please log in to your patient portal to view the full details and download any documents.</p>
            <p>Best regards,<br>MentiBot Healthcare Team</p>
          </div>
        `;
        break;
    }

    console.log(`Sending email to ${patient_email}`);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "MentiBot Healthcare <onboarding@resend.dev>",
      to: [patient_email],
      subject,
      html,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-prescription-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
