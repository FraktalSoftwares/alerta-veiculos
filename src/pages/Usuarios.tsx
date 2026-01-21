import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Pencil, Loader2 } from "lucide-react";
import { NewUserModal } from "@/components/settings/NewUserModal";
import { useUsersWithRoles, useAdminRoles, useAssignUserRole } from "@/hooks/useSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; full_name: string; admin_role_id?: string } | null;
}

function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const { data: roles = [] } = useAdminRoles();
  const assignRole = useAssignUserRole();
  const [selectedRole, setSelectedRole] = useState(user?.admin_role_id || "");

  // Atualiza o role quando abrir para outro usuário
  useEffect(() => {
    if (user) setSelectedRole(user.admin_role_id || "");
  }, [user?.id, user?.admin_role_id]);

  const handleSave = async () => {
    if (!user || !selectedRole) return;
    
    await assignRole.mutateAsync({ userId: user.id, adminRoleId: selectedRole });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base sm:text-lg">Editar Função — {user?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 sm:py-4">
          <div className="space-y-2">
            <Label>Função Administrativa</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={assignRole.isPending} className="w-full sm:w-auto">
            {assignRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Usuarios = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string; admin_role_id?: string } | null>(null);
  
  const { data: users = [], isLoading } = useUsersWithRoles();

  const handleNewUserClick = () => {
    setIsModalOpen(true);
  };

  const handleEditUser = (user: { id: string; full_name: string; admin_role_id?: string }) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin: "ADMINISTRADOR",
      associacao: "ASSOCIAÇÃO",
      franqueado: "FRANQUEADO",
      frotista: "FROTISTA",
      motorista: "MOTORISTA",
    };
    return labels[type] || type.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">Usuários</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie funções e acessos dos usuários</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 w-full sm:w-[250px] bg-background"
              />
            </div>
            <Button onClick={handleNewUserClick} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-muted-foreground mb-2">Nenhum usuário encontrado</p>
            <p className="text-sm text-muted-foreground">
              {searchValue ? 'Tente uma busca diferente' : 'Clique em "Novo Usuário" para adicionar'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-sm hover:border-border/80 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs mt-1.5 w-fit">
                      {user.admin_role_name || getUserTypeLabel(user.user_type)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditUser(user)}
                  className="shrink-0 self-end sm:self-center text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] min-w-[44px]"
                >
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <NewUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
      />
    </div>
  );
};

export default Usuarios;
