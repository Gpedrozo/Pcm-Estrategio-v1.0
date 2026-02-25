import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Building2, Plus, Pencil, Trash2, Power, Search, Eye,
  FileText, Wrench, Users, BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['hsl(199,89%,48%)', 'hsl(142,72%,29%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(213,56%,24%)'];

export default function AdminEmpresas() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [empresaMetrics, setEmpresaMetrics] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', cnpj: '', plano: 'BASICO' });

  const load = useCallback(async () => {
    setIsLoading(true);
    const [empRes, profRes, osRes, eqRes] = await Promise.all([
      supabase.from('empresas').select('*').order('nome'),
      supabase.from('profiles').select('id, empresa_id'),
      supabase.from('ordens_servico').select('id, empresa_id, status, tipo, prioridade'),
      supabase.from('equipamentos').select('id, empresa_id, criticidade'),
    ]);
    const emp = (empRes.data || []).map(e => ({
      ...e,
      _usuarios: (profRes.data || []).filter(p => p.empresa_id === e.id).length,
      _os: (osRes.data || []).filter(o => o.empresa_id === e.id).length,
      _osAbertas: (osRes.data || []).filter(o => o.empresa_id === e.id && o.status !== 'FECHADA').length,
      _equipamentos: (eqRes.data || []).filter(eq => eq.empresa_id === e.id).length,
    }));
    setEmpresas(emp);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ nome: '', cnpj: '', plano: 'BASICO' }); setDialog(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ nome: e.nome, cnpj: e.cnpj || '', plano: e.plano }); setDialog(true); };

  const save = async () => {
    if (!form.nome.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const data = { nome: form.nome, cnpj: form.cnpj || null, plano: form.plano };
    if (editing) {
      await supabase.from('empresas').update(data).eq('id', editing.id);
      toast({ title: 'Empresa atualizada' });
    } else {
      await supabase.from('empresas').insert(data);
      toast({ title: 'Empresa criada' });
    }
    setDialog(false); load();
  };

  const toggle = async (e: any) => {
    await supabase.from('empresas').update({ ativo: !e.ativo }).eq('id', e.id);
    toast({ title: e.ativo ? 'Empresa bloqueada' : 'Empresa desbloqueada' }); load();
  };

  const remove = async (e: any) => {
    if (!confirm(`Excluir "${e.nome}"? Irreversível.`)) return;
    const { error } = await supabase.from('empresas').delete().eq('id', e.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Empresa excluída' }); load();
  };

  const viewDetails = async (e: any) => {
    setSelectedEmpresa(e);
    // Carregar métricas detalhadas
    const [osRes, eqRes, profRes, mecRes] = await Promise.all([
      supabase.from('ordens_servico').select('*').eq('empresa_id', e.id),
      supabase.from('equipamentos').select('*').eq('empresa_id', e.id),
      supabase.from('profiles').select('*').eq('empresa_id', e.id),
      supabase.from('mecanicos').select('*').eq('empresa_id', e.id),
    ]);
    const os = osRes.data || [];
    const statusCount: Record<string, number> = {};
    os.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    const tipoCount: Record<string, number> = {};
    os.forEach(o => { tipoCount[o.tipo] = (tipoCount[o.tipo] || 0) + 1; });
    const critCount: Record<string, number> = {};
    (eqRes.data || []).forEach(eq => { critCount[eq.criticidade] = (critCount[eq.criticidade] || 0) + 1; });

    setEmpresaMetrics({
      os: os.length,
      osAbertas: os.filter(o => o.status !== 'FECHADA').length,
      osFechadas: os.filter(o => o.status === 'FECHADA').length,
      equipamentos: (eqRes.data || []).length,
      usuarios: (profRes.data || []).length,
      mecanicos: (mecRes.data || []).length,
      statusChart: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
      tipoChart: Object.entries(tipoCount).map(([name, value]) => ({ name, value })),
      critChart: Object.entries(critCount).map(([name, value]) => ({ name, value })),
      osUrgentes: os.filter(o => o.prioridade === 'URGENTE' && o.status !== 'FECHADA').length,
      profiles: profRes.data || [],
    });
    setDetailDialog(true);
  };

  const filtered = empresas.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()) || (e.cnpj || '').includes(search));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Gestão de Empresas</h1><p className="text-sm text-muted-foreground">{empresas.length} empresas cadastradas</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Empresa</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CNPJ..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Empresa</th>
                <th className="p-3 text-left font-medium">CNPJ</th>
                <th className="p-3 text-left font-medium">Plano</th>
                <th className="p-3 text-center font-medium">Usuários</th>
                <th className="p-3 text-center font-medium">OS</th>
                <th className="p-3 text-center font-medium">OS Abertas</th>
                <th className="p-3 text-center font-medium">Equip.</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{e.nome}</td>
                    <td className="p-3 font-mono text-xs">{e.cnpj || '-'}</td>
                    <td className="p-3"><Badge variant="outline">{e.plano}</Badge></td>
                    <td className="p-3 text-center font-mono">{e._usuarios}</td>
                    <td className="p-3 text-center font-mono">{e._os}</td>
                    <td className="p-3 text-center"><Badge variant={e._osAbertas > 0 ? 'default' : 'secondary'}>{e._osAbertas}</Badge></td>
                    <td className="p-3 text-center font-mono">{e._equipamentos}</td>
                    <td className="p-3"><Badge variant={e.ativo ? 'default' : 'destructive'}>{e.ativo ? 'Ativo' : 'Bloqueado'}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => viewDetails(e)} title="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => toggle(e)} title={e.ativo ? 'Bloquear' : 'Desbloquear'}><Power className={`h-4 w-4 ${e.ativo ? 'text-green-500' : 'text-destructive'}`} /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(e)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Nenhuma empresa encontrada</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: CRUD */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Plano</Label>
              <Select value={form.plano} onValueChange={v => setForm(f => ({ ...f, plano: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASICO">Básico</SelectItem>
                  <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={save}>{editing ? 'Atualizar' : 'Criar Empresa'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes / Métricas */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedEmpresa?.nome} — Métricas e Relatórios
            </DialogTitle>
          </DialogHeader>
          {empresaMetrics && (
            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="charts">Gráficos</TabsTrigger>
                <TabsTrigger value="users">Usuários</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: FileText, label: 'Total OS', value: empresaMetrics.os },
                    { icon: FileText, label: 'OS Abertas', value: empresaMetrics.osAbertas },
                    { icon: FileText, label: 'OS Fechadas', value: empresaMetrics.osFechadas },
                    { icon: FileText, label: 'OS Urgentes', value: empresaMetrics.osUrgentes },
                    { icon: Wrench, label: 'Equipamentos', value: empresaMetrics.equipamentos },
                    { icon: Users, label: 'Usuários', value: empresaMetrics.usuarios },
                    { icon: Users, label: 'Mecânicos', value: empresaMetrics.mecanicos },
                  ].map(k => (
                    <Card key={k.label}><CardContent className="p-3 flex items-center gap-2">
                      <k.icon className="h-5 w-5 text-primary shrink-0" />
                      <div><p className="text-lg font-bold">{k.value}</p><p className="text-[10px] text-muted-foreground">{k.label}</p></div>
                    </CardContent></Card>
                  ))}
                </div>
                <Card><CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Informações</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-mono">{selectedEmpresa?.cnpj || '-'}</span></div>
                    <div><span className="text-muted-foreground">Plano:</span> <Badge variant="outline">{selectedEmpresa?.plano}</Badge></div>
                    <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedEmpresa?.ativo ? 'default' : 'destructive'}>{selectedEmpresa?.ativo ? 'Ativo' : 'Bloqueado'}</Badge></div>
                    <div><span className="text-muted-foreground">Cadastro:</span> <span className="font-mono text-xs">{new Date(selectedEmpresa?.created_at).toLocaleDateString('pt-BR')}</span></div>
                  </div>
                </CardContent></Card>
                {empresaMetrics.osUrgentes > 0 && (
                  <Card className="border-warning/50 bg-warning/5"><CardContent className="p-4">
                    <p className="text-sm font-medium text-warning">⚠️ Atenção: {empresaMetrics.osUrgentes} OS urgente(s) em aberto nesta empresa. Considere entrar em contato.</p>
                  </CardContent></Card>
                )}
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">OS por Status</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={empresaMetrics.statusChart} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {empresaMetrics.statusChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card><CardHeader className="pb-2"><CardTitle className="text-sm">OS por Tipo</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={empresaMetrics.tipoChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm">Criticidade dos Equipamentos</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={empresaMetrics.critChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <Card><CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Nome</th><th className="p-3 text-left font-medium">Cadastro</th></tr></thead>
                    <tbody>
                      {(empresaMetrics.profiles || []).map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{p.nome}</td>
                          <td className="p-3 text-xs font-mono">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                      {(empresaMetrics.profiles || []).length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">Nenhum usuário</td></tr>}
                    </tbody>
                  </table>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
