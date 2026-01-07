import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, ChevronRight, ChevronLeft, MapPin, Car, Users, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateVehicle } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useAvailableEquipments, useLinkEquipmentToVehicle } from "@/hooks/useEquipment";
import { formatPlate, isValidPlate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

interface NewVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
}

interface SelectedEquipment {
  id: string;
  serial_number: string;
  imei: string | null;
  chip_operator: string | null;
  products: { id: string; title: string; model: string | null } | null;
}

export interface VehicleFormData {
  // Step 1
  cliente: string;
  clienteId: string;
  rastreadorId: string;
  rastreadorInfo: string;
  // Step 2
  tipo: string;
  marca: string;
  cor: string;
  ano: string;
  hodometro: string;
  modelo: string;
  placa: string;
  responsavel: string;
  responsavelId: string;
  // Step 3
  alertas: string[];
  comandos: string[];
}

const STEP_LABELS = [
  { icon: MapPin, label: "Dados do\nRastreador" },
  { icon: Car, label: "Dados do\nveículo" },
  { icon: Users, label: "Opções de\nRastreamento" },
];

const ALERTAS_OPTIONS = [
  { id: "movimento", label: "Rastreador em movimento", defaultChecked: true },
  { id: "ignicao_ligada", label: "Ignição ligada", defaultChecked: true },
  { id: "ignicao_desligada", label: "Ignição desligada", defaultChecked: true },
  { id: "cerca_violada", label: "Cerca virtual violada", defaultChecked: false },
  { id: "limite_velocidade", label: "Limite de velocidade", defaultChecked: false },
  { id: "bateria_fraca", label: "Bateria fraca", defaultChecked: false },
  { id: "desconectado", label: "Desconectado da fonte de energia", defaultChecked: false },
];

const COMANDOS_OPTIONS = [
  { id: "alterar_velocidade", label: "Alterar limite de velocidade", defaultChecked: true },
  { id: "ativar_alerta", label: "Ativar / desativar alerta de movimento", defaultChecked: true },
  { id: "bloquear", label: "Bloquear / desbloquear veículo", defaultChecked: true },
];

export function NewVehicleModal({ open, onOpenChange, preselectedClientId }: NewVehicleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSearch, setClientSearch] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [responsavelSearch, setResponsavelSearch] = useState("");
  const [responsavelTipoFilter, setResponsavelTipoFilter] = useState<string>("");
  const [formData, setFormData] = useState<VehicleFormData>({
    cliente: "",
    clienteId: preselectedClientId || "",
    rastreadorId: "",
    rastreadorInfo: "",
    tipo: "",
    marca: "",
    cor: "",
    ano: "",
    hodometro: "",
    modelo: "",
    placa: "",
    responsavel: "",
    responsavelId: "",
    alertas: ALERTAS_OPTIONS.filter(a => a.defaultChecked).map(a => a.id),
    comandos: COMANDOS_OPTIONS.filter(c => c.defaultChecked).map(c => c.id),
  });

  const { toast } = useToast();
  const createVehicle = useCreateVehicle();
  const linkEquipment = useLinkEquipmentToVehicle();
  const { data: clientsData } = useClients({ search: clientSearch });
  const { data: responsaveisData } = useClients({ 
    search: responsavelSearch,
    clientType: responsavelTipoFilter || undefined
  });
  const { data: availableEquipments = [] } = useAvailableEquipments(equipmentSearch);

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit
      if (!formData.clienteId || !formData.placa) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o cliente e a placa do veículo.",
          variant: "destructive",
        });
        return;
      }
      
      // Validar placa
      if (!isValidPlate(formData.placa)) {
        toast({
          title: "Placa inválida",
          description: "Por favor, informe uma placa válida (formato: ABC-1234 ou ABC1D23).",
          variant: "destructive",
        });
        return;
      }
      
      // Validar ano se fornecido
      let yearValue: number | undefined = undefined;
      if (formData.ano) {
        const parsedYear = parseInt(formData.ano, 10);
        if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear() + 1) {
          toast({
            title: "Ano inválido",
            description: "Por favor, informe um ano válido.",
            variant: "destructive",
          });
          return;
        }
        yearValue = parsedYear;
      }
      
      // Remover hífen da placa antes de enviar (se houver)
      const plateToSend = formData.placa.replace(/-/g, '').toUpperCase();
      
      createVehicle.mutate({
        client_id: formData.clienteId,
        plate: plateToSend,
        vehicle_type: formData.tipo || undefined,
        brand: formData.marca || undefined,
        model: formData.modelo || undefined,
        year: yearValue,
        color: formData.cor || undefined,
      }, {
        onSuccess: (newVehicle) => {
          // Se tiver rastreador selecionado, vincular ao veículo
          if (formData.rastreadorId && newVehicle?.id) {
            linkEquipment.mutate({
              equipmentId: formData.rastreadorId,
              vehicleId: newVehicle.id,
            });
          }
          
          onOpenChange(false);
          setCurrentStep(1);
          setEquipmentSearch("");
          setFormData({
            cliente: "",
            clienteId: preselectedClientId || "",
            rastreadorId: "",
            rastreadorInfo: "",
            tipo: "",
            marca: "",
            cor: "",
            ano: "",
            hodometro: "",
            modelo: "",
            placa: "",
            responsavel: "",
            responsavelId: "",
            alertas: ALERTAS_OPTIONS.filter(a => a.defaultChecked).map(a => a.id),
            comandos: COMANDOS_OPTIONS.filter(c => c.defaultChecked).map(c => c.id),
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar veículo",
            description: error.message || "Ocorreu um erro ao tentar cadastrar o veículo. Tente novamente.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAlertChange = (alertId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      alertas: checked 
        ? [...prev.alertas, alertId]
        : prev.alertas.filter(id => id !== alertId)
    }));
  };

  const handleComandoChange = (comandoId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      comandos: checked 
        ? [...prev.comandos, comandoId]
        : prev.comandos.filter(id => id !== comandoId)
    }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep(1);
    }
    onOpenChange(isOpen);
  };

  const selectClient = (clientId: string, clientName: string) => {
    setFormData(prev => ({ ...prev, clienteId: clientId, cliente: clientName }));
    setClientSearch("");
  };

  const selectEquipment = (equipment: SelectedEquipment) => {
    const info = `${equipment.serial_number}${equipment.imei ? ` - IMEI: ${equipment.imei}` : ''}`;
    setFormData(prev => ({ ...prev, rastreadorId: equipment.id, rastreadorInfo: info }));
    setEquipmentSearch("");
  };

  const clearEquipment = () => {
    setFormData(prev => ({ ...prev, rastreadorId: "", rastreadorInfo: "" }));
  };

  const selectResponsavel = (clientId: string, clientName: string) => {
    setFormData(prev => ({ ...prev, responsavelId: clientId, responsavel: clientName }));
    setResponsavelSearch("");
  };

  const clearResponsavel = () => {
    setFormData(prev => ({ ...prev, responsavelId: "", responsavel: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">
            Cadastrar Veículo
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Stepper */}
          <div className="border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              {STEP_LABELS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                const isPending = stepNumber > currentStep;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 relative",
                          isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                          isCompleted && "bg-green-500 text-white",
                          isPending && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-6 w-6" />
                        )}
                      </div>
                      <span 
                        className={cn(
                          "text-xs mt-2 text-center whitespace-pre-line transition-colors",
                          isActive && "text-foreground font-semibold",
                          isCompleted && "text-green-600 dark:text-green-400 font-medium",
                          isPending && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEP_LABELS.length - 1 && (
                      <div
                        className={cn(
                          "h-1 w-32 mx-4 rounded-full transition-colors",
                          isCompleted ? "bg-green-500" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Selecionar cliente */}
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Selecionar cliente</h3>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Buscar cliente</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.cliente || clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        if (formData.cliente) {
                          setFormData(prev => ({ ...prev, cliente: "", clienteId: "" }));
                        }
                      }}
                      placeholder="Digite o nome do cliente"
                      className="bg-background pl-10"
                    />
                  </div>
                  {clientSearch && clientsData?.clients && clientsData.clients.length > 0 && (
                    <div className="border border-border rounded-md mt-2 max-h-40 overflow-y-auto">
                      {clientsData.clients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client.id, client.name)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
                        >
                          {client.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.clienteId && (
                    <p className="text-xs text-muted-foreground">Cliente selecionado: {formData.cliente}</p>
                  )}
                </div>
              </div>

              {/* Rastreador */}
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Rastreador</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Buscar</Label>
                    
                    {formData.rastreadorId ? (
                      <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1">{formData.rastreadorInfo}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={clearEquipment}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Pesquise pelo modelo ou IMEI"
                            value={equipmentSearch}
                            onChange={(e) => setEquipmentSearch(e.target.value)}
                            className="bg-background pl-10"
                          />
                        </div>
                        
                        {/* Lista de equipamentos disponíveis */}
                        {availableEquipments.length > 0 && (
                          <div className="border border-border rounded-md mt-2 max-h-48 overflow-y-auto">
                            {availableEquipments.map((equipment) => (
                              <button
                                key={equipment.id}
                                type="button"
                                onClick={() => selectEquipment(equipment as SelectedEquipment)}
                                className="w-full text-left px-3 py-3 hover:bg-muted/50 text-sm border-b border-border last:border-b-0"
                              >
                                <div className="font-medium">{equipment.serial_number}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    IMEI: {equipment.imei || 'N/A'}
                                  </span>
                                  {equipment.chip_operator && (
                                    <span>Operadora: {equipment.chip_operator}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {equipmentSearch && availableEquipments.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Nenhum rastreador disponível encontrado
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <Button variant="outline" className="text-accent border-accent hover:bg-accent/10 gap-2">
                    <Plus className="h-4 w-4" />
                    Cadastrar Rastreador
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Dados do Veículo</h3>
              <div className="space-y-6">
                {/* Placa - Required */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Placa *</Label>
                  <Input
                    placeholder="ABC-1234"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: formatPlate(e.target.value) })}
                    className="bg-background max-w-xs"
                    maxLength={8}
                    required
                  />
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Tipo</Label>
                    <Input
                      placeholder="Carro"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Marca</Label>
                    <Input
                      placeholder="Ford"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Cor</Label>
                    <Input
                      placeholder="Digite a cor do veículo"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Ano</Label>
                    <Input
                      placeholder="2011"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Hodômetro</Label>
                    <Input
                      placeholder="0"
                      value={formData.hodometro}
                      onChange={(e) => setFormData({ ...formData, hodometro: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Modelo</Label>
                    <Input
                      placeholder="Digite o modelo do veículo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Responsável */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Responsável ou motorista</Label>
                  
                  {formData.responsavelId ? (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm flex-1">{formData.responsavel}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={clearResponsavel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Filtro por tipo */}
                      <div className="flex gap-2 mb-2">
                        <Button
                          type="button"
                          variant={responsavelTipoFilter === "" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponsavelTipoFilter("")}
                          className="text-xs"
                        >
                          Todos
                        </Button>
                        <Button
                          type="button"
                          variant={responsavelTipoFilter === "motorista" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponsavelTipoFilter("motorista")}
                          className="text-xs"
                        >
                          Motorista
                        </Button>
                        <Button
                          type="button"
                          variant={responsavelTipoFilter === "frotista" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setResponsavelTipoFilter("frotista")}
                          className="text-xs"
                        >
                          Frotista
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar cliente por nome..."
                          value={responsavelSearch}
                          onChange={(e) => setResponsavelSearch(e.target.value)}
                          className="bg-background pl-10"
                        />
                      </div>
                      
                      {(responsavelSearch || responsavelTipoFilter) && responsaveisData?.clients && responsaveisData.clients.length > 0 && (
                        <div className="border border-border rounded-md mt-2 max-h-40 overflow-y-auto">
                          {responsaveisData.clients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => selectResponsavel(client.id, client.name)}
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center justify-between"
                            >
                              <span>{client.name}</span>
                              <span className="text-xs text-muted-foreground capitalize">{client.type}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {responsavelSearch && responsaveisData?.clients?.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Nenhum cliente encontrado
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Opções de rastreamento</h3>
              <div className="grid grid-cols-2 gap-8">
                {/* Alertas */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Alertas Emitidos</h4>
                  <div className="space-y-3">
                    {ALERTAS_OPTIONS.map((alerta) => (
                      <div key={alerta.id} className="flex items-center gap-3">
                        <Checkbox
                          id={alerta.id}
                          checked={formData.alertas.includes(alerta.id)}
                          onCheckedChange={(checked) => handleAlertChange(alerta.id, checked as boolean)}
                        />
                        <Label htmlFor={alerta.id} className="text-sm font-normal cursor-pointer">
                          {alerta.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comandos */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Comandos Habilitados para o cliente</h4>
                  <div className="space-y-3">
                    {COMANDOS_OPTIONS.map((comando) => (
                      <div key={comando.id} className="flex items-center gap-3">
                        <Checkbox
                          id={comando.id}
                          checked={formData.comandos.includes(comando.id)}
                          onCheckedChange={(checked) => handleComandoChange(comando.id, checked as boolean)}
                        />
                        <Label htmlFor={comando.id} className="text-sm font-normal cursor-pointer">
                          {comando.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-end gap-4 mt-6">
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-foreground text-background hover:bg-foreground/90 gap-2"
              disabled={createVehicle.isPending}
            >
              {createVehicle.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  {currentStep === 3 ? "Finalizar" : "Próximo"}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
