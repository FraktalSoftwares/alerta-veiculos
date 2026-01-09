/**
 * Utility functions for formatting and masking Brazilian form fields
 */

// CEP: 00000-000
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function unformatCEP(value: string): string {
  return value.replace(/\D/g, "");
}

// CPF: 000.000.000-00
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function unformatCPF(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

// CNPJ: 00.000.000/0000-00
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function unformatCNPJ(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Validate first digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;
  
  // Validate second digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits[13])) return false;
  
  return true;
}

// Format CPF or CNPJ based on length
export function formatCPFOrCNPJ(value: string, type: "cpf" | "cnpj"): string {
  return type === "cpf" ? formatCPF(value) : formatCNPJ(value);
}

// Phone: (00) 00000-0000 or (00) 0000-0000
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function unformatPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Currency: R$ 0,00
export function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" 
    ? parseFloat(value.replace(/\D/g, "")) / 100 
    : value;
  
  if (isNaN(numValue)) return "R$ 0,00";
  
  return numValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseCurrency(value: string): number {
  // Remove R$, espaços e pontos (milhares)
  let cleaned = value.replace(/[R$\s]/g, "");
  // Substitui vírgula por ponto para parseFloat
  cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Date: DD/MM/YYYY
export function formatDateBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDateBR(value: string): string | null {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// IMEI: 15 digits
export function formatIMEI(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function isValidIMEI(imei: string): boolean {
  const digits = imei.replace(/\D/g, "");
  return digits.length === 15;
}

// Plate: ABC-1234 or ABC1D23 (Mercosul)
export function formatPlate(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (cleaned.length <= 3) return cleaned;
  // Old format: ABC-1234
  if (/^[A-Z]{3}[0-9]{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  // Mercosul format: ABC1D23
  return cleaned;
}

export function isValidPlate(plate: string): boolean {
  const cleaned = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  // Old format: ABC1234
  if (/^[A-Z]{3}[0-9]{4}$/.test(cleaned)) return true;
  // Mercosul format: ABC1D23
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned)) return true;
  return false;
}
