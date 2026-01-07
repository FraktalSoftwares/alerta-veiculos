import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientWithDetails } from "@/types/client";
import { useCreateAddress, useUpdateAddress } from "@/hooks/useClients";

interface EnderecoTabProps {
  client: ClientWithDetails;
}

export function EnderecoTab({ client }: EnderecoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const address = client.addresses?.[0];

  const [formData, setFormData] = useState({
    zip_code: address?.zip_code || "",
    city: address?.city || "",
    neighborhood: address?.neighborhood || "",
    street: address?.street || "",
    number: address?.number || "",
    complement: address?.complement || "",
    state: address?.state || "",
    is_primary: true,
  });

  const handleSave = async () => {
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
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setFormData({
      zip_code: address?.zip_code || "",
      city: address?.city || "",
      neighborhood: address?.neighborhood || "",
      street: address?.street || "",
      number: address?.number || "",
      complement: address?.complement || "",
      state: address?.state || "",
      is_primary: true,
    });
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
          <Input 
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "00000-000" : "Não informado"}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Cidade<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "Nome da cidade" : "Não informado"}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Estado<span className="text-destructive">*</span>
          </Label>
          {isEditing ? (
            <Select 
              value={formData.state} 
              onValueChange={(value) => setFormData({ ...formData, state: value })}
            >
              <SelectTrigger>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Bairro<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "Nome do bairro" : "Não informado"}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-muted-foreground">
            Logradouro<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "Rua, Avenida, etc" : "Não informado"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Número<span className="text-destructive">*</span>
          </Label>
          <Input 
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted/50 border-border" : ""}
            placeholder={isEditing ? "Número" : "Não informado"}
          />
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
