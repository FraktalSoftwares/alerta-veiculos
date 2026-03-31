import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateClient } from "@/hooks/useClients";
import { ClientDisplay } from "@/types/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCPF, formatCNPJ, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { getAllowedUserTypesToCreate } from "@/lib/userTypeHierarchy";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDisplay | null;
}

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const updateClient = useUpdateClient();
  const { profile } = useAuth();
  const allowedUserTypes = getAllowedUserTypesToCreate(profile?.user_type);
  
  const [formData, setFormData] = useState({
    name: "",
    document_type: "cpf" as "cpf" | "cnpj",
    document_number: "",
    phone: "",
    email: "",
    client_type: "frotista" as "associacao" | "associado" | "franqueado" | "frotista" | "motorista",
    status: "active" as "active" | "inactive" | "blocked",
  });

  useEffect(() => {
    if (client) {
      const docType = (client.document_type === "cnpj") ? "cnpj" : "cpf";
      const rawDoc = client.document_number || "";
      const rawPhone = client.phone || "";
      setFormData({
        name: client.name,
        document_type: docType,
        document_number: docType === "cnpj" ? formatCNPJ(rawDoc) : formatCPF(rawDoc),
        phone: formatPhone(rawPhone),
        email: client.email || "",
        client_type: (client.client_type === "associacao" || client.client_type === "associado" || client.client_type === "franqueado" || client.client_type === "frotista" || client.client_type === "motorista")
          ? client.client_type
          : "motorista",
        status: client.status === "ATIVO" ? "active" : client.status === "INATIVO" ? "inactive" : "blocked",
      });
    }
  }, [client]);

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

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;

    const docDigits = formData.document_number.replace(/\D/g, "");
    const requiredDocLen = formData.document_type === "cpf" ? 11 : 14;
    if (docDigits.length !== requiredDocLen) newErrors.document_number = true;

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) newErrors.phone = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios corretamente");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;
    
    if (!validate()) return;

    try {
      await updateClient.mutateAsync({ 
        id: client.id, 
        data: formData 
      });
      setErrors({});
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-name">
                Nome Completo<span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors((prev) => ({ ...prev, name: false })); }}
                placeholder="Nome do cliente"
                className={errors.name ? "border-destructive ring-destructive/30 ring-2" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">Nome é obrigatório</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-document_type">Tipo do Documento</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: "cpf" | "cnpj") => 
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-document_number">
                Documento<span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-document_number"
                value={formData.document_number}
                onChange={(e) => { handleDocumentChange(e.target.value); setErrors((prev) => ({ ...prev, document_number: false })); }}
                placeholder={formData.document_type === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                maxLength={formData.document_type === "cpf" ? 14 : 18}
                className={errors.document_number ? "border-destructive ring-destructive/30 ring-2" : ""}
              />
              {errors.document_number && <p className="text-xs text-destructive">{formData.document_type === "cpf" ? "CPF inválido (11 dígitos)" : "CNPJ inválido (14 dígitos)"}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                Telefone<span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => { handlePhoneChange(e.target.value); setErrors((prev) => ({ ...prev, phone: false })); }}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.phone ? "border-destructive ring-destructive/30 ring-2" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">Telefone inválido (mín. 10 dígitos)</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "blocked") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tipo de Usuário</Label>
            <RadioGroup
              value={formData.client_type}
              onValueChange={(value: any) =>
                setFormData({ ...formData, client_type: value })
              }
              className="flex flex-wrap gap-6"
            >
              {allowedUserTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={`edit-${type.value}`} />
                  <Label htmlFor={`edit-${type.value}`}>{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-foreground hover:bg-foreground/90 text-background"
              disabled={updateClient.isPending}
            >
              {updateClient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
