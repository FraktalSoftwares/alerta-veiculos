import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema } from "@/lib/validations/auth";
import logoAlerta from "@/assets/logo-alerta.png";
import logoAlertaLarge from "@/assets/logo-alerta-large.png";
import loginBg from "@/assets/login-bg.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Por favor, confirme seu email antes de fazer login');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
      }
      return;
    }

    toast.success("Login realizado com sucesso!");
  };

  if (authLoading) {
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
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            {/* Logo Header */}
            <div className="bg-foreground py-6 px-8 flex justify-center box-content">
              <img src={logoAlerta} alt="Alerta Rastreamento" className="h-10" style={{ width: '113px', height: '50px' }} />
            </div>

            {/* Form Content */}
            <div className="p-8">
              <h1 className="text-2xl font-semibold text-center text-foreground mb-8">
                Boas vindas novamente!
              </h1>

              <form onSubmit={handleLogin} className="space-y-5">
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

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
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
                </div>

                <div className="text-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    Esqueceu sua senha?
                  </span>
                  <Link
                    to="/esqueceu-senha"
                    className="text-sm text-foreground underline ml-1 hover:text-primary transition-colors"
                  >
                    Clique aqui.
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
                      Acessar minha conta
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Background Image with Logo */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat items-center justify-center"
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <img src={logoAlertaLarge} alt="Alerta Rastreamento" className="h-20" />
      </div>
    </div>
  );
};

export default Login;
