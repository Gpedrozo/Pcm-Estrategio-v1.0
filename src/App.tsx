import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovaOS from "./pages/NovaOS";
import FecharOS from "./pages/FecharOS";
import HistoricoOS from "./pages/HistoricoOS";
import Equipamentos from "./pages/Equipamentos";
import NotFound from "./pages/NotFound";
import {
  Solicitacoes, Backlog, Programacao, Preventiva, Preditiva,
  Inspecoes, FMEA, RCA, Melhorias, Hierarquia, Mecanicos,
  Materiais, Fornecedores, Contratos, DocumentosTecnicos,
  Lubrificacao, Custos, Relatorios, SSMA, Usuarios,
  Auditoria, MasterTI
} from "./pages/ModulePages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
              <Route path="/os/nova" element={<NovaOS />} />
              <Route path="/os/fechar" element={<FecharOS />} />
              <Route path="/os/historico" element={<HistoricoOS />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/programacao" element={<Programacao />} />
              <Route path="/preventiva" element={<Preventiva />} />
              <Route path="/preditiva" element={<Preditiva />} />
              <Route path="/inspecoes" element={<Inspecoes />} />
              <Route path="/fmea" element={<FMEA />} />
              <Route path="/rca" element={<RCA />} />
              <Route path="/melhorias" element={<Melhorias />} />
              <Route path="/hierarquia" element={<Hierarquia />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/mecanicos" element={<Mecanicos />} />
              <Route path="/materiais" element={<Materiais />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/documentos" element={<DocumentosTecnicos />} />
              <Route path="/lubrificacao" element={<Lubrificacao />} />
              <Route path="/custos" element={<Custos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/ssma" element={<SSMA />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/master-ti" element={<MasterTI />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
