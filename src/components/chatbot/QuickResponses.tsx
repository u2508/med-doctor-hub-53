import React from "react";
import { Button } from "@/components/ui/button";

interface QuickResponsesProps {
  responses: string[];
  onSelect: (text: string) => void;
  disabled: boolean;
}

const QuickResponses: React.FC<QuickResponsesProps> = ({
  responses,
  onSelect,
  disabled,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {responses.map((text, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onSelect(text)}
          disabled={disabled}
          className="text-xs"
        >
          {text}
        </Button>
      ))}
    </div>
  );
};

export default QuickResponses;
