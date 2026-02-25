import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Crown, Database, Users, FileText, Shield } from 'lucide-react';

export default function MasterTI() {
  const [stats, setStats] = useState({ profiles: 0, os: 0, equipamentos: 0, auditoria: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }),
      supabase.from('equipamentos').select('id', { count: 'exact', head: true }),
      supabase.from('auditoria').select('id', { count: 'exact', head: true }),
    ]).then(([p, o, e, a]) => {
      setStats({ profiles: p.count || 0, os: o.count || 0, equipamentos: e.count || 0, auditoria: a.count || 0 });
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center gap-3"><Crown className="h-8 w-8 text-primary" /><div><h1 className="page-title">Painel Master TI</h1><p className="page-subtitle">Configurações avançadas e estatísticas do sistema</p></div></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Users className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.profiles}</p><p className="text-sm text-muted-foreground">Usuários</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><FileText className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.os}</p><p className="text-sm text-muted-foreground">Ordens de Serviço</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Database className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.equipamentos}</p><p className="text-sm text-muted-foreground">Equipamentos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Shield className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.auditoria}</p><p className="text-sm text-muted-foreground">Logs Auditoria</p></div></CardContent></Card>
      </div>
      <Card className="card-industrial"><CardHeader><CardTitle>Informações do Sistema</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Versão</span><span className="font-mono font-medium">PCM v3.0</span></div>
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Backend</span><span className="font-mono font-medium">Lovable Cloud</span></div>
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Banco de Dados</span><span className="font-mono font-medium">PostgreSQL</span></div>
        <div className="flex justify-between py-2"><span className="text-muted-foreground">Ambiente</span><span className="font-mono font-medium">Produção</span></div>
      </CardContent></Card>
    </div>
  );
}
