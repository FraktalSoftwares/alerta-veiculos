import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface StockPageHeaderProps {
  title: string;
  onNewClick: () => void;
}

export function StockPageHeader({ title, onNewClick }: StockPageHeaderProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.user_type === 'admin';

  return (
    <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">{title}</h1>
      {isAdmin && (
        <Button onClick={onNewClick} className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 gap-2">
          <Plus className="h-4 w-4" />
          Novo equipamento
        </Button>
      )}
    </div>
  );
}
