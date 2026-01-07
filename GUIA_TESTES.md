# Guia de Testes - Alerta Veículos

## 🚀 Executando Testes

### Comandos Disponíveis

```bash
# Executar todos os testes uma vez
npm test

# Executar testes em modo watch (re-executa ao salvar arquivos)
npm test -- --watch

# Executar testes com interface visual
npm run test:ui

# Executar testes uma vez (sem watch)
npm run test:run

# Executar testes com cobertura
npm run test:coverage
```

### Executar Testes Específicos

```bash
# Executar um arquivo específico
npx vitest run src/lib/userTypeHierarchy.test.ts

# Executar testes que correspondem a um padrão
npx vitest run -t "hierarchy"

# Executar em modo watch para um arquivo específico
npx vitest watch src/lib/userTypeHierarchy.test.ts
```

---

## 📝 Estrutura de Testes

### Arquivo de Teste Existente

✅ **`src/lib/userTypeHierarchy.test.ts`**
- 20 testes passando
- Testa a hierarquia de tipos de usuários
- Cobre todos os cenários de criação de usuários

### Convenções

- Arquivos de teste: `*.test.ts` ou `*.spec.ts`
- Localização: Mesmo diretório do arquivo testado ou em `__tests__/`
- Nome: `nomeDoArquivo.test.ts`

---

## 🧪 Exemplos de Testes

### Testando Funções Utilitárias

```typescript
// src/lib/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formata valores em reais', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });
  });

  describe('formatDate', () => {
    it('formata datas em formato brasileiro', () => {
      const date = new Date('2024-12-07');
      expect(formatDate(date)).toBe('07/12/2024');
    });
  });
});
```

### Testando Hooks Customizados

```typescript
// src/hooks/useClients.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClients } from './useClients';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

describe('useClients', () => {
  it('retorna lista de clientes', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useClients(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Testando Componentes React

```typescript
// src/components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByText('Clique aqui')).toBeInTheDocument();
  });

  it('aplica variantes corretamente', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
```

### Testando Validações

```typescript
// src/lib/validations/auth.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from './auth';

describe('auth validations', () => {
  describe('validateEmail', () => {
    it('valida emails corretos', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejeita emails inválidos', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('valida senhas com pelo menos 6 caracteres', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('senha123')).toBe(true);
    });

    it('rejeita senhas muito curtas', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });
});
```

---

## 🛠️ Configuração

### Vitest Config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // ou 'jsdom' para componentes React
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Dependências Necessárias

Para testar componentes React, você precisará:

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

---

## 📊 Cobertura de Testes

### Verificar Cobertura

```bash
npm run test:coverage
```

### Configurar Cobertura Mínima

Adicione no `vitest.config.ts`:

```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
      '**/mockData/**',
    ],
    thresholds: {
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
    },
  },
}
```

---

## 🎯 Boas Práticas

### 1. Organize Testes por Funcionalidade

```typescript
describe('UserTypeHierarchy', () => {
  describe('getAllowedUserTypesToCreate', () => {
    // testes aqui
  });

  describe('getDefaultUserTypeForCreation', () => {
    // testes aqui
  });
});
```

### 2. Use Nomes Descritivos

```typescript
// ❌ Ruim
it('test 1', () => { ... });

// ✅ Bom
it('admin can create all types except admin', () => { ... });
```

### 3. Teste Comportamento, Não Implementação

```typescript
// ❌ Ruim - testa implementação
it('calls getAllowedUserTypesToCreate', () => { ... });

// ✅ Bom - testa comportamento
it('returns correct user types for admin', () => { ... });
```

### 4. Use Arrange-Act-Assert

```typescript
it('formats currency correctly', () => {
  // Arrange
  const value = 1000;
  
  // Act
  const result = formatCurrency(value);
  
  // Assert
  expect(result).toBe('R$ 1.000,00');
});
```

### 5. Isole Testes

Cada teste deve ser independente e não depender de outros.

---

## 🐛 Mocking

### Mock de Supabase

```typescript
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: mockData, 
            error: null 
          }))
        }))
      }))
    }))
  }
}));
```

### Mock de Context

```typescript
import { vi } from 'vitest';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@example.com' },
    profile: { user_type: 'admin' },
    loading: false,
  }),
}));
```

---

## 📈 Próximos Passos

### Testes Prioritários para Adicionar

1. **Utilitários** (`src/lib/`)
   - [ ] `formatters.test.ts`
   - [ ] `cardValidation.test.ts`
   - [ ] `utils.test.ts`

2. **Hooks** (`src/hooks/`)
   - [ ] `useClients.test.ts`
   - [ ] `useVehicles.test.ts`
   - [ ] `useDashboard.test.ts`

3. **Validações** (`src/lib/validations/`)
   - [ ] `auth.test.ts`

4. **Componentes Críticos**
   - [ ] `ProtectedRoute.test.tsx`
   - [ ] `AuthContext.test.tsx`

---

## 🔗 Recursos

- [Documentação Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Library](https://testing-library.com/react)
- [Guia de Testes React](https://react.dev/learn/testing)

---

*Última atualização: Dezembro 2024*


