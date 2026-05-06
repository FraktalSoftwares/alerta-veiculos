import { useAuth } from "@/contexts/AuthContext";

export function StockTableHeader() {
  const { profile } = useAuth();
  const isAdmin = profile?.user_type === 'admin';

  return (
    <div className={`grid ${isAdmin ? 'grid-cols-[1fr_150px_120px_160px_100px_120px_140px_180px]' : 'grid-cols-[1fr_120px_160px_100px_120px_140px_180px]'} gap-4 px-6 py-4 text-sm font-medium text-muted-foreground border-b border-border`}>
      <div>Nome</div>
      {isAdmin && <div>Proprietário</div>}
      <div>Modelo</div>
      <div>IMEI/ESN</div>
      <div>Linha</div>
      <div>Modalidade</div>
      <div>Situação</div>
      <div className="text-right">Ações</div>
    </div>
  );
}
