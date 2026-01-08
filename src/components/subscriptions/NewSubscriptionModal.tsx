import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSubscription, CreateSubscriptionData } from '@/hooks/useSubscriptions';
import { useClients } from '@/hooks/useClients';
import { formatCurrency, parseCurrency } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';
import { formatCardNumber, formatExpiryDate, formatCVV } from '@/lib/cardValidation';

interface NewSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSubscriptionModal({ open, onOpenChange }: NewSubscriptionModalProps) {
  const createSubscription = useCreateSubscription();
  const { data: clientsData } = useClients({ pageSize: 100 });
  const clients = clientsData?.clients || [];

  const [formData, setFormData] = useState<CreateSubscriptionData>({
    clientId: '',
    productId: '',
    subscriptionType: 'monthly',
    amount: 0,
    billingDay: 1,
    paymentMethod: 'credit_card',
    description: '',
  });

  const [creditCard, setCreditCard] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (formData.billingDay < 1 || formData.billingDay > 31) {
      newErrors.billingDay = 'Dia de vencimento deve ser entre 1 e 31';
    }

    if (formData.paymentMethod === 'credit_card') {
      if (!creditCard.holderName.trim()) {
        newErrors.holderName = 'Nome no cartão é obrigatório';
      }
      if (!creditCard.number.replace(/\s/g, '').match(/^\d{13,19}$/)) {
        newErrors.number = 'Número do cartão inválido';
      }
      if (!creditCard.expiryMonth || !creditCard.expiryYear) {
        newErrors.expiry = 'Data de validade é obrigatória';
      }
      if (!creditCard.cvv.match(/^\d{3,4}$/)) {
        newErrors.cvv = 'CVV inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const data: CreateSubscriptionData = {
        ...formData,
        creditCard: formData.paymentMethod === 'credit_card' ? creditCard : undefined,
      };

      await createSubscription.mutateAsync(data);
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: '',
      productId: '',
      subscriptionType: 'monthly',
      amount: 0,
      billingDay: 1,
      paymentMethod: 'credit_card',
      description: '',
    });
    setCreditCard({
      holderName: '',
      number: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Assinatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente *</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
            >
              <SelectTrigger id="clientId">
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
            {errors.clientId && (
              <p className="text-sm text-destructive">{errors.clientId}</p>
            )}
          </div>

          {/* Tipo de Assinatura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscriptionType">Período *</Label>
              <Select
                value={formData.subscriptionType}
                onValueChange={(value: 'monthly' | 'quarterly' | 'annual') =>
                  setFormData({ ...formData, subscriptionType: value })
                }
              >
                <SelectTrigger id="subscriptionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingDay">Dia de Vencimento *</Label>
              <Input
                id="billingDay"
                type="number"
                min="1"
                max="31"
                value={formData.billingDay || ''}
                onChange={(e) =>
                  setFormData({ ...formData, billingDay: parseInt(e.target.value) || 1 })
                }
              />
              {errors.billingDay && (
                <p className="text-sm text-destructive">{errors.billingDay}</p>
              )}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount > 0 ? formatCurrency(formData.amount) : ''}
              onChange={(e) => {
                const value = parseCurrency(e.target.value);
                setFormData({ ...formData, amount: value });
              }}
              placeholder="0,00"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: 'credit_card' | 'pix' | 'boleto') =>
                setFormData({ ...formData, paymentMethod: value })
              }
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Cartão */}
          {formData.paymentMethod === 'credit_card' && (
            <div className="space-y-4 p-4 border border-border rounded-lg">
              <h3 className="font-medium">Dados do Cartão</h3>

              <div className="space-y-2">
                <Label htmlFor="holderName">Nome no Cartão *</Label>
                <Input
                  id="holderName"
                  value={creditCard.holderName}
                  onChange={(e) =>
                    setCreditCard({ ...creditCard, holderName: e.target.value.toUpperCase() })
                  }
                  placeholder="NOME COMPLETO"
                />
                {errors.holderName && (
                  <p className="text-sm text-destructive">{errors.holderName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número do Cartão *</Label>
                <Input
                  id="number"
                  value={formatCardNumber(creditCard.number)}
                  onChange={(e) =>
                    setCreditCard({ ...creditCard, number: e.target.value.replace(/\s/g, '') })
                  }
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">{errors.number}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Mês *</Label>
                  <Input
                    id="expiryMonth"
                    value={creditCard.expiryMonth}
                    onChange={(e) =>
                      setCreditCard({
                        ...creditCard,
                        expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                      })
                    }
                    placeholder="MM"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Ano *</Label>
                  <Input
                    id="expiryYear"
                    value={creditCard.expiryYear}
                    onChange={(e) =>
                      setCreditCard({
                        ...creditCard,
                        expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    placeholder="AAAA"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={creditCard.cvv}
                    onChange={(e) =>
                      setCreditCard({
                        ...creditCard,
                        cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    placeholder="000"
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive">{errors.cvv}</p>
                  )}
                </div>
              </div>
              {errors.expiry && (
                <p className="text-sm text-destructive">{errors.expiry}</p>
              )}
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da assinatura (opcional)"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={createSubscription.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createSubscription.isPending}>
            {createSubscription.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Assinatura'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

