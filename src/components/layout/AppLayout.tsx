import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { getRouteModule } from '@/config/routeModules';
import { MODULES } from '@/constants/modules';
import { Menu, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { moduloAtivo, isLoading: empresaLoading } = useEmpresa();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const routeModule = useMemo(() => getRouteModule(location.pathname), [location.pathname]);
  const allowedSolicitantePaths = useMemo(() => ['/dashboard', '/solicitacoes'], []);
  const blockedUsuarioPaths = useMemo(() => ['/os/nova'], []);
  const blockedGestorPrefixes = useMemo(() => ['/admin', '/master-ti', '/system-health', '/usuarios'], []);
  const lastBlockedPathRef = useRef<string | null>(null);
  const allowed = useMemo(() => {
    if (!routeModule) return false;
    if (routeModule === MODULES.DASHBOARD) return true;
    return moduloAtivo(routeModule);
  }, [moduloAtivo, routeModule]);

  // Route protection based on module
  useEffect(() => {
    if (isLoading || empresaLoading) return;
    if (!isAuthenticated) return;

    if (!routeModule) {
      if (location.pathname !== '/dashboard') {
        if (lastBlockedPathRef.current !== location.pathname) {
          lastBlockedPathRef.current = location.pathname;
          toast({
            title: 'Rota não permitida',
            description: 'Esta rota não está mapeada para acesso no sistema.',
            variant: 'destructive',
          });
        }
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    if (user?.tipo === 'SOLICITANTE' && !allowedSolicitantePaths.includes(location.pathname)) {
      if (lastBlockedPathRef.current !== location.pathname) {
        lastBlockedPathRef.current = location.pathname;
        toast({
          title: 'Acesso restrito',
          description: 'Seu perfil permite apenas registrar e consultar solicitações.',
          variant: 'destructive',
        });
      }
      navigate('/solicitacoes', { replace: true });
      return;
    }

    if (user?.tipo === 'USUARIO' && blockedUsuarioPaths.includes(location.pathname)) {
      if (lastBlockedPathRef.current !== location.pathname) {
        lastBlockedPathRef.current = location.pathname;
        toast({
          title: 'Acesso restrito',
          description: 'Perfil USUARIO pode aceitar solicitações, mas não emitir O.S.',
          variant: 'destructive',
        });
      }
      navigate('/solicitacoes', { replace: true });
      return;
    }

    if (user?.tipo === 'GESTOR' && blockedGestorPrefixes.some((prefix) => location.pathname.startsWith(prefix))) {
      if (lastBlockedPathRef.current !== location.pathname) {
        lastBlockedPathRef.current = location.pathname;
        toast({
          title: 'Acesso restrito',
          description: 'Perfil GESTOR não possui acesso a configurações críticas.',
          variant: 'destructive',
        });
      }
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!allowed) {
      if (location.pathname !== '/dashboard') {
        if (lastBlockedPathRef.current !== location.pathname) {
          lastBlockedPathRef.current = location.pathname;
          toast({
            title: 'Módulo não disponível',
            description: 'Este módulo não está incluído no seu plano atual.',
            variant: 'destructive',
          });
        }
        navigate('/dashboard', { replace: true });
      }
    } else {
      lastBlockedPathRef.current = null;
    }
  }, [
    allowed,
    routeModule,
    user?.tipo,
    allowedSolicitantePaths,
    blockedUsuarioPaths,
    blockedGestorPrefixes,
    isAuthenticated,
    isLoading,
    empresaLoading,
    location.pathname,
    navigate,
    toast,
  ]);

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
