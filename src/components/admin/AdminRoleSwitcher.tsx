import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Shield,
  Stethoscope,
  User,
  ChevronDown,
  Monitor,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "admin" | "doctor" | "patient";

interface AdminRoleSwitcherProps {
  className?: string;
}

const AdminRoleSwitcher: React.FC<AdminRoleSwitcherProps> = ({ className }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>("admin");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verify admin role from database
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check user_roles table for admin role (server-side verification)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        setIsAdmin(!!roleData);
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  const viewOptions: { value: ViewMode; label: string; icon: React.ReactNode; description: string; path: string }[] = [
    {
      value: "admin",
      label: "Admin View",
      icon: <Shield className="w-4 h-4" />,
      description: "Full admin dashboard access",
      path: "/admin-dashboard",
    },
    {
      value: "doctor",
      label: "Doctor View",
      icon: <Stethoscope className="w-4 h-4" />,
      description: "Preview doctor experience",
      path: "/doctor-dashboard",
    },
    {
      value: "patient",
      label: "Patient View",
      icon: <User className="w-4 h-4" />,
      description: "Preview patient experience",
      path: "/user-dashboard",
    },
  ];

  const handleViewChange = (view: ViewMode) => {
    const option = viewOptions.find((o) => o.value === view);
    if (!option) return;

    setCurrentView(view);
    
    toast({
      title: `Switched to ${option.label}`,
      description: option.description,
    });

    navigate(option.path);
  };

  const getCurrentViewOption = () => viewOptions.find((o) => o.value === currentView);

  // Don't render if not admin or still loading
  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <div className={className}>
      {/* Floating indicator when not in admin view */}
      <AnimatePresence>
        {currentView !== "admin" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-warning/90 text-warning-foreground rounded-full shadow-lg backdrop-blur-sm">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">
                Viewing as {getCurrentViewOption()?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-warning-foreground/20 rounded-full"
                onClick={() => handleViewChange("admin")}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary/50 bg-card/50 backdrop-blur-sm"
          >
            <Monitor className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">View Mode</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {getCurrentViewOption()?.label.split(" ")[0]}
            </Badge>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-card border-border z-50">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Switch Dashboard View
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {viewOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleViewChange(option.value)}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                currentView === option.value ? "bg-primary/10" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  currentView === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {currentView === option.value && (
                    <Badge variant="default" className="text-xs h-5">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="p-2 text-xs text-muted-foreground text-center">
            Role switcher is for testing only
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AdminRoleSwitcher;
