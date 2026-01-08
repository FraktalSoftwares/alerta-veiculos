export function SubscriptionTableHeader() {
  return (
    <div className="grid grid-cols-[200px_1fr_120px_120px_100px_100px_80px] gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border">
      <div>Cliente</div>
      <div>Descrição</div>
      <div>Valor</div>
      <div>Período</div>
      <div>Status</div>
      <div>Vencimento</div>
      <div className="text-right">Ações</div>
    </div>
  );
}

