import { describe, it, expect } from 'vitest';
import {
  formatCEP,
  unformatCEP,
  formatCPF,
  unformatCPF,
  isValidCPF,
  formatCNPJ,
  unformatCNPJ,
  isValidCNPJ,
  formatPhone,
  unformatPhone,
  isValidPhone,
  isValidEmail,
  formatCurrency,
  parseCurrency,
  formatDateBR,
  parseDateBR,
  formatIMEI,
  isValidIMEI,
  formatPlate,
  isValidPlate,
} from './formatters';

describe('formatters', () => {
  describe('CEP', () => {
    it('formata CEP corretamente', () => {
      expect(formatCEP('12345678')).toBe('12345-678');
      expect(formatCEP('12345')).toBe('12345');
      expect(formatCEP('123456')).toBe('12345-6');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatCEP('12345-678')).toBe('12345-678');
      expect(formatCEP('abc12345678def')).toBe('12345-678');
    });

    it('limita a 8 dígitos', () => {
      expect(formatCEP('1234567890123')).toBe('12345-678');
    });

    it('desformata CEP', () => {
      expect(unformatCEP('12345-678')).toBe('12345678');
      expect(unformatCEP('12345')).toBe('12345');
    });
  });

  describe('CPF', () => {
    it('formata CPF corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
      expect(formatCPF('123456789')).toBe('123.456.789');
      expect(formatCPF('123456')).toBe('123.456');
      expect(formatCPF('123')).toBe('123');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatCPF('123.456.789-01')).toBe('123.456.789-01');
      expect(formatCPF('abc12345678901def')).toBe('123.456.789-01');
    });

    it('limita a 11 dígitos', () => {
      expect(formatCPF('123456789012345')).toBe('123.456.789-01');
    });

    it('desformata CPF', () => {
      expect(unformatCPF('123.456.789-01')).toBe('12345678901');
    });

    it('valida CPF válido', () => {
      // CPF válido de exemplo (gerado apenas para testes)
      expect(isValidCPF('11144477735')).toBe(true);
    });

    it('rejeita CPF inválido', () => {
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('12345678901')).toBe(false);
      expect(isValidCPF('123')).toBe(false);
      expect(isValidCPF('')).toBe(false);
    });
  });

  describe('CNPJ', () => {
    it('formata CNPJ corretamente', () => {
      expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
      expect(formatCNPJ('12345678')).toBe('12.345.678');
      expect(formatCNPJ('12345')).toBe('12.345');
      expect(formatCNPJ('12')).toBe('12');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });

    it('limita a 14 dígitos', () => {
      expect(formatCNPJ('12345678000190123')).toBe('12.345.678/0001-90');
    });

    it('desformata CNPJ', () => {
      expect(unformatCNPJ('12.345.678/0001-90')).toBe('12345678000190');
    });

    it('valida CNPJ válido', () => {
      // CNPJ válido de exemplo (gerado apenas para testes)
      expect(isValidCNPJ('11222333000181')).toBe(true);
    });

    it('rejeita CNPJ inválido', () => {
      expect(isValidCNPJ('11111111111111')).toBe(false);
      expect(isValidCNPJ('12345678000190')).toBe(false);
      expect(isValidCNPJ('123')).toBe(false);
      expect(isValidCNPJ('')).toBe(false);
    });
  });

  describe('Phone', () => {
    it('formata telefone fixo corretamente', () => {
      expect(formatPhone('1198765432')).toBe('(11) 9876-5432');
      expect(formatPhone('1198765')).toBe('(11) 9876-5');
      expect(formatPhone('11')).toBe('(11');
    });

    it('formata celular corretamente', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
      expect(formatPhone('abc11987654321def')).toBe('(11) 98765-4321');
    });

    it('limita a 11 dígitos', () => {
      expect(formatPhone('11987654321123')).toBe('(11) 98765-4321');
    });

    it('desformata telefone', () => {
      expect(unformatPhone('(11) 98765-4321')).toBe('11987654321');
      expect(unformatPhone('(11) 9876-5432')).toBe('1198765432');
    });

    it('valida telefone válido', () => {
      expect(isValidPhone('11987654321')).toBe(true);
      expect(isValidPhone('1198765432')).toBe(true);
    });

    it('rejeita telefone inválido', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('123456789012')).toBe(false);
    });
  });

  describe('Email', () => {
    it('valida email válido', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('rejeita email inválido', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Currency', () => {
    it('formata moeda corretamente', () => {
      // toLocaleString pode usar espaço não-quebrável, então verificamos se contém os valores
      expect(formatCurrency(1000)).toContain('1.000,00');
      expect(formatCurrency(1000)).toContain('R$');
      expect(formatCurrency(1234.56)).toContain('1.234,56');
      expect(formatCurrency(0)).toContain('0,00');
      expect(formatCurrency(100)).toContain('100,00');
    });

    it('formata string de moeda', () => {
      expect(formatCurrency('100000')).toContain('1.000,00');
      expect(formatCurrency('R$ 1.234,56')).toContain('1.234,56');
    });

    it('retorna R$ 0,00 para valores inválidos', () => {
      expect(formatCurrency('abc')).toBe('R$ 0,00');
      expect(formatCurrency('')).toBe('R$ 0,00');
    });

    it('parse currency string', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrency('1.234,56')).toBe(1234.56);
      expect(parseCurrency('1234,56')).toBe(1234.56);
      expect(parseCurrency('abc')).toBe(0);
    });
  });

  describe('Date BR', () => {
    it('formata data corretamente', () => {
      expect(formatDateBR('07122024')).toBe('07/12/2024');
      expect(formatDateBR('0712')).toBe('07/12');
      expect(formatDateBR('07')).toBe('07');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatDateBR('07/12/2024')).toBe('07/12/2024');
    });

    it('limita a 8 dígitos', () => {
      expect(formatDateBR('07122024123')).toBe('07/12/2024');
    });

    it('parse data BR', () => {
      expect(parseDateBR('07/12/2024')).toBe('2024-12-07');
      expect(parseDateBR('01/01/2024')).toBe('2024-01-01');
    });

    it('retorna null para datas inválidas', () => {
      expect(parseDateBR('07/12')).toBe(null);
      expect(parseDateBR('07-12-2024')).toBe(null);
      expect(parseDateBR('abc')).toBe(null);
      expect(parseDateBR('07/12/24')).toBe(null);
    });
  });

  describe('IMEI', () => {
    it('formata IMEI corretamente', () => {
      expect(formatIMEI('123456789012345')).toBe('123456789012345');
      expect(formatIMEI('1234567890123456')).toBe('123456789012345');
    });

    it('remove caracteres não numéricos', () => {
      expect(formatIMEI('123-456-789-012-345')).toBe('123456789012345');
    });

    it('valida IMEI válido', () => {
      expect(isValidIMEI('123456789012345')).toBe(true);
    });

    it('rejeita IMEI inválido', () => {
      expect(isValidIMEI('12345678901234')).toBe(false);
      expect(isValidIMEI('1234567890123456')).toBe(false);
      expect(isValidIMEI('abc')).toBe(false);
    });
  });

  describe('Plate', () => {
    it('formata placa antiga corretamente', () => {
      expect(formatPlate('ABC1234')).toBe('ABC-1234');
      expect(formatPlate('abc1234')).toBe('ABC-1234');
    });

    it('formata placa Mercosul corretamente', () => {
      expect(formatPlate('ABC1D23')).toBe('ABC1D23');
      expect(formatPlate('abc1d23')).toBe('ABC1D23');
    });

    it('remove caracteres inválidos', () => {
      expect(formatPlate('ABC-1234')).toBe('ABC-1234');
      // A função remove caracteres inválidos e depois formata se necessário
      expect(formatPlate('ABC@1234')).toBe('ABC-1234'); // Remove @ e formata
      expect(formatPlate('ABC#1234')).toBe('ABC-1234'); // Remove # e formata
      expect(formatPlate('ABC1234')).toBe('ABC-1234'); // Formata placa antiga
    });

    it('valida placa antiga válida', () => {
      expect(isValidPlate('ABC1234')).toBe(true);
      expect(isValidPlate('ABC-1234')).toBe(true);
    });

    it('valida placa Mercosul válida', () => {
      expect(isValidPlate('ABC1D23')).toBe(true);
      expect(isValidPlate('abc1d23')).toBe(true);
    });

    it('rejeita placa inválida', () => {
      expect(isValidPlate('ABC123')).toBe(false);
      expect(isValidPlate('ABC12345')).toBe(false);
      expect(isValidPlate('ABC1D2')).toBe(false);
      expect(isValidPlate('ABC')).toBe(false);
    });
  });
});

