import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import EsqueceuSenha from "./pages/EsqueceuSenha";
import NovaSenha from "./pages/NovaSenha";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Veiculos from "./pages/Veiculos";
import VeiculoMapa from "./pages/VeiculoMapa";
import VeiculoMapaPublico from "./pages/VeiculoMapaPublico";
import VeiculoHistorico from "./pages/VeiculoHistorico";
import VeiculosMapa from "./pages/VeiculosMapa";
import VeiculoCercas from "./pages/VeiculoCercas";
import Notificacoes from "./pages/Notificacoes";
import Financeiro from "./pages/Financeiro";
import Despesas from "./pages/Despesas";
import Loja from "./pages/Loja";
import Estoque from "./pages/Estoque";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/nova-senha" element={<NovaSenha />} />
            <Route path="/compartilhar/:id" element={<VeiculoMapaPublico />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id" element={
              <ProtectedRoute>
                <ClienteDetalhes />
              </ProtectedRoute>
            } />
            <Route path="/veiculos" element={
              <ProtectedRoute>
                <Veiculos />
              </ProtectedRoute>
            } />
            <Route path="/veiculos/mapa" element={
              <ProtectedRoute>
                <VeiculosMapa />
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/mapa" element={
              <ProtectedRoute>
                <VeiculoMapa />
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/historico" element={
              <ProtectedRoute>
                <VeiculoHistorico />
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/cercas" element={
              <ProtectedRoute>
                <VeiculoCercas />
              </ProtectedRoute>
            } />
            <Route path="/notificacoes" element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/despesas" element={
              <ProtectedRoute>
                <Despesas />
              </ProtectedRoute>
            } />
            <Route path="/loja" element={
              <ProtectedRoute>
                <Loja />
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute>
                <Estoque />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute allowedUserTypes={['admin', 'associacao', 'franqueado']}>
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes/usuarios" element={
              <ProtectedRoute allowedUserTypes={['admin', 'associacao', 'franqueado']}>
                <Usuarios />
              </ProtectedRoute>
            } />
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

