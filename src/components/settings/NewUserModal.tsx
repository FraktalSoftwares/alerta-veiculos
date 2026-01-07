import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2 } from "lucide-react";
import { useAdminRoles } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getAllowedUserTypesToCreate, getDefaultUserTypeForCreation } from "@/lib/userTypeHierarchy";

interface NewUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface UserFormData {
  nome: string;
  email: string;
  password: string;
  user_type: string;
  admin_role_id: string;
}

export function NewUserModal({ open, onOpenChange }: NewUserModalProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: roles = [] } = useAdminRoles();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get allowed user types based on current user's type
  const allowedUserTypes = useMemo(() => {
    return getAllowedUserTypesToCreate(profile?.user_type);
  }, [profile?.user_type]);

  const defaultUserType = useMemo(() => {
    return getDefaultUserTypeForCreation(profile?.user_type);
  }, [profile?.user_type]);
  
  const [formData, setFormData] = useState<UserFormData>({
    nome: "",
    email: "",
    password: "",
    user_type: defaultUserType,
    admin_role_id: "",
  });

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.nome,
          user_type: formData.user_type,
          admin_role_id: formData.admin_role_id || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("Usuário criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      onOpenChange(false);
      setFormData({
        nome: "",
        email: "",
        password: "",
        user_type: "motorista",
        admin_role_id: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Adicionar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome<span className="text-destructive">*</span></Label>
            <Input
              id="nome"
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail<span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha<span className="text-destructive">*</span></Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Usuário</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => setFormData({ ...formData, user_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {allowedUserTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Função Administrativa</Label>
            <Select
              value={formData.admin_role_id}
              onValueChange={(value) => setFormData({ ...formData, admin_role_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar Usuário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
