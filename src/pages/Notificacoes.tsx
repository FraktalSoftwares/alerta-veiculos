import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { NotificationForm } from "@/components/notifications/NotificationForm";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useSentNotifications, useDeleteNotification } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";

const Notificacoes = () => {
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: notifications, isLoading } = useSentNotifications();
  const deleteNotification = useDeleteNotification();

  const handleTemplateClick = () => {
    toast({
      title: "Modelos",
      description: "Funcionalidade de modelos será implementada em breve.",
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteNotification.mutate(id, {
      onSettled: () => {
        setDeletingId(null);
      }
    });
  };

  const filteredNotifications = (notifications || []).filter((n) =>
    n.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    n.message.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-6">Notificações</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NotificationForm onTemplateClick={handleTemplateClick} />
          <NotificationList
            notifications={filteredNotifications}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onDelete={handleDelete}
            isLoading={isLoading}
            isDeletingId={deletingId}
          />
        </div>
      </main>
    </div>
  );
};

export default Notificacoes;
