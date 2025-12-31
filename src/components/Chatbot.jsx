import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Chatbot = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem("secure_chat_messages");
      return stored
        ? JSON.parse(stored)
        : [
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
    try {
      sessionStorage.setItem("secure_chat_messages", JSON.stringify(messages));
    } catch {
      console.warn("Failed to save chat session");
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const now = Date.now();
    if (now - lastMessageTime < 2000) return; // rate limit

    setLastMessageTime(now);

    const sanitizedText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .trim();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to use the chatbot");

      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { message: sanitizedText, history: messages.slice(-10) },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const botText =
        data.response || "Sorry, I couldn't process your request right now.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: botText, sender: "bot", timestamp: new Date() },
      ]);
    } catch (err) {
      console.warn("Chat error occurred");
      let errorMessage = "Sorry, something went wrong. Please try again later.";
      if (err.message === "Please sign in to use the chatbot")
        errorMessage = "Please sign in to continue chatting.";
      else if (err.message?.includes("Too many requests"))
        errorMessage = "Please wait a moment before sending another message.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: errorMessage, sender: "bot", timestamp: new Date() },
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3 font-display">
            <Heart className="text-[#00BFFF]" /> MentiBot Chat
          </h1>
          <button
            onClick={() => navigate("/user-dashboard")}
            className="bg-[#00BFFF] text-white px-6 py-3 rounded-xl hover:bg-[#009FD6] transition-all duration-300 font-medium shadow-md"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Chat Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-10 flex flex-col space-y-8">
        <div className="bg-slate-800/60 rounded-3xl flex-1 flex flex-col shadow-2xl border border-slate-700/40 overflow-hidden">
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
                      ? "bg-[#00BFFF] text-white rounded-br-md shadow-lg"
                      : "bg-slate-700 text-gray-100 rounded-bl-md border border-slate-600/50"
                  }`}
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
                <div className="bg-slate-700/70 border border-slate-600 rounded-xl px-4 py-2 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick responses */}
          <div className="border-t border-slate-700 p-6 flex flex-wrap gap-3 bg-slate-900/60">
            {quickResponses.map((text, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(text)}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-gray-100 px-4 py-2 rounded-full transition-all duration-200 border border-slate-600 font-medium"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-700 flex bg-slate-800/80 p-6 gap-4"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-5 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00BFFF]/40 focus:border-transparent outline-none text-white text-lg"
            />
            <button
              type="submit"
              className="bg-[#00BFFF] text-white px-8 py-3 rounded-xl hover:bg-[#009FD6] transition-all duration-300 font-semibold shadow-lg"
            >
              Send
            </button>
          </form>
        </div>

        {/* 🚨 Crisis Support */}
        <div className="mt-10 bg-red-700 text-white border border-red-800 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🚨 Crisis Support
          </h3>
          <ul className="list-disc list-inside space-y-2 text-base font-medium">
            <li>National Suicide Prevention Lifeline: <span className="font-bold">988</span></li>
            <li>Crisis Text Line: <span className="font-bold">Text HOME to 741741</span></li>
            <li>Emergency Services: <span className="font-bold">911</span></li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Chatbot;
