import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateButton } from "./TemplateButton";
import { useCreateNotification } from "@/hooks/useNotifications";
import { UserType } from "@/types/notification";

interface NotificationFormProps {
  onTemplateClick: () => void;
}

export function NotificationForm({ onTemplateClick }: NotificationFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<'all' | 'user_type'>('all');
  const [targetUserType, setTargetUserType] = useState<UserType>('motorista');

  const createNotification = useCreateNotification();

  const handleSubmit = () => {
    if (!title || !message) {
      return;
    }

    createNotification.mutate({
      title,
      message,
      target_type: targetType,
      target_user_type: targetType === 'user_type' ? targetUserType : undefined,
      notification_type: 'general',
    }, {
      onSuccess: () => {
        setTitle("");
        setMessage("");
        setTargetType('all');
      }
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <TemplateButton onClick={onTemplateClick} />

      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Dê um título para a notificação"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-background border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem *</Label>
        <Textarea
          id="message"
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

      <Button 
        onClick={handleSubmit} 
        disabled={createNotification.isPending || !title || !message}
        className="w-full bg-foreground text-background hover:bg-foreground/90 gap-2"
      >
        {createNotification.isPending ? 'Enviando...' : 'Enviar notificação'}
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

export interface NotificationFormData {
  title: string;
  message: string;
  target: string;
  status: string;
  expiresIn: string;
  scheduleEnabled: boolean;
  scheduleDate: string;
  scheduleTime: string;
  saveAsTemplate: boolean;
}
