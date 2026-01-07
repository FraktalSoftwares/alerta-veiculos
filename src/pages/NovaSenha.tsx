import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Check, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { newPasswordSchema } from "@/lib/validations/auth";
import { supabase } from "@/integrations/supabase/client";
import loginBg from "@/assets/login-bg.png";

const NovaSenha = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // User needs to have a session (from clicking the recovery link)
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error('Link de recuperação inválido ou expirado');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erro ao atualizar senha');
      return;
    }

    toast.success("Senha alterada com sucesso!");
    navigate("/login");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-muted/30 p-8">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg overflow-hidden">
            {/* Logo Header */}
            <div className="bg-foreground py-6 px-8 flex justify-center">
              <img src="/logo_alerta.png" alt="Alerta Rastreamento" className="h-10" />
            </div>

            {/* Form Content */}
            <div className="p-8">
              <h1 className="text-2xl font-semibold text-center text-foreground mb-6">
                Redefinir senha
              </h1>

              {!isValidSession ? (
                <div className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Link inválido
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Este link de recuperação é inválido ou já expirou. Solicite um novo link.
                    </p>
                  </div>

                  <Link to="/esqueceu-senha">
                    <Button className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background gap-2">
                      Solicitar novo link
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Criar nova senha
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Digite sua nova senha abaixo. A senha deve ter pelo menos 6 caracteres.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 h-12"
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-11 h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Salvar nova senha
                        </>
                      )}
                    </Button>

                    <Link
                      to="/login"
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para o login
                    </Link>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Background Image with Logo */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat items-center justify-center"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <img src="/logo_alerta.png" alt="Alerta Rastreamento" className="h-20" />
      </div>
    </div>
  );
};

export default NovaSenha;
