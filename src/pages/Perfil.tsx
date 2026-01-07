import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Shield, User, Mail, Phone, FileText, Pencil, Key } from "lucide-react";

const Perfil = () => {
  const { profile } = useAuth();
  const { data: roleInfo, isLoading } = useUserPermissions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      associacao: "Associação",
      franqueado: "Franqueado",
      frotista: "Frotista",
      motorista: "Motorista",
    };
    return labels[type] || type;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-[50px] py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Meu Perfil
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="gap-2">
              <Key className="h-4 w-4" />
              Alterar Senha
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar Perfil
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile?.full_name ? getInitials(profile.full_name) : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile?.full_name || "Usuário"}</CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="mt-2">
                  {profile?.user_type ? getUserTypeLabel(profile.user_type) : "Usuário"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile?.email || "-"}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.phone}</span>
                </div>
              )}
              {profile?.document_number && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {profile.document_type?.toUpperCase()}: {profile.document_number}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Permissões</CardTitle>
              </div>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : roleInfo?.roleName ? (
                  <span>
                    Função: <strong>{roleInfo.roleName}</strong>
                    {roleInfo.roleDescription && ` - ${roleInfo.roleDescription}`}
                  </span>
                ) : (
                  "Nenhuma função administrativa atribuída"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Skeleton key={j} className="h-8 w-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : roleInfo?.permissions && roleInfo.permissions.length > 0 ? (
                <div className="space-y-6">
                  {roleInfo.permissions.map((group) => (
                    <div key={group.groupName}>
                      <h3 className="font-semibold text-foreground mb-3">
                        {group.groupName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {group.items.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                          >
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-foreground truncate" title={permission.description}>
                              {permission.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não possui uma função administrativa atribuída.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entre em contato com um administrador para solicitar acesso.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <EditProfileModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          profile={profile}
        />

        <ChangePasswordModal
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        />
      </main>
    </div>
  );
};

export default Perfil;
