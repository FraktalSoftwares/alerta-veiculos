import { User, LogOut, Settings, UserCog, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function UserProfile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const handleProfile = () => {
    navigate("/perfil");
  };

  const handleSettings = () => {
    navigate("/configuracoes");
  };

  const displayName = profile?.full_name || "Usuário";
  const displayEmail = profile?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 outline-none hover:opacity-80 transition-opacity">
          <div className="text-right">
            <p className="text-sm font-semibold text-background">{displayName}</p>
            <p className="text-xs text-background/80">{displayEmail}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-background/20 border-2 border-background/40 flex items-center justify-center">
            <User className="h-5 w-5 text-background" />
          </div>
          <ChevronDown className="h-4 w-4 text-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[180px] bg-card border border-border rounded-md shadow-md z-50">
        <DropdownMenuItem onClick={handleProfile} className="cursor-pointer gap-2 py-2">
          <UserCog className="h-4 w-4" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer gap-2 py-2">
          <Settings className="h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
