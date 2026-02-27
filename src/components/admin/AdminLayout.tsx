import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Building2, Users, CreditCard, FileText,
  Settings, LogOut, ChevronLeft, Crown, BarChart3, Shield, ShieldAlert,
  Menu, KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import gppisLogo from '@/assets/gppis-logo.png';

const adminMenu = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Empresas', url: '/admin/empresas', icon: Building2 },
  { title: 'Usuários', url: '/admin/usuarios', icon: Users },
  { title: 'Planos SaaS', url: '/admin/planos', icon: CreditCard },
  { title: 'Assinaturas', url: '/admin/assinaturas', icon: FileText },
  { title: 'Métricas', url: '/admin/metricas', icon: BarChart3 },
  { title: 'Permissões', url: '/admin/permissoes', icon: Shield },
  { title: 'Logs Segurança', url: '/admin/security-logs', icon: ShieldAlert },
  { title: 'API Tokens', url: '/admin/api-tokens', icon: KeyRound },
  { title: 'Configurações', url: '/admin/config', icon: Settings },
];

export function AdminLayout() {
  const { isAuthenticated, isLoading, isMasterTI, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isMasterTI || user?.tipo !== 'MASTER_TI') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex flex-col border-r border-sidebar-border`}
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src={gppisLogo} alt="GPPIS" className="h-8 w-8 rounded" />
              <div>
                <p className="text-xs font-bold" style={{ color: 'hsl(var(--sidebar-foreground))' }}>GPPIS</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-primary))' }}>Admin da Plataforma</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {adminMenu.map(item => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'hsl(var(--sidebar-primary-foreground))' : 'hsl(var(--sidebar-foreground))',
                background: isActive ? 'hsl(var(--sidebar-primary))' : undefined,
              })}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-white/5 transition-colors mb-2"
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
          >
            <ChevronLeft className="h-4 w-4" />
            {sidebarOpen && <span>Voltar ao Sistema</span>}
          </NavLink>
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' }}>
                {user?.nome?.charAt(0) || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>{user?.nome}</p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--sidebar-primary))' }}>MASTER TI</p>
              </div>
              <button onClick={logout} className="p-1 rounded hover:bg-white/10" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 shrink-0">
          <Crown className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Admin da Plataforma GPPIS</h1>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
