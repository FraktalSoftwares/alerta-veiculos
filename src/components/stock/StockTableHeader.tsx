export function StockTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_120px_160px_100px_120px_140px_100px] gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border">
      <div>Nome</div>
      <div>Modelo</div>
      <div>IMEI/ESN</div>
      <div>Linha</div>
      <div>Modalidade</div>
      <div>Situação</div>
      <div className="text-right">Ações</div>
    </div>
  );
}
