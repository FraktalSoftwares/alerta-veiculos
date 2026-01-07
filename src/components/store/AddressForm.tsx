import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShippingAddress, ViaCEPResponse } from '@/types/cart';
import { formatCEP, validateCEP } from '@/lib/cardValidation';
import { Loader2 } from 'lucide-react';

interface AddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors: Record<string, string>;
}

export function AddressForm({ address, onChange, errors }: AddressFormProps) {
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleCEPChange = async (value: string) => {
    const formattedCEP = formatCEP(value);
    onChange({ ...address, cep: formattedCEP });
    setCepError(null);

    const cleanCEP = formattedCEP.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data: ViaCEPResponse = await response.json();

        if (data.erro) {
          setCepError('CEP não encontrado');
          return;
        }

        onChange({
          ...address,
          cep: formattedCEP,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          complement: data.complemento || address.complement || '',
        });
      } catch (error) {
        setCepError('Erro ao buscar CEP');
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Endereço de Entrega</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <div className="relative">
            <Input
              id="cep"
              value={address.cep}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={errors.cep || cepError ? 'border-destructive' : ''}
            />
            {isLoadingCEP && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {(errors.cep || cepError) && (
            <p className="text-xs text-destructive">{errors.cep || cepError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={address.number}
            onChange={(e) => onChange({ ...address, number: e.target.value })}
            placeholder="123"
            className={errors.number ? 'border-destructive' : ''}
          />
          {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Rua *</Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => onChange({ ...address, street: e.target.value })}
          placeholder="Nome da rua"
          className={errors.street ? 'border-destructive' : ''}
        />
        {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          value={address.complement || ''}
          onChange={(e) => onChange({ ...address, complement: e.target.value })}
          placeholder="Apto, bloco, etc."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro *</Label>
          <Input
            id="neighborhood"
            value={address.neighborhood}
            onChange={(e) => onChange({ ...address, neighborhood: e.target.value })}
            placeholder="Bairro"
            className={errors.neighborhood ? 'border-destructive' : ''}
          />
          {errors.neighborhood && <p className="text-xs text-destructive">{errors.neighborhood}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => onChange({ ...address, city: e.target.value })}
            placeholder="Cidade"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">UF *</Label>
          <Input
            id="state"
            value={address.state}
            onChange={(e) => onChange({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="UF"
            maxLength={2}
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
      </div>
    </div>
  );
}
