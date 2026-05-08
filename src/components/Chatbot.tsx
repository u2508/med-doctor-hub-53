import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ChatMessage from "@/components/chatbot/ChatMessage";
import ChatInput from "@/components/chatbot/ChatInput";
import QuickResponses from "@/components/chatbot/QuickResponses";
import TypingIndicator from "@/components/chatbot/TypingIndicator";
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

const CHATBOT_FAILURE_PATTERNS = [
  /unexpected ai service error/i,
  /server encountered an issue/i,
  /something went wrong/i,
  /couldn't process your request/i,
  /failed to generate summary/i,
];

const isChatbotFailureText = (text: string) =>
  CHATBOT_FAILURE_PATTERNS.some((pattern) => pattern.test(text));

const buildFallbackReply = (userText: string) => {
  const text = userText.toLowerCase();

  if (text.includes("anxious") || text.includes("panic") || text.includes("overwhelmed")) {
    return [
      "I'm here with you.",
      "If the AI reply can't load right now, try one small step first: slow your breathing, unclench your shoulders, and notice one thing around you that feels steady.",
      "If you want, send one sentence about what triggered it and I can help you organize the next step.",
    ].join("\n");
  }

  if (text.includes("sad") || text.includes("down") || text.includes("depressed")) {
    return [
      "I'm here with you.",
      "A good next step is to describe when this started, whether anything made it worse, and what support you already have around you.",
      "If you want, I can help turn that into a short message you can share with a clinician.",
    ].join("\n");
  }

  if (text.includes("sleep") || text.includes("insomnia")) {
    return [
      "I'm here with you.",
      "When sleep is the problem, it helps to note the time you went to bed, whether your mind felt active, and what helped you relax before sleep.",
      "If you want, I can help you organize that into a clear summary.",
    ].join("\n");
  }

  return [
    "I'm here with you.",
    "I couldn't finish the AI reply just now, but you can still make progress by naming the main feeling, the trigger, and what you'd like help with next.",
    "If symptoms are severe, worsening, or you feel unsafe, seek urgent medical help right away.",
  ].join("\n");
};

const buildLocalSummary = (conversationMessages: ChatMessageType[]) => {
  const recentUserMessages = conversationMessages
    .filter((message) => message.sender === "user")
    .slice(-8)
    .map((message) => message.content.trim())
    .filter(Boolean);

  const combined = recentUserMessages.join(" ").toLowerCase();
  const moodIndicators = Array.from(
    new Set(
      [
        combined.includes("anxious") || combined.includes("panic") ? "anxious" : null,
        combined.includes("sad") || combined.includes("down") ? "low mood" : null,
        combined.includes("stressed") || combined.includes("overwhelmed") ? "stressed" : null,
        combined.includes("sleep") ? "sleep difficulty" : null,
        combined.includes("pain") ? "physical discomfort" : null,
      ].filter(Boolean) as string[],
    ),
  );

  const keyConcerns = Array.from(
    new Set(
      [
        combined.includes("anxious") || combined.includes("panic") ? "anxiety" : null,
        combined.includes("sad") || combined.includes("down") ? "low mood" : null,
        combined.includes("sleep") ? "sleep problems" : null,
        combined.includes("stressed") || combined.includes("overwhelmed") ? "stress" : null,
        combined.includes("pain") ? "pain or discomfort" : null,
      ].filter(Boolean) as string[],
    ),
  );

  const summaryParts = [
    recentUserMessages.length > 0
      ? `The patient discussed: ${recentUserMessages.slice(0, 3).join("; ")}.`
      : "The patient used the chat for general support.",
    "The conversation focused on supportive next steps, clarification of symptoms, and when to seek clinical care.",
    "No diagnosis was made in the summary.",
  ];

  return {
    summary_text: summaryParts.join(" "),
    mood_indicators: moodIndicators,
    key_concerns: keyConcerns,
  };
};

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
    : messages.map((message, index) => {
        if (message.sender !== "bot" || !isChatbotFailureText(message.content)) {
          return message;
        }

        const priorUserMessage = [...messages.slice(0, index)]
          .reverse()
          .find((entry) => entry.sender === "user");

        return {
          ...message,
          content: buildFallbackReply(priorUserMessage?.content || ""),
        };
      });

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

      const rawBotText = data.response || "";
      const botText = isChatbotFailureText(rawBotText)
        ? buildFallbackReply(sanitizedText)
        : rawBotText || buildFallbackReply(sanitizedText);
      await addMessage(botText, "bot");
    } catch (err: any) {
      console.warn("Chat error:", err);
      let errorMessage = buildFallbackReply(sanitizedText);
      
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
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error("Please sign in to generate summaries");
            return;
          }

          const fallback = buildLocalSummary(messages);
          const targetDate = new Date().toISOString().split("T")[0];
          const { data: savedSummary, error: saveError } = await supabase
            .from("chat_summaries")
            .upsert(
              {
                patient_id: session.user.id,
                summary_date: targetDate,
                summary_text: fallback.summary_text,
                mood_indicators: fallback.mood_indicators,
                key_concerns: fallback.key_concerns,
              },
              { onConflict: "patient_id,summary_date" },
            )
            .select()
            .single();

          if (saveError) throw saveError;

          toast.success("Summary generated and saved to your notes");
          if (savedSummary) {
            console.info("Local summary saved:", savedSummary.id);
          }
        } catch (fallbackError) {
          console.error("Fallback summary error:", fallbackError);
          toast.error("Summary could not be saved right now");
        }
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
          <div className="flex-1 flex flex-col w-full px-4 py-4 md:px-6 md:py-6 overflow-hidden">
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
