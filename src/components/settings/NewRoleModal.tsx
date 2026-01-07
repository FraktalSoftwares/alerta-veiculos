import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAdminRole } from "@/hooks/useSettings";

interface NewRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRoleModal({ open, onOpenChange }: NewRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createRole = useCreateAdminRole();

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!name) return;

    await createRole.mutateAsync({
      name,
      description: description || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Função Administrativa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: Gerente, Supervisor..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva as responsabilidades desta função..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || createRole.isPending}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2"
          >
            <Check className="h-4 w-4" />
            {createRole.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
