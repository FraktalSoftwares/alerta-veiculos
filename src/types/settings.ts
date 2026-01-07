import { Tables } from "@/integrations/supabase/types";

export type AdminRole = Tables<"admin_roles">;
export type Permission = Tables<"permissions">;
export type RolePermission = Tables<"role_permissions">;

export interface AdminRoleDisplay {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface PermissionDisplay {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
  checked: boolean;
}

export interface PermissionGroup {
  groupName: string;
  items: PermissionDisplay[];
}

export function mapAdminRoleToDisplay(role: AdminRole): AdminRoleDisplay {
  return {
    id: role.id,
    name: role.name,
    description: role.description || "",
    isActive: role.is_active ?? true,
  };
}

export function mapPermissionToDisplay(
  permission: Permission,
  isChecked: boolean = false
): PermissionDisplay {
  return {
    id: permission.id,
    code: permission.code,
    name: permission.name,
    module: permission.module,
    description: permission.description || "",
    checked: isChecked,
  };
}

export function groupPermissionsByModule(permissions: PermissionDisplay[]): PermissionGroup[] {
  const groups: Record<string, PermissionDisplay[]> = {};

  permissions.forEach((permission) => {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }
    groups[permission.module].push(permission);
  });

  return Object.entries(groups).map(([groupName, items]) => ({
    groupName,
    items,
  }));
}
