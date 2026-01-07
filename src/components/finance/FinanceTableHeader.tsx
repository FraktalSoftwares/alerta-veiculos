export function FinanceTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_120px_1fr_120px_120px_100px_80px] gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border">
      <div>Cliente</div>
      <div>Tipo</div>
      <div>Descrição</div>
      <div className="text-right">Valor</div>
      <div>Vencimento</div>
      <div>Situação</div>
      <div className="text-right">Ações</div>
    </div>
  );
}
