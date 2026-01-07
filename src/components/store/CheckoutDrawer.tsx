import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from './CartContext';
import { CartItemRow } from './CartItemRow';
import { AddressForm } from './AddressForm';
import { PaymentForm } from './PaymentForm';
import { useCreateOrder } from '@/hooks/useOrders';
import { ShippingAddress, PaymentData } from '@/types/cart';
import { formatCurrency } from '@/lib/formatters';
import {
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateCEP,
} from '@/lib/cardValidation';
import { Loader2, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'cart' | 'address' | 'payment';

const emptyAddress: ShippingAddress = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const emptyPayment: PaymentData = {
  cardNumber: '',
  cardHolder: '',
  expiryDate: '',
  cvv: '',
};

const stepLabels: Record<Step, string> = {
  cart: 'Carrinho',
  address: 'Endereço',
  payment: 'Pagamento',
};

export function CheckoutDrawer({ open, onOpenChange }: CheckoutDrawerProps) {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [payment, setPayment] = useState<PaymentData>(emptyPayment);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const createOrder = useCreateOrder();
  const total = getTotal();

  const validateAddress = (): boolean => {
    const errors: Record<string, string> = {};

    if (!validateCEP(address.cep)) {
      errors.cep = 'CEP inválido';
    }
    if (!address.street.trim()) {
      errors.street = 'Rua é obrigatória';
    }
    if (!address.number.trim()) {
      errors.number = 'Número é obrigatório';
    }
    if (!address.neighborhood.trim()) {
      errors.neighborhood = 'Bairro é obrigatório';
    }
    if (!address.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }
    if (!address.state.trim() || address.state.length !== 2) {
      errors.state = 'UF inválido';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = (): boolean => {
    const errors: Record<string, string> = {};

    if (!validateCardNumber(payment.cardNumber)) {
      errors.cardNumber = 'Número do cartão inválido';
    }
    if (!payment.cardHolder.trim() || payment.cardHolder.length < 3) {
      errors.cardHolder = 'Nome no cartão é obrigatório';
    }
    if (!validateExpiryDate(payment.expiryDate)) {
      errors.expiryDate = 'Validade inválida';
    }
    if (!validateCVV(payment.cvv)) {
      errors.cvv = 'CVV inválido';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 'cart') {
      setStep('address');
    } else if (step === 'address') {
      if (validateAddress()) {
        setStep('payment');
      }
    }
  };

  const handleBack = () => {
    if (step === 'address') {
      setStep('cart');
    } else if (step === 'payment') {
      setStep('address');
    }
  };

  const handleSubmit = async () => {
    if (!validatePayment()) return;

    try {
      await createOrder.mutateAsync({
        items,
        shippingAddress: address,
        paymentData: payment,
      });

      clearCart();
      setStep('cart');
      setAddress(emptyAddress);
      setPayment(emptyPayment);
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setStep('cart');
    onOpenChange(false);
  };

  const steps: Step[] = ['cart', 'address', 'payment'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-lg font-semibold">
            {stepLabels[step]}
          </SheetTitle>
          
          {/* Simple step indicators */}
          <div className="flex items-center justify-center gap-3 pt-3">
            {steps.map((s, index) => {
              const isActive = currentStepIndex === index;
              const isPast = currentStepIndex > index;
              
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-primary scale-125'
                          : isPast
                          ? 'bg-primary/60'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                    <span className={`text-[10px] font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {stepLabels[s]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-px -mt-4 ${
                        isPast ? 'bg-primary/60' : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-6">
            {step === 'cart' && (
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="py-16 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">Carrinho vazio</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Adicione produtos para continuar</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))
                )}
              </div>
            )}
            
            {step === 'address' && (
              <AddressForm
                address={address}
                onChange={setAddress}
                errors={addressErrors}
              />
            )}
            
            {step === 'payment' && (
              <PaymentForm
                payment={payment}
                onChange={setPayment}
                errors={paymentErrors}
              />
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-card p-6 space-y-4">
          {items.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
          )}

          <div className="flex gap-3">
            {step !== 'cart' ? (
              <Button variant="outline" onClick={handleBack} className="flex-1 h-11">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            ) : (
              <Button variant="outline" onClick={handleClose} className="flex-1 h-11">
                Continuar Comprando
              </Button>
            )}

            {step !== 'payment' && items.length > 0 && (
              <Button onClick={handleNext} className="flex-1 h-11">
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {step === 'payment' && (
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Pagar ${formatCurrency(total)}`
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
