import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { ClientBadge } from "../ClientBadge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientWithDetails } from "@/types/client";
import { useUpdateClient } from "@/hooks/useClients";

interface DadosBasicosTabProps {
  client: ClientWithDetails;
}

export function DadosBasicosTab({ client }: DadosBasicosTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateClient = useUpdateClient();

  const [formData, setFormData] = useState({
    name: client.name,
    birth_date: client.birth_date || "",
    document_type: (client.document_type || "cpf") as "cpf" | "cnpj",
    document_number: client.document_number || "",
    phone: client.phone || "",
    client_type: client.client_type as "associacao" | "franqueado" | "frotista" | "motorista",
    status: (client.status || "active") as "active" | "inactive" | "blocked",
  });

  const handleSave = async () => {
    await updateClient.mutateAsync({ id: client.id, data: formData });
    setIsEditing(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try { return new Date(date).toLocaleDateString('pt-BR'); } catch { return date; }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Dados do Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 mb-6">
        <div className="space-y-2">
          <Label>Nome Completo<span className="text-destructive">*</span></Label>
          <Input value={isEditing ? formData.name : client.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Nascimento</Label>
          {isEditing ? <Input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} /> : <Input value={formatDate(client.birth_date)} readOnly className="bg-muted/50" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label>Tipo do Documento</Label>
          <Select value={formData.document_type} onValueChange={(v: "cpf" | "cnpj") => setFormData({ ...formData, document_type: v })} disabled={!isEditing}>
            <SelectTrigger className={!isEditing ? "bg-muted/50" : ""}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="cpf">CPF</SelectItem><SelectItem value="cnpj">CNPJ</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Documento</Label>
          <Input value={isEditing ? formData.document_number : (client.document_number || "")} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={isEditing ? formData.phone : (client.phone || "")} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} readOnly={!isEditing} className={!isEditing ? "bg-muted/50" : ""} />
        </div>
      </div>

      <div className="mb-6">
        <Label className="font-semibold mb-2 block">Situação:</Label>
        <ClientBadge variant={client.status === 'active' ? "active" : "inactive"}>{client.status === 'active' ? 'ATIVO' : 'INATIVO'}</ClientBadge>
      </div>

      <div className="mb-6">
        <Label className="font-semibold mb-3 block">Tipo de usuário</Label>
        <RadioGroup value={formData.client_type} onValueChange={(v: any) => setFormData({ ...formData, client_type: v })} className="flex gap-6" disabled={!isEditing}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="associacao" id="associacao" /><Label htmlFor="associacao">Associação</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="franqueado" id="franqueado" /><Label htmlFor="franqueado">Franqueado</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="frotista" id="frotista" /><Label htmlFor="frotista">Frotista</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="motorista" id="motorista" /><Label htmlFor="motorista">Motorista</Label></div>
        </RadioGroup>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updateClient.isPending}><X className="h-4 w-4 mr-2" />Cancelar</Button>
            <Button className="bg-foreground hover:bg-foreground/90 text-background" onClick={handleSave} disabled={updateClient.isPending}>
              {updateClient.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Salvar</>}
            </Button>
          </>
        ) : (
          <Button className="bg-foreground hover:bg-foreground/90 text-background" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4 mr-2" />Editar</Button>
        )}
      </div>
    </div>
  );
}
