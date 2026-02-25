import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Usuarios() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAdmin, isMasterTI } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('user_roles').select('*'),
    ]);
    setProfiles(p.data || []);
    setRoles(r.data || []);
    setIsLoading(false);
  }

  const getRole = (userId: string) => {
    const role = roles.find(r => r.user_id === userId);
    return role?.role || 'USUARIO';
  };

  const filtered = profiles.filter(i => !search || i.nome?.toLowerCase().includes(search.toLowerCase()));
  const roleColor = (r: string) => r === 'MASTER_TI' ? 'destructive' : r === 'ADMIN' ? 'default' : 'secondary';

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Usuários</h1><p className="page-subtitle">{filtered.length} usuários cadastrados</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Nome</th><th>Função</th><th>Cadastro</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-medium">{e.nome}</td><td><Badge variant={roleColor(getRole(e.id)) as any}>{getRole(e.id)}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum usuário</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
