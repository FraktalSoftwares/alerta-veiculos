export function ClientTableHeader() {
  return (
    <div className="grid grid-cols-[80px_120px_1fr_100px_140px_120px_100px_140px_100px_80px] gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border bg-table-header">
      <div>#</div>
      <div>Tipo</div>
      <div>Nome</div>
      <div className="text-center">Veículos Totais</div>
      <div className="text-center">Veículos Rastreados</div>
      <div className="text-center">Sem Sinal (GPS)</div>
      <div className="text-center">Desligados</div>
      <div>Última Atualização</div>
      <div>Situação</div>
      <div className="text-right">Ações</div>
    </div>
  );
}
