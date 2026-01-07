import { useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { MainNav } from "./MainNav";
import { HeaderIcon } from "./HeaderIcon";
import { UserProfile } from "./UserProfile";
import { AlertsDrawer } from "./AlertsDrawer";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { useUnreadAlertsCount } from "@/hooks/useVehicleAlerts";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import logoAlerta from "@/assets/logo-alerta.png";

export function Header() {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const { data: unreadAlertsCount = 0 } = useUnreadAlertsCount();
  const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();

  return (
    <header className="w-full">
      {/* Top bar - Black background */}
      <div className="flex items-center justify-between px-6 py-3 bg-foreground relative">
        <div className="flex items-center gap-2">
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
        <div className="absolute left-1/2 -translate-x-1/2">
          <img src={logoAlerta} alt="Alerta Rastreamento" className="h-8" />
        </div>
        
        <UserProfile />
      </div>
      
      {/* Navigation - White/Light background */}
      <MainNav />

      {/* Drawers */}
      <AlertsDrawer open={alertsOpen} onOpenChange={setAlertsOpen} />
      <NotificationsDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </header>
  );
}