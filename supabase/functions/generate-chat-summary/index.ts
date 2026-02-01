import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = Deno.env.get("VITE_GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if summary already exists for this date
    const { data: existingSummary } = await supabase
      .from('chat_summaries')
      .select('*')
      .eq('patient_id', authData.user.id)
      .eq('summary_date', targetDate)
      .single();

    if (existingSummary) {
      return new Response(JSON.stringify({ 
        summary: existingSummary,
        message: "Summary already exists for this date"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all messages from conversations on the target date
    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select(`
        content,
        sender,
        created_at,
        conversation_id,
        chat_conversations!inner(user_id)
      `)
      .eq('chat_conversations.user_id', authData.user.id)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      throw new Error("Failed to fetch messages");
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No messages found for this date" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format messages for AI
    const conversationText = messages
      .map(m => `${m.sender === 'user' ? 'Patient' : 'MentiBot'}: ${m.content}`)
      .join('\n');

    // Generate summary using Gemini
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{
            text: `Analyze this mental health conversation between a patient and MentiBot. Create a clinical summary for healthcare providers.

CONVERSATION:
${conversationText}

Provide a JSON response with:
1. "summary_text": A 2-3 paragraph clinical summary of the patient's mental state, concerns discussed, and any coping strategies mentioned
2. "mood_indicators": An array of mood descriptors observed (e.g., ["anxious", "hopeful", "stressed"])
3. "key_concerns": An array of main issues or topics the patient discussed

Response must be valid JSON only, no markdown.`
          }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    };

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!aiResponse.ok) {
      console.error("Gemini API error:", aiResponse.status);
      throw new Error("AI service error");
    }

    const aiResult = await aiResponse.json();
    const responseText = aiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse AI response
    let summaryData;
    try {
      // Clean the response in case it has markdown code blocks
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      summaryData = JSON.parse(cleanedResponse);
    } catch {
      summaryData = {
        summary_text: responseText,
        mood_indicators: [],
        key_concerns: []
      };
    }

    // Save summary to database
    const { data: savedSummary, error: saveError } = await supabase
      .from('chat_summaries')
      .insert({
        patient_id: authData.user.id,
        summary_date: targetDate,
        summary_text: summaryData.summary_text,
        mood_indicators: summaryData.mood_indicators || [],
        key_concerns: summaryData.key_concerns || []
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving summary:", saveError);
      throw new Error("Failed to save summary");
    }

    return new Response(JSON.stringify({ 
      summary: savedSummary,
      message: "Summary generated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
