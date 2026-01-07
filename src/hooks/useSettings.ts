import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AdminRoleDisplay,
  PermissionDisplay,
  PermissionGroup,
  mapAdminRoleToDisplay,
  mapPermissionToDisplay,
  groupPermissionsByModule,
} from "@/types/settings";

// ==================== Admin Roles Hooks ====================

export function useAdminRoles() {
  return useQuery({
    queryKey: ["admin-roles"],
    queryFn: async (): Promise<AdminRoleDisplay[]> => {
      const { data, error } = await supabase
        .from("admin_roles")
        .select("*")
        .order("name");

      if (error) throw error;

      return (data || []).map(mapAdminRoleToDisplay);
    },
  });
}

export function useAdminRole(roleId: string | undefined) {
  return useQuery({
    queryKey: ["admin-role", roleId],
    queryFn: async (): Promise<AdminRoleDisplay | null> => {
      if (!roleId) return null;

      const { data, error } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("id", roleId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapAdminRoleToDisplay(data);
    },
    enabled: !!roleId,
  });
}

export function useCreateAdminRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: role, error } = await supabase
        .from("admin_roles")
        .insert({
          name: data.name,
          description: data.description,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast({
        title: "Função criada",
        description: "A função administrativa foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { data: role, error } = await supabase
        .from("admin_roles")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast({
        title: "Função atualizada",
        description: "A função administrativa foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAdminRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast({
        title: "Função removida",
        description: "A função administrativa foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ==================== Permissions Hooks ====================

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async (): Promise<PermissionDisplay[]> => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module")
        .order("name");

      if (error) throw error;

      return (data || []).map((p) => mapPermissionToDisplay(p, false));
    },
  });
}

export function useRolePermissions(roleId: string | undefined) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: async (): Promise<PermissionGroup[]> => {
      if (!roleId) return [];

      // Get all permissions
      const { data: allPermissions, error: permError } = await supabase
        .from("permissions")
        .select("*")
        .order("module")
        .order("name");

      if (permError) throw permError;

      // Get role's assigned permissions
      const { data: rolePerms, error: rolePermError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("admin_role_id", roleId);

      if (rolePermError) throw rolePermError;

      const assignedPermissionIds = new Set(rolePerms?.map((rp) => rp.permission_id) || []);

      // Map permissions with checked status
      const permissions = (allPermissions || []).map((p) =>
        mapPermissionToDisplay(p, assignedPermissionIds.has(p.id))
      );

      return groupPermissionsByModule(permissions);
    },
    enabled: !!roleId,
  });
}

export function useAssignPermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from("role_permissions")
        .insert({
          admin_role_id: roleId,
          permission_id: permissionId,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir permissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemovePermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: string; permissionId: string }) => {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("admin_role_id", roleId)
        .eq("permission_id", permissionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover permissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roleId, 
      permissionIds, 
      assign 
    }: { 
      roleId: string; 
      permissionIds: string[]; 
      assign: boolean 
    }) => {
      if (assign) {
        // Get existing permissions to avoid duplicates
        const { data: existing } = await supabase
          .from("role_permissions")
          .select("permission_id")
          .eq("admin_role_id", roleId)
          .in("permission_id", permissionIds);

        const existingIds = new Set(existing?.map((e) => e.permission_id) || []);
        const toInsert = permissionIds
          .filter((id) => !existingIds.has(id))
          .map((permissionId) => ({
            admin_role_id: roleId,
            permission_id: permissionId,
          }));

        if (toInsert.length > 0) {
          const { error } = await supabase.from("role_permissions").insert(toInsert);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("admin_role_id", roleId)
          .in("permission_id", permissionIds);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", variables.roleId] });
    },
  });
}

// ==================== User Admin Roles Hooks ====================

export interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  avatar_url?: string;
  admin_role_id?: string;
  admin_role_name?: string;
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_type, avatar_url")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Get all user admin roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_admin_roles")
        .select("user_id, admin_role_id");

      if (rolesError) throw rolesError;

      // Get all admin roles for names
      const { data: adminRoles, error: adminRolesError } = await supabase
        .from("admin_roles")
        .select("id, name");

      if (adminRolesError) throw adminRolesError;

      const roleMap = new Map(adminRoles?.map((r) => [r.id, r.name]) || []);
      const userRoleMap = new Map(userRoles?.map((ur) => [ur.user_id, ur.admin_role_id]) || []);

      return (profiles || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        user_type: profile.user_type,
        avatar_url: profile.avatar_url || undefined,
        admin_role_id: userRoleMap.get(profile.id) || undefined,
        admin_role_name: userRoleMap.get(profile.id) ? roleMap.get(userRoleMap.get(profile.id)!) : undefined,
      }));
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, adminRoleId }: { userId: string; adminRoleId: string }) => {
      // First, remove any existing role assignment
      await supabase
        .from("user_admin_roles")
        .delete()
        .eq("user_id", userId);

      // Then assign the new role
      const { error } = await supabase
        .from("user_admin_roles")
        .insert({
          user_id: userId,
          admin_role_id: adminRoleId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({
        title: "Função atribuída",
        description: "A função foi atribuída ao usuário com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_admin_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({
        title: "Função removida",
        description: "A função foi removida do usuário com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
