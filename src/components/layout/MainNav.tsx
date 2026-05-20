import { Home, Users, Car, Bell, TrendingUp, Store, Package, Settings, LucideIcon } from "lucide-react";
import { NavItem } from "./NavItem";
import { useHasAnyPermission, useUserPermissions, PERMISSIONS } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface NavItemConfig {
  to: string;
  icon: LucideIcon;
  label: string;
  permissions?: string[];
  allowedUserTypes?: string[];
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
    subItems: [
      { to: "/loja", label: "Produtos", permissions: [PERMISSIONS.STORE_VIEW] },
      { to: "/meus-pedidos", label: "Meus Pedidos", permissions: [PERMISSIONS.STORE_VIEW] },
    ],
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
    allowedUserTypes: ["admin"],
    subItems: [
      { to: "/configuracoes", label: "Funções Administrativas", permissions: [PERMISSIONS.SETTINGS_ROLES] },
      { to: "/configuracoes/usuarios", label: "Usuários", permissions: [PERMISSIONS.SETTINGS_USERS] },
    ]
  },
];

function NavItemWithPermission({
  item,
  variant = "horizontal",
  onClose
}: {
  item: NavItemConfig;
  variant?: "horizontal" | "vertical";
  onClose?: () => void;
}) {
  const { profile } = useAuth();
  const { data: userPerms } = useUserPermissions();
  const hasPermission = useHasAnyPermission(item.permissions || []);
  const isAdmin = profile?.user_type === "admin";

  // Restrict by user type if specified
  if (item.allowedUserTypes && item.allowedUserTypes.length > 0) {
    if (!profile?.user_type || !item.allowedUserTypes.includes(profile.user_type)) {
      return null;
    }
  }

  if (!item.permissions || item.permissions.length === 0) {
    return <NavItem {...item} variant={variant} onClose={onClose} />;
  }

  if (isAdmin || hasPermission) {
    const filteredSubItems = item.subItems?.filter((subItem) => {
      if (!subItem.permissions || subItem.permissions.length === 0) return true;
      if (isAdmin) return true;
      return subItem.permissions.some((p) => userPerms?.permissionCodes.has(p));
    });

    return <NavItem {...item} subItems={filteredSubItems} variant={variant} onClose={onClose} />;
  }

  return null;
}

export function MainNav() {
  return (
    <nav className="hidden md:flex items-center justify-center gap-2 border-b-2 border-border bg-background px-4 sm:px-6 h-[60px]">
      {navItems.map((item) => (
        <NavItemWithPermission key={item.to} item={item} />
      ))}
    </nav>
  );
}

interface MainNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MainNavSheet({ open, onOpenChange }: MainNavSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full max-w-[280px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navItems.map((item) => (
            <NavItemWithPermission
              key={item.to}
              item={item}
              variant="vertical"
              onClose={() => onOpenChange(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
