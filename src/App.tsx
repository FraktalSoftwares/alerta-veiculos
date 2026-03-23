import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientCustomizationProvider } from "@/contexts/ClientCustomizationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedByPermission } from "@/components/auth/ProtectedByPermission";
import { PERMISSIONS } from "@/hooks/useUserPermissions";
import Index from "./pages/Index";
import Login from "./pages/Login";
import EsqueceuSenha from "./pages/EsqueceuSenha";
import NovaSenha from "./pages/NovaSenha";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";
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
import Assinaturas from "./pages/Assinaturas";
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
        <ClientCustomizationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/nova-senha" element={<NovaSenha />} />
            <Route path="/compartilhar/:id" element={<VeiculoMapaPublico />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
                  <Index />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.CLIENTS_VIEW]}>
                  <Clientes />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.CLIENTS_VIEW]}>
                  <ClienteDetalhes />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/veiculos" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.VEHICLES_VIEW]}>
                  <Veiculos />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/veiculos/mapa" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.VEHICLES_TRACK]}>
                  <VeiculosMapa />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/mapa" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.VEHICLES_TRACK]}>
                  <VeiculoMapa />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/historico" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.VEHICLES_VIEW]}>
                  <VeiculoHistorico />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/veiculos/:id/cercas" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.VEHICLES_VIEW]}>
                  <VeiculoCercas />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/notificacoes" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.NOTIFICATIONS_VIEW]}>
                  <Notificacoes />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.FINANCE_VIEW]}>
                  <Financeiro />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/despesas" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.FINANCE_EXPENSES]}>
                  <Despesas />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/loja" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.STORE_VIEW]}>
                  <Loja />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.STOCK_VIEW]}>
                  <Estoque />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/assinaturas" element={
              <ProtectedRoute>
                <ProtectedByPermission permissions={[PERMISSIONS.FINANCE_VIEW]}>
                  <Assinaturas />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute allowedUserTypes={['admin', 'associacao', 'franqueado']}>
                <ProtectedByPermission permissions={[PERMISSIONS.SETTINGS_VIEW]}>
                  <Configuracoes />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            <Route path="/configuracoes/usuarios" element={
              <ProtectedRoute allowedUserTypes={['admin', 'associacao', 'franqueado']}>
                <ProtectedByPermission permissions={[PERMISSIONS.SETTINGS_USERS]}>
                  <Usuarios />
                </ProtectedByPermission>
              </ProtectedRoute>
            } />
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ClientCustomizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

