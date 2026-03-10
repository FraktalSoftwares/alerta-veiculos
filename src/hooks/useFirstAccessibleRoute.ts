import { useUserPermissions, PERMISSIONS } from "@/hooks/useUserPermissions";

const ROUTES_BY_PERMISSION = [
  { path: "/", permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: "/veiculos", permission: PERMISSIONS.VEHICLES_VIEW },
  { path: "/veiculos/mapa", permission: PERMISSIONS.VEHICLES_TRACK },
  { path: "/clientes", permission: PERMISSIONS.CLIENTS_VIEW },
  { path: "/notificacoes", permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { path: "/financeiro", permission: PERMISSIONS.FINANCE_VIEW },
  { path: "/loja", permission: PERMISSIONS.STORE_VIEW },
  { path: "/estoque", permission: PERMISSIONS.STOCK_VIEW },
];

export function useFirstAccessibleRoute(): string {
  const { data } = useUserPermissions();
  const permissionCodes = data?.permissionCodes;

  if (!permissionCodes || permissionCodes.size === 0) {
    return "/perfil";
  }

  for (const route of ROUTES_BY_PERMISSION) {
    if (permissionCodes.has(route.permission)) {
      return route.path;
    }
  }

  return "/perfil";
}
