export type StructuralNode = {
  id: string;
  parentId: string | null;
  nome: string;
  nivel: number;
};

export function buildTree(nodes: StructuralNode[]) {
  const map = new Map<string, StructuralNode & { children: StructuralNode[] }>();
  const roots: Array<StructuralNode & { children: StructuralNode[] }> = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of map.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    const parent = map.get(node.parentId);
    if (parent) parent.children.push(node);
  }

  return roots;
}
