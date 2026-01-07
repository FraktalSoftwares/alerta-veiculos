import { MapPin } from "lucide-react";

export function VehicleMapPlaceholder() {
  return (
    <div className="flex-1 bg-muted/30 flex items-center justify-center relative">
      {/* Placeholder map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-muted-foreground">
        <MapPin className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Mapa de Rastreamento</h2>
        <p className="text-sm max-w-md">
          Para visualizar o mapa, é necessário configurar a integração com Mapbox.
          <br />
          Acesse as configurações do projeto para adicionar sua chave de API.
        </p>
      </div>
    </div>
  );
}
