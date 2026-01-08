# Cercas Virtuais - Documentação

## 📋 Visão Geral

Sistema completo de gestão de cercas virtuais (geofences) para equipamentos de rastreamento. Permite criar, editar e gerenciar múltiplas cercas por equipamento.

## ✨ Funcionalidades

- ✅ Criar múltiplas cercas virtuais por equipamento
- ✅ Definir nome, localização (lat/lon), raio em metros
- ✅ Configurar limite de velocidade (opcional)
- ✅ Marcar cerca como principal
- ✅ Configurar notificações ao entrar/sair da cerca
- ✅ Integração com API de rastreamento
- ✅ Sincronização automática com banco de dados

## 📁 Arquivos Criados

### Banco de Dados
- `supabase/migrations/20250108000000_create_virtual_fences.sql` - Migration da tabela

### Types
- `src/types/virtualFence.ts` - Tipos TypeScript

### Hooks
- `src/hooks/useVirtualFences.ts` - Hooks para CRUD de cercas

### Componentes
- `src/components/vehicles/VirtualFenceModal.tsx` - Modal para criar/editar cercas
- `src/components/vehicles/VirtualFenceList.tsx` - Lista de cercas de um equipamento

### API
- `src/integrations/tracking-api/client.ts` - Métodos para sincronizar com API

## 🚀 Como Usar

### 1. Exibir Lista de Cercas

```tsx
import { VirtualFenceList } from '@/components/vehicles/VirtualFenceList';

function MyComponent() {
  const equipmentId = 'equipment-uuid';
  
  return (
    <VirtualFenceList 
      equipmentId={equipmentId}
      onFenceSelect={(fence) => {
        // Callback quando uma cerca é selecionada (ex: mostrar no mapa)
        console.log('Cerca selecionada:', fence);
      }}
    />
  );
}
```

### 2. Criar/Editar Cerca

```tsx
import { VirtualFenceModal } from '@/components/vehicles/VirtualFenceModal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const equipmentId = 'equipment-uuid';
  
  return (
    <VirtualFenceModal
      open={isOpen}
      onOpenChange={setIsOpen}
      equipmentId={equipmentId}
      fenceId={null} // null para criar, ou ID para editar
      initialLocation={{ lat: -23.5505, lng: -46.6333 }} // Opcional
      onLocationSelect={(lat, lng) => {
        // Callback quando usuário seleciona localização no mapa
        console.log('Localização selecionada:', lat, lng);
      }}
    />
  );
}
```

### 3. Usar Hooks Diretamente

```tsx
import { useVirtualFences, useCreateVirtualFence } from '@/hooks/useVirtualFences';

function MyComponent() {
  const equipmentId = 'equipment-uuid';
  const { data: fences, isLoading } = useVirtualFences(equipmentId);
  const createFence = useCreateVirtualFence();
  
  const handleCreate = async () => {
    await createFence.mutateAsync({
      equipment_id: equipmentId,
      name: 'Minha Cerca',
      latitude: -23.5505,
      longitude: -46.6333,
      radius: 100,
      speed_limit: 60,
      is_primary: false,
      notify_on_enter: true,
      notify_on_exit: true,
    });
  };
  
  return (
    <div>
      {fences?.map(fence => (
        <div key={fence.id}>{fence.name}</div>
      ))}
    </div>
  );
}
```

## 📊 Estrutura da Tabela

```sql
virtual_fences (
  id UUID PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL, -- em metros
  speed_limit INTEGER, -- em km/h (opcional)
  is_primary BOOLEAN DEFAULT false,
  notify_on_enter BOOLEAN DEFAULT true,
  notify_on_exit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## 🔌 Integração com API

As cercas são automaticamente sincronizadas com a API de rastreamento quando:
- Uma cerca é criada
- Uma cerca é atualizada
- Uma cerca é deletada

A sincronização usa:
- IMEI do equipamento
- Protocolo (modelo do rastreador: J16, 8310, 310)
- Dados da cerca (nome, localização, raio, etc.)

**Nota:** Se a API falhar, a operação no banco de dados ainda será concluída. O erro será logado no console.

## 🗺️ Integração com Mapa

Para integrar a seleção de localização no mapa:

1. Passe um callback `onLocationSelect` para o `VirtualFenceModal`
2. Quando o usuário clicar em "Selecionar no Mapa", o callback será chamado
3. Use o callback para abrir um mapa interativo onde o usuário pode clicar
4. Quando o usuário clicar no mapa, atualize `initialLocation` do modal

Exemplo:

```tsx
const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);
const [isSelectingLocation, setIsSelectingLocation] = useState(false);

<VirtualFenceModal
  open={isOpen}
  onOpenChange={setIsOpen}
  equipmentId={equipmentId}
  initialLocation={mapLocation}
  onLocationSelect={() => {
    setIsSelectingLocation(true);
    // Abrir mapa interativo
  }}
/>

{isSelectingLocation && (
  <MapComponent
    onLocationClick={(lat, lng) => {
      setMapLocation({ lat, lng });
      setIsSelectingLocation(false);
    }}
  />
)}
```

## 🔒 Permissões

As políticas RLS garantem que:
- Usuários só veem cercas de equipamentos que possuem
- Usuários só podem criar/editar/deletar cercas de seus equipamentos
- A hierarquia de clientes é respeitada

## 📝 Próximos Passos

Para completar a integração:

1. **Integrar com página de mapa do veículo** - Mostrar cercas no mapa
2. **Adicionar visualização de círculos** - Desenhar círculos das cercas no Google Maps
3. **Notificações em tempo real** - Quando veículo entra/sai de uma cerca
4. **Histórico de violações** - Registrar quando cercas foram violadas

## 🐛 Troubleshooting

### Erro: "Cerca virtual não encontrada"
- Verifique se o `equipmentId` está correto
- Verifique se o usuário tem permissão para ver o equipamento

### Erro: "Erro ao sincronizar com API"
- Verifique se o equipamento tem IMEI configurado
- Verifique se o protocolo está correto
- Verifique a documentação da API em https://fraktalsistemas.com.br:8004/docs#/

### Cerca não aparece na lista
- Verifique se o `equipmentId` está sendo passado corretamente
- Verifique as políticas RLS no Supabase
- Verifique o console do navegador para erros

