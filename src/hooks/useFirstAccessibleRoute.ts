import { useUserPermissions, PERMISSIONS } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";

// Gestores (topo/agrupadores). Subordinados: associado, franqueado, motorista.
const GESTORES = ["admin", "associacao", "franquia", "frotista"];

// Ordem de preferência da primeira rota acessível.
// `allowedUserTypes` (quando presente) restringe por tipo, alinhado às
// mesmas regras estruturais das rotas em App.tsx / do menu em MainNav.
const ROUTES_BY_PERMISSION: {
  path: string;
  permission: string;
  allowedUserTypes?: string[];
}[] = [
  {
    path: "/",
    permission: PERMISSIONS.DASHBOARD_VIEW,
    // Dashboard não é para motorista.
    allowedUserTypes: ["admin", "associacao", "associado", "franquia", "franqueado", "frotista"],
  },
  { path: "/veiculos", permission: PERMISSIONS.VEHICLES_VIEW },
  { path: "/veiculos/mapa", permission: PERMISSIONS.VEHICLES_TRACK },
  { path: "/clientes", permission: PERMISSIONS.CLIENTS_VIEW },
  { path: "/notificacoes", permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { path: "/financeiro", permission: PERMISSIONS.FINANCE_VIEW, allowedUserTypes: GESTORES },
  { path: "/loja", permission: PERMISSIONS.STORE_VIEW, allowedUserTypes: ["admin", "associacao", "franquia"] },
  { path: "/estoque", permission: PERMISSIONS.STOCK_VIEW, allowedUserTypes: GESTORES },
];

export function useFirstAccessibleRoute(): string {
  const { data } = useUserPermissions();
  const { profile } = useAuth();
  const permissionCodes = data?.permissionCodes;
  const userType = profile?.user_type;

  if (!permissionCodes || permissionCodes.size === 0) {
    return "/perfil";
  }

  for (const route of ROUTES_BY_PERMISSION) {
    if (!permissionCodes.has(route.permission)) continue;
    // Respeita a restrição por tipo (senão redirecionaria para uma rota bloqueada).
    if (route.allowedUserTypes && (!userType || !route.allowedUserTypes.includes(userType))) {
      continue;
    }
    return route.path;
  }

  return "/perfil";
}
