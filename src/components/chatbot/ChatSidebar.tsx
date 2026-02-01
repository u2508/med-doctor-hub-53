import React from "react";
import { Plus, MessageSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useChatConversations";

interface ChatSidebarProps {
  groupedConversations: Record<string, Conversation[]>;
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  groupedConversations,
  activeConversation,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
  const dateOrder = ["Today", "Yesterday", "Last 7 days"];

  const sortedGroups = Object.keys(groupedConversations).sort((a, b) => {
    const aIndex = dateOrder.indexOf(a);
    const bIndex = dateOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return b.localeCompare(a);
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-50 md:z-auto h-full w-72 bg-muted/30 border-r flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Button onClick={onNewChat} className="flex-1 gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {sortedGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            ) : (
              sortedGroups.map((group) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {groupedConversations[group].map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                          activeConversation?.id === conv.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={() => onSelectConversation(conv)}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="text-sm truncate flex-1">
                          {conv.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default ChatSidebar;
