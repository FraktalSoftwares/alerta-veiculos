// Luhn algorithm for card validation
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Detect card brand
export function detectCardBrand(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (!digits) return null;

  // Visa
  if (/^4/.test(digits)) return 'Visa';
  
  // Mastercard
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  
  // American Express
  if (/^3[47]/.test(digits)) return 'Amex';
  
  // Elo
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) return 'Elo';
  
  // Hipercard
  if (/^(606282|3841)/.test(digits)) return 'Hipercard';

  return null;
}

// Format card number with spaces
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

// Format expiry date
export function formatExpiryDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

// Validate expiry date
export function validateExpiryDate(expiryDate: string): boolean {
  const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

// Validate CVV
export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv);
}

// Format CEP
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

// Validate CEP
export function validateCEP(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep);
}
