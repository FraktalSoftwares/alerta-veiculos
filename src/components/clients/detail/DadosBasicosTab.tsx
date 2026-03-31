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
import { formatCPF, formatCNPJ, formatPhone, formatDateBR, parseDateBR } from "@/lib/formatters";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAllowedUserTypesToCreate } from "@/lib/userTypeHierarchy";

interface DadosBasicosTabProps {
  client: ClientWithDetails;
}

export function DadosBasicosTab({ client }: DadosBasicosTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const updateClient = useUpdateClient();
  const { profile } = useAuth();
  const allowedUserTypes = getAllowedUserTypesToCreate(profile?.user_type);

  const [formData, setFormData] = useState(() => {
    const docType = (client.document_type || "cpf") as "cpf" | "cnpj";
    const rawDoc = client.document_number || "";
    const rawPhone = client.phone || "";
    return {
      name: client.name,
      birth_date: client.birth_date || "",
      document_type: docType,
      document_number: docType === "cnpj" ? formatCNPJ(rawDoc) : formatCPF(rawDoc),
      phone: formatPhone(rawPhone),
      client_type: client.client_type as "associacao" | "associado" | "franqueado" | "frotista" | "motorista",
      status: (client.status || "active") as "active" | "inactive" | "blocked",
    };
  });

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;

    const docDigits = formData.document_number.replace(/\D/g, "");
    const requiredDocLen = formData.document_type === "cpf" ? 11 : 14;
    if (docDigits.length !== requiredDocLen) newErrors.document_number = true;

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) newErrors.phone = true;

    const birthDateRaw = formData.birth_date.replace(/\D/g, "");
    if (birthDateRaw.length !== 8) newErrors.birth_date = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios corretamente");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const dataToSave = { ...formData };
    if (formData.birth_date && !formData.birth_date.includes("-")) {
      const parsed = parseDateBR(formData.birth_date);
      if (parsed) dataToSave.birth_date = parsed;
    }
    await updateClient.mutateAsync({ id: client.id, data: dataToSave });
    setErrors({});
    setIsEditing(false);
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formData.document_type === "cpf"
      ? formatCPF(value)
      : formatCNPJ(value);
    setFormData({ ...formData, document_number: formatted });
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleBirthDateChange = (value: string) => {
    const formatted = formatDateBR(value);
    setFormData({ ...formData, birth_date: formatted });
  };

  const formatDisplayDocument = (docNumber: string | null, docType: string | null) => {
    if (!docNumber) return "";
    const digits = docNumber.replace(/\D/g, "");
    if (docType === "cnpj" || digits.length > 11) return formatCNPJ(digits);
    return formatCPF(digits);
  };

  const formatDisplayPhone = (phone: string | null) => {
    if (!phone) return "";
    return formatPhone(phone);
  };

  const formatDisplayDate = (date: string | null) => {
    if (!date) return "";
    try {
      if (date.includes("-")) {
        const d = new Date(date + "T00:00:00");
        return d.toLocaleDateString("pt-BR");
      }
      return date;
    } catch { return date; }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Dados do Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 mb-6">
        <div className="space-y-2">
          <Label>Nome Completo<span className="text-destructive">*</span></Label>
          <Input
            value={isEditing ? formData.name : client.name}
            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors((prev) => ({ ...prev, name: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50" : ""} ${errors.name ? "border-destructive ring-destructive/30 ring-2" : ""}`}
          />
          {errors.name && <p className="text-xs text-destructive">Nome é obrigatório</p>}
        </div>
        <div className="space-y-2">
          <Label>Nascimento<span className="text-destructive">*</span></Label>
          {isEditing ? (
            <Input
              value={formData.birth_date.includes("-") ? formatDisplayDate(formData.birth_date) : formData.birth_date}
              onChange={(e) => { handleBirthDateChange(e.target.value); setErrors((prev) => ({ ...prev, birth_date: false })); }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className={errors.birth_date ? "border-destructive ring-destructive/30 ring-2" : ""}
            />
          ) : (
            <Input value={formatDisplayDate(client.birth_date)} readOnly className="bg-muted/50" />
          )}
          {errors.birth_date && <p className="text-xs text-destructive">Data de nascimento é obrigatória (DD/MM/AAAA)</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label>Tipo do Documento</Label>
          <Select value={formData.document_type} onValueChange={(v: "cpf" | "cnpj") => setFormData({ ...formData, document_type: v, document_number: "" })} disabled={!isEditing}>
            <SelectTrigger className={!isEditing ? "bg-muted/50" : ""}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="cpf">CPF</SelectItem><SelectItem value="cnpj">CNPJ</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Documento<span className="text-destructive">*</span></Label>
          <Input
            value={isEditing ? formData.document_number : formatDisplayDocument(client.document_number, client.document_type)}
            onChange={(e) => { handleDocumentChange(e.target.value); setErrors((prev) => ({ ...prev, document_number: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50" : ""} ${errors.document_number ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder={formData.document_type === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            maxLength={formData.document_type === "cpf" ? 14 : 18}
          />
          {errors.document_number && <p className="text-xs text-destructive">{formData.document_type === "cpf" ? "CPF inválido (11 dígitos)" : "CNPJ inválido (14 dígitos)"}</p>}
        </div>
        <div className="space-y-2">
          <Label>Telefone<span className="text-destructive">*</span></Label>
          <Input
            value={isEditing ? formData.phone : formatDisplayPhone(client.phone)}
            onChange={(e) => { handlePhoneChange(e.target.value); setErrors((prev) => ({ ...prev, phone: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50" : ""} ${errors.phone ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {errors.phone && <p className="text-xs text-destructive">Telefone inválido (mín. 10 dígitos)</p>}
        </div>
      </div>

      <div className="mb-6">
        <Label className="font-semibold mb-2 block">Situação:</Label>
        <ClientBadge variant={client.status === 'active' ? "active" : "inactive"}>{client.status === 'active' ? 'ATIVO' : 'INATIVO'}</ClientBadge>
      </div>

      <div className="mb-6">
        <Label className="font-semibold mb-3 block">Tipo de usuário</Label>
        <RadioGroup value={formData.client_type} onValueChange={(v: any) => setFormData({ ...formData, client_type: v })} className="flex gap-6" disabled={!isEditing}>
          {allowedUserTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem value={type.value} id={type.value} />
              <Label htmlFor={type.value}>{type.label}</Label>
            </div>
          ))}
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
