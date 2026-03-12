import { useState, useEffect } from "react";
import { Check, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserType, NotificationTemplateDisplay } from "@/types/notification";

export interface NotificationFormSubmitData {
  title: string;
  message: string;
  targetType: 'all' | 'user_type';
  targetUserType: UserType;
  saveAsTemplate: boolean;
  scheduleEnabled: boolean;
  scheduleDate: string;
  scheduleTime: string;
}

interface NotificationFormProps {
  onTemplateClick: () => void;
  onSubmit: (data: NotificationFormSubmitData) => void;
  templateData?: NotificationTemplateDisplay | null;
  isPending?: boolean;
  resetKey?: number;
}

export function NotificationForm({
  onTemplateClick,
  onSubmit,
  templateData,
  isPending = false,
  resetKey = 0,
}: NotificationFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<'all' | 'user_type'>('all');
  const [targetUserType, setTargetUserType] = useState<UserType>('motorista');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    if (resetKey > 0) {
      setTitle("");
      setMessage("");
      setTargetType('all');
      setTargetUserType('motorista');
      setScheduleEnabled(false);
      setScheduleDate("");
      setScheduleTime("");
      setSaveAsTemplate(false);
    }
  }, [resetKey]);

  useEffect(() => {
    if (templateData) {
      setTitle(templateData.title);
      setMessage(templateData.message);
      if (templateData.targetType === 'all' || templateData.targetType === 'user_type') {
        setTargetType(templateData.targetType);
      }
      if (templateData.targetUserType) {
        setTargetUserType(templateData.targetUserType);
      }
    }
  }, [templateData]);

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) return;

    if (scheduleEnabled) {
      if (!scheduleDate || !scheduleTime) {
        return;
      }
      // Validar que a data/hora agendada é no futuro
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        return;
      }
    }

    onSubmit({
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetUserType,
      saveAsTemplate,
      scheduleEnabled,
      scheduleDate,
      scheduleTime,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <button
        onClick={onTemplateClick}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <Bookmark className="h-4 w-4" />
        Escolher Um Modelo
      </button>

      <div className="space-y-2">
        <Label htmlFor="notif-title">Título *</Label>
        <Input
          id="notif-title"
          placeholder="Dê um título para a notificação"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notif-message">Mensagem *</Label>
        <Textarea
          id="notif-message"
          placeholder="Digite a mensagem que será enviada"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-background border-border min-h-[100px] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Enviar para</Label>
          <Select value={targetType} onValueChange={(v) => setTargetType(v as 'all' | 'user_type')}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="user_type">Por tipo de usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetType === 'user_type' && (
          <div className="space-y-2">
            <Label>Tipo de usuário</Label>
            <Select value={targetUserType} onValueChange={(v) => setTargetUserType(v as UserType)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="associacao">Associações</SelectItem>
                <SelectItem value="franqueado">Franqueados</SelectItem>
                <SelectItem value="frotista">Frotistas</SelectItem>
                <SelectItem value="motorista">Motoristas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch
            id="schedule-toggle"
            checked={scheduleEnabled}
            onCheckedChange={setScheduleEnabled}
          />
          <Label htmlFor="schedule-toggle" className="cursor-pointer">
            Agendar envio
          </Label>
        </div>

        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Data do envio *</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className={`bg-background border-border ${scheduleEnabled && !scheduleDate ? 'border-destructive' : ''}`}
                required
              />
              {scheduleEnabled && !scheduleDate && (
                <p className="text-xs text-destructive">Informe a data do envio</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Hora do envio *</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className={`bg-background border-border ${scheduleEnabled && !scheduleTime ? 'border-destructive' : ''}`}
                required
              />
              {scheduleEnabled && !scheduleTime && (
                <p className="text-xs text-destructive">Informe a hora do envio</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="save-template"
          checked={saveAsTemplate}
          onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
        />
        <Label htmlFor="save-template" className="cursor-pointer text-sm">
          Salvar mensagem como modelo
        </Label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending || !title.trim() || !message.trim() || (scheduleEnabled && (!scheduleDate || !scheduleTime))}
        className="w-full bg-foreground text-background hover:bg-foreground/90 gap-2"
      >
        {isPending ? 'Enviando...' : 'Enviar notificação'}
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
