import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, RefreshCw } from 'lucide-react';

export default function AdminAssinaturas() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ empresa_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0] });

  const load = useCallback(async () => {
    setIsLoading(true);
    const [a, e, p] = await Promise.all([
      supabase.from('assinaturas').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('id, nome').order('nome'),
      supabase.from('planos_saas').select('id, nome, preco').order('preco'),
    ]);
    setAssinaturas(a.data || []);
    setEmpresas(e.data || []);
    setPlanos(p.data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getEmpresa = (id: string) => empresas.find(e => e.id === id)?.nome || '-';
  const getPlano = (id: string) => planos.find(p => p.id === id)?.nome || '-';

  const save = async () => {
    if (!form.empresa_id || !form.plano_id) { toast({ title: 'Selecione empresa e plano', variant: 'destructive' }); return; }
    await supabase.from('assinaturas').update({ status: 'CANCELADA' }).eq('empresa_id', form.empresa_id).eq('status', 'ATIVA');
    const { error } = await supabase.from('assinaturas').insert({ empresa_id: form.empresa_id, plano_id: form.plano_id, data_inicio: form.data_inicio, status: 'ATIVA' });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Assinatura criada' });
    setDialog(false); load();
  };

  const cancelar = async (a: any) => {
    if (!confirm('Cancelar esta assinatura?')) return;
    await supabase.from('assinaturas').update({ status: 'CANCELADA' }).eq('id', a.id);
    toast({ title: 'Assinatura cancelada' }); load();
  };

  const reativar = async (a: any) => {
    await supabase.from('assinaturas').update({ status: 'CANCELADA' }).eq('empresa_id', a.empresa_id).eq('status', 'ATIVA');
    await supabase.from('assinaturas').update({ status: 'ATIVA' }).eq('id', a.id);
    toast({ title: 'Assinatura reativada' }); load();
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Assinaturas</h1><p className="text-sm text-muted-foreground">{assinaturas.length} assinaturas ({assinaturas.filter(a => a.status === 'ATIVA').length} ativas)</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          <Button onClick={() => { setForm({ empresa_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0] }); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Nova Assinatura</Button>
        </div>
      </div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Empresa</th>
              <th className="p-3 text-left font-medium">Plano</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Início</th>
              <th className="p-3 text-left font-medium">Fim</th>
              <th className="p-3 text-left font-medium">Ações</th>
            </tr></thead>
            <tbody>
              {assinaturas.map(a => (
                <tr key={a.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{getEmpresa(a.empresa_id)}</td>
                  <td className="p-3"><Badge variant="outline">{getPlano(a.plano_id)}</Badge></td>
                  <td className="p-3"><Badge variant={a.status === 'ATIVA' ? 'default' : 'secondary'}>{a.status}</Badge></td>
                  <td className="p-3 text-xs font-mono">{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-xs font-mono">{a.data_fim ? new Date(a.data_fim).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-3">
                    {a.status === 'ATIVA' ? (
                      <Button size="sm" variant="destructive" onClick={() => cancelar(a)}>Cancelar</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => reativar(a)}>Reativar</Button>
                    )}
                  </td>
                </tr>
              ))}
              {assinaturas.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma assinatura</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Assinatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Empresa *</Label>
              <Select value={form.empresa_id} onValueChange={v => setForm(f => ({ ...f, empresa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano *</Label>
              <Select value={form.plano_id} onValueChange={v => setForm(f => ({ ...f, plano_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco).toFixed(2)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Início</Label><Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
            <Button className="w-full" onClick={save}>Criar Assinatura</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
