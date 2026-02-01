import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Menu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onGenerateSummary?: () => void;
  isGeneratingSummary?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  onGenerateSummary,
  isGeneratingSummary,
}) => {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-card sticky top-0 z-30">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
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
        <div className="flex items-center gap-2">
          {onGenerateSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateSummary}
              disabled={isGeneratingSummary}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isGeneratingSummary ? "Generating..." : "Generate Summary"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
