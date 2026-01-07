import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useVehicleAlerts,
  useMarkAlertAsRead,
  VehicleAlert,
} from "@/hooks/useVehicleAlerts";

interface AlertsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AlertItem({
  alert,
  onMarkAsRead,
}: {
  alert: VehicleAlert;
  onMarkAsRead: (id: string) => void;
}) {
  const formattedDate = format(
    new Date(alert.createdAt),
    "dd/MM/yyyy 'às' HH:mm:ss",
    { locale: ptBR }
  );

  const handleClick = () => {
    if (!alert.isRead) {
      onMarkAsRead(alert.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
        !alert.isRead ? "bg-primary/5" : ""
      }`}
    >
      <div>
        <Badge variant="outline" className="font-medium mb-1">
          {alert.plate}
        </Badge>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        <span
          className={`w-2 h-2 rounded-full mr-2 ${
            !alert.isRead ? "bg-primary" : "bg-muted-foreground"
          }`}
        />
        {alert.alertType}
      </Badge>
    </div>
  );
}

export function AlertsDrawer({ open, onOpenChange }: AlertsDrawerProps) {
  const [activeTab, setActiveTab] = useState("all");
  const { data: alerts = [], isLoading } = useVehicleAlerts();
  const markAsRead = useMarkAlertAsRead();

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "unread") return !alert.isRead;
    if (activeTab === "read") return alert.isRead;
    return true;
  });

  const handleMarkAsRead = (alertId: string) => {
    markAsRead.mutate(alertId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-center text-lg font-semibold">
            Alertas
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 px-6">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Todos os alertas
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Não lidos
            </TabsTrigger>
            <TabsTrigger
              value="read"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Lidos
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum alerta encontrado
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredAlerts.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
