import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Info, Database, Shield, Server } from 'lucide-react';

export default function AdminConfig() {
  const { user } = useAuth();
  const { empresa } = useEmpresa();

  const sysInfo = [
    ['Versão do Sistema', 'PCM Estratégico v4.0'],
    ['Framework', 'React 18 + TypeScript + Vite'],
    ['UI Library', 'shadcn/ui + Tailwind CSS'],
    ['Backend', 'Supabase Cloud'],
    ['Banco de Dados', 'PostgreSQL (com RLS)'],
    ['Autenticação', 'Email/Senha (Supabase Auth)'],
    ['Ambiente', 'Produção'],
    ['Sistema desenvolvido por', 'GPPIS – Gustavo Pedrozo Pinto Industrial Systems'],
    ['Criador', 'Gustavo Pedrozo Pinto'],
    ['Site oficial', 'https://www.gppis.com.br'],
  ];

  const security = [
    ['Row Level Security (RLS)', 'Ativo em todas as tabelas'],
    ['Isolamento Multi-Empresa', 'empresa_id em todas as tabelas operacionais'],
    ['Roles', 'USUARIO, ADMIN, MASTER_TI'],
    ['Funções de Segurança', 'has_role(), get_user_empresa_id() — SECURITY DEFINER'],
    ['Auditoria', 'Registro automático de login/logout e ações'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground">Informações técnicas e configurações gerais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Sistema */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" />Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sysInfo.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono font-medium text-xs">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Segurança</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {security.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono font-medium text-xs text-right max-w-[200px]">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Admin logado */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" />Administrador Logado</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Nome</span><span className="font-medium">{user?.nome}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{user?.email}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Role</span><Badge variant="destructive">{user?.tipo}</Badge></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Empresa</span><span className="font-medium">{empresa?.nome || '-'}</span></div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />Roadmap — Próximos Passos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { item: 'Portal de gestão separado (site externo)', status: 'Planejado' },
              { item: 'Integração com pagamentos (Stripe)', status: 'Futuro' },
              { item: 'Onboarding automatizado de empresas', status: 'Futuro' },
              { item: 'Relatórios gerenciais exportáveis', status: 'Futuro' },
              { item: 'Dashboard de saúde do banco de dados', status: 'Futuro' },
              { item: 'Notificações push / email', status: 'Futuro' },
            ].map(r => (
              <div key={r.item} className="flex justify-between py-2 border-b border-border last:border-0">
                <span>{r.item}</span>
                <Badge variant="outline" className="text-xs">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
