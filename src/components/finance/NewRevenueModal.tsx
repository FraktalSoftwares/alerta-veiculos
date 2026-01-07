import { useState } from "react";
import { Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateFinanceRecord } from "@/hooks/useFinance";
import { useClients } from "@/hooks/useClients";
import { formatCurrency, parseCurrency } from "@/lib/formatters";

interface NewRevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

export function NewRevenueModal({ open, onOpenChange, onSubmit }: NewRevenueModalProps) {
  const [clienteId, setClienteId] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [formaCobranca, setFormaCobranca] = useState("");
  const [parcelamento, setParcelamento] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState("12");
  const [modoParcelamento, setModoParcelamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const createRecord = useCreateFinanceRecord();
  const { data: clientsData } = useClients({ search: clienteSearch, pageSize: 10 });
  const clients = clientsData?.clients || [];

  const parseValue = (val: string): number => {
    return parseCurrency(val);
  };

  const handleSubmit = () => {
    const amount = parseValue(valor);
    if (amount <= 0) return;

    createRecord.mutate(
      {
        type: "revenue",
        clientId: clienteId || undefined,
        description: descricao || observacoes || undefined,
        amount,
        dueDate: vencimento || undefined,
        paymentMethod: formaCobranca || undefined,
        category: "Cobrança",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSubmit?.();
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setClienteId("");
    setClienteSearch("");
    setDescricao("");
    setValor("");
    setVencimento("");
    setFormaCobranca("");
    setParcelamento(false);
    setQtdParcelas("12");
    setModoParcelamento("");
    setObservacoes("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-center text-lg font-medium">
            Nova Receita
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Cliente Search */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Descrição da receita"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Valor, Vencimento, Forma de cobrança */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                placeholder="R$ 0,00"
                value={valor}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setValor(formatCurrency(value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input
                id="vencimento"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forma-cobranca">Forma de cobrança</Label>
              <Select value={formaCobranca} onValueChange={setFormaCobranca}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parcelamento Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={parcelamento}
              onCheckedChange={setParcelamento}
            />
            <Label className="cursor-pointer" onClick={() => setParcelamento(!parcelamento)}>
              Ativar parcelamento
            </Label>
          </div>

          {/* Parcelamento Options */}
          {parcelamento && (
            <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="qtd-parcelas">Qtd parcelas</Label>
                <Input
                  id="qtd-parcelas"
                  value={qtdParcelas}
                  onChange={(e) => setQtdParcelas(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modo-parcelamento">Modo de parcelamento</Label>
                <Select value={modoParcelamento} onValueChange={setModoParcelamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valor total dividido pelo número de parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dividido">Valor total dividido pelo número de parcelas</SelectItem>
                    <SelectItem value="fixo">Valor fixo por parcela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="h-10">
                Calcular parcelas
              </Button>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações da receita"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRecord.isPending}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 px-8"
          >
            <Check className="h-4 w-4" />
            {createRecord.isPending ? "Salvando..." : "Gerar nova receita"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
