import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Calendar } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CobrancaTabProps {
  client: { id: string; billing_settings?: any };
}

export function CobrancaTab({ client }: CobrancaTabProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Cobrança</h2>
      
      <div className="flex items-center gap-3 mb-6">
        <span className="text-foreground font-medium">Situação atual:</span>
        <span className="bg-destructive/20 text-destructive px-3 py-1 rounded text-sm font-medium">
          EM ATRASO
        </span>
      </div>

      <div className="mb-6">
        <Label className="text-foreground font-medium mb-3 block">Selecione a forma de pagamento</Label>
        <RadioGroup defaultValue="pix" className="space-y-3" disabled>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix" className="text-foreground">Pix</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cartao" id="cartao" />
            <Label htmlFor="cartao" className="text-foreground">Cartão de crédito</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boleto" id="boleto" />
            <Label htmlFor="boleto" className="text-foreground">Boleto</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="transferencia" id="transferencia" />
            <Label htmlFor="transferencia" className="text-foreground">Transferência Bancária</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Data do contrato</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value="12/02/21" 
              readOnly 
              className="bg-muted/50 border-border pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Dia do Vencimento da Fatura</Label>
          <Input 
            value="10" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Valor Mensalidade</Label>
          <Input 
            value="R$ 129,90" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Parcelas</Label>
          <Input 
            value="10" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Duração do contrato (meses)</Label>
          <Input 
            value="12" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Situação do contrato</Label>
          <Select defaultValue="" disabled>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Taxa de Adesão</Label>
          <Input 
            value="R$ 123,45" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Taxa de Instalação</Label>
          <Input 
            value="R$ 123,45" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Valor do(s) equipamento(s)</Label>
          <Input 
            value="R$ 123,45" 
            readOnly 
            className="bg-muted/50 border-border"
          />
        </div>
      </div>

      <div className="mb-6">
        <Label className="text-foreground font-medium mb-3 block">Enviar alertas de vencimento:</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="sms" defaultChecked disabled />
            <Label htmlFor="sms" className="text-foreground">SMS</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="email" defaultChecked disabled />
            <Label htmlFor="email" className="text-foreground">E-mail</Label>
          </div>
        </div>
      </div>

      <Button variant="secondary" className="bg-muted text-muted-foreground" disabled>
        Bloquear acesso
      </Button>

      <div className="flex justify-end mt-6">
        <Button className="bg-foreground hover:bg-foreground/90 text-background gap-2">
          Editar <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
