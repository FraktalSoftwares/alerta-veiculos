import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Camera, Upload, Mail, Save, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { 
  useClientCustomization, 
  useUpsertCustomization, 
  useUploadClientAsset,
  useCreateClientUser,
  useSendPasswordReset,
  useUpdateClientEmail 
} from "@/hooks/useClientAccess";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AcessoOpcoesTabProps {
  client: { 
    id: string; 
    email?: string | null;
    user_id?: string | null;
    name?: string;
  };
}

const DEFAULT_PRIMARY_COLOR = "#F59E0B";
const DEFAULT_SECONDARY_COLOR = "#FFFFFF";

export function AcessoOpcoesTab({ client }: AcessoOpcoesTabProps) {
  // Customization state
  const [isEditingColors, setIsEditingColors] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);
  
  // User access state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditEmailDialog, setShowEditEmailDialog] = useState(false);
  const [editEmail, setEditEmail] = useState("");

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { data: customization, isLoading: loadingCustomization } = useClientCustomization(client.id);
  const upsertCustomization = useUpsertCustomization();
  const uploadAsset = useUploadClientAsset();
  const createClientUser = useCreateClientUser();
  const sendPasswordReset = useSendPasswordReset();
  const updateClientEmail = useUpdateClientEmail();

  // Initialize colors from customization data
  useEffect(() => {
    if (customization) {
      setPrimaryColor(customization.primary_color || DEFAULT_PRIMARY_COLOR);
      setSecondaryColor(customization.secondary_color || DEFAULT_SECONDARY_COLOR);
    }
  }, [customization]);

  const handleSaveColors = async () => {
    await upsertCustomization.mutateAsync({
      client_id: client.id,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
    setIsEditingColors(false);
  };

  const handleResetColors = async () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setSecondaryColor(DEFAULT_SECONDARY_COLOR);
    await upsertCustomization.mutateAsync({
      client_id: client.id,
      primary_color: DEFAULT_PRIMARY_COLOR,
      secondary_color: DEFAULT_SECONDARY_COLOR,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const publicUrl = await uploadAsset.mutateAsync({
      clientId: client.id,
      file,
      type: 'logo',
    });

    await upsertCustomization.mutateAsync({
      client_id: client.id,
      logo_url: publicUrl,
    });
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const publicUrl = await uploadAsset.mutateAsync({
      clientId: client.id,
      file,
      type: 'favicon',
    });

    await upsertCustomization.mutateAsync({
      client_id: client.id,
      favicon_url: publicUrl,
    });
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) return;
    
    await createClientUser.mutateAsync({
      client_id: client.id,
      email: newEmail,
      password: newPassword,
    });

    setNewEmail("");
    setNewPassword("");
    setShowCreateUser(false);
  };

  const handleSendPasswordReset = async () => {
    if (!client.email) return;
    await sendPasswordReset.mutateAsync(client.email);
  };

  const handleUpdateEmail = async () => {
    if (!editEmail) return;
    await updateClientEmail.mutateAsync({
      clientId: client.id,
      email: editEmail,
    });
    setShowEditEmailDialog(false);
    setEditEmail("");
  };

  const hasUserAccess = !!client.user_id;

  if (loadingCustomization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customização */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Customização</h2>
        
        <Label className="text-foreground font-medium mb-4 block">Cores</Label>
        
        <div className="flex items-start gap-8 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24">Cor Principal</span>
              {isEditingColors ? (
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border-2 border-border cursor-pointer"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded border-2 border-border" 
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24">Cor de fundo</span>
              {isEditingColors ? (
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border-2 border-border cursor-pointer"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded border-2 border-border" 
                  style={{ backgroundColor: secondaryColor }}
                />
              )}
            </div>
            <button 
              onClick={handleResetColors}
              disabled={upsertCustomization.isPending}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Redefinir para padrão
            </button>
          </div>

          <div className="flex gap-4">
            <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 min-w-[140px]">
              {customization?.logo_url ? (
                <img 
                  src={customization.logo_url} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Logo expandida</span>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadAsset.isPending}
              >
                {uploadAsset.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Fazer upload
              </Button>
            </div>
            <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 min-w-[140px]">
              {customization?.favicon_url ? (
                <img 
                  src={customization.favicon_url} 
                  alt="Favicon" 
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Favicon</span>
              <input
                type="file"
                ref={faviconInputRef}
                onChange={handleFaviconUpload}
                accept="image/*"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadAsset.isPending}
              >
                {uploadAsset.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Fazer upload
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {isEditingColors ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditingColors(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button 
                onClick={handleSaveColors}
                disabled={upsertCustomization.isPending}
                className="bg-foreground hover:bg-foreground/90 text-background gap-2"
              >
                {upsertCustomization.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditingColors(true)}
              className="bg-foreground hover:bg-foreground/90 text-background gap-2"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </div>

      {/* Usuário e senha */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Usuário e senha</h2>
        
        {hasUserAccess ? (
          // User already has access - show email and options
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label className="text-muted-foreground">E-mail</Label>
              <Input 
                value={client.email || ""} 
                readOnly 
                className="bg-muted/50 border-border"
              />
              <button 
                onClick={() => {
                  setEditEmail(client.email || "");
                  setShowEditEmailDialog(true);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Editar E-mail
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Senha</Label>
              <Input 
                type="password"
                value="********" 
                readOnly 
                className="bg-muted/50 border-border"
              />
            </div>

            <Button 
              variant="outline" 
              className="gap-2 mt-4"
              onClick={handleSendPasswordReset}
              disabled={sendPasswordReset.isPending || !client.email}
            >
              {sendPasswordReset.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Enviar E-mail de Redefinição de Senha
            </Button>
          </div>
        ) : (
          // No user access - show create form
          <div className="space-y-4 max-w-md">
            {!showCreateUser ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Este cliente ainda não possui acesso ao sistema.
                </p>
                <Button 
                  onClick={() => setShowCreateUser(true)}
                  className="bg-foreground hover:bg-foreground/90 text-background"
                >
                  Criar Acesso
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">E-mail</Label>
                  <Input 
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Senha</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowCreateUser(false);
                      setNewEmail("");
                      setNewPassword("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={createClientUser.isPending || !newEmail || newPassword.length < 6}
                    className="bg-foreground hover:bg-foreground/90 text-background"
                  >
                    {createClientUser.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Criar Acesso
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Email Dialog */}
      <Dialog open={showEditEmailDialog} onOpenChange={setShowEditEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar E-mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo E-mail</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmailDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateEmail}
              disabled={updateClientEmail.isPending || !editEmail}
            >
              {updateClientEmail.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}