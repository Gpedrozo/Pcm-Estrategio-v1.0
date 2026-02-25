import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';

const TODOS_MODULOS = [
  'DASHBOARD','SOLICITACOES','EMITIR_OS','FECHAR_OS','HISTORICO_OS',
  'BACKLOG','PROGRAMACAO','PREVENTIVA','PREDITIVA','INSPECOES',
  'FMEA','RCA','MELHORIAS','HIERARQUIA','EQUIPAMENTOS','MECANICOS',
  'MATERIAIS','FORNECEDORES','CONTRATOS','DOCUMENTOS','LUBRIFICACAO',
  'CUSTOS','RELATORIOS','SSMA','USUARIOS','AUDITORIA','ANALISE_IA',
];

export default function AdminPlanos() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [planos, setPlanos] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', preco: 0, max_usuarios: 5, modulos_ativos: [] as string[], ativo: true });

  const load = useCallback(async () => {
    setIsLoading(true);
    const [p, a] = await Promise.all([
      supabase.from('planos_saas').select('*').order('preco'),
      supabase.from('assinaturas').select('*').eq('status', 'ATIVA'),
    ]);
    setPlanos(p.data || []);
    setAssinaturas(a.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ nome: '', preco: 0, max_usuarios: 5, modulos_ativos: [], ativo: true }); setDialog(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ nome: p.nome, preco: p.preco, max_usuarios: p.max_usuarios, modulos_ativos: p.modulos_ativos || [], ativo: p.ativo }); setDialog(true); };

  const toggleModulo = (mod: string) => {
    setForm(f => ({
      ...f,
      modulos_ativos: f.modulos_ativos.includes(mod) ? f.modulos_ativos.filter(m => m !== mod) : [...f.modulos_ativos, mod],
    }));
  };

  const save = async () => {
    if (!form.nome.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const data = { nome: form.nome, preco: form.preco, max_usuarios: form.max_usuarios, modulos_ativos: form.modulos_ativos, ativo: form.ativo };
    if (editing) {
      await supabase.from('planos_saas').update(data).eq('id', editing.id);
      toast({ title: 'Plano atualizado' });
    } else {
      await supabase.from('planos_saas').insert(data);
      toast({ title: 'Plano criado' });
    }
    setDialog(false); load();
  };

  const remove = async (p: any) => {
    const used = assinaturas.some(a => a.plano_id === p.id);
    if (used) { toast({ title: 'Plano em uso', description: 'Não é possível excluir um plano com assinaturas ativas', variant: 'destructive' }); return; }
    if (!confirm(`Excluir plano "${p.nome}"?`)) return;
    await supabase.from('planos_saas').delete().eq('id', p.id);
    toast({ title: 'Plano excluído' }); load();
  };

  const getAssCount = (planoId: string) => assinaturas.filter(a => a.plano_id === planoId).length;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Planos SaaS</h1><p className="text-sm text-muted-foreground">{planos.length} planos cadastrados</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.map(p => (
          <Card key={p.id} className={`relative ${!p.ativo ? 'opacity-60' : ''}`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{p.nome}</h3>
                    {!p.ativo && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <p className="text-3xl font-bold text-primary mt-1">
                    R$ {Number(p.preco).toFixed(2)}
                    <span className="text-sm text-muted-foreground font-normal">/mês</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Máx. Usuários</span><span className="font-bold">{p.max_usuarios}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Módulos</span><span className="font-bold">{(p.modulos_ativos || []).length}/{TODOS_MODULOS.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Assinaturas Ativas</span><Badge variant="default">{getAssCount(p.id)}</Badge></div>
              </div>
              <div className="flex flex-wrap gap-1 pt-2 border-t">
                {(p.modulos_ativos || []).map((m: string) => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
        {planos.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-8">Nenhum plano</p>}
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: Number(e.target.value) }))} /></div>
              <div><Label>Máx Usuários</Label><Input type="number" value={form.max_usuarios} onChange={e => setForm(f => ({ ...f, max_usuarios: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
              <Label>Plano ativo</Label>
            </div>
            <div>
              <Label>Módulos ({form.modulos_ativos.length}/{TODOS_MODULOS.length})</Label>
              <div className="flex gap-2 mt-1 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, modulos_ativos: [...TODOS_MODULOS] }))}>Todos</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, modulos_ativos: [] }))}>Nenhum</Button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto border rounded-md p-3">
                {TODOS_MODULOS.map(m => (
                  <label key={m} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <input type="checkbox" checked={form.modulos_ativos.includes(m)} onChange={() => toggleModulo(m)} className="rounded" />
                    {m}
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={save}>{editing ? 'Atualizar' : 'Criar Plano'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
