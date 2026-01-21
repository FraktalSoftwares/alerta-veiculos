import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { RoleList } from "@/components/settings/RoleList";
import { RoleDetails } from "@/components/settings/RoleDetails";
import { UserRoleSection } from "@/components/settings/UserRoleSection";
import { AdminRoleDisplay, PermissionGroup } from "@/types/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminRoles,
  useRolePermissions,
  useUpdateAdminRole,
  useAssignPermission,
  useRemovePermission,
  useBulkAssignPermissions,
} from "@/hooks/useSettings";

const Configuracoes = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.user_type === "admin";
  const [selectedRole, setSelectedRole] = useState<AdminRoleDisplay | null>(null);

  const { data: roles = [], isLoading: isLoadingRoles } = useAdminRoles();
  const { data: permissions = [], isLoading: isLoadingPermissions } = useRolePermissions(selectedRole?.id);

  const updateRole = useUpdateAdminRole();
  const assignPermission = useAssignPermission();
  const removePermission = useRemovePermission();
  const bulkAssignPermissions = useBulkAssignPermissions();

  // Auto-select first role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  // Update selected role when roles change (after update)
  useEffect(() => {
    if (selectedRole) {
      const updatedRole = roles.find((r) => r.id === selectedRole.id);
      if (updatedRole) {
        setSelectedRole(updatedRole);
      }
    }
  }, [roles]);

  const handleRoleSelect = (role: AdminRoleDisplay) => {
    setSelectedRole(role);
  };

  const handleToggleActive = async (active: boolean) => {
    if (selectedRole) {
      await updateRole.mutateAsync({
        id: selectedRole.id,
        is_active: active,
      });
    }
  };

  const handlePermissionChange = async (
    groupName: string,
    permissionId: string,
    checked: boolean
  ) => {
    if (!selectedRole) return;

    if (checked) {
      await assignPermission.mutateAsync({
        roleId: selectedRole.id,
        permissionId,
      });
    } else {
      await removePermission.mutateAsync({
        roleId: selectedRole.id,
        permissionId,
      });
    }
  };

  const handleSelectAllInGroup = async (groupName: string, checked: boolean) => {
    if (!selectedRole) return;

    const group = permissions.find((g) => g.groupName === groupName);
    if (!group) return;

    const permissionIds = group.items.map((p) => p.id);

    await bulkAssignPermissions.mutateAsync({
      roleId: selectedRole.id,
      permissionIds,
      assign: checked,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground mb-4 sm:mb-6">
          Configurações
        </h1>

        <Tabs defaultValue={isAdmin ? "roles" : "users"} className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full h-auto flex-wrap sm:inline-flex sm:w-auto gap-1 p-1.5 sm:p-1">
            {isAdmin && (
              <TabsTrigger value="roles" className="flex-1 sm:flex-none min-w-0 truncate text-xs sm:text-sm px-2 sm:px-3 py-2.5 sm:py-1.5">
                Funções
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="flex-1 sm:flex-none min-w-0 truncate text-xs sm:text-sm px-2 sm:px-3 py-2.5 sm:py-1.5">
              Usuários
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="roles" className="space-y-4 mt-4 sm:mt-6">
              <div className="flex justify-end">
                <SettingsPageHeader title="" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <RoleList
                  roles={roles}
                  selectedRole={selectedRole}
                  onRoleSelect={handleRoleSelect}
                  isLoading={isLoadingRoles}
                />

                {selectedRole && (
                  <RoleDetails
                    role={selectedRole}
                    permissions={permissions}
                    isLoading={isLoadingPermissions}
                    onToggleActive={handleToggleActive}
                    onPermissionChange={handlePermissionChange}
                    onSelectAllInGroup={handleSelectAllInGroup}
                  />
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="users" className="mt-4 sm:mt-6">
            <UserRoleSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Configuracoes;
