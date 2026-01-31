import React from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CrisisSupport: React.FC = () => {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Crisis Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>National Suicide Prevention: <strong>988</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>Crisis Text Line: <strong>Text HOME to 741741</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>Emergency Services: <strong>911</strong></span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrisisSupport;
