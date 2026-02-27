import { useEffect, useState } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, Search, Settings2, AlertTriangle, CheckCircle2, Activity, Eye, Pencil, GitBranch, BookOpen, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import VisualizarAtivoDialog from '@/modules/equipamentos/VisualizarAtivoDialog';
import EditarDadosAtivoDialog from '@/modules/equipamentos/EditarDadosAtivoDialog';
import EditarArvoreAtivoDialog from '@/modules/equipamentos/EditarArvoreAtivoDialog';
import ManuaisAtivoDialog from '@/modules/equipamentos/ManuaisAtivoDialog';

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
  tag: '',
  nome: '',
  criticidade: 'C' as Criticidade,
  nivel_risco: 'BAIXO' as NivelRisco,
  localizacao: '',
  fabricante: '',
  modelo: '',
  numero_serie: '',
  data_instalacao: '',
};

export default function Equipamentos() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<Equipamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editDataOpen, setEditDataOpen] = useState(false);
  const [editTreeOpen, setEditTreeOpen] = useState(false);
  const [manuaisOpen, setManuaisOpen] = useState(false);
  const [selected, setSelected] = useState<Equipamento | null>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [osCount, setOsCount] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [fromEmpresa]);

  async function load() {
    setIsLoading(true);
    const { data } = await fromEmpresa('equipamentos').order('tag');
    setItems((data as Equipamento[]) || []);

    const { data: osData } = await fromEmpresa('ordens_servico').select('tag');
    if (osData) {
      const counts: Record<string, number> = {};
      osData.forEach((os: any) => {
        counts[os.tag] = (counts[os.tag] || 0) + 1;
      });
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
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    toast({ title: 'Equipamento cadastrado com sucesso!' });
    setDialogOpen(false);
    setForm(FORM_INITIAL);
    setSaving(false);
    load();
  };

  const handleDelete = async (equip: Equipamento) => {
    if (!confirm(`Excluir o ativo ${equip.tag} - ${equip.nome}?`)) return;

    let query = supabase.from('equipamentos').delete().eq('id', equip.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);

    const { error } = await query;
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Ativo excluído com sucesso!' });
    load();
  };

  const openVisualizar = (equip: Equipamento) => {
    setSelected(equip);
    setViewOpen(true);
  };

  const openEditarDados = (equip: Equipamento) => {
    setSelected(equip);
    setEditDataOpen(true);
  };

  const openEditarArvore = (equip: Equipamento) => {
    setSelected(equip);
    setEditTreeOpen(true);
  };

  const openManuais = (equip: Equipamento) => {
    setSelected(equip);
    setManuaisOpen(true);
  };

  const filtered = items.filter((i) => {
    const matchSearch = !search ||
      i.tag?.toLowerCase().includes(search.toLowerCase()) ||
      i.nome?.toLowerCase().includes(search.toLowerCase()) ||
      i.fabricante?.toLowerCase().includes(search.toLowerCase());
    const matchCrit = filterCriticidade === 'TODOS' || i.criticidade === filterCriticidade;
    const matchStatus = filterStatus === 'TODOS' || (filterStatus === 'ATIVO' ? i.ativo : !i.ativo);
    return matchSearch && matchCrit && matchStatus;
  });

  const stats = {
    total: items.length,
    ativos: items.filter((i) => i.ativo).length,
    criticos: items.filter((i) => i.criticidade === 'A').length,
    riscoCritico: items.filter((i) => i.nivel_risco === 'CRITICO').length,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Gestão de Equipamentos</h1>
          <p className="page-subtitle">Cadastro completo de ativos industriais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild>
            <Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Equipamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Novo Equipamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit}>
              <FormFields form={form} setForm={setForm} />
              <Button type="submit" className="btn-industrial w-full mt-6" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cadastrar Equipamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <Card className="card-industrial">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por TAG, nome ou fabricante..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                  <th className="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/50">
                    <td className="font-mono font-bold text-primary">{e.tag}</td>
                    <td className="font-medium">{e.nome}</td>
                    <td><Badge variant={criticidadeColor(e.criticidade)}>{e.criticidade === 'A' ? 'A - Crítico' : e.criticidade === 'B' ? 'B - Importante' : 'C - Normal'}</Badge></td>
                    <td><span className={`font-semibold text-sm ${riscoColor(e.nivel_risco)}`}>{e.nivel_risco}</span></td>
                    <td className="text-sm">{e.localizacao || '-'}</td>
                    <td className="text-sm">{[e.fabricante, e.modelo].filter(Boolean).join(' / ') || '-'}</td>
                    <td>{osCount[e.tag] ? <Badge variant="outline" className="font-mono">{osCount[e.tag]}</Badge> : <span className="text-muted-foreground">0</span>}</td>
                    <td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="actions-container justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="action-icon-btn text-primary"
                              onClick={() => openVisualizar(e)}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar ativo</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="action-icon-btn text-blue-600"
                              onClick={() => openEditarDados(e)}
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar dados do ativo</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="action-icon-btn text-violet-600"
                              onClick={() => openEditarArvore(e)}
                            >
                              <GitBranch className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar árvore do ativo</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="action-icon-btn text-emerald-600"
                              onClick={() => openManuais(e)}
                            >
                              <BookOpen className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gerenciar manuais</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="action-icon-btn text-destructive"
                              onClick={() => handleDelete(e)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir ativo</TooltipContent>
                        </Tooltip>
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

      <VisualizarAtivoDialog open={viewOpen} onOpenChange={setViewOpen} equipamento={selected} />

      <EditarDadosAtivoDialog
        open={editDataOpen}
        onOpenChange={setEditDataOpen}
        equipamento={selected}
        onSaved={load}
      />

      <EditarArvoreAtivoDialog
        open={editTreeOpen}
        onOpenChange={setEditTreeOpen}
        equipamento={selected}
      />

      <ManuaisAtivoDialog
        open={manuaisOpen}
        onOpenChange={setManuaisOpen}
        equipamento={selected}
      />
    </div>
  );
}

function FormFields({
  form,
  setForm,
}: {
  form: typeof FORM_INITIAL;
  setForm: React.Dispatch<React.SetStateAction<typeof FORM_INITIAL>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>TAG *</Label>
          <Input
            value={form.tag}
            onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value.toUpperCase() }))}
            required
            placeholder="Ex: BOM-001"
          />
        </div>
        <div className="space-y-2">
          <Label>Nome do Equipamento *</Label>
          <Input
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            required
            placeholder="Ex: Bomba Centrífuga Principal"
          />
        </div>
        <div className="space-y-2">
          <Label>Criticidade ABC</Label>
          <Select value={form.criticidade} onValueChange={(v) => setForm((p) => ({ ...p, criticidade: v as Criticidade }))}>
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
          <Select value={form.nivel_risco} onValueChange={(v) => setForm((p) => ({ ...p, nivel_risco: v as NivelRisco }))}>
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
          <Input value={form.localizacao} onChange={(e) => setForm((p) => ({ ...p, localizacao: e.target.value }))} placeholder="Ex: Sala de Bombas" />
        </div>
        <div className="space-y-2">
          <Label>Fabricante</Label>
          <Input value={form.fabricante} onChange={(e) => setForm((p) => ({ ...p, fabricante: e.target.value }))} placeholder="Ex: KSB" />
        </div>
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Input value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} placeholder="Ex: Meganorm 65-200" />
        </div>
        <div className="space-y-2">
          <Label>Nº de Série</Label>
          <Input value={form.numero_serie} onChange={(e) => setForm((p) => ({ ...p, numero_serie: e.target.value }))} placeholder="Ex: SN-2021-00451" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Data de Instalação</Label>
          <Input type="date" value={form.data_instalacao} onChange={(e) => setForm((p) => ({ ...p, data_instalacao: e.target.value }))} />
        </div>
      </div>
    </div>
  );
}
