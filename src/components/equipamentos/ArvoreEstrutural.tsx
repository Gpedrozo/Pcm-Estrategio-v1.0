import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, Loader2,
  Cpu, Cog, CircuitBoard, Box, Component, Settings2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ComponenteNode {
  id: string;
  equipamento_id: string;
  parent_id: string | null;
  codigo: string;
  nome: string;
  tipo: string;
  criticidade: string;
  observacoes: string | null;
  ativo: boolean;
  ordem: number;
  empresa_id: string | null;
  children: ComponenteNode[];
}

const TIPOS = [
  { value: 'SISTEMA', label: 'Sistema', icon: Cpu },
  { value: 'SUBSISTEMA', label: 'Subsistema', icon: CircuitBoard },
  { value: 'CONJUNTO', label: 'Conjunto', icon: Settings2 },
  { value: 'COMPONENTE', label: 'Componente', icon: Cog },
  { value: 'PARTE', label: 'Parte/Peça', icon: Component },
];

const CRITICIDADES = [
  { value: 'A', label: 'A - Crítico', color: 'destructive' as const },
  { value: 'B', label: 'B - Importante', color: 'default' as const },
  { value: 'C', label: 'C - Normal', color: 'secondary' as const },
];

const FORM_INITIAL = {
  codigo: '',
  nome: '',
  tipo: 'COMPONENTE',
  criticidade: 'C',
  observacoes: '',
};

interface Props {
  equipamentoId: string;
  equipamentoTag: string;
  readOnly?: boolean;
}

export default function ArvoreEstrutural({ equipamentoId, equipamentoTag, readOnly = false }: Props) {
  const { empresaId } = useEmpresaQuery();
  const [nodes, setNodes] = useState<ComponenteNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNode, setEditNode] = useState<ComponenteNode | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('componentes_equipamento')
      .select('*')
      .eq('equipamento_id', equipamentoId)
      .order('ordem')
      .order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar árvore', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Build tree
    const flat = (data || []) as any[];
    const map = new Map<string, ComponenteNode>();
    const roots: ComponenteNode[] = [];

    flat.forEach(n => map.set(n.id, { ...n, children: [] }));
    flat.forEach(n => {
      const node = map.get(n.id)!;
      if (n.parent_id && map.has(n.parent_id)) {
        map.get(n.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    setNodes(roots);
    setLoading(false);
  }, [equipamentoId]);

  useEffect(() => { loadTree(); }, [loadTree]);

  const openAdd = (pId: string | null) => {
    if (readOnly) return;
    setParentId(pId);
    setEditNode(null);
    // Suggest tipo based on depth
    const suggestedTipo = !pId ? 'SISTEMA' : 'COMPONENTE';
    setForm({ ...FORM_INITIAL, tipo: suggestedTipo });
    setDialogOpen(true);
  };

  const openEdit = (node: ComponenteNode) => {
    if (readOnly) return;
    setEditNode(node);
    setParentId(node.parent_id);
    setForm({
      codigo: node.codigo,
      nome: node.nome,
      tipo: node.tipo,
      criticidade: node.criticidade,
      observacoes: node.observacoes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editNode) {
      const { error } = await supabase
        .from('componentes_equipamento')
        .update({
          codigo: form.codigo,
          nome: form.nome,
          tipo: form.tipo,
          criticidade: form.criticidade,
          observacoes: form.observacoes || null,
        })
        .eq('id', editNode.id);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      toast({ title: 'Componente atualizado!' });
    } else {
      const { error } = await supabase
        .from('componentes_equipamento')
        .insert({
          equipamento_id: equipamentoId,
          parent_id: parentId,
          codigo: form.codigo,
          nome: form.nome,
          tipo: form.tipo,
          criticidade: form.criticidade,
          observacoes: form.observacoes || null,
          empresa_id: empresaId,
        });

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
      toast({ title: 'Componente adicionado!' });
    }

    setSaving(false);
    setDialogOpen(false);
    loadTree();
  };

  const handleDelete = async (node: ComponenteNode) => {
    if (readOnly) return;
    if (!confirm(`Remover "${node.nome}" e todos os sub-itens?`)) return;
    const { error } = await supabase
      .from('componentes_equipamento')
      .delete()
      .eq('id', node.id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Componente removido!' });
    loadTree();
  };

  const countTotal = (nodes: ComponenteNode[]): number => {
    return nodes.reduce((acc, n) => acc + 1 + countTotal(n.children), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Árvore Estrutural</p>
          <p className="text-xs text-muted-foreground">
            {countTotal(nodes)} componente(s) cadastrado(s)
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openAdd(null)}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar Sistema
          </Button>
        )}
      </div>

      {/* Tree */}
      {nodes.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Box className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum componente cadastrado</p>
          <p className="text-xs mt-1">{readOnly ? 'Não há estrutura cadastrada para visualização.' : 'Adicione sistemas, subsistemas e componentes para construir a árvore estrutural.'}</p>
          {!readOnly && (
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => openAdd(null)}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar Primeiro Sistema
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-3 space-y-0.5 bg-muted/20">
          {/* Root: Equipment */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/5 border border-primary/20 mb-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-bold text-primary">{equipamentoTag}</span>
            <span className="text-sm text-muted-foreground">— Equipamento (raiz)</span>
          </div>
          {nodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={1}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {!readOnly && (
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditNode(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editNode ? 'Editar Componente' : 'Novo Componente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Código *</Label>
                  <Input
                    value={form.codigo}
                    onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                    required
                    placeholder="Ex: SIS-COMP-01"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo *</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  required
                  placeholder="Ex: Sistema de Compressão"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Criticidade</Label>
                <Select value={form.criticidade} onValueChange={v => setForm(p => ({ ...p, criticidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRITICIDADES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Observações técnicas..."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editNode ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onAdd,
  onEdit,
  onDelete,
  readOnly,
}: {
  node: ComponenteNode;
  depth: number;
  onAdd: (parentId: string | null) => void;
  onEdit: (node: ComponenteNode) => void;
  onDelete: (node: ComponenteNode) => void;
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(depth <= 2);
  const hasChildren = node.children.length > 0;
  const tipoInfo = TIPOS.find(t => t.value === node.tipo) || TIPOS[3];
  const TipoIcon = tipoInfo.icon;
  const critInfo = CRITICIDADES.find(c => c.value === node.criticidade) || CRITICIDADES[2];

  return (
    <div style={{ paddingLeft: `${depth * 16}px` }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/60 transition-colors">
          {/* Expand toggle */}
          <CollapsibleTrigger asChild>
            <button className="p-0.5 rounded hover:bg-muted" disabled={!hasChildren}>
              {hasChildren ? (
                open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <span className="w-3.5 h-3.5 inline-block" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* Icon + info */}
          <TipoIcon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
          <span className="font-mono text-xs text-muted-foreground">{node.codigo}</span>
          <span className="text-sm font-medium truncate">{node.nome}</span>
          <Badge variant={critInfo.color} className="text-[10px] px-1.5 py-0 h-4 ml-1">
            {node.criticidade}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {tipoInfo.label}
          </Badge>
          {!node.ativo && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Inativo</Badge>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAdd(node.id)} title="Adicionar sub-item">
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)} title="Editar">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(node)} title="Remover">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}
