import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ClientWithDetails } from "@/types/client";
import { useUpsertBillingSettings } from "@/hooks/useClients";
import { toast } from "sonner";

interface CobrancaTabProps {
  client: ClientWithDetails;
}

export function CobrancaTab({ client }: CobrancaTabProps) {
  const billing = client.billing_settings;
  const upsertBilling = useUpsertBillingSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    payment_method: billing?.payment_method || "pix",
    billing_day: billing?.billing_day ?? 10,
    auto_billing: billing?.auto_billing ?? false,
    notes: billing?.notes || "",
  });

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    const day = Number(formData.billing_day);
    if (!day || day < 1 || day > 31) newErrors.billing_day = true;
    if (!formData.payment_method) newErrors.payment_method = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Preencha os campos obrigatórios corretamente");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await upsertBilling.mutateAsync({
        clientId: client.id,
        data: {
          payment_method: formData.payment_method,
          billing_day: Number(formData.billing_day),
          auto_billing: formData.auto_billing,
          notes: formData.notes,
        },
      });
      setErrors({});
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setFormData({
      payment_method: billing?.payment_method || "pix",
      billing_day: billing?.billing_day ?? 10,
      auto_billing: billing?.auto_billing ?? false,
      notes: billing?.notes || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleBillingDayChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const num = digits ? Math.min(Number(digits), 31) : "";
    setFormData({ ...formData, billing_day: num as number });
    setErrors((prev) => ({ ...prev, billing_day: false }));
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Cobrança</h2>

      <div className="mb-6">
        <Label className="text-foreground font-medium mb-3 block">
          Forma de pagamento<span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={formData.payment_method}
          onValueChange={(v) => {
            setFormData({ ...formData, payment_method: v });
            setErrors((prev) => ({ ...prev, payment_method: false }));
          }}
          className="space-y-3"
          disabled={!isEditing}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pix" id="cobranca-pix" />
            <Label htmlFor="cobranca-pix" className="text-foreground">Pix</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cartao" id="cobranca-cartao" />
            <Label htmlFor="cobranca-cartao" className="text-foreground">Cartão de crédito</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boleto" id="cobranca-boleto" />
            <Label htmlFor="cobranca-boleto" className="text-foreground">Boleto</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="transferencia" id="cobranca-transferencia" />
            <Label htmlFor="cobranca-transferencia" className="text-foreground">Transferência Bancária</Label>
          </div>
        </RadioGroup>
        {errors.payment_method && (
          <p className="text-xs text-destructive mt-1">Selecione uma forma de pagamento</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            Dia do Vencimento da Fatura<span className="text-destructive">*</span>
          </Label>
          <Input
            value={String(formData.billing_day)}
            onChange={(e) => handleBillingDayChange(e.target.value)}
            readOnly={!isEditing}
            className={`${!isEditing ? "bg-muted/50 border-border" : ""} ${errors.billing_day ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            placeholder="1 a 31"
            maxLength={2}
          />
          {errors.billing_day && (
            <p className="text-xs text-destructive">Informe um dia válido (1 a 31)</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Switch
          id="cobranca-auto"
          checked={formData.auto_billing}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, auto_billing: checked })
          }
          disabled={!isEditing}
        />
        <Label htmlFor="cobranca-auto" className="text-foreground font-medium">
          Cobrança automática
        </Label>
      </div>

      <div className="space-y-2 mb-6">
        <Label className="text-muted-foreground">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          readOnly={!isEditing}
          className={!isEditing ? "bg-muted/50 border-border resize-none" : "resize-none"}
          placeholder={isEditing ? "Observações sobre cobrança..." : "Nenhuma observação"}
          rows={3}
        />
      </div>

      <div className="flex justify-end mt-6 gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={upsertBilling.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              className="bg-foreground hover:bg-foreground/90 text-background"
              onClick={handleSave}
              disabled={upsertBilling.isPending}
            >
              {upsertBilling.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            className="bg-foreground hover:bg-foreground/90 text-background"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
