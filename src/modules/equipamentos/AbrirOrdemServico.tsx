import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  equipamento: {
    tag: string;
    nome: string;
    localizacao: string | null;
  };
  componente: {
    id: string;
    codigo: string;
    nome: string;
    tipo: string;
  };
  onSuccess?: () => void;
}

export default function AbrirOrdemServico({ equipamento, componente, onSuccess }: Props) {
  const { user } = useAuth();
  const { empresaId } = useEmpresaQuery();
  const [problema, setProblema] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [fotosTexto, setFotosTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fotos = fotosTexto
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const { error } = await supabase.from('ordens_servico').insert({
        empresa_id: empresaId,
        tipo: 'CORRETIVA',
        prioridade: prioridade as any,
        tag: equipamento.tag,
        equipamento: equipamento.nome,
        componente: `${componente.codigo} - ${componente.nome}`,
        local: equipamento.localizacao || null,
        solicitante: user?.nome || 'Usuário',
        problema,
        usuario_abertura_id: user?.id,
        usuario_abertura: user?.nome || 'Usuário',
        data_solicitacao: new Date().toISOString(),
        fotos,
        status: 'ABERTA',
      });

      if (error) throw error;
      toast({ title: 'O.S aberta com sucesso!' });
      setProblema('');
      setPrioridade('MEDIA');
      setFotosTexto('');
      onSuccess?.();
    } catch (error: any) {
      toast({ title: 'Erro ao abrir O.S', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>TAG</Label><Input value={equipamento.tag} readOnly className="bg-muted font-mono" /></div>
        <div className="space-y-1"><Label>Equipamento</Label><Input value={equipamento.nome} readOnly className="bg-muted" /></div>
        <div className="space-y-1"><Label>Componente</Label><Input value={`${componente.codigo} - ${componente.nome}`} readOnly className="bg-muted" /></div>
        <div className="space-y-1"><Label>Local</Label><Input value={equipamento.localizacao || '-'} readOnly className="bg-muted" /></div>
        <div className="space-y-1"><Label>Data</Label><Input value={new Date().toLocaleString('pt-BR')} readOnly className="bg-muted" /></div>
        <div className="space-y-1"><Label>Aberto por</Label><Input value={user?.nome || 'Usuário'} readOnly className="bg-muted" /></div>
      </div>

      <div className="space-y-1">
        <Label>Prioridade</Label>
        <Select value={prioridade} onValueChange={setPrioridade}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="URGENTE">Urgente</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
            <SelectItem value="MEDIA">Média</SelectItem>
            <SelectItem value="BAIXA">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Descrição do problema</Label>
        <Textarea value={problema} onChange={(e) => setProblema(e.target.value)} rows={3} required />
      </div>

      <div className="space-y-1">
        <Label>Foto opcional (URLs, uma por linha)</Label>
        <Textarea value={fotosTexto} onChange={(e) => setFotosTexto(e.target.value)} rows={2} />
      </div>

      <Button type="submit" className="btn-industrial w-full" disabled={saving || !problema.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Abrir Ordem de Serviço
      </Button>
    </form>
  );
}
