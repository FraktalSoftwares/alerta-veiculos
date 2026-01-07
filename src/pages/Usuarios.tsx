import { useState } from "react";
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

  const handleSave = async () => {
    if (!user || !selectedRole) return;
    
    await assignRole.mutateAsync({ userId: user.id, adminRoleId: selectedRole });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Função - {user?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={assignRole.isPending}>
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

      <main className="px-[50px] py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-heading text-foreground">Usuários</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 w-[250px] bg-background"
              />
            </div>
            <Button onClick={handleNewUserClick} className="gap-2">
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
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
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-foreground">{user.full_name}</span>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                      {user.admin_role_name || getUserTypeLabel(user.user_type)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditUser(user)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-5 w-5" />
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
