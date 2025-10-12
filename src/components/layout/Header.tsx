import { Heart, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  doctorName?: string;
  onLogout?: () => void;
}

export function Header({ doctorName = "Dr. Smith", onLogout }: HeaderProps) {
  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-2xl blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-r from-primary to-primary-dark p-3 rounded-2xl shadow-xl">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">MediCare Portal</h1>
            <p className="text-sm text-muted-foreground font-medium">Doctor Dashboard</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="lg" className="flex items-center gap-3 hover:bg-primary/10 transition-colors font-medium">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">{doctorName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer hover:bg-primary/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}