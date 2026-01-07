import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UserRoleList } from "./UserRoleList";
import {
  useUsersWithRoles,
  useAdminRoles,
  useAssignUserRole,
  useRemoveUserRole,
} from "@/hooks/useSettings";

export function UserRoleSection() {
  const [searchValue, setSearchValue] = useState("");

  const { data: users = [], isLoading: isLoadingUsers } = useUsersWithRoles();
  const { data: roles = [], isLoading: isLoadingRoles } = useAdminRoles();
  const assignRole = useAssignUserRole();
  const removeRole = useRemoveUserRole();

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleAssignRole = (userId: string, roleId: string) => {
    assignRole.mutate({ userId, adminRoleId: roleId });
  };

  const handleRemoveRole = (userId: string) => {
    removeRole.mutate(userId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Usuários e Funções
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 w-64 bg-background"
          />
        </div>
      </div>

      <UserRoleList
        users={filteredUsers}
        roles={roles}
        isLoading={isLoadingUsers || isLoadingRoles}
        onAssignRole={handleAssignRole}
        onRemoveRole={handleRemoveRole}
      />
    </div>
  );
}
