import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS setup ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Environment setup ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const geminiApiKey = Deno.env.get("VITE_GEMINI_API_KEY");

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error("❌ Missing environment variables. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and VITE_GEMINI_API_KEY.");
  Deno.exit(1);
}

// --- Supabase client ---
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Rate limiting ---
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute per user
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userKey = `user_${userId}`;
  const userRequests = requestCounts.get(userKey) || [];

  // Cleanup old timestamps
  const validRequests = userRequests.filter((t) => now - t < RATE_WINDOW);

  if (validRequests.length >= RATE_LIMIT) return false;

  validRequests.push(now);
  requestCounts.set(userKey, validRequests);

  // Prevent memory bloat
  if (requestCounts.size > 1000) {
    const oldest = [...requestCounts.keys()][0];
    requestCounts.delete(oldest);
  }

  return true;
}

// --- Basic profanity filter (lightweight) ---
function sanitizeInput(text: string): string {
  const sanitized = text.replace(/<script.*?>.*?<\/script>/gi, "").trim();
  const profaneWords = ["kill", "suicide", "hate"];
  const clean = profaneWords.reduce(
    (acc, word) => acc.replace(new RegExp(`\\b${word}\\b`, "gi"), "***"),
    sanitized,
  );
  return clean;
}

// --- Main handler ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check route
  if (new URL(req.url).pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", uptime: Deno.uptime() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth verification
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Try again in a minute.",
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const { message, history } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid message format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedMessage = sanitizeInput(message);

    // --- Gemini request ---
    const payload = {
      contents: [
        ...(history || []).map((h: any) => ({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: sanitizeInput(h.text || "") }],
        })),
        { role: "user", parts: [{ text: sanitizedMessage }] },
      ],
      systemInstruction: {
        parts: [{
          text:
            "You are MentiBot — an empathetic mental health & medical companion. Respond with care, use concise bullet points, provide wellness advice & suggest consulting professionals when needed. Never give medical diagnoses.",
        }],
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error(`Gemini API Error: ${status}`);

      let message = "Unexpected AI service error. Please try again later.";
      if (status === 429)
        message =
          "High server load. Please wait a moment or contact emergency services if in crisis (988 / 112).";
      if (status === 400)
        message = "I couldn't understand that. Could you rephrase?";

      return new Response(JSON.stringify({ response: message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResponse.json();
    const botResponse =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here with you. Let’s try that again.";

    // Approx token logging (simple heuristic)
    const inputLength = sanitizedMessage.split(/\s+/).length;
    const outputLength = botResponse.split(/\s+/).length;
    console.log(
      `[AI Log] user=${user.id} | input=${inputLength} tokens | output=${outputLength} tokens`,
    );

    // Return AI response
    return new Response(JSON.stringify({
      response: botResponse,
      userId: user.id,
      meta: { inputTokens: inputLength, outputTokens: outputLength },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Chatbot Server Error:", error.message || error);
    return new Response(JSON.stringify({
      error: "Server encountered an issue. Please try again later.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
