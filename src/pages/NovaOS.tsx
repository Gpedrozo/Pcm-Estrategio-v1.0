import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FilePlus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TipoOS = Database['public']['Enums']['tipo_os'];
type PrioridadeOS = Database['public']['Enums']['prioridade_os'];

export default function NovaOS() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [form, setForm] = useState({
    tipo: 'CORRETIVA' as TipoOS,
    prioridade: 'MEDIA' as PrioridadeOS,
    tag: '',
    equipamento: '',
    solicitante: user?.nome || '',
    problema: '',
    tempo_estimado: '',
    custo_estimado: '',
  });

  useEffect(() => {
    supabase.from('equipamentos').select('*').eq('ativo', true).then(({ data }) => {
      setEquipamentos(data || []);
    });
  }, []);

  const handleTagChange = (tag: string) => {
    const equip = equipamentos.find(e => e.tag === tag);
    setForm(prev => ({ ...prev, tag, equipamento: equip?.nome || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from('ordens_servico').insert({
        tipo: form.tipo,
        prioridade: form.prioridade,
        tag: form.tag,
        equipamento: form.equipamento,
        solicitante: form.solicitante,
        problema: form.problema,
        usuario_abertura_id: user?.id,
        usuario_abertura: user?.nome || 'Usuário',
        tempo_estimado: form.tempo_estimado ? parseInt(form.tempo_estimado) : null,
        custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : null,
      });

      if (error) throw error;

      toast({ title: 'O.S criada com sucesso!' });
      setForm({ tipo: 'CORRETIVA', prioridade: 'MEDIA', tag: '', equipamento: '', solicitante: user?.nome || '', problema: '', tempo_estimado: '', custo_estimado: '' });
    } catch (error: any) {
      toast({ title: 'Erro ao criar O.S', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Emitir Ordem de Serviço</h1>
        <p className="page-subtitle">Preencha os dados para criar uma nova O.S</p>
      </div>

      <Card className="card-industrial max-w-3xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm(prev => ({ ...prev, tipo: v as TipoOS }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                    <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                    <SelectItem value="PREDITIVA">Preditiva</SelectItem>
                    <SelectItem value="INSPECAO">Inspeção</SelectItem>
                    <SelectItem value="MELHORIA">Melhoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm(prev => ({ ...prev, prioridade: v as PrioridadeOS }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>TAG do Equipamento</Label>
                <Select value={form.tag} onValueChange={handleTagChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {equipamentos.map(e => (
                      <SelectItem key={e.id} value={e.tag}>{e.tag} - {e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Equipamento</Label>
                <Input value={form.equipamento} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Solicitante</Label>
                <Input value={form.solicitante} onChange={(e) => setForm(prev => ({ ...prev, solicitante: e.target.value }))} required />
              </div>

              <div className="space-y-2">
                <Label>Tempo Estimado (min)</Label>
                <Input type="number" value={form.tempo_estimado} onChange={(e) => setForm(prev => ({ ...prev, tempo_estimado: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea
                value={form.problema}
                onChange={(e) => setForm(prev => ({ ...prev, problema: e.target.value }))}
                required
                rows={4}
                placeholder="Descreva o problema detalhadamente..."
              />
            </div>

            <Button type="submit" className="btn-industrial gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
              Criar Ordem de Serviço
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
