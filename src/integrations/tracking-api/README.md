# API de Rastreamento - Integração

Este diretório contém a integração com a API de rastreamento localizada em `https://fraktalsistemas.com.br:8004`.

## 📚 Documentação da API

A documentação completa da API está disponível em: **https://fraktalsistemas.com.br:8004/docs#/**

## 🔧 Configuração

### Arquivos Principais

- **`config.ts`**: Define a URL base da API e os endpoints disponíveis
- **`client.ts`**: Cliente HTTP para comunicação com a API
- **`../hooks/useVehicleActions.ts`**: Hooks React para usar as ações em componentes

## 📝 Endpoints Configurados

Os endpoints atualmente configurados são:

### Conexões
- `GET /conexoes/verificar_conexao/{imei}` - Verifica status de conexão

### Mapas
- `GET /mapa/{imei}?protocolo={protocolo}` - Visualização de mapa

### Ações de Veículos
- `POST /acoes/bloquear/{imei}` - Bloqueia veículo
- `POST /acoes/desbloquear/{imei}` - Desbloqueia veículo
- `POST /acoes/sirene/{imei}` - Ativa sirene
- `POST /acoes/reiniciar/{imei}` - Reinicia rastreador
- `POST /acoes/cerca_virtual/{imei}` - Gerencia cerca virtual
- `POST /acoes/pontos_interesse/{imei}` - Gerencia pontos de interesse
- `POST /acoes/hodometro/{imei}` - Obtém dados do hodômetro
- `POST /acoes/rotas/{imei}` - Obtém rotas do veículo

## ⚠️ Importante: Ajustar Endpoints

**Os endpoints acima são exemplos baseados em padrões comuns. Você DEVE verificar a documentação real da API em https://fraktalsistemas.com.br:8004/docs#/ e ajustar os endpoints em `config.ts` conforme necessário.**

### Como Ajustar

1. Acesse a documentação da API: https://fraktalsistemas.com.br:8004/docs#/
2. Identifique os endpoints reais para cada ação
3. Atualize o arquivo `src/integrations/tracking-api/config.ts`:

```typescript
export const TRACKING_API_ENDPOINTS = {
  // Ajuste conforme a documentação real
  BLOCK_VEHICLE: (imei: string) => `/acoes/bloquear/${imei}`, // ← Ajuste aqui
  UNBLOCK_VEHICLE: (imei: string) => `/acoes/desbloquear/${imei}`, // ← Ajuste aqui
  // ... outros endpoints
} as const;
```

## 🚀 Uso nos Componentes

### Exemplo: Bloquear/Desbloquear Veículo

```typescript
import { useBlockVehicle } from '@/hooks/useVehicles';

const MyComponent = () => {
  const blockVehicle = useBlockVehicle();
  
  const handleBlock = (vehicleId: string) => {
    blockVehicle.mutate({ 
      id: vehicleId, 
      block: true 
    });
  };
  
  // ...
};
```

### Exemplo: Ativar Sirene

```typescript
import { useSirenAction } from '@/hooks/useVehicleActions';

const MyComponent = () => {
  const sirenAction = useSirenAction();
  const imei = '123456789'; // IMEI/ESN/Identificador do equipamento
  const protocolo = '310'; // Modelo do rastreador (J16, 8310, ou 310)
  
  const handleSiren = () => {
    sirenAction.activate(imei, protocolo, 30); // 30 segundos
  };
  
  // ...
};
```

### Exemplo: Reiniciar Rastreador

```typescript
import { useRestartTrackerAction } from '@/hooks/useVehicleActions';

const MyComponent = () => {
  const restartAction = useRestartTrackerAction();
  const imei = '123456789'; // IMEI/ESN/Identificador do equipamento
  const protocolo = 'J16'; // Modelo do rastreador (J16, 8310, ou 310)
  
  const handleRestart = () => {
    restartAction.restart(imei, protocolo);
  };
  
  // ...
};
```

## 🔍 Parâmetros

### IMEI / ESN / Identificador
- **Obrigatório**: Sim
- **Tipo**: String
- **Descrição**: Identificador único do equipamento de rastreamento
- **Importante**: IMEI, ESN e Identificador são a mesma coisa - representam o número único do equipamento

### Protocolo (Modelo do Rastreador)
- **Obrigatório**: Não (mas recomendado)
- **Tipo**: String
- **Descrição**: Modelo do rastreador. Valores possíveis:
  - `'J16'` ou `'j16'` - Modelo J16
  - `'8310'` - Modelo 8310
  - `'310'` - Modelo 310
- **Como obter**: `equipment?.products?.model || equipment?.model`
- **Nota**: O protocolo é o modelo do rastreador, não um protocolo de comunicação

## 📋 Hooks Disponíveis

- `useVehicleAction()` - Hook genérico para qualquer ação
- `useBlockVehicleAction()` - Específico para bloquear/desbloquear
- `useSirenAction()` - Específico para sirene
- `useRestartTrackerAction()` - Específico para reiniciar
- `useVirtualFenceAction()` - Específico para cerca virtual
- `usePointsOfInterestAction()` - Específico para pontos de interesse
- `useOdometerAction()` - Específico para hodômetro
- `useRoutesAction()` - Específico para rotas

## 🐛 Tratamento de Erros

Todos os hooks incluem tratamento de erros automático com notificações toast. Em caso de erro:

1. Uma notificação de erro é exibida ao usuário
2. O erro é logado no console
3. As queries relacionadas são invalidadas para atualizar a UI

## 🔄 Sincronização com Banco de Dados

Algumas ações (como bloquear/desbloquear) também atualizam o status no banco de dados Supabase após a execução na API. Isso garante consistência entre a API e o banco local.

## 📝 Notas

- A API pode retornar diferentes formatos de resposta. Ajuste os tipos em `config.ts` conforme necessário.
- Alguns endpoints podem requerer autenticação. Se necessário, adicione headers de autenticação em `client.ts`.
- Os endpoints podem aceitar parâmetros adicionais via query string ou body. Consulte a documentação da API para detalhes.

