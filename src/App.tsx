import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovaOS from "./pages/NovaOS";
import FecharOS from "./pages/FecharOS";
import HistoricoOS from "./pages/HistoricoOS";
import Equipamentos from "./pages/Equipamentos";
import Solicitacoes from "./pages/Solicitacoes";
import Backlog from "./pages/Backlog";
import Lubrificacao from "./pages/Lubrificacao";
import Programacao from "./pages/Programacao";
import Preventiva from "./pages/Preventiva";
import Preditiva from "./pages/Preditiva";
import Inspecoes from "./pages/Inspecoes";
import FMEAPage from "./pages/FMEAPage";
import RCAPage from "./pages/RCAPage";
import MelhoriasPage from "./pages/MelhoriasPage";
import Hierarquia from "./pages/Hierarquia";
import Mecanicos from "./pages/Mecanicos";
import Materiais from "./pages/Materiais";
import Fornecedores from "./pages/Fornecedores";
import Contratos from "./pages/Contratos";
import DocumentosTecnicos from "./pages/DocumentosTecnicos";
import Custos from "./pages/Custos";
import Relatorios from "./pages/Relatorios";
import SSMAPage from "./pages/SSMAPage";
import Usuarios from "./pages/Usuarios";
import Auditoria from "./pages/Auditoria";
import AnaliseIA from "./pages/AnaliseIA";
import NotFound from "./pages/NotFound";
import SiteHome from "./pages/SiteHome";
import SystemPortal from "./pages/SystemPortal";
import SystemsCatalog from "./pages/SystemsCatalog";
import SystemHealth from "./pages/SystemHealth";
import EquipamentoPage from "./modules/equipamentos/EquipamentoPage";
import { PLATFORM_ROUTES } from "@/config/platformArchitecture";

// Admin Portal
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";
import AdminMetricas from "./pages/admin/AdminMetricas";
import AdminPermissoes from "./pages/admin/AdminPermissoes";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminSecurityLogs from "./pages/admin/AdminSecurityLogs";
import AdminApiTokens from "./pages/admin/AdminApiTokens";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EmpresaProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path={PLATFORM_ROUTES.siteHome} element={<SiteHome />} />
            <Route path={PLATFORM_ROUTES.portalAcesso} element={<SystemPortal />} />
            <Route path={PLATFORM_ROUTES.catalogoSistemas} element={<SystemsCatalog />} />
            <Route path="/portal" element={<Navigate to={PLATFORM_ROUTES.portalAcesso} replace />} />
            <Route path="/acessar-sistema" element={<Navigate to={PLATFORM_ROUTES.portalAcesso} replace />} />
            <Route path="/start" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/app/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
              <Route path="/app/solicitacoes" element={<Navigate to="/solicitacoes" replace />} />
              <Route path="/os/nova" element={<NovaOS />} />
              <Route path="/app/os/nova" element={<Navigate to="/os/nova" replace />} />
              <Route path="/os/fechar" element={<FecharOS />} />
              <Route path="/app/os/fechar" element={<Navigate to="/os/fechar" replace />} />
              <Route path="/os/historico" element={<HistoricoOS />} />
              <Route path="/app/os/historico" element={<Navigate to="/os/historico" replace />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/app/backlog" element={<Navigate to="/backlog" replace />} />
              <Route path="/programacao" element={<Programacao />} />
              <Route path="/app/programacao" element={<Navigate to="/programacao" replace />} />
              <Route path="/preventiva" element={<Preventiva />} />
              <Route path="/app/preventiva" element={<Navigate to="/preventiva" replace />} />
              <Route path="/preditiva" element={<Preditiva />} />
              <Route path="/app/preditiva" element={<Navigate to="/preditiva" replace />} />
              <Route path="/inspecoes" element={<Inspecoes />} />
              <Route path="/app/inspecoes" element={<Navigate to="/inspecoes" replace />} />
              <Route path="/fmea" element={<FMEAPage />} />
              <Route path="/app/fmea" element={<Navigate to="/fmea" replace />} />
              <Route path="/rca" element={<RCAPage />} />
              <Route path="/app/rca" element={<Navigate to="/rca" replace />} />
              <Route path="/melhorias" element={<MelhoriasPage />} />
              <Route path="/app/melhorias" element={<Navigate to="/melhorias" replace />} />
              <Route path="/hierarquia" element={<Hierarquia />} />
              <Route path="/app/hierarquia" element={<Navigate to="/hierarquia" replace />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/app/equipamentos" element={<Navigate to="/equipamentos" replace />} />
              <Route path="/equipamento/:tag" element={<EquipamentoPage />} />
              <Route path="/app/equipamento/:tag" element={<Navigate to="/equipamentos" replace />} />
              <Route path="/mecanicos" element={<Mecanicos />} />
              <Route path="/app/mecanicos" element={<Navigate to="/mecanicos" replace />} />
              <Route path="/materiais" element={<Materiais />} />
              <Route path="/app/materiais" element={<Navigate to="/materiais" replace />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/app/fornecedores" element={<Navigate to="/fornecedores" replace />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/app/contratos" element={<Navigate to="/contratos" replace />} />
              <Route path="/documentos" element={<DocumentosTecnicos />} />
              <Route path="/app/documentos" element={<Navigate to="/documentos" replace />} />
              <Route path="/lubrificacao" element={<Lubrificacao />} />
              <Route path="/app/lubrificacao" element={<Navigate to="/lubrificacao" replace />} />
              <Route path="/custos" element={<Custos />} />
              <Route path="/app/custos" element={<Navigate to="/custos" replace />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/app/relatorios" element={<Navigate to="/relatorios" replace />} />
              <Route path="/ssma" element={<SSMAPage />} />
              <Route path="/app/ssma" element={<Navigate to="/ssma" replace />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/app/usuarios" element={<Navigate to="/usuarios" replace />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/app/auditoria" element={<Navigate to="/auditoria" replace />} />
              <Route path="/analise-ia" element={<AnaliseIA />} />
              <Route path="/app/analise-ia" element={<Navigate to="/analise-ia" replace />} />
              <Route path="/system-health" element={<SystemHealth />} />
              <Route path="/app/system-health" element={<Navigate to="/system-health" replace />} />
              <Route path="/master-ti" element={<Navigate to={PLATFORM_ROUTES.adminGlobal} replace />} />
            </Route>

            <Route path={PLATFORM_ROUTES.adminAlias} element={<Navigate to={PLATFORM_ROUTES.adminGlobal} replace />} />
            <Route path="/gestao/empresas" element={<Navigate to="/admin/empresas" replace />} />
            <Route path="/gestao/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
            <Route path="/gestao/planos" element={<Navigate to="/admin/planos" replace />} />
            <Route path="/gestao/assinaturas" element={<Navigate to="/admin/assinaturas" replace />} />
            <Route path="/gestao/metricas" element={<Navigate to="/admin/metricas" replace />} />
            <Route path="/gestao/permissoes" element={<Navigate to="/admin/permissoes" replace />} />
            <Route path="/gestao/security-logs" element={<Navigate to="/admin/security-logs" replace />} />
            <Route path="/gestao/config" element={<Navigate to="/admin/config" replace />} />
            <Route path="/gestao/api-tokens" element={<Navigate to="/admin/api-tokens" replace />} />

            {/* Portal Admin — MASTER_TI only */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/empresas" element={<AdminEmpresas />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/planos" element={<AdminPlanos />} />
              <Route path="/admin/assinaturas" element={<AdminAssinaturas />} />
              <Route path="/admin/metricas" element={<AdminMetricas />} />
              <Route path="/admin/permissoes" element={<AdminPermissoes />} />
              <Route path="/admin/security-logs" element={<AdminSecurityLogs />} />
              <Route path="/admin/config" element={<AdminConfig />} />
              <Route path="/admin/api-tokens" element={<AdminApiTokens />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </EmpresaProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
