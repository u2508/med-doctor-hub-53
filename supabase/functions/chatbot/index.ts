import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;  
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting - simple in-memory store (for demo)
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute per user
const RATE_WINDOW = 60 * 1000; // 1 minute

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userKey = `user_${userId}`;
  const userRequests = requestCounts.get(userKey) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter((timestamp: number) => now - timestamp < RATE_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT) {
    return false; // Rate limited
  }
  
  // Add current request
  validRequests.push(now);
  requestCounts.set(userKey, validRequests);
  return true;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please wait a moment before sending another message.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, history } = await req.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize message input (basic XSS protection)
    const sanitizedMessage = message.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          ...((history || []).map((h: any) => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          }))),
          {
            role: 'user',
            parts: [{ text: sanitizedMessage }]
          }
        ],
        systemInstruction: {
          parts: [{
            text: "Your name is ThinkBot. Engage with patients warmly, discuss health and mental health, predict possible issues, give home remedies & preventive measures. Keep responses short, easy to understand, and in bullet points. Always advise consulting a professional if needed. Keep conversation history in mind. Never provide medical diagnoses or replace professional medical advice."
          }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      
      // Handle different API error types
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          response: "I'm experiencing high demand right now. Please try again in a few moments. In the meantime, remember that if you're experiencing a crisis, please contact:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (response.status === 400) {
        return new Response(JSON.stringify({ 
          response: "I had trouble understanding your message. Could you please rephrase it?"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';

    // Log chat interaction (without storing sensitive content)
    console.log(`Chat interaction for user ${user.id} - Message length: ${sanitizedMessage.length}, Response length: ${botResponse.length}`);

    return new Response(JSON.stringify({ 
      response: botResponse,
      userId: user.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chatbot function error:', errorMessage);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});