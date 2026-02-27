import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Equipamento {
  id: string;
  tag: string;
  nome: string;
  localizacao: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ativo: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento: Equipamento | null;
  onSaved: () => void;
}

function splitSetorLocal(localizacao: string | null) {
  const value = localizacao || '';
  const parts = value.split('/').map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { setor: parts[0], local: parts.slice(1).join(' / ') };
  }
  return { setor: '', local: value };
}

export default function EditarDadosAtivoDialog({ open, onOpenChange, equipamento, onSaved }: Props) {
  const { empresaId } = useEmpresaQuery();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tag: '',
    nome: '',
    setor: '',
    local: '',
    fabricante: '',
    modelo: '',
    numero_serie: '',
    status: 'ATIVO',
  });

  useEffect(() => {
    if (!equipamento) return;
    const parsed = splitSetorLocal(equipamento.localizacao);
    setForm({
      tag: equipamento.tag,
      nome: equipamento.nome,
      setor: parsed.setor,
      local: parsed.local,
      fabricante: equipamento.fabricante || '',
      modelo: equipamento.modelo || '',
      numero_serie: equipamento.numero_serie || '',
      status: equipamento.ativo ? 'ATIVO' : 'INATIVO',
    });
  }, [equipamento]);

  const localizacao = useMemo(() => {
    if (form.setor && form.local) return `${form.setor} / ${form.local}`;
    return form.local || form.setor || '';
  }, [form.local, form.setor]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!equipamento) return;

    setSaving(true);
    let query = supabase
      .from('equipamentos')
      .update({
        tag: form.tag.toUpperCase(),
        nome: form.nome,
        localizacao: localizacao || null,
        fabricante: form.fabricante || null,
        modelo: form.modelo || null,
        numero_serie: form.numero_serie || null,
        ativo: form.status === 'ATIVO',
      })
      .eq('id', equipamento.id);

    if (empresaId) query = query.eq('empresa_id', empresaId);

    const { error } = await query;
    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao atualizar ativo', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Dados do ativo atualizados com sucesso!' });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Dados do Ativo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TAG *</Label>
              <Input value={form.tag} onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value.toUpperCase() }))} required />
            </div>
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input value={form.setor} onChange={(e) => setForm((prev) => ({ ...prev, setor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input value={form.local} onChange={(e) => setForm((prev) => ({ ...prev, local: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Input value={form.fabricante} onChange={(e) => setForm((prev) => ({ ...prev, fabricante: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input value={form.numero_serie} onChange={(e) => setForm((prev) => ({ ...prev, numero_serie: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar Dados
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
