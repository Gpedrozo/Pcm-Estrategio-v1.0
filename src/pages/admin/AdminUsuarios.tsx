import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Users, RefreshCw } from 'lucide-react';

export default function AdminUsuarios() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    const [p, r, e] = await Promise.all([
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('user_roles').select('*'),
      supabase.from('empresas').select('id, nome').order('nome'),
    ]);
    setProfiles(p.data || []);
    setRoles(r.data || []);
    setEmpresas(e.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getRole = (uid: string) => roles.find(r => r.user_id === uid)?.role || 'USUARIO';
  const getRoleId = (uid: string) => roles.find(r => r.user_id === uid)?.id;
  const getEmpresaNome = (eid: string | null) => empresas.find(e => e.id === eid)?.nome || 'Sem empresa';

  const changeRole = async (uid: string, newRole: string) => {
    const rid = getRoleId(uid);
    if (rid) {
      await supabase.from('user_roles').update({ role: newRole as any }).eq('id', rid);
    } else {
      await supabase.from('user_roles').insert({ user_id: uid, role: newRole as any });
    }
    toast({ title: `Role alterada para ${newRole}` });
    load();
  };

  const changeEmpresa = async (uid: string, empresaId: string | null) => {
    await supabase.from('profiles').update({ empresa_id: empresaId }).eq('id', uid);
    const rid = getRoleId(uid);
    if (rid) await supabase.from('user_roles').update({ empresa_id: empresaId } as any).eq('id', rid);
    toast({ title: 'Empresa atualizada' });
    load();
  };

  const roleColor = (r: string) => r === 'MASTER_TI' ? 'destructive' as const : r === 'ADMIN' ? 'default' as const : r === 'SOLICITANTE' ? 'outline' as const : 'secondary' as const;

  const filtered = profiles.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchEmpresa = filterEmpresa === 'all' || p.empresa_id === filterEmpresa || (filterEmpresa === 'none' && !p.empresa_id);
    const matchRole = filterRole === 'all' || getRole(p.id) === filterRole;
    return matchSearch && matchEmpresa && matchRole;
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Gestão de Usuários</h1><p className="text-sm text-muted-foreground">{profiles.length} usuários no sistema</p></div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            <SelectItem value="none">Sem empresa</SelectItem>
            {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as roles</SelectItem>
            <SelectItem value="USUARIO">USUARIO</SelectItem>
            <SelectItem value="SOLICITANTE">SOLICITANTE</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="MASTER_TI">MASTER_TI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Nome</th>
                <th className="p-3 text-left font-medium">Role Atual</th>
                <th className="p-3 text-left font-medium">Empresa Atual</th>
                <th className="p-3 text-left font-medium">Cadastro</th>
                <th className="p-3 text-left font-medium">Alterar Role</th>
                <th className="p-3 text-left font-medium">Alterar Empresa</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{p.nome}</td>
                    <td className="p-3"><Badge variant={roleColor(getRole(p.id))}>{getRole(p.id)}</Badge></td>
                    <td className="p-3 text-xs">{getEmpresaNome(p.empresa_id)}</td>
                    <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <Select value={getRole(p.id)} onValueChange={v => changeRole(p.id, v)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USUARIO">USUARIO</SelectItem>
                          <SelectItem value="SOLICITANTE">SOLICITANTE</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="MASTER_TI">MASTER_TI</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Select value={p.empresa_id || 'none'} onValueChange={v => changeEmpresa(p.id, v === 'none' ? null : v)}>
                        <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem empresa</SelectItem>
                          {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
