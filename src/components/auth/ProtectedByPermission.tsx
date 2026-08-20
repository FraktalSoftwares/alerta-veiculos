import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useHasAnyPermission, useHasAllPermissions, useUserPermissions } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useFirstAccessibleRoute } from "@/hooks/useFirstAccessibleRoute";

interface ProtectedByPermissionProps {
  permissions: string[];
  requireAll?: boolean;
  redirectTo?: string;
  children: ReactNode;
}

export function ProtectedByPermission({
  permissions,
  requireAll = false,
  redirectTo,
  children,
}: ProtectedByPermissionProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const { isLoading: permsLoading } = useUserPermissions();
  const hasAny = useHasAnyPermission(permissions);
  const hasAll = useHasAllPermissions(permissions);
  const hasPermission = requireAll ? hasAll : hasAny;
  const firstAccessibleRoute = useFirstAccessibleRoute();

  // Espera TANTO o auth quanto a query de permissões carregarem antes de
  // decidir o redirect. Sem isso, durante o carregamento das permissões o
  // usuário (mesmo tendo acesso) era mandado para /perfil (a rota de fallback).
  if (loading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.user_type === "admin") {
    return <>{children}</>;
  }

  if (!hasPermission) {
    // Redireciona para a primeira rota que o usuário tem acesso
    const target = redirectTo || firstAccessibleRoute;
    // Evita loop infinito
    if (target === location.pathname) {
      return <Navigate to="/perfil" replace />;
    }
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
