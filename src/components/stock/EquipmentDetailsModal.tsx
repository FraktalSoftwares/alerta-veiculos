import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEquipmentFullDetails } from "@/hooks/useEquipment";
import { EquipmentDisplay } from "@/types/equipment";
import {
  Loader2,
  Radio,
  User,
  Car,
  Building2,
  Package,
  Hash,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

interface EquipmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentDisplay | null;
}

const statusLabel: Record<string, string> = {
  available: "Disponível",
  installed: "Instalado",
  maintenance: "Manutenção",
  defective: "Defeito",
  in_store: "Na Loja",
};

function fmtDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

function fmtCurrency(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value || "-"}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

export function EquipmentDetailsModal({ isOpen, onClose, equipment }: EquipmentDetailsModalProps) {
  const { data, isLoading } = useEquipmentFullDetails(isOpen ? equipment?.id : undefined);

  const eq = data?.equipment;
  const owner = data?.owner;
  const vehicle = data?.vehicle;
  const client = data?.client;
  const product = data?.product;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Detalhes do Rastreador
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] px-6 pb-6">
          {isLoading || !data ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <Section icon={Hash} title="Equipamento">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Nome" value={product?.title || "Rastreador GPS"} />
                  <Field label="Modelo" value={(eq as any)?.model || product?.model} />
                  <Field
                    label="Status"
                    value={
                      <Badge variant="outline">
                        {statusLabel[eq?.status as string] || eq?.status || "-"}
                      </Badge>
                    }
                  />
                  <Field label="Serial" value={eq?.serial_number} />
                  <Field label="IMEI" value={eq?.imei} />
                  <Field label="Operadora" value={eq?.chip_operator} />
                  <Field label="Chip" value={eq?.chip_number} />
                  <Field label="Cadastrado em" value={fmtDate(eq?.created_at)} />
                  <Field label="Atualizado em" value={fmtDate(eq?.updated_at)} />
                </div>
              </Section>

              <Separator />

              <Section icon={Package} title="Produto">
                {product ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Título" value={product.title} />
                    <Field label="Modelo" value={product.model} />
                    <Field label="Preço" value={fmtCurrency(product.price)} />
                    {product.description && (
                      <div className="col-span-full">
                        <Field label="Descrição" value={product.description} />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem produto vinculado.</p>
                )}
              </Section>

              <Separator />

              <Section icon={User} title="Proprietário do Equipamento">
                {owner ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Nome" value={owner.full_name} />
                    <Field
                      label="Tipo"
                      value={
                        <Badge variant="secondary" className="capitalize">
                          {owner.user_type}
                        </Badge>
                      }
                    />
                    <Field
                      label="E-mail"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {owner.email}
                        </span>
                      }
                    />
                    {owner.phone && (
                      <Field
                        label="Telefone"
                        value={
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {owner.phone}
                          </span>
                        }
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem proprietário definido.</p>
                )}
              </Section>

              <Separator />

              <Section icon={Car} title="Veículo Vinculado">
                {vehicle ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Placa" value={vehicle.plate} />
                    <Field label="Tipo" value={vehicle.vehicle_type} />
                    <Field
                      label="Status"
                      value={
                        <Badge variant="outline" className="capitalize">
                          {vehicle.status || "-"}
                        </Badge>
                      }
                    />
                    <Field label="Marca" value={vehicle.brand} />
                    <Field label="Modelo" value={vehicle.model} />
                    <Field label="Ano" value={vehicle.year} />
                    <Field label="Cor" value={vehicle.color} />
                    <Field label="Chassi" value={vehicle.chassis} />
                    <Field label="Renavam" value={vehicle.renavam} />
                    <Field
                      label="Cadastrado em"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {fmtDate(vehicle.created_at)}
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Equipamento não está instalado em nenhum veículo.
                  </p>
                )}
              </Section>

              {client && (
                <>
                  <Separator />
                  <Section icon={Building2} title="Cliente do Veículo">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Field label="Nome" value={client.name} />
                      <Field label="Documento" value={client.document_number} />
                      <Field label="Tipo Doc." value={client.document_type} />
                      {client.email && (
                        <Field
                          label="E-mail"
                          value={
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {client.email}
                            </span>
                          }
                        />
                      )}
                      {client.phone && (
                        <Field
                          label="Telefone"
                          value={
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> {client.phone}
                            </span>
                          }
                        />
                      )}
                    </div>
                  </Section>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
