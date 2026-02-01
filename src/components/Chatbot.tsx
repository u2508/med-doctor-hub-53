import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ChatMessage from "@/components/chatbot/ChatMessage";
import ChatInput from "@/components/chatbot/ChatInput";
import QuickResponses from "@/components/chatbot/QuickResponses";
import TypingIndicator from "@/components/chatbot/TypingIndicator";
import CrisisSupport from "@/components/chatbot/CrisisSupport";
import ChatSidebar from "@/components/chatbot/ChatSidebar";
import ChatHeader from "@/components/chatbot/ChatHeader";
import { useChatConversations, type ChatMessage as ChatMessageType } from "@/hooks/useChatConversations";
import { toast } from "sonner";

const INITIAL_BOT_MESSAGE = "Hello! I'm MentiBot, your mental health assistant. How are you feeling today?";

const QUICK_RESPONSES = [
  "I'm feeling anxious",
  "I'm feeling sad",
  "I need help relaxing",
  "I can't sleep",
  "I'm feeling overwhelmed",
];

const Chatbot: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const {
    groupedConversations,
    activeConversation,
    messages,
    isLoading,
    createConversation,
    selectConversation,
    addMessage,
    deleteConversation,
  } = useChatConversations();

  // Display messages with initial bot message if conversation is empty
  const displayMessages = messages.length === 0
    ? [{ id: "initial", content: INITIAL_BOT_MESSAGE, sender: "bot" as const, created_at: new Date().toISOString(), conversation_id: "" }]
    : messages;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sanitizeInput = (text: string): string => {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
  };

  const sendMessage = async (text: string) => {
    const sanitizedText = sanitizeInput(text);
    if (!sanitizedText || !activeConversation) return;

    const now = Date.now();
    if (now - lastMessageTime < 2000) {
      toast.warning("Please wait a moment before sending another message");
      return;
    }
    setLastMessageTime(now);
    setInputText("");
    setIsTyping(true);

    // Add user message to DB
    await addMessage(sanitizedText, "user");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use the chatbot");
      }

      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { 
          message: sanitizedText, 
          history: messages.slice(-10).map(m => ({ text: m.content, sender: m.sender }))
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const botText = data.response || "Sorry, I couldn't process your request right now.";
      await addMessage(botText, "bot");
    } catch (err: any) {
      console.warn("Chat error:", err);
      let errorMessage = "Sorry, something went wrong. Please try again later.";
      
      if (err.message === "Please sign in to use the chatbot") {
        errorMessage = "Please sign in to continue chatting.";
        toast.error(errorMessage);
      } else if (err.message?.includes("Too many requests") || err.message?.includes("429")) {
        errorMessage = "Please wait a moment before sending another message.";
      }

      await addMessage(errorMessage, "bot");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = () => {
    sendMessage(inputText);
  };

  const handleNewChat = async () => {
    await createConversation();
    setSidebarOpen(false);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate summaries");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-chat-summary", {
        body: { date: new Date().toISOString().split("T")[0] },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.summary) {
        toast.success("Summary generated! View it in My Health > Notes");
      } else {
        toast.info(data.message || "Summary generated");
      }
    } catch (err: any) {
      console.error("Summary error:", err);
      if (err.message?.includes("No messages")) {
        toast.info("No messages to summarize for today");
      } else {
        toast.error("Failed to generate summary");
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ChatHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onGenerateSummary={handleGenerateSummary}
        isGeneratingSummary={isGeneratingSummary}
      />

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          groupedConversations={groupedConversations}
          activeConversation={activeConversation}
          onSelectConversation={(conv) => {
            selectConversation(conv);
            setSidebarOpen(false);
          }}
          onNewChat={handleNewChat}
          onDeleteConversation={deleteConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 overflow-hidden">
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2 border-b shrink-0">
                <p className="text-sm text-muted-foreground">
                  I'm here to support your mental wellness. How can I help you today?
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {displayMessages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={{
                          id: typeof message.id === "string" ? Date.now() : Number(message.id),
                          text: message.content,
                          sender: message.sender,
                          timestamp: new Date(message.created_at),
                        }}
                      />
                    ))}
                    {isTyping && <TypingIndicator />}
                  </div>
                </ScrollArea>

                {/* Quick Responses */}
                <div className="border-t p-4 shrink-0">
                  <QuickResponses
                    responses={QUICK_RESPONSES}
                    onSelect={sendMessage}
                    disabled={isTyping}
                  />
                </div>

                {/* Input */}
                <div className="border-t p-4 shrink-0">
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
            <div className="mt-4 shrink-0">
              <CrisisSupport />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
