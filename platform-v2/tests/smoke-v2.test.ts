import { describe, expect, it } from 'vitest';
import { buildQrPayload } from '../services/qrService';
import { buildTree } from '../services/treeService';
import { canAccessApp } from '../web/AuthGate';

describe('platform-v2 smoke', () => {
  it('gera payload de QR com tag e empresa', () => {
    const payload = buildQrPayload({
      baseUrl: 'https://pcm.example.com',
      tag: 'BMB-100',
      empresaId: 'empresa-1',
    });

    expect(payload).toContain('BMB-100');
    expect(payload).toContain('empresa-1');
  });

  it('monta árvore estrutural infinita por parentId', () => {
    const tree = buildTree([
      { id: '1', parentId: null, nome: 'Pai', nivel: 0 },
      { id: '2', parentId: '1', nome: 'Filho', nivel: 1 },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
  });

  it('bloqueia acesso sem sessão ou empresa', () => {
    expect(canAccessApp({ userId: null, empresaId: 'e1' })).toBe(false);
    expect(canAccessApp({ userId: 'u1', empresaId: null })).toBe(false);
    expect(canAccessApp({ userId: 'u1', empresaId: 'e1' })).toBe(true);
  });
});
