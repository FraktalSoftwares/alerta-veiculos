import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Search, Eye, EyeOff, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCPF, formatCNPJ, formatPhone, formatCEP, isValidEmail, isValidCPF, isValidCNPJ } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAllowedUserTypesToCreate, getDefaultUserTypeForCreation } from "@/lib/userTypeHierarchy";
import { useAdminRoles } from "@/hooks/useSettings";

// IDs fixos das roles padrão por tipo de cliente (criadas na migration)
const DEFAULT_ROLE_BY_CLIENT_TYPE: Record<string, string> = {
  associacao: "00000000-0000-0000-0000-000000000002",
  associado: "00000000-0000-0000-0000-000000000007",
  franquia: "00000000-0000-0000-0000-000000000006",
  franqueado: "00000000-0000-0000-0000-000000000008",
  frotista: "00000000-0000-0000-0000-000000000004",
  motorista: "00000000-0000-0000-0000-000000000005",
};

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedParentClientId?: string;
}

const ALL_STEPS = [
  { id: 1, label: "Dados Básicos" },
  { id: 2, label: "Endereço" },
  { id: 3, label: "Cobrança" },
  { id: 4, label: "Customização" },
  { id: 5, label: "Acesso e opções" },
];

// Associado inherits customization from parent Associação — skip step 4
const STEPS_WITHOUT_CUSTOMIZATION = ALL_STEPS.filter(s => s.id !== 4);

const generateRandomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export function NewClientModal({ isOpen, onClose, preselectedParentClientId }: NewClientModalProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const allowedUserTypes = useMemo(() => {
    return getAllowedUserTypesToCreate(profile?.user_type);
  }, [profile?.user_type]);

  const defaultUserType = useMemo(() => {
    return getDefaultUserTypeForCreation(profile?.user_type);
  }, [profile?.user_type]);

  // Step 1 - Dados Básicos
  const [dadosBasicos, setDadosBasicos] = useState({
    name: "",
    document_type: "cpf" as "cpf" | "cnpj",
    document_number: "",
    phone: "",
    email: "",
    birth_date: "",
    client_type: "motorista" as "associacao" | "associado" | "franquia" | "franqueado" | "frotista" | "motorista",
    status: "active" as "active" | "inactive" | "blocked",
  });

  const hasCustomization = dadosBasicos.client_type === "associacao" || dadosBasicos.client_type === "franquia" || dadosBasicos.client_type === "franqueado";
  const steps = hasCustomization ? ALL_STEPS : STEPS_WITHOUT_CUSTOMIZATION;
  const lastStepId = steps[steps.length - 1].id;

  // Sync defaultUserType when profile loads asynchronously
  useEffect(() => {
    if (defaultUserType) {
      setDadosBasicos(prev => ({ ...prev, client_type: defaultUserType as "associacao" | "associado" | "franquia" | "franqueado" | "frotista" | "motorista" }));
    }
  }, [defaultUserType]);

  // Step 2 - Endereço
  const [endereco, setEndereco] = useState({
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setEndereco(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        complement: data.complemento || prev.complement,
      }));
      toast.success("Endereço encontrado!");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setEndereco({ ...endereco, zip_code: formatted });

    if (formatted.replace(/\D/g, "").length === 8) {
      searchCep(formatted);
    }
  };

  const handleDocumentChange = (value: string) => {
    const formatted = dadosBasicos.document_type === "cpf"
      ? formatCPF(value)
      : formatCNPJ(value);
    setDadosBasicos({ ...dadosBasicos, document_number: formatted });
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setDadosBasicos({ ...dadosBasicos, phone: formatted });
  };

  // Step 3 - Cobrança
  const [cobranca, setCobranca] = useState({
    billing_day: 10,
    payment_method: "pix",
    auto_billing: false,
    notes: "",
  });

  // Step 4 - Customização
  const [customizacao, setCustomizacao] = useState({
    primary_color: "#F59E0B",
    secondary_color: "#FFFFFF",
    logo_url: null as string | null,
    favicon_url: null as string | null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // Step 5 - Acesso e opções
  const [acesso, setAcesso] = useState({
    create_login: true,
    email: "",
    password: generateRandomPassword(),
    admin_role_id: "" as string,
    send_welcome_email: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const { data: adminRoles = [] } = useAdminRoles();

  // Auto-selecionar a função administrativa baseada no tipo de cliente
  useEffect(() => {
    const defaultRoleId = DEFAULT_ROLE_BY_CLIENT_TYPE[dadosBasicos.client_type];
    if (defaultRoleId) {
      setAcesso(prev => ({ ...prev, admin_role_id: defaultRoleId }));
    }
  }, [dadosBasicos.client_type]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (faviconPreview) URL.revokeObjectURL(faviconPreview);
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setCreatedClientId(null);
    setErrors({});
    setIsSaving(false);
    setDadosBasicos({
      name: "",
      document_type: "cpf",
      document_number: "",
      phone: "",
      email: "",
      birth_date: "",
      client_type: (defaultUserType as "associacao" | "associado" | "franquia" | "franqueado" | "frotista" | "motorista") || "motorista",
      status: "active",
    });
    setEndereco({
      zip_code: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    });
    setCobranca({
      billing_day: 10,
      payment_method: "pix",
      auto_billing: false,
      notes: "",
    });
    setCustomizacao({
      primary_color: "#F59E0B",
      secondary_color: "#FFFFFF",
      logo_url: null,
      favicon_url: null,
    });
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    if (faviconPreview) URL.revokeObjectURL(faviconPreview);
    setLogoFile(null);
    setFaviconFile(null);
    setLogoPreview(null);
    setFaviconPreview(null);
    setAcesso({
      create_login: true,
      email: "",
      password: generateRandomPassword(),
      admin_role_id: "",
      send_welcome_email: false,
    });
    setShowPassword(false);
  };

  // Navigation — only validates, NO API calls
  const handleNext = () => {
    if (currentStep === 1) {
      const newErrors: Record<string, boolean> = {};
      if (!dadosBasicos.name.trim()) newErrors.name = true;

      const docDigits = dadosBasicos.document_number.replace(/\D/g, "");
      const requiredDocLen = dadosBasicos.document_type === "cpf" ? 11 : 14;
      if (docDigits.length !== requiredDocLen) {
        newErrors.document_number = true;
      } else {
        const isDocValid = dadosBasicos.document_type === "cpf"
          ? isValidCPF(docDigits)
          : isValidCNPJ(docDigits);
        if (!isDocValid) newErrors.document_number = true;
      }

      const phoneDigits = dadosBasicos.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) newErrors.phone = true;

      if (!dadosBasicos.birth_date) newErrors.birth_date = true;

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error("Preencha os campos obrigatórios corretamente");
        return;
      }

      // Pre-fill email for access step
      if (dadosBasicos.email && !acesso.email) {
        setAcesso(prev => ({ ...prev, email: dadosBasicos.email }));
      }
    }

    // Skip customization step for associado
    const nextStep = currentStep + 1;
    if (nextStep === 4 && !hasCustomization) {
      setCurrentStep(5);
    } else {
      setCurrentStep(nextStep);
    }
  };

  // Final save — ALL records created here
  const handleFinish = async () => {
    // Validate step 5 if creating login
    if (acesso.create_login) {
      if (!acesso.email || !isValidEmail(acesso.email)) {
        toast.error("Digite um email válido para o acesso");
        return;
      }
      if (!acesso.password || acesso.password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSaving(true);

    try {
      let clientId = createdClientId;

      // 1. Create client (skip if retrying after partial failure)
      if (!clientId) {
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            owner_id: user.id,
            name: dadosBasicos.name.trim(),
            document_type: dadosBasicos.document_type,
            document_number: dadosBasicos.document_number.replace(/\D/g, ""),
            phone: dadosBasicos.phone.replace(/\D/g, ""),
            email: dadosBasicos.email || null,
            birth_date: dadosBasicos.birth_date || null,
            client_type: dadosBasicos.client_type,
            status: dadosBasicos.status,
            parent_client_id: preselectedParentClientId || null,
          })
          .select()
          .single();

        if (clientError) throw new Error(`Erro ao criar cliente: ${clientError.message}`);
        clientId = client.id;
        setCreatedClientId(clientId);
      }

      // 2. Create address (if any field is filled)
      const hasAddressData = endereco.zip_code || endereco.street || endereco.number ||
                             endereco.city || endereco.neighborhood || endereco.state;
      if (hasAddressData) {
        // Remove existing address from a previous failed attempt
        await supabase.from("addresses").delete().eq("client_id", clientId);

        const { error: addressError } = await supabase
          .from("addresses")
          .insert({
            client_id: clientId,
            zip_code: endereco.zip_code.replace(/\D/g, "") || null,
            street: endereco.street || null,
            number: endereco.number || null,
            complement: endereco.complement || null,
            neighborhood: endereco.neighborhood || null,
            city: endereco.city || null,
            state: endereco.state || null,
          });

        if (addressError) throw new Error(`Erro ao salvar endereço: ${addressError.message}`);
      }

      // 3. Save billing settings (upsert is safe for retries)
      const { error: billingError } = await supabase
        .from("billing_settings")
        .upsert({
          client_id: clientId,
          billing_day: cobranca.billing_day,
          payment_method: cobranca.payment_method,
          auto_billing: cobranca.auto_billing,
          notes: cobranca.notes || null,
        }, { onConflict: "client_id" });

      if (billingError) throw new Error(`Erro ao salvar cobrança: ${billingError.message}`);

      // 4. Save customization (upload assets first)
      let logoUrl = customizacao.logo_url;
      let faviconUrl = customizacao.favicon_url;

      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const logoPath = `${clientId}/logo-${Date.now()}.${fileExt}`;
        const { error: logoUploadError } = await supabase.storage
          .from("client-assets")
          .upload(logoPath, logoFile, { upsert: true });
        if (logoUploadError) throw new Error(`Erro ao fazer upload do logo: ${logoUploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from("client-assets").getPublicUrl(logoPath);
        logoUrl = publicUrl;
      }

      if (faviconFile) {
        const fileExt = faviconFile.name.split(".").pop();
        const faviconPath = `${clientId}/favicon-${Date.now()}.${fileExt}`;
        const { error: faviconUploadError } = await supabase.storage
          .from("client-assets")
          .upload(faviconPath, faviconFile, { upsert: true });
        if (faviconUploadError) throw new Error(`Erro ao fazer upload do favicon: ${faviconUploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from("client-assets").getPublicUrl(faviconPath);
        faviconUrl = publicUrl;
      }

      const { error: customError } = await supabase
        .from("client_customization")
        .upsert({
          client_id: clientId,
          primary_color: customizacao.primary_color,
          secondary_color: customizacao.secondary_color,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
        }, { onConflict: "client_id" });

      if (customError) throw new Error(`Erro ao salvar customização: ${customError.message}`);

      // 5. Create user access if enabled
      if (acesso.create_login) {
        const { data: result, error: funcError } = await supabase.functions.invoke("create-client-user", {
          body: {
            client_id: clientId,
            email: acesso.email,
            password: acesso.password,
            admin_role_id: acesso.admin_role_id || undefined,
            send_welcome_email: acesso.send_welcome_email,
          },
        });

        if (funcError) throw new Error(`Erro ao criar acesso: ${funcError.message}`);
        if (result?.error) throw new Error(result.error);

        if (acesso.send_welcome_email && result?.welcome_email?.sent) {
          toast.success("Cliente cadastrado e e-mail de boas-vindas enviado!");
        } else if (acesso.send_welcome_email && !result?.welcome_email?.sent) {
          toast.success("Cliente cadastrado com sucesso!");
          toast.warning("Não foi possível enviar o e-mail de boas-vindas. Verifique a configuração do serviço de e-mail.");
        } else {
          toast.success("Cliente cadastrado com sucesso!");
        }
      } else {
        toast.success("Cliente cadastrado com sucesso!");
      }

      // Invalidate queries to refresh client list
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao finalizar cadastro. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              currentStep > step.id
                ? "bg-primary text-primary-foreground"
                : currentStep === step.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step.id ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 mx-1",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Dados Básicos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">Nome Completo<span className="text-destructive">*</span></Label>
          <Input
            id="name"
            value={dadosBasicos.name}
            onChange={(e) => { setDadosBasicos({ ...dadosBasicos, name: e.target.value }); setErrors((prev) => ({ ...prev, name: false })); }}
            placeholder="Nome do cliente"
            className={errors.name ? "border-destructive ring-destructive/30 ring-2" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">Nome é obrigatório</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo do Documento<span className="text-destructive">*</span></Label>
          <Select
            value={dadosBasicos.document_type}
            onValueChange={(value: "cpf" | "cnpj") =>
              setDadosBasicos({ ...dadosBasicos, document_type: value, document_number: "" })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Documento<span className="text-destructive">*</span></Label>
          <Input
            value={dadosBasicos.document_number}
            onChange={(e) => { handleDocumentChange(e.target.value); setErrors((prev) => ({ ...prev, document_number: false })); }}
            placeholder={dadosBasicos.document_type === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            maxLength={dadosBasicos.document_type === "cpf" ? 14 : 18}
            className={errors.document_number ? "border-destructive ring-destructive/30 ring-2" : ""}
          />
          {errors.document_number && <p className="text-xs text-destructive">{dadosBasicos.document_type === "cpf" ? "CPF inválido" : "CNPJ inválido"}</p>}
        </div>

        <div className="space-y-2">
          <Label>Telefone<span className="text-destructive">*</span></Label>
          <Input
            value={dadosBasicos.phone}
            onChange={(e) => { handlePhoneChange(e.target.value); setErrors((prev) => ({ ...prev, phone: false })); }}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className={errors.phone ? "border-destructive ring-destructive/30 ring-2" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive">Telefone inválido (mín. 10 dígitos)</p>}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={dadosBasicos.email}
            onChange={(e) => setDadosBasicos({ ...dadosBasicos, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Data de Nascimento<span className="text-destructive">*</span></Label>
          <Input
            type="date"
            value={dadosBasicos.birth_date}
            onChange={(e) => { setDadosBasicos({ ...dadosBasicos, birth_date: e.target.value }); setErrors((prev) => ({ ...prev, birth_date: false })); }}
            className={errors.birth_date ? "border-destructive ring-destructive/30 ring-2" : ""}
          />
          {errors.birth_date && <p className="text-xs text-destructive">Data de nascimento é obrigatória</p>}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={dadosBasicos.status}
            onValueChange={(value: "active" | "inactive" | "blocked") =>
              setDadosBasicos({ ...dadosBasicos, status: value })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Tipo de Usuário</Label>
        <RadioGroup
          value={dadosBasicos.client_type}
          onValueChange={(value: "associacao" | "associado" | "franquia" | "franqueado" | "frotista" | "motorista") =>
            setDadosBasicos({ ...dadosBasicos, client_type: value })
          }
          className="flex flex-wrap gap-6"
        >
          {allowedUserTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <RadioGroupItem value={type.value} id={`new-${type.value}`} />
              <Label htmlFor={`new-${type.value}`}>{type.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CEP</Label>
          <div className="flex gap-2">
            <Input
              value={endereco.zip_code}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => searchCep(endereco.zip_code)}
              disabled={isLoadingCep || endereco.zip_code.replace(/\D/g, "").length !== 8}
            >
              {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Rua</Label>
          <Input
            value={endereco.street}
            onChange={(e) => setEndereco({ ...endereco, street: e.target.value })}
            placeholder="Nome da rua"
          />
        </div>

        <div className="space-y-2">
          <Label>Número</Label>
          <Input
            value={endereco.number}
            onChange={(e) => setEndereco({ ...endereco, number: e.target.value })}
            placeholder="123"
          />
        </div>

        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input
            value={endereco.complement}
            onChange={(e) => setEndereco({ ...endereco, complement: e.target.value })}
            placeholder="Apto, Sala, etc."
          />
        </div>

        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input
            value={endereco.neighborhood}
            onChange={(e) => setEndereco({ ...endereco, neighborhood: e.target.value })}
            placeholder="Bairro"
          />
        </div>

        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            value={endereco.city}
            onChange={(e) => setEndereco({ ...endereco, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={endereco.state}
            onValueChange={(value) => setEndereco({ ...endereco, state: value })}
          >
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Cobrança</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dia de Vencimento</Label>
          <Input
            type="number"
            min={1}
            max={28}
            value={cobranca.billing_day}
            onChange={(e) => setCobranca({ ...cobranca, billing_day: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Forma de Pagamento</Label>
          <Select
            value={cobranca.payment_method}
            onValueChange={(value) => setCobranca({ ...cobranca, payment_method: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="cartao">Cartão de Crédito</SelectItem>
              <SelectItem value="debito">Débito Automático</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto-billing"
            checked={cobranca.auto_billing}
            onCheckedChange={(checked) => setCobranca({ ...cobranca, auto_billing: checked })}
          />
          <Label htmlFor="auto-billing">Cobrança Automática</Label>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={cobranca.notes}
            onChange={(e) => setCobranca({ ...cobranca, notes: e.target.value })}
            placeholder="Observações sobre cobrança..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Customização</h3>

      {/* Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor Principal</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={customizacao.primary_color}
              onChange={(e) => setCustomizacao({ ...customizacao, primary_color: e.target.value })}
              className="w-12 h-10 rounded border cursor-pointer"
            />
            <Input
              value={customizacao.primary_color}
              onChange={(e) => setCustomizacao({ ...customizacao, primary_color: e.target.value })}
              placeholder="#F59E0B"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={customizacao.secondary_color}
              onChange={(e) => setCustomizacao({ ...customizacao, secondary_color: e.target.value })}
              className="w-12 h-10 rounded border cursor-pointer"
            />
            <Input
              value={customizacao.secondary_color}
              onChange={(e) => setCustomizacao({ ...customizacao, secondary_color: e.target.value })}
              placeholder="#FFFFFF"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain border rounded" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full"
                onClick={() => { if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoFile(null); setLogoPreview(null); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Escolher arquivo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          )}
        </div>
      </div>

      {/* Favicon Upload */}
      <div className="space-y-2">
        <Label>Favicon</Label>
        <div className="flex items-center gap-4">
          {faviconPreview ? (
            <div className="relative">
              <img src={faviconPreview} alt="Favicon preview" className="h-10 w-10 object-contain border rounded" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full"
                onClick={() => { if (faviconPreview) URL.revokeObjectURL(faviconPreview); setFaviconFile(null); setFaviconPreview(null); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Escolher arquivo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFaviconChange} />
            </label>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border rounded-lg">
        <Label className="text-sm text-muted-foreground mb-2 block">Pré-visualização do Header</Label>
        <div
          className="h-12 rounded flex items-center px-4 gap-3"
          style={{ backgroundColor: customizacao.primary_color }}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-24 bg-white/20 rounded flex items-center justify-center text-xs text-white">
              Logo
            </div>
          )}
          <span className="text-white font-medium text-sm">{dadosBasicos.name || "Nome do Cliente"}</span>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Acesso e Opções</h3>

      {/* User Access Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Label>Criar Login para o Cliente</Label>
            <p className="text-sm text-muted-foreground">
              Permite que o cliente acesse o sistema
            </p>
          </div>
          <Switch
            checked={acesso.create_login}
            onCheckedChange={(checked) => setAcesso({ ...acesso, create_login: checked })}
          />
        </div>

        {acesso.create_login && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Email de Acesso<span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={acesso.email}
                onChange={(e) => setAcesso({ ...acesso, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Senha<span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={acesso.password}
                    onChange={(e) => setAcesso({ ...acesso, password: e.target.value })}
                    placeholder="Senha de acesso"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAcesso({ ...acesso, password: generateRandomPassword() })}
                >
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres. Clique em "Gerar" para criar uma senha aleatória.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Enviar Email de Boas-vindas</Label>
                <p className="text-sm text-muted-foreground">
                  Envia credenciais por email ao cliente
                </p>
              </div>
              <Switch
                checked={acesso.send_welcome_email}
                onCheckedChange={(checked) => setAcesso({ ...acesso, send_welcome_email: checked })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente - {ALL_STEPS[currentStep - 1].label}</DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}
        {renderCurrentStep()}

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep <= 1) { handleClose(); return; }
              const prevStep = currentStep - 1;
              // Skip customization step for associado
              if (prevStep === 4 && !hasCustomization) {
                setCurrentStep(3);
              } else {
                setCurrentStep(prevStep);
              }
            }}
            disabled={isSaving}
          >
            {currentStep === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {currentStep < lastStepId ? (
            <Button
              onClick={handleNext}
              className="bg-foreground hover:bg-foreground/90 text-background"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Finalizar Cadastro"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
