import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Cpu, CircuitBoard, Cog, Component, Settings2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Node {
  id: string;
  parent_id: string | null;
  codigo: string;
  nome: string;
  tipo: string;
  criticidade: string;
  children: Node[];
}

interface Props {
  equipamentoId: string;
  onSelectComponente: (node: Node) => void;
  selectedComponenteId?: string | null;
}

const tipoIcon = (tipo: string) => {
  if (tipo === 'SISTEMA') return Cpu;
  if (tipo === 'SUBSISTEMA') return CircuitBoard;
  if (tipo === 'CONJUNTO') return Settings2;
  if (tipo === 'COMPONENTE') return Cog;
  return Component;
};

export default function ArvoreEstrutural({ equipamentoId, onSelectComponente, selectedComponenteId }: Props) {
  const [roots, setRoots] = useState<Node[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('componentes_equipamento')
        .select('id, parent_id, codigo, nome, tipo, criticidade')
        .eq('equipamento_id', equipamentoId)
        .eq('ativo', true)
        .order('ordem')
        .order('nome');

      if (error) {
        toast({ title: 'Erro ao carregar árvore', description: error.message, variant: 'destructive' });
        return;
      }

      const map = new Map<string, Node>();
      (data || []).forEach((item: any) => map.set(item.id, { ...item, children: [] }));
      const r: Node[] = [];
      (data || []).forEach((item: any) => {
        const node = map.get(item.id)!;
        if (item.parent_id && map.has(item.parent_id)) map.get(item.parent_id)!.children.push(node);
        else r.push(node);
      });
      setRoots(r);
    };
    load();
  }, [equipamentoId]);

  const total = useMemo(() => {
    const count = (nodes: Node[]): number => nodes.reduce((acc, n) => acc + 1 + count(n.children), 0);
    return count(roots);
  }, [roots]);

  if (roots.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem estrutura cadastrada para este equipamento.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{total} componente(s) na estrutura</p>
      <div className="border rounded-lg p-2">
        {roots.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} onSelectComponente={onSelectComponente} selectedComponenteId={selectedComponenteId} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onSelectComponente,
  selectedComponenteId,
}: {
  node: Node;
  depth: number;
  onSelectComponente: (node: Node) => void;
  selectedComponenteId?: string | null;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const Icon = tipoIcon(node.tipo);

  return (
    <div style={{ paddingLeft: `${depth * 14}px` }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className={`flex items-center gap-2 px-2 py-1 rounded ${selectedComponenteId === node.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}>
          <CollapsibleTrigger asChild>
            <button type="button" className="p-0.5 rounded">
              {hasChildren ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span className="w-3.5 h-3.5 inline-block" />}
            </button>
          </CollapsibleTrigger>
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">{node.codigo}</span>
          <span className="text-sm flex-1 truncate">{node.nome}</span>
          <Badge variant="outline" className="text-[10px]">{node.criticidade}</Badge>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelectComponente(node)}>Selecionar</Button>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} onSelectComponente={onSelectComponente} selectedComponenteId={selectedComponenteId} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}
