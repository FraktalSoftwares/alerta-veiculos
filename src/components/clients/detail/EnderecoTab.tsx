import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientWithDetails } from "@/types/client";
import { useCreateAddress, useUpdateAddress } from "@/hooks/useClients";
import { formatCEP } from "@/lib/formatters";
import { toast } from "sonner";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface EnderecoTabProps {
  client: ClientWithDetails;
}

export function EnderecoTab({ client }: EnderecoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const address = client.addresses?.[0];

  const formatDisplayCEP = (cep: string | null) => {
    if (!cep) return "";
    return formatCEP(cep);
  };

  const [formData, setFormData] = useState({
    zip_code: formatCEP(address?.zip_code || ""),
    city: address?.city || "",
    neighborhood: address?.neighborhood || "",
    street: address?.street || "",
    number: address?.number || "",
    complement: address?.complement || "",
    state: address?.state || "",
    is_primary: true,
  });

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        complement: data.complemento || prev.complement,
      }));
      toast.success("Endereço encontrado!");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setFormData({ ...formData, zip_code: formatted });

    if (formatted.replace(/\D/g, "").length === 8) {
      searchCep(formatted);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    const cepDigits = formData.zip_code.replace(/\D/g, "");
    if (cepDigits.length !== 8) newErrors.zip_code = true;
    if (!formData.city.trim()) newErrors.city = true;
    if (!formData.state) newErrors.state = true;
    if (!formData.neighborhood.trim()) newErrors.neighborhood = true;
    if (!formData.street.trim()) newErrors.street = true;
    if (!formData.number.trim()) newErrors.number = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios do endereço");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (address) {
        await updateAddress.mutateAsync({
          id: address.id,
          clientId: client.id,
          data: formData,
        });
      } else {
        await createAddress.mutateAsync({
          clientId: client.id,
          data: formData,
        });
      }
      setErrors({});
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setFormData({
      zip_code: formatCEP(address?.zip_code || ""),
      city: address?.city || "",
      neighborhood: address?.neighborhood || "",
      street: address?.street || "",
      number: address?.number || "",
      complement: address?.complement || "",
      state: address?.state || "",
      is_primary: true,
    });
    setErrors({});
    setIsEditing(false);
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Endereço</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            CEP<span className="text-destructive">*</span>
          </Label>
          {isEditing ? (
            <div>
              <div className="flex gap-2">
                <Input
                  value={formData.zip_code}
                  onChange={(e) => { handleCepChange(e.target.value); setErrors((prev) => ({ ...prev, zip_code: false })); }}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.zip_code ? "border-destructive ring-destructive/30 ring-2" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => searchCep(formData.zip_code)}
                  disabled={isLoadingCep || formData.zip_code.replace(/\D/g, "").length !== 8}
                >
                  {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {errors.zip_code && <p className="text-xs text-destructive mt-1">CEP inválido (8 dígitos)</p>}
            </div>
          ) : (
            <Input
              value={formatDisplayCEP(address?.zip_code)}
              readOnly
              className="bg-muted/50 border-border"
              placeholder="Não informado"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Cidade<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.city}
            onChange={(e) => { setFormData({ ...formData, city: e.target.value }); setErrors((prev) => ({ ...prev, city: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50 border-border" : ""} ${errors.city ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder={isEditing ? "Nome da cidade" : "Não informado"}
          />
          {errors.city && <p className="text-xs text-destructive">Cidade é obrigatória</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Estado<span className="text-destructive">*</span>
          </Label>
          {isEditing ? (
            <Select 
              value={formData.state} 
              onValueChange={(value) => { setFormData({ ...formData, state: value }); setErrors((prev) => ({ ...prev, state: false })); }}
            >
              <SelectTrigger className={errors.state ? "border-destructive ring-destructive/30 ring-2" : ""}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre</SelectItem>
                <SelectItem value="AL">Alagoas</SelectItem>
                <SelectItem value="AP">Amapá</SelectItem>
                <SelectItem value="AM">Amazonas</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="CE">Ceará</SelectItem>
                <SelectItem value="DF">Distrito Federal</SelectItem>
                <SelectItem value="ES">Espírito Santo</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MA">Maranhão</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="PA">Pará</SelectItem>
                <SelectItem value="PB">Paraíba</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="PE">Pernambuco</SelectItem>
                <SelectItem value="PI">Piauí</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="RO">Rondônia</SelectItem>
                <SelectItem value="RR">Roraima</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="SE">Sergipe</SelectItem>
                <SelectItem value="TO">Tocantins</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input 
              value={address?.state || ""}
              readOnly
              className="bg-muted/50 border-border"
              placeholder="Não informado"
            />
          )}
          {errors.state && <p className="text-xs text-destructive">Estado é obrigatório</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Bairro<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.neighborhood}
            onChange={(e) => { setFormData({ ...formData, neighborhood: e.target.value }); setErrors((prev) => ({ ...prev, neighborhood: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50 border-border" : ""} ${errors.neighborhood ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder={isEditing ? "Nome do bairro" : "Não informado"}
          />
          {errors.neighborhood && <p className="text-xs text-destructive">Bairro é obrigatório</p>}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-muted-foreground">
            Logradouro<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.street}
            onChange={(e) => { setFormData({ ...formData, street: e.target.value }); setErrors((prev) => ({ ...prev, street: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50 border-border" : ""} ${errors.street ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder={isEditing ? "Rua, Avenida, etc" : "Não informado"}
          />
          {errors.street && <p className="text-xs text-destructive">Logradouro é obrigatório</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Número<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.number}
            onChange={(e) => { setFormData({ ...formData, number: e.target.value }); setErrors((prev) => ({ ...prev, number: false })); }}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50 border-border" : ""} ${errors.number ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder={isEditing ? "Número" : "Não informado"}
          />
          {errors.number && <p className="text-xs text-destructive">Número é obrigatório</p>}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-muted-foreground">Complemento</Label>
          <Input 
            value={formData.complement}
            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "Apto, Sala, etc" : "Não informado"}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-2">
        {isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              className="bg-foreground hover:bg-foreground/90 text-background gap-2"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </>
        ) : (
          <Button 
            className="bg-foreground hover:bg-foreground/90 text-background gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
