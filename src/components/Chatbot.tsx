import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ChatMessage from "@/components/chatbot/ChatMessage";
import ChatInput from "@/components/chatbot/ChatInput";
import QuickResponses from "@/components/chatbot/QuickResponses";
import TypingIndicator from "@/components/chatbot/TypingIndicator";
import CrisisSupport from "@/components/chatbot/CrisisSupport";
import { toast } from "sonner";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  text: "Hello! I'm MentiBot, your mental health assistant. How are you feeling today?",
  sender: "bot",
  timestamp: new Date(),
};

const QUICK_RESPONSES = [
  "I'm feeling anxious",
  "I'm feeling sad",
  "I need help relaxing",
  "I can't sleep",
  "I'm feeling overwhelmed",
];

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = sessionStorage.getItem("secure_chat_messages");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {
      console.warn("Failed to load chat session");
    }
    return [INITIAL_MESSAGE];
  });

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    try {
      sessionStorage.setItem("secure_chat_messages", JSON.stringify(messages));
    } catch {
      console.warn("Failed to save chat session");
    }
  }, [messages]);

  const sanitizeInput = (text: string): string => {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
  };

  const sendMessage = async (text: string) => {
    const sanitizedText = sanitizeInput(text);
    if (!sanitizedText) return;

    const now = Date.now();
    if (now - lastMessageTime < 2000) {
      toast.warning("Please wait a moment before sending another message");
      return;
    }
    setLastMessageTime(now);

    const userMessage: Message = {
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
      if (!session) {
        throw new Error("Please sign in to use the chatbot");
      }

      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { message: sanitizedText, history: messages.slice(-10) },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const botText = data.response || "Sorry, I couldn't process your request right now.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: botText, sender: "bot", timestamp: new Date() },
      ]);
    } catch (err: any) {
      console.warn("Chat error:", err);
      let errorMessage = "Sorry, something went wrong. Please try again later.";
      
      if (err.message === "Please sign in to use the chatbot") {
        errorMessage = "Please sign in to continue chatting.";
        toast.error(errorMessage);
      } else if (err.message?.includes("Too many requests") || err.message?.includes("429")) {
        errorMessage = "Please wait a moment before sending another message.";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: errorMessage, sender: "bot", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = () => {
    sendMessage(inputText);
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem("secure_chat_messages");
    toast.success("Chat cleared");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/user-dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">MentiBot</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-2 border-b">
            <p className="text-sm text-muted-foreground">
              I'm here to support your mental wellness. How can I help you today?
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
              </div>
            </ScrollArea>

            {/* Quick Responses */}
            <div className="border-t p-4">
              <QuickResponses
                responses={QUICK_RESPONSES}
                onSelect={sendMessage}
                disabled={isTyping}
              />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <ChatInput
                value={inputText}
                onChange={setInputText}
                onSubmit={handleSubmit}
                isLoading={isTyping}
              />
            </div>
          </CardContent>
        </Card>

        {/* Crisis Support */}
        <CrisisSupport />
      </main>
    </div>
  );
};

export default Chatbot;
