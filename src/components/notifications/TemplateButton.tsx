import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateButtonProps {
  onClick: () => void;
}

export function TemplateButton({ onClick }: TemplateButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
    >
      <Bookmark className="h-4 w-4" />
      Escolher Um Modelo
    </Button>
  );
}
