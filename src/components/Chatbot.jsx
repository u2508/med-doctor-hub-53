import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Remove exposed API key - now handled securely via Edge Function

const Chatbot = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  // Secure session storage instead of localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem("secure_chat_messages");
      return stored ? JSON.parse(stored) : [
        {
          id: 1,
          text: "Hello! I'm your mental health assistant. How are you feeling today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ];
    } catch {
      return [
        {
          id: 1,
          text: "Hello! I'm your mental health assistant. How are you feeling today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ];
    }
  });
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Secure session storage with error handling
    try {
      sessionStorage.setItem("secure_chat_messages", JSON.stringify(messages));
    } catch (error) {
      // Storage failed - continue without persistence
      console.warn("Failed to save chat session");
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Rate limiting on frontend (prevent spam)
    const now = Date.now();
    if (now - lastMessageTime < 2000) { // 2 second cooldown
      return;
    }
    setLastMessageTime(now);

    // Input sanitization
    const sanitizedText = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
    if (!sanitizedText) return;

    const userMessage = {
      id: Date.now(),
      text: sanitizedText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use the chatbot");
      }

      // Call secure edge function instead of direct API
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          message: sanitizedText,
          history: messages.slice(-10) // Limit history to last 10 messages for performance
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const botText = data.response || "Sorry, I couldn't process your request right now.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: botText,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      // Sanitized error logging
      console.warn("Chat error occurred");
      let errorMessage = "Sorry, something went wrong. Please try again later.";
      
      if (err.message === "Please sign in to use the chatbot") {
        errorMessage = "Please sign in to continue chatting.";
      } else if (err.message?.includes("Too many requests")) {
        errorMessage = "Please wait a moment before sending another message.";
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: errorMessage,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const quickResponses = [
    "I'm feeling anxious",
    "I'm feeling sad",
    "I need help relaxing",
    "I can't sleep",
    "I'm feeling overwhelmed",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ background: 'var(--gradient-subtle)' }}>
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3 font-display">
            <Heart className="text-primary" /> MentiBot Chat
          </h1>
          <button
            onClick={() => navigate("/user-dashboard")}
            className="bg-gradient-primary text-primary-foreground px-6 py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-8 flex flex-col">
        <div className="card-elevated rounded-3xl flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-6 py-4 rounded-2xl max-w-xs md:max-w-lg whitespace-pre-line ${
                    message.sender === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md border border-border"
                  }`}
                  style={{ 
                    boxShadow: message.sender === "user" 
                      ? 'var(--shadow-glow)' 
                      : 'var(--shadow-elegant)'
                  }}
                >
                  {message.text}
                  <div className="text-xs opacity-70 mt-3 font-medium">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-accent border border-border rounded-xl px-4 py-2 flex items-center space-x-1" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick responses */}
          <div className="border-t border-border p-6 flex flex-wrap gap-3 bg-accent/30">
            {quickResponses.map((text, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(text)}
                className="text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-full transition-all duration-200 border border-border hover:shadow-card font-medium"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border flex bg-card/80 p-6 gap-4"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-foreground text-lg"
            />
            <button
              type="submit"
              className="bg-gradient-primary text-primary-foreground px-8 py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold"
            >
              Send
            </button>
          </form>
        </div>

        {/* Crisis info */}
        <div className="mt-8 bg-destructive/10 border border-destructive/20 rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-elegant)' }}>
          <h3 className="text-base font-semibold text-destructive mb-4 flex items-center gap-2">
            🚨 Crisis Support
          </h3>
          <ul className="list-disc list-inside text-sm text-destructive-foreground space-y-2 font-medium">
            <li>National Suicide Prevention Lifeline: 988</li>
            <li>Crisis Text Line: Text HOME to 741741</li>
            <li>Emergency Services: 911</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
