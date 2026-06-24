# Modelos 3D dos veículos (GLB)

Coloque aqui os modelos low-poly em formato **.glb**:

- `carro.glb` — usado para veículos do tipo carro (e demais que não forem moto)
- `moto.glb` — usado para veículos cujo `vehicle_type` contém "moto"

## Requisitos / dicas

- **Formato:** `.glb` (glTF binário). Exporte do Blender/etc.
- **Peso:** quanto menor melhor (ideal < 1–2 MB). Use modelos low-poly e texturas pequenas.
- **Orientação:** o "nariz" (frente) do modelo deve apontar para **-Z** (convenção glTF).
  Se ficar virado, ajuste `modelHeadingOffset` na chamada do `MapboxView`
  (em `src/components/vehicles/map/SelectedVehicleMap.tsx`).
- **Escala:** é normalizada automaticamente para ~`sizeMeters`
  (carro 4.5 m, moto 2.1 m). Ajuste em `model3dForType` se precisar.

## Comportamento

- Sem os arquivos aqui: o mapa fica **plano (2D)** com o ícone/logo — tudo funciona normal.
- Com os arquivos: o modelo 3D carrega, o mapa **inclina (pitch 55°)** e o
  veículo gira conforme o rumo (alinha à rua), atualizando em tempo real.
