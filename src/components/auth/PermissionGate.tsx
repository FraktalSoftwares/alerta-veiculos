import { ReactNode } from "react";
import { useHasPermission, useHasAnyPermission } from "@/hooks/useUserPermissions";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * @param permission - Single permission code to check
 * @param permissions - Array of permission codes to check
 * @param requireAll - If true, user must have ALL permissions. If false (default), user needs ANY permission
 * @param fallback - Optional fallback UI to render when permission check fails
 * @param children - Content to render when permission check passes
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const singlePermission = useHasPermission(permission || "");
  const multiplePermissions = useHasAnyPermission(permissions || []);

  // Single permission check
  if (permission) {
    return singlePermission ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      const hasAll = permissions.every((p) => useHasPermission(p));
      return hasAll ? <>{children}</> : <>{fallback}</>;
    }
    return multiplePermissions ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
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
