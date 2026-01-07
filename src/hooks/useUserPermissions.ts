import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGroup, groupPermissionsByModule, mapPermissionToDisplay } from "@/types/settings";

export interface UserRoleInfo {
  roleId: string | null;
  roleName: string | null;
  roleDescription: string | null;
  permissions: PermissionGroup[];
  permissionCodes: Set<string>;
}

export function useUserPermissions() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async (): Promise<UserRoleInfo> => {
      if (!user?.id) {
        return {
          roleId: null,
          roleName: null,
          roleDescription: null,
          permissions: [],
          permissionCodes: new Set(),
        };
      }

      // Get user's admin role
      const { data: userRole, error: userRoleError } = await supabase
        .from("user_admin_roles")
        .select("admin_role_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRoleError) throw userRoleError;

      if (!userRole) {
        return {
          roleId: null,
          roleName: null,
          roleDescription: null,
          permissions: [],
          permissionCodes: new Set(),
        };
      }

      // Get role details
      const { data: role, error: roleError } = await supabase
        .from("admin_roles")
        .select("id, name, description")
        .eq("id", userRole.admin_role_id)
        .single();

      if (roleError) throw roleError;

      // Get role permissions
      const { data: rolePermissions, error: permError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("admin_role_id", role.id);

      if (permError) throw permError;

      const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || [];

      if (permissionIds.length === 0) {
        return {
          roleId: role.id,
          roleName: role.name,
          roleDescription: role.description,
          permissions: [],
          permissionCodes: new Set(),
        };
      }

      // Get permission details
      const { data: permissions, error: permDetailsError } = await supabase
        .from("permissions")
        .select("*")
        .in("id", permissionIds)
        .order("module")
        .order("name");

      if (permDetailsError) throw permDetailsError;

      const mappedPermissions = (permissions || []).map((p) =>
        mapPermissionToDisplay(p, true)
      );

      const permissionCodes = new Set(permissions?.map((p) => p.code) || []);

      return {
        roleId: role.id,
        roleName: role.name,
        roleDescription: role.description,
        permissions: groupPermissionsByModule(mappedPermissions),
        permissionCodes,
      };
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permissionCode: string): boolean {
  const { data, isLoading } = useUserPermissions();
  const { profile } = useAuth();

  // Admin users always have all permissions
  if (profile?.user_type === "admin") return true;

  if (isLoading || !data) return false;

  return data.permissionCodes.has(permissionCode);
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissionCodes: string[]): boolean {
  const { data, isLoading } = useUserPermissions();
  const { profile } = useAuth();

  // Admin users always have all permissions
  if (profile?.user_type === "admin") return true;

  if (isLoading || !data) return false;

  return permissionCodes.some((code) => data.permissionCodes.has(code));
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissionCodes: string[]): boolean {
  const { data, isLoading } = useUserPermissions();
  const { profile } = useAuth();

  // Admin users always have all permissions
  if (profile?.user_type === "admin") return true;

  if (isLoading || !data) return false;

  return permissionCodes.every((code) => data.permissionCodes.has(code));
}

/**
 * Permission codes for easy reference
 */
export const PERMISSIONS = {
  // Clientes
  CLIENTS_VIEW: "clients_view",
  CLIENTS_CREATE: "clients_create",
  CLIENTS_EDIT: "clients_edit",
  CLIENTS_DELETE: "clients_delete",
  CLIENTS_BILLING: "clients_billing",
  CLIENTS_ADDRESS: "clients_address",
  CLIENTS_ACCESS: "clients_access",
  CLIENTS_BASIC: "clients_basic",

  // Veículos
  VEHICLES_VIEW: "vehicles_view",
  VEHICLES_CREATE: "vehicles_create",
  VEHICLES_EDIT: "vehicles_edit",
  VEHICLES_DELETE: "vehicles_delete",
  VEHICLES_BLOCK: "vehicles_block",
  VEHICLES_TRACK: "vehicles_track",
  VEHICLES_ALERTS: "vehicles_alerts",

  // Financeiro
  FINANCE_VIEW: "finance_view",
  FINANCE_REVENUE: "finance_revenue",
  FINANCE_EXPENSES: "finance_expenses",
  FINANCE_REPORTS: "finance_reports",
  FINANCE_EDIT: "finance_edit",
  FINANCE_DELETE: "finance_delete",

  // Estoque
  STOCK_VIEW: "stock_view",
  STOCK_CREATE: "stock_create",
  STOCK_EDIT: "stock_edit",
  STOCK_DELETE: "stock_delete",
  STOCK_INSTALL: "stock_install",
  STOCK_MAINTENANCE: "stock_maintenance",

  // Loja
  STORE_VIEW: "store_view",
  STORE_CREATE: "store_create",
  STORE_EDIT: "store_edit",
  STORE_DELETE: "store_delete",
  STORE_PURCHASE: "store_purchase",
  STORE_ORDERS: "store_orders",

  // Notificações
  NOTIFICATIONS_VIEW: "notifications_view",
  NOTIFICATIONS_CREATE: "notifications_create",
  NOTIFICATIONS_SEND: "notifications_send",

  // Configurações
  SETTINGS_VIEW: "settings_view",
  SETTINGS_ROLES: "settings_roles",
  SETTINGS_PERMISSIONS: "settings_permissions",
  SETTINGS_USERS: "settings_users",

  // Dashboard
  DASHBOARD_VIEW: "dashboard_view",
  DASHBOARD_STATS: "dashboard_stats",
  DASHBOARD_REPORTS: "dashboard_reports",
} as const;
