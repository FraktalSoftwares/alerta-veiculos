import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateFinanceRecord } from "@/hooks/useFinance";
import { FinanceRecordDisplay } from "@/types/finance";
import { Loader2 } from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/formatters";

interface EditFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecordDisplay | null;
}

export function EditFinanceModal({ isOpen, onClose, record }: EditFinanceModalProps) {
  const updateRecord = useUpdateFinanceRecord();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    status: "pending" as "pending" | "paid" | "overdue" | "cancelled",
  });

  useEffect(() => {
    if (record) {
      setFormData({
        description: record.description || "",
        amount: formatCurrency(record.amount),
        status: record.status,
      });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!record) return;

    try {
      await updateRecord.mutateAsync({ 
        id: record.id, 
        description: formData.description,
        amount: parseCurrency(formData.amount),
        status: formData.status,
      });
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do registro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Valor</Label>
            <Input
              id="edit-amount"
              value={formData.amount}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setFormData({ ...formData, amount: formatCurrency(value) });
              }}
              placeholder="R$ 0,00"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "paid" | "overdue" | "cancelled") => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-foreground hover:bg-foreground/90 text-background"
              disabled={updateRecord.isPending}
            >
              {updateRecord.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}