import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useHasAnyPermission } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedByPermissionProps {
  permissions: string[];
  requireAll?: boolean;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route protection component that checks for specific permissions
 * Redirects to specified path if user doesn't have required permissions
 */
export function ProtectedByPermission({
  permissions,
  requireAll = false,
  redirectTo = "/",
  children,
}: ProtectedByPermissionProps) {
  const { profile, loading } = useAuth();
  const hasPermission = useHasAnyPermission(permissions);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin always has access
  if (profile?.user_type === "admin") {
    return <>{children}</>;
  }

  // Check permissions
  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
