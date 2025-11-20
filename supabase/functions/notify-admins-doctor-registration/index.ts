import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  doctorName: string;
  doctorEmail: string;
  specialty: string;
  licenseNumber: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { doctorName, doctorEmail, specialty, licenseNumber }: NotificationRequest = await req.json();

    // Get all admin users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      throw new Error(`Failed to fetch admins: ${adminError.message}`);
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found to notify");
      return new Response(
        JSON.stringify({ message: "No admins to notify", success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get admin email addresses from profiles
    const adminIds = adminRoles.map(role => role.user_id);
    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('user_id', adminIds);

    if (profileError) {
      throw new Error(`Failed to fetch admin profiles: ${profileError.message}`);
    }

    // Log notification (in production, you would send actual emails here using Resend)
    console.log("=== NEW DOCTOR REGISTRATION NOTIFICATION ===");
    console.log(`Doctor Name: ${doctorName}`);
    console.log(`Email: ${doctorEmail}`);
    console.log(`Specialty: ${specialty}`);
    console.log(`License Number: ${licenseNumber}`);
    console.log(`Notifying ${adminProfiles?.length || 0} admin(s):`);
    adminProfiles?.forEach(admin => {
      console.log(`  - ${admin.full_name} (${admin.email})`);
    });
    console.log("===========================================");

    // TODO: Integrate with Resend to send actual emails
    // Example email content:
    // Subject: New Doctor Registration - Approval Required
    // Body: A new doctor has registered and requires approval:
    //       Name: ${doctorName}
    //       Email: ${doctorEmail}
    //       Specialty: ${specialty}
    //       License: ${licenseNumber}
    //       Please review and approve in the admin portal.

    return new Response(
      JSON.stringify({ 
        message: "Admin notification sent successfully",
        adminsNotified: adminProfiles?.length || 0,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in notify-admins-doctor-registration:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});