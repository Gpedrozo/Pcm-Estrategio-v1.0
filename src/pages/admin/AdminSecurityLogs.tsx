import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

type SecurityLogRow = {
  id: string;
  user_id: string | null;
  empresa_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  metadata: unknown;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function AdminSecurityLogs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tableAvailable, setTableAvailable] = useState(true);

  const [logs, setLogs] = useState<SecurityLogRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, string>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'SUCESSO' | 'FALHA'>('TODOS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const startIso = useMemo(() => {
    if (!startDate) return null;
    return new Date(`${startDate}T00:00:00`).toISOString();
  }, [startDate]);

  const endIso = useMemo(() => {
    if (!endDate) return null;
    return new Date(`${endDate}T23:59:59.999`).toISOString();
  }, [endDate]);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id, nome');
    if (error) return;
    const map: Record<string, string> = {};
    (data || []).forEach((p: any) => {
      map[p.id] = p.nome;
    });
    setProfilesById(map);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);

    let allowedUserIds: string[] | null = null;
    const trimmedUser = userFilter.trim();
    if (trimmedUser) {
      const { data: usersByName, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('nome', `%${trimmedUser}%`)
        .limit(200);

      if (usersError) {
        toast({ title: 'Erro ao filtrar usuários', description: usersError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const userIds = (usersByName || []).map((u: any) => u.id);
      const uuidLike = /^[0-9a-fA-F-]{36}$/.test(trimmedUser);
      if (uuidLike) userIds.push(trimmedUser);

      allowedUserIds = Array.from(new Set(userIds));
      if (allowedUserIds.length === 0) {
        setLogs([]);
        setTotalCount(0);
        setTableAvailable(true);
        setLoading(false);
        return;
      }
    }

    let query = supabase
      .from('security_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (actionFilter.trim()) query = query.ilike('action', `%${actionFilter.trim()}%`);
    if (statusFilter === 'SUCESSO') query = query.eq('success', true);
    if (statusFilter === 'FALHA') query = query.eq('success', false);
    if (startIso) query = query.gte('created_at', startIso);
    if (endIso) query = query.lte('created_at', endIso);
    if (allowedUserIds) query = query.in('user_id', allowedUserIds);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      setTableAvailable(false);
      setLogs([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setTableAvailable(true);
    setLogs((data || []) as SecurityLogRow[]);
    setTotalCount(count || 0);
    setLoading(false);
  }, [actionFilter, endIso, page, startIso, statusFilter, toast, userFilter]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const applyFilters = () => {
    setPage(0);
    loadLogs();
  };

  const clearFilters = () => {
    setActionFilter('');
    setUserFilter('');
    setStatusFilter('TODOS');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs de Segurança</h1>
          <p className="text-sm text-muted-foreground">Monitoramento de eventos de segurança com filtros e paginação</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ação</p>
            <Input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="ex.: LOGIN, RATE_LIMIT..." />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Usuário (nome ou ID)</p>
            <Input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="Buscar usuário" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sucesso/Falha</p>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'TODOS' | 'SUCESSO' | 'FALHA')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="SUCESSO">Sucesso</SelectItem>
                <SelectItem value="FALHA">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Início</p>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Fim</p>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="md:col-span-5 flex gap-2 justify-end">
            <Button variant="outline" onClick={clearFilters}>Limpar</Button>
            <Button onClick={applyFilters}>Aplicar filtros</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Eventos</CardTitle>
          <Badge variant="outline">{totalCount} registro(s)</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!tableAvailable ? (
            <div className="p-6 text-sm text-destructive bg-destructive/5 border-t border-destructive/30">
              Tabela <strong>security_logs</strong> não encontrada. Aplique a migration de fundação para habilitar esta tela.
            </div>
          ) : loading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left">Data</th>
                      <th className="p-3 text-left">Ação</th>
                      <th className="p-3 text-left">Usuário</th>
                      <th className="p-3 text-left">Recurso</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                        <td className="p-3"><Badge variant="outline">{log.action}</Badge></td>
                        <td className="p-3 text-xs">
                          <div className="font-medium">{log.user_id ? (profilesById[log.user_id] || 'Usuário não encontrado') : 'Sistema'}</div>
                          <div className="text-muted-foreground font-mono">{log.user_id || '-'}</div>
                        </td>
                        <td className="p-3 text-xs">
                          <div className="font-medium">{log.resource}</div>
                          <div className="text-muted-foreground font-mono">{log.resource_id || '-'}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant={log.success ? 'default' : 'destructive'}>{log.success ? 'Sucesso' : 'Falha'}</Badge>
                        </td>
                        <td className="p-3 text-xs max-w-[300px] truncate" title={log.error_message || ''}>{log.error_message || '-'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum log encontrado para os filtros aplicados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Página {Math.min(page + 1, totalPages)} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Próxima<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
