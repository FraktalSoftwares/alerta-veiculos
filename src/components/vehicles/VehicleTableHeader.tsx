export function VehicleTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_80px_130px_110px_100px_100px_120px_100px_60px] gap-3 px-6 py-4 text-xs font-medium text-muted-foreground border-b border-border uppercase tracking-wide">
      <div>Cliente</div>
      <div>Tipo</div>
      <div>IMEI / ESN</div>
      <div>Placa / Descrição</div>
      <div>Rastreador</div>
      <div>Operadora</div>
      <div>Status</div>
      <div className="text-center">Situação</div>
      <div className="text-right">Ações</div>
    </div>
  );
}