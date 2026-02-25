import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { ROTA_MODULO } from '@/types';
import { Menu, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { moduloAtivo, isLoading: empresaLoading } = useEmpresa();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Route protection based on module
  useEffect(() => {
    if (isLoading || empresaLoading) return;
    const modulo = ROTA_MODULO[location.pathname];
    if (modulo && !moduloAtivo(modulo)) {
      toast({
        title: 'Módulo não disponível',
        description: 'Este módulo não está incluído no seu plano atual.',
        variant: 'destructive',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, moduloAtivo, isLoading, empresaLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 no-print">
            <SidebarTrigger className="p-2 hover:bg-muted rounded-md">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
