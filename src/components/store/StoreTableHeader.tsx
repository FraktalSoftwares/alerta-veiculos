export function StoreTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_140px_100px_100px_120px_100px_80px] gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border">
      <div>Título</div>
      <div>Veículo</div>
      <div>Frequência</div>
      <div>Modelo</div>
      <div>Marca</div>
      <div className="text-right">Quantidade</div>
      <div className="text-right">Ações</div>
    </div>
  );
}
