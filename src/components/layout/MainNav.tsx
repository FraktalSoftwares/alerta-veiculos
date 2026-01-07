import { Home, Users, Car, Bell, TrendingUp, Store, Package, Settings, LucideIcon } from "lucide-react";
import { NavItem } from "./NavItem";
import { useHasAnyPermission, PERMISSIONS } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";

interface NavItemConfig {
  to: string;
  icon: LucideIcon;
  label: string;
  permissions?: string[];
  subItems?: { to: string; label: string; permissions?: string[] }[];
}

const navItems: NavItemConfig[] = [
  { 
    to: "/", 
    icon: Home, 
    label: "Início",
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  { 
    to: "/clientes", 
    icon: Users, 
    label: "Clientes",
    permissions: [PERMISSIONS.CLIENTS_VIEW],
  },
  { 
    to: "/veiculos", 
    icon: Car, 
    label: "Veículos",
    permissions: [PERMISSIONS.VEHICLES_VIEW],
    subItems: [
      { to: "/veiculos", label: "Gestão de veículos", permissions: [PERMISSIONS.VEHICLES_VIEW] },
      { to: "/veiculos/mapa", label: "Gestão de mapa", permissions: [PERMISSIONS.VEHICLES_TRACK] },
    ]
  },
  { 
    to: "/notificacoes", 
    icon: Bell, 
    label: "Notificações",
    permissions: [PERMISSIONS.NOTIFICATIONS_VIEW],
  },
  { 
    to: "/financeiro", 
    icon: TrendingUp, 
    label: "Financeiro",
    permissions: [PERMISSIONS.FINANCE_VIEW],
    subItems: [
      { to: "/financeiro", label: "Receitas", permissions: [PERMISSIONS.FINANCE_REVENUE] },
      { to: "/financeiro/despesas", label: "Despesas", permissions: [PERMISSIONS.FINANCE_EXPENSES] },
    ]
  },
  { 
    to: "/loja", 
    icon: Store, 
    label: "Loja",
    permissions: [PERMISSIONS.STORE_VIEW],
  },
  { 
    to: "/estoque", 
    icon: Package, 
    label: "Estoque",
    permissions: [PERMISSIONS.STOCK_VIEW],
  },
  { 
    to: "/configuracoes", 
    icon: Settings, 
    label: "Configurações",
    permissions: [PERMISSIONS.SETTINGS_VIEW],
    subItems: [
      { to: "/configuracoes", label: "Funções Administrativas", permissions: [PERMISSIONS.SETTINGS_ROLES] },
      { to: "/configuracoes/usuarios", label: "Usuários", permissions: [PERMISSIONS.SETTINGS_USERS] },
    ]
  },
];

function NavItemWithPermission({ item }: { item: NavItemConfig }) {
  const { profile } = useAuth();
  const hasPermission = useHasAnyPermission(item.permissions || []);

  // Admin always sees everything
  const isAdmin = profile?.user_type === "admin";
  
  // If no permissions required, always show
  if (!item.permissions || item.permissions.length === 0) {
    return <NavItem {...item} />;
  }

  // Show item if user is admin or has required permissions
  if (isAdmin || hasPermission) {
    // Filter sub-items based on permissions
    const filteredSubItems = item.subItems?.filter((subItem) => {
      if (!subItem.permissions || subItem.permissions.length === 0) return true;
      if (isAdmin) return true;
      return subItem.permissions.some((p) => hasPermission);
    });

    return <NavItem {...item} subItems={filteredSubItems} />;
  }

  return null;
}

export function MainNav() {
  return (
    <nav className="flex items-center justify-center gap-2 border-b-2 border-border bg-background px-6 h-[60px]">
      {navItems.map((item) => (
        <NavItemWithPermission key={item.to} item={item} />
      ))}
    </nav>
  );
}
