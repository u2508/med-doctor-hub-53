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

// Input validation function
function validateNotificationRequest(body: unknown): NotificationRequest {
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }
  
  const { doctorName, doctorEmail, specialty, licenseNumber } = body as Record<string, unknown>;
  
  // Validate required fields exist and are strings
  if (typeof doctorName !== 'string' || doctorName.trim().length === 0) {
    throw new Error("doctorName is required and must be a non-empty string");
  }
  if (typeof doctorEmail !== 'string' || doctorEmail.trim().length === 0) {
    throw new Error("doctorEmail is required and must be a non-empty string");
  }
  if (typeof specialty !== 'string' || specialty.trim().length === 0) {
    throw new Error("specialty is required and must be a non-empty string");
  }
  if (typeof licenseNumber !== 'string' || licenseNumber.trim().length === 0) {
    throw new Error("licenseNumber is required and must be a non-empty string");
  }
  
  // Validate lengths
  if (doctorName.length > 200) {
    throw new Error("doctorName must be less than 200 characters");
  }
  if (doctorEmail.length > 255) {
    throw new Error("doctorEmail must be less than 255 characters");
  }
  if (specialty.length > 100) {
    throw new Error("specialty must be less than 100 characters");
  }
  if (licenseNumber.length > 100) {
    throw new Error("licenseNumber must be less than 100 characters");
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(doctorEmail)) {
    throw new Error("doctorEmail must be a valid email address");
  }
  
  return {
    doctorName: doctorName.trim(),
    doctorEmail: doctorEmail.trim(),
    specialty: specialty.trim(),
    licenseNumber: licenseNumber.trim(),
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // SECURITY FIX 1: Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Unauthorized: Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", success: false }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    // Create client with user's auth context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("Unauthorized: Invalid token", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication", success: false }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 401 
        }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // SECURITY FIX 2: Validate input
    const rawBody = await req.json();
    let validatedInput: NotificationRequest;
    
    try {
      validatedInput = validateNotificationRequest(rawBody);
    } catch (validationError: any) {
      console.log("Validation error:", validationError.message);
      return new Response(
        JSON.stringify({ error: validationError.message, success: false }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // SECURITY FIX 3: Verify the request is for the authenticated user's own doctor profile
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: doctorProfile, error: profileError } = await supabase
      .from('doctor_profiles')
      .select('user_id, license_number')
      .eq('user_id', userId)
      .eq('license_number', validatedInput.licenseNumber)
      .single();

    if (profileError || !doctorProfile) {
      console.log("Authorization failed: Doctor profile mismatch", profileError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - you can only request notifications for your own registration", success: false }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 403 
        }
      );
    }

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
    const { data: adminProfiles, error: adminProfileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('user_id', adminIds);

    if (adminProfileError) {
      throw new Error(`Failed to fetch admin profiles: ${adminProfileError.message}`);
    }

    // Log notification (sanitized - don't log sensitive license numbers)
    console.log("=== NEW DOCTOR REGISTRATION NOTIFICATION ===");
    console.log(`Doctor Name: ${validatedInput.doctorName}`);
    console.log(`Specialty: ${validatedInput.specialty}`);
    console.log(`Notifying ${adminProfiles?.length || 0} admin(s)`);
    console.log("===========================================");

    // TODO: Integrate with Resend to send actual emails
    // Example email content:
    // Subject: New Doctor Registration - Approval Required
    // Body: A new doctor has registered and requires approval:
    //       Name: ${doctorName}
    //       Specialty: ${specialty}
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
      JSON.stringify({ error: "Internal server error", success: false }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
