import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Search, Settings2, Eye, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle, Activity, Wrench, FileText, GitBranchPlus, BookOpen } from 'lucide-react';
import ArvoreEstrutural from '@/components/equipamentos/ArvoreEstrutural';
import ManuaisEquipamento from '@/components/equipamentos/ManuaisEquipamento';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Criticidade = Database['public']['Enums']['criticidade_abc'];
type NivelRisco = Database['public']['Enums']['nivel_risco'];

interface Equipamento {
  id: string;
  tag: string;
  nome: string;
  criticidade: Criticidade;
  nivel_risco: NivelRisco;
  localizacao: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  data_instalacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresa_id: string | null;
}

const FORM_INITIAL = {
  tag: '', nome: '', criticidade: 'C' as Criticidade, nivel_risco: 'BAIXO' as NivelRisco,
  localizacao: '', fabricante: '', modelo: '', numero_serie: '', data_instalacao: '',
};

export default function Equipamentos() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<Equipamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Equipamento | null>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [osCount, setOsCount] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);

  async function load() {
    setIsLoading(true);
    const { data } = await fromEmpresa('equipamentos').order('tag');
    setItems((data as Equipamento[]) || []);

    // Count OS per tag
    const { data: osData } = await fromEmpresa('ordens_servico').select('tag');
    if (osData) {
      const counts: Record<string, number> = {};
      osData.forEach((os: any) => { counts[os.tag] = (counts[os.tag] || 0) + 1; });
      setOsCount(counts);
    }
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = { ...form };
    if (!payload.data_instalacao) delete payload.data_instalacao;
    if (!payload.numero_serie) delete payload.numero_serie;

    const { error } = await insertWithEmpresa('equipamentos', payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Equipamento cadastrado com sucesso!' });
    setDialogOpen(false);
    setForm(FORM_INITIAL);
    setSaving(false);
    load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const payload: any = { ...form };
    if (!payload.data_instalacao) payload.data_instalacao = null;
    if (!payload.numero_serie) payload.numero_serie = null;

    let query = supabase.from('equipamentos').update(payload).eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Equipamento atualizado!' });
    setDetailOpen(false);
    setEditMode(false);
    setSaving(false);
    load();
  };

  const handleToggleAtivo = async (equip: Equipamento) => {
    let query = supabase.from('equipamentos').update({ ativo: !equip.ativo }).eq('id', equip.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: equip.ativo ? 'Equipamento desativado' : 'Equipamento ativado' });
    load();
  };

  const openDetail = (equip: Equipamento) => {
    setSelected(equip);
    setForm({
      tag: equip.tag, nome: equip.nome, criticidade: equip.criticidade, nivel_risco: equip.nivel_risco,
      localizacao: equip.localizacao || '', fabricante: equip.fabricante || '', modelo: equip.modelo || '',
      numero_serie: equip.numero_serie || '', data_instalacao: equip.data_instalacao || '',
    });
    setEditMode(false);
    setDetailOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.nome?.toLowerCase().includes(search.toLowerCase()) || i.fabricante?.toLowerCase().includes(search.toLowerCase());
    const matchCrit = filterCriticidade === 'TODOS' || i.criticidade === filterCriticidade;
    const matchStatus = filterStatus === 'TODOS' || (filterStatus === 'ATIVO' ? i.ativo : !i.ativo);
    return matchSearch && matchCrit && matchStatus;
  });

  const stats = {
    total: items.length,
    ativos: items.filter(i => i.ativo).length,
    criticos: items.filter(i => i.criticidade === 'A').length,
    riscoCritico: items.filter(i => i.nivel_risco === 'CRITICO').length,
  };

  const criticidadeColor = (c: string) => {
    if (c === 'A') return 'destructive';
    if (c === 'B') return 'default';
    return 'secondary';
  };

  const riscoColor = (r: string) => {
    if (r === 'CRITICO') return 'text-red-500';
    if (r === 'ALTO') return 'text-orange-500';
    if (r === 'MEDIO') return 'text-yellow-500';
    return 'text-green-500';
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>TAG *</Label>
          <Input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value.toUpperCase() }))} required placeholder="Ex: BOM-001" disabled={isEdit} />
        </div>
        <div className="space-y-2">
          <Label>Nome do Equipamento *</Label>
          <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Bomba Centrífuga Principal" />
        </div>
        <div className="space-y-2">
          <Label>Criticidade ABC</Label>
          <Select value={form.criticidade} onValueChange={v => setForm(p => ({ ...p, criticidade: v as Criticidade }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A - Crítico</SelectItem>
              <SelectItem value="B">B - Importante</SelectItem>
              <SelectItem value="C">C - Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nível de Risco</Label>
          <Select value={form.nivel_risco} onValueChange={v => setForm(p => ({ ...p, nivel_risco: v as NivelRisco }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICO">Crítico</SelectItem>
              <SelectItem value="ALTO">Alto</SelectItem>
              <SelectItem value="MEDIO">Médio</SelectItem>
              <SelectItem value="BAIXO">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Localização</Label>
          <Input value={form.localizacao} onChange={e => setForm(p => ({ ...p, localizacao: e.target.value }))} placeholder="Ex: Sala de Bombas" />
        </div>
        <div className="space-y-2">
          <Label>Fabricante</Label>
          <Input value={form.fabricante} onChange={e => setForm(p => ({ ...p, fabricante: e.target.value }))} placeholder="Ex: KSB" />
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} placeholder="Ex: Meganorm 65-200" />
        </div>
        <div className="space-y-2">
          <Label>Nº de Série</Label>
          <Input value={form.numero_serie} onChange={e => setForm(p => ({ ...p, numero_serie: e.target.value }))} placeholder="Ex: SN-2021-00451" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Data de Instalação</Label>
          <Input type="date" value={form.data_instalacao} onChange={e => setForm(p => ({ ...p, data_instalacao: e.target.value }))} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Gestão de Equipamentos</h1>
          <p className="page-subtitle">Cadastro completo de ativos industriais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild>
            <Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Equipamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Novo Equipamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <FormFields />
              <Button type="submit" className="btn-industrial w-full mt-6" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Cadastrar Equipamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Cadastrados</p></div>
          </CardContent>
        </Card>
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
          </CardContent>
        </Card>
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{stats.criticos}</p><p className="text-xs text-muted-foreground">Criticidade A</p></div>
          </CardContent>
        </Card>
        <Card className="card-industrial">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10"><Activity className="h-5 w-5 text-orange-500" /></div>
            <div><p className="text-2xl font-bold">{stats.riscoCritico}</p><p className="text-xs text-muted-foreground">Risco Crítico</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-industrial">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por TAG, nome ou fabricante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterCriticidade} onValueChange={setFilterCriticidade}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Criticidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas</SelectItem>
                <SelectItem value="A">A - Crítico</SelectItem>
                <SelectItem value="B">B - Importante</SelectItem>
                <SelectItem value="C">C - Normal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativos</SelectItem>
                <SelectItem value="INATIVO">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} equipamento(s) encontrado(s)</p>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card className="card-industrial">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="table-industrial w-full">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>Nome</th>
                  <th>Criticidade</th>
                  <th>Risco</th>
                  <th>Localização</th>
                  <th>Fabricante / Modelo</th>
                  <th>O.S</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(e)}>
                    <td className="font-mono font-bold text-primary">{e.tag}</td>
                    <td className="font-medium">{e.nome}</td>
                    <td><Badge variant={criticidadeColor(e.criticidade)}>{e.criticidade === 'A' ? 'A - Crítico' : e.criticidade === 'B' ? 'B - Importante' : 'C - Normal'}</Badge></td>
                    <td><span className={`font-semibold text-sm ${riscoColor(e.nivel_risco)}`}>{e.nivel_risco}</span></td>
                    <td className="text-sm">{e.localizacao || '-'}</td>
                    <td className="text-sm">{[e.fabricante, e.modelo].filter(Boolean).join(' / ') || '-'}</td>
                    <td>{osCount[e.tag] ? <Badge variant="outline" className="font-mono">{osCount[e.tag]}</Badge> : <span className="text-muted-foreground">0</span>}</td>
                    <td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td className="text-right" onClick={ev => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openDetail(e); setEditMode(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleAtivo(e)}>
                          {e.ativo ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Nenhum equipamento encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail / Edit Dialog */}
      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-primary text-xl">{selected.tag}</span>
                  <Separator orientation="vertical" className="h-6" />
                  <span>{selected.nome}</span>
                  <Badge variant={selected.ativo ? 'default' : 'secondary'} className="ml-auto">{selected.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </DialogTitle>
              </DialogHeader>

              {editMode ? (
                <form onSubmit={handleUpdate} className="mt-4">
                  <FormFields isEdit />
                  <div className="flex gap-2 mt-6">
                    <Button type="submit" className="btn-industrial flex-1" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar Alterações
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <Tabs defaultValue="dados" className="mt-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="dados">Dados</TabsTrigger>
                    <TabsTrigger value="arvore" className="gap-1"><GitBranchPlus className="h-3.5 w-3.5" />Árvore</TabsTrigger>
                    <TabsTrigger value="manuais" className="gap-1"><BookOpen className="h-3.5 w-3.5" />Manuais</TabsTrigger>
                    <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoField label="TAG" value={selected.tag} mono />
                      <InfoField label="Nome" value={selected.nome} />
                      <InfoField label="Criticidade" value={selected.criticidade === 'A' ? 'A - Crítico' : selected.criticidade === 'B' ? 'B - Importante' : 'C - Normal'} badge badgeVariant={criticidadeColor(selected.criticidade)} />
                      <InfoField label="Nível de Risco" value={selected.nivel_risco} className={riscoColor(selected.nivel_risco)} />
                      <InfoField label="Localização" value={selected.localizacao || '-'} />
                      <InfoField label="Fabricante" value={selected.fabricante || '-'} />
                      <InfoField label="Modelo" value={selected.modelo || '-'} />
                      <InfoField label="Nº de Série" value={selected.numero_serie || '-'} mono />
                      <InfoField label="Data Instalação" value={selected.data_instalacao ? new Date(selected.data_instalacao).toLocaleDateString('pt-BR') : '-'} />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" className="gap-2" onClick={() => setEditMode(true)}>
                        <Pencil className="h-4 w-4" />Editar Dados
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="arvore" className="mt-4">
                    <ArvoreEstrutural equipamentoId={selected.id} equipamentoTag={selected.tag} />
                  </TabsContent>

                  <TabsContent value="manuais" className="mt-4">
                    <ManuaisEquipamento equipamentoId={selected.id} equipamentoTag={selected.tag} />
                  </TabsContent>

                  <TabsContent value="manutencao" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <Wrench className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{osCount[selected.tag] || 0}</p>
                            <p className="text-xs text-muted-foreground">Ordens de Serviço</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <Activity className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{selected.criticidade}</p>
                            <p className="text-xs text-muted-foreground">Classe de Criticidade</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xl font-bold">{selected.nivel_risco}</p>
                            <p className="text-xs text-muted-foreground">Nível de Risco</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <p className="text-sm text-muted-foreground">Acesse os módulos de O.S, Preventiva e Preditiva para visualizar o histórico completo de manutenção deste equipamento.</p>
                  </TabsContent>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField label="ID" value={selected.id} mono />
                      <InfoField label="Empresa ID" value={selected.empresa_id || '-'} mono />
                      <InfoField label="Criado em" value={new Date(selected.created_at).toLocaleString('pt-BR')} />
                      <InfoField label="Atualizado em" value={new Date(selected.updated_at).toLocaleString('pt-BR')} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Status do Equipamento</p>
                        <p className="text-sm text-muted-foreground">{selected.ativo ? 'Equipamento está ativo e em operação' : 'Equipamento está desativado'}</p>
                      </div>
                      <Switch checked={selected.ativo} onCheckedChange={() => { handleToggleAtivo(selected); setDetailOpen(false); }} />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({ label, value, mono, badge, badgeVariant, className }: {
  label: string; value: string; mono?: boolean; badge?: boolean; badgeVariant?: any; className?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      {badge ? (
        <Badge variant={badgeVariant || 'default'}>{value}</Badge>
      ) : (
        <p className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${className || ''}`}>{value}</p>
      )}
    </div>
  );
}
