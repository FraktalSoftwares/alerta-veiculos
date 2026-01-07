import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { resetPasswordSchema } from "@/lib/validations/auth";
import loginBg from "@/assets/login-bg.png";

const EsqueceuSenha = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = resetPasswordSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
      return;
    }

    setEmailSent(true);
    toast.success("Email de recuperação enviado com sucesso!");
  };

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
                Recuperação de senha
              </h1>

              {emailSent ? (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                      Email enviado!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background gap-2"
                  >
                    Voltar para o login
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Esqueceu sua senha?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Insira seu e-mail cadastrado. Nós enviaremos para ele uma mensagem de redefinição de senha.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seunome@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-11 h-12"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <span className="text-sm text-muted-foreground">
                        Tem uma senha?
                      </span>
                      <Link
                        to="/login"
                        className="text-sm text-foreground underline ml-1 hover:text-primary transition-colors"
                      >
                        Faça login.
                      </Link>
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
                          Enviar email de recuperação de senha
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
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

export default EsqueceuSenha;
