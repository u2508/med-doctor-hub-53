import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: "user" | "bot";
  created_at: string;
}

export function useChatConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);

      // Auto-select or create conversation
      if (data && data.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todayConv = data.find(
          (c) => c.created_at.split("T")[0] === today && c.is_active
        );
        
        if (todayConv) {
          setActiveConversation(todayConv);
        } else {
          // Create new conversation for today
          await createConversation();
        }
      } else {
        await createConversation();
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new conversation
  const createConversation = async (title?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: session.user.id,
          title: title || `Chat - ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations((prev) => [data, ...prev]);
      setActiveConversation(data);
      setMessages([]);
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create new chat");
      return null;
    }
  };

  // Select a conversation
  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation.id);
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }) as { data: ChatMessage[] | null; error: any };

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Add a message
  const addMessage = async (content: string, sender: "user" | "bot") => {
    if (!activeConversation) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: activeConversation.id,
          user_id: session.user.id,
          content,
          sender,
        })
        .select()
        .single() as { data: ChatMessage | null; error: any };

      if (error) throw error;
      
      setMessages((prev) => [...prev, data]);

      // Update conversation title if it's the first user message
      if (sender === "user" && messages.filter(m => m.sender === "user").length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await supabase
          .from("chat_conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", activeConversation.id);
        
        setActiveConversation((prev) => prev ? { ...prev, title } : null);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, title } : c))
        );
      }

      return data;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      
      if (activeConversation?.id === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        if (remaining.length > 0) {
          await selectConversation(remaining[0]);
        } else {
          await createConversation();
        }
      }
      
      toast.success("Chat deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete chat");
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const date = new Date(conv.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Yesterday";
    } else if (date > lastWeek) {
      group = "Last 7 days";
    } else {
      group = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  return {
    conversations,
    groupedConversations,
    activeConversation,
    messages,
    isLoading,
    createConversation,
    selectConversation,
    addMessage,
    deleteConversation,
    fetchConversations,
  };
}
