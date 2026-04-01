import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { NotificationForm, NotificationFormSubmitData } from "@/components/notifications/NotificationForm";
import { NotificationList } from "@/components/notifications/NotificationList";
import { TemplatesModal } from "@/components/notifications/TemplatesModal";
import { SendConfirmationDialog } from "@/components/notifications/SendConfirmationDialog";
import { useSentNotifications, useDeleteNotification, useCreateNotification } from "@/hooks/useNotifications";
import { useCreateNotificationTemplate } from "@/hooks/useNotificationTemplates";
import { NotificationTemplateDisplay } from "@/types/notification";

const TARGET_LABELS: Record<string, string> = {
  admin: 'Administradores',
  associacao: 'Associações',
  associado: 'Associados',
  franquia: 'Franquias',
  franqueado: 'Franqueados',
  frotista: 'Frotistas',
  motorista: 'Motoristas',
};

const Notificacoes = () => {
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<NotificationFormSubmitData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateDisplay | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const { data: notifications, isLoading } = useSentNotifications();
  const deleteNotification = useDeleteNotification();
  const createNotification = useCreateNotification();
  const createTemplate = useCreateNotificationTemplate();

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteNotification.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const handleFormSubmit = useCallback((data: NotificationFormSubmitData) => {
    setPendingData(data);
    setConfirmOpen(true);
  }, []);

  const handleConfirmSend = useCallback(() => {
    if (!pendingData) return;

    if (pendingData.saveAsTemplate) {
      createTemplate.mutate({
        title: pendingData.title,
        message: pendingData.message,
        target_type: pendingData.targetType,
        target_user_type: pendingData.targetType === 'user_type' ? pendingData.targetUserType : undefined,
        notification_type: 'general',
      });
    }

    // Montar scheduled_at se agendamento estiver habilitado
    const scheduledAt = pendingData.scheduleEnabled && pendingData.scheduleDate && pendingData.scheduleTime
      ? new Date(`${pendingData.scheduleDate}T${pendingData.scheduleTime}`).toISOString()
      : undefined;

    createNotification.mutate(
      {
        title: pendingData.title,
        message: pendingData.message,
        target_type: pendingData.targetType,
        target_user_type: pendingData.targetType === 'user_type' ? pendingData.targetUserType : undefined,
        notification_type: 'general',
        scheduled_at: scheduledAt,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setPendingData(null);
          setSelectedTemplate(null);
          setFormResetKey((k) => k + 1);
        },
        onError: () => {
          setConfirmOpen(false);
        },
      }
    );
  }, [pendingData, createNotification, createTemplate]);

  const getConfirmTargetLabel = (): string => {
    if (!pendingData) return '';
    if (pendingData.targetType === 'all') return 'todos os usuários';
    return TARGET_LABELS[pendingData.targetUserType] || pendingData.targetUserType;
  };

  const filteredNotifications = (notifications || []).filter((n) => {
    const search = searchValue.toLowerCase();
    return (
      n.title.toLowerCase().includes(search) ||
      n.message.toLowerCase().includes(search) ||
      n.target.toLowerCase().includes(search) ||
      n.date.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-6">Notificações</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NotificationForm
            onTemplateClick={() => setTemplatesOpen(true)}
            onSubmit={handleFormSubmit}
            templateData={selectedTemplate}
            isPending={createNotification.isPending}
            resetKey={formResetKey}
          />
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

      <TemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectTemplate={setSelectedTemplate}
      />

      <SendConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSend}
        targetLabel={getConfirmTargetLabel()}
        isPending={createNotification.isPending}
      />
    </div>
  );
};

export default Notificacoes;
