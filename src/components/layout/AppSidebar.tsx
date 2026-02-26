import {
  LayoutDashboard, FileText, FilePlus, FileCheck, History,
  Wrench, Users, ClipboardList, Tag, LogOut, Settings,
  Building2, Package, MessageSquare, Calendar, Search,
  Shield, TrendingUp, FileSearch, Lightbulb, Truck,
  Inbox, CalendarClock, Activity, DollarSign, BarChart3,
  FileArchive, Droplet, Lock, Brain
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import gppisLogo from '@/assets/gppis-logo.png';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MODULES } from '@/constants/modules';

type MenuItem = { title: string; url: string; icon: React.ElementType };

const mainMenuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

const osMenuItems: MenuItem[] = [
  { title: 'Solicitações', url: '/solicitacoes', icon: MessageSquare },
  { title: 'Backlog', url: '/backlog', icon: Inbox },
  { title: 'Emitir O.S', url: '/os/nova', icon: FilePlus },
  { title: 'Fechar O.S', url: '/os/fechar', icon: FileCheck },
  { title: 'Histórico', url: '/os/historico', icon: History },
];

const planejamentoMenuItems: MenuItem[] = [
  { title: 'Lubrificação', url: '/lubrificacao', icon: Droplet },
  { title: 'Programação', url: '/programacao', icon: CalendarClock },
  { title: 'Preventiva', url: '/preventiva', icon: Calendar },
  { title: 'Preditiva', url: '/preditiva', icon: Activity },
  { title: 'Inspeções', url: '/inspecoes', icon: Search },
];

const analisesMenuItems: MenuItem[] = [
  { title: 'FMEA/RCM', url: '/fmea', icon: FileSearch },
  { title: 'Causa Raiz', url: '/rca', icon: TrendingUp },
  { title: 'Melhorias', url: '/melhorias', icon: Lightbulb },
  { title: 'Análise IA', url: '/analise-ia', icon: Brain },
];

const cadastroMenuItems: MenuItem[] = [
  { title: 'Hierarquia', url: '/hierarquia', icon: Building2 },
  { title: 'Equipamentos', url: '/equipamentos', icon: Tag },
  { title: 'Mecânicos', url: '/mecanicos', icon: Wrench },
  { title: 'Materiais', url: '/materiais', icon: Package },
  { title: 'Fornecedores', url: '/fornecedores', icon: Truck },
  { title: 'Contratos', url: '/contratos', icon: FileText },
  { title: 'Documentos', url: '/documentos', icon: FileArchive },
];

const relatoriosMenuItems: MenuItem[] = [
  { title: 'Custos', url: '/custos', icon: DollarSign },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
];

const ssmaMenuItems: MenuItem[] = [
  { title: 'SSMA', url: '/ssma', icon: Shield },
];

const adminMenuItems: MenuItem[] = [
  { title: 'Usuários', url: '/usuarios', icon: Users },
  { title: 'Auditoria', url: '/auditoria', icon: ClipboardList },
];

interface MenuGroup {
  label: string;
  modulo: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  { label: 'Principal', modulo: MODULES.DASHBOARD, items: mainMenuItems },
  { label: 'Ordens de Serviço', modulo: MODULES.ORDENS_SERVICO, items: osMenuItems },
  { label: 'Planejamento', modulo: MODULES.PLANEJAMENTO, items: planejamentoMenuItems },
  { label: 'Análises', modulo: MODULES.ANALISES, items: analisesMenuItems },
  { label: 'Cadastros', modulo: MODULES.CADASTROS, items: cadastroMenuItems },
  { label: 'Relatórios', modulo: MODULES.RELATORIOS, items: relatoriosMenuItems },
  { label: 'Segurança', modulo: MODULES.SSMA, items: ssmaMenuItems },
];

export function AppSidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { moduloAtivo } = useEmpresa();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const renderMenuLink = (item: MenuItem, locked = false) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild>
        {locked ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/30 cursor-not-allowed">
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
            <Lock className="h-3 w-3 ml-auto" />
          </div>
        ) : (
          <NavLink
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive(item.url)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center text-center gap-2">
          <img src={gppisLogo} alt="GPPIS Industrial Systems" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">PCM ESTRATÉGICO</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Sistema de Manutenção</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {menuGroups.map((group) => {
          const isModuloAtivo = moduloAtivo(group.modulo);
          return (
            <SidebarGroup key={group.label} className="mt-2">
              <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs font-semibold px-3 mb-2">
                {group.label}
                {!isModuloAtivo && <Lock className="inline h-3 w-3 ml-1 opacity-50" />}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => renderMenuLink(item, !isModuloAtivo))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {isAdmin && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs font-semibold px-3 mb-2">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{adminMenuItems.map(item => renderMenuLink(item))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                {user?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{user?.nome}</span>
              <span className="text-xs text-sidebar-foreground/60">{user?.tipo}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
