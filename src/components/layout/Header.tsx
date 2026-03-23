import { useState } from "react";
import { Bell, AlertTriangle, Menu } from "lucide-react";
import { MainNav, MainNavSheet } from "./MainNav";
import { HeaderIcon } from "./HeaderIcon";
import { UserProfile } from "./UserProfile";
import { AlertsDrawer } from "./AlertsDrawer";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { useUnreadAlertsCount } from "@/hooks/useVehicleAlerts";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { useClientCustomization } from "@/contexts/ClientCustomizationContext";

export function Header() {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const { data: unreadAlertsCount = 0 } = useUnreadAlertsCount();
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();
  const { customization } = useClientCustomization();

  return (
    <header className="w-full sticky top-0 z-40 bg-background">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 bg-foreground relative"
        style={customization?.primary_color ? { backgroundColor: customization.primary_color } : undefined}
      >
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 shrink-0 text-background hover:bg-background/20"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <HeaderIcon
            icon={Bell}
            notification={unreadNotificationsCount > 0 ? { count: unreadNotificationsCount, variant: "danger" } : undefined}
            onClick={() => setNotificationsOpen(true)}
          />
          <HeaderIcon
            icon={AlertTriangle}
            notification={unreadAlertsCount > 0 ? { count: unreadAlertsCount, variant: "danger" } : undefined}
            onClick={() => setAlertsOpen(true)}
          />
        </div>
        
        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
          <img
            src={customization?.logo_url || "/logo_alerta.png"}
            alt="Alerta Rastreamento"
            className="h-7 sm:h-8 max-w-[140px] object-contain"
          />
        </div>
        
        <UserProfile />
      </div>
      
      {/* Navigation - White/Light background (oculta em mobile) */}
      <MainNav />

      <MainNavSheet open={navOpen} onOpenChange={setNavOpen} />

      {/* Drawers */}
      <AlertsDrawer open={alertsOpen} onOpenChange={setAlertsOpen} />
      <NotificationsDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </header>
  );
}