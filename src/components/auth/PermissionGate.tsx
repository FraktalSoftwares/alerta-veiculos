import { ReactNode } from "react";
import { useHasPermission, useHasAnyPermission, useHasAllPermissions } from "@/hooks/useUserPermissions";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const singlePermission = useHasPermission(permission || "");
  const multipleAny = useHasAnyPermission(permissions || []);
  const multipleAll = useHasAllPermissions(permissions || []);

  if (permission) {
    return singlePermission ? <>{children}</> : <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasPermissions = requireAll ? multipleAll : multipleAny;
    return hasPermissions ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Simple wrapper for single permission check
 */
interface RequirePermissionProps {
  code: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({ code, fallback = null, children }: RequirePermissionProps) {
  const hasPermission = useHasPermission(code);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
