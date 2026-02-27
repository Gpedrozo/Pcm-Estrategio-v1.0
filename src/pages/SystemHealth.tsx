import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Database, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HealthRow {
  checked_at: string;
  empresas_ativas: number;
  os_abertas: number;
  erros_24h: number;
}

export default function SystemHealth() {
  const { isAdmin, isMasterTI } = useAuth();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthRow | null>(null);
  const [recentErrors, setRecentErrors] = useState<Array<{ id: string; event: string; message: string; created_at: string }>>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [{ data: healthData }, { data: errorsData }] = await Promise.all([
        supabase.from('system_health').select('*').maybeSingle(),
        supabase
          .from('system_logs')
          .select('id, event, message, created_at')
          .eq('level', 'ERROR')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setHealth((healthData as HealthRow) || null);
      setRecentErrors((errorsData as Array<{ id: string; event: string; message: string; created_at: string }>) || []);
      setLoading(false);
    };

    load();
  }, []);

  if (!isAdmin && !isMasterTI) {
    return (
      <Card className="card-industrial">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Acesso restrito ao monitoramento de saúde do sistema.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" />System Health</h1>
        <p className="page-subtitle">Conexão, erros recentes e status operacional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{health?.empresas_ativas ?? 0}</p>
              <p className="text-xs text-muted-foreground">Empresas ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-info" />
            <div>
              <p className="text-2xl font-bold">{health?.os_abertas ?? 0}</p>
              <p className="text-xs text-muted-foreground">OS abertas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{health?.erros_24h ?? 0}</p>
              <p className="text-xs text-muted-foreground">Erros (24h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-industrial">
        <CardHeader>
          <CardTitle className="text-base">Erros recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro recente.</p>
          ) : (
            recentErrors.map((error) => (
              <div key={error.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="destructive">{error.event}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(error.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm mt-2">{error.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
