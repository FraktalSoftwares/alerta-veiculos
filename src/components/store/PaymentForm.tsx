import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentData } from '@/types/cart';
import {
  formatCardNumber,
  formatExpiryDate,
  detectCardBrand,
} from '@/lib/cardValidation';
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/formatters';
import { CreditCard } from 'lucide-react';

interface PaymentFormProps {
  payment: PaymentData;
  onChange: (payment: PaymentData) => void;
  errors: Record<string, string>;
}

export function PaymentForm({ payment, onChange, errors }: PaymentFormProps) {
  const cardBrand = detectCardBrand(payment.cardNumber);

  const handleCardNumberChange = (value: string) => {
    onChange({ ...payment, cardNumber: formatCardNumber(value) });
  };

  const handleExpiryChange = (value: string) => {
    onChange({ ...payment, expiryDate: formatExpiryDate(value) });
  };

  const handleCVVChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    onChange({ ...payment, cvv: digits });
  };

  const handleCpfCnpjChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      onChange({ ...payment, cpfCnpj: formatCPF(value) });
    } else {
      onChange({ ...payment, cpfCnpj: formatCNPJ(value) });
    }
  };

  const handlePhoneChange = (value: string) => {
    onChange({ ...payment, phone: formatPhone(value) });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Dados do Pagamento</h3>

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número do Cartão *</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            value={payment.cardNumber}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className={errors.cardNumber ? 'border-destructive pr-20' : 'pr-20'}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {cardBrand ? (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {cardBrand}
              </span>
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
        {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardHolder">Nome no Cartão *</Label>
        <Input
          id="cardHolder"
          value={payment.cardHolder}
          onChange={(e) => onChange({ ...payment, cardHolder: e.target.value.toUpperCase() })}
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          className={errors.cardHolder ? 'border-destructive' : ''}
        />
        {errors.cardHolder && <p className="text-xs text-destructive">{errors.cardHolder}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Validade *</Label>
          <Input
            id="expiry"
            value={payment.expiryDate}
            onChange={(e) => handleExpiryChange(e.target.value)}
            placeholder="MM/AA"
            maxLength={5}
            className={errors.expiryDate ? 'border-destructive' : ''}
          />
          {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV *</Label>
          <Input
            id="cvv"
            value={payment.cvv}
            onChange={(e) => handleCVVChange(e.target.value)}
            placeholder="123"
            maxLength={4}
            type="password"
            className={errors.cvv ? 'border-destructive' : ''}
          />
          {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpfCnpj">CPF/CNPJ do Titular *</Label>
        <Input
          id="cpfCnpj"
          value={payment.cpfCnpj}
          onChange={(e) => handleCpfCnpjChange(e.target.value)}
          placeholder="000.000.000-00"
          maxLength={18}
          className={errors.cpfCnpj ? 'border-destructive' : ''}
        />
        {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone"
          value={payment.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="(00) 00000-0000"
          maxLength={15}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          Seus dados de pagamento são processados com segurança via Asaas
        </p>
      </div>
    </div>
  );
}
