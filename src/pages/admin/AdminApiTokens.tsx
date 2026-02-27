import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, RefreshCw, Copy, RotateCcw, Ban } from 'lucide-react';
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
  rotateApiToken,
  type ApiTokenItem,
} from '@/services/adminApiTokensService';

const AVAILABLE_SCOPES = [
  'read:openapi',
  'read:equipamentos',
  'read:ordens-servico',
  'read:execucoes',
  'read:indicadores',
  'read:usuarios',
  'read:empresas',
];

export default function AdminApiTokens() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('all');

  const [empresaId, setEmpresaId] = useState<string>('');
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read:equipamentos']);
  const [expiresAt, setExpiresAt] = useState('');
  const [novoToken, setNovoToken] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, items] = await Promise.all([
        supabase.from('empresas').select('id, nome').order('nome'),
        listApiTokens(empresaFiltro === 'all' ? undefined : empresaFiltro),
      ]);

      setEmpresas((empRes.data || []) as Array<{ id: string; nome: string }>);
      setTokens(items);

      if (!empresaId && (empRes.data || []).length > 0) {
        setEmpresaId(empRes.data![0].id);
      }
    } catch (error) {
      toast({ title: 'Erro ao carregar tokens', description: error instanceof Error ? error.message : 'Falha inesperada', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, empresaFiltro, empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const empresaNome = useMemo(() => {
    const map = new Map(empresas.map((empresa) => [empresa.id, empresa.nome]));
    return (id: string) => map.get(id) || id;
  }, [empresas]);

  const toggleScope = (scope: string, checked: boolean) => {
    setScopes((prev) => {
      if (checked) return Array.from(new Set([...prev, scope]));
      return prev.filter((item) => item !== scope);
    });
  };

  const onCreate = async () => {
    if (!empresaId || !name.trim() || scopes.length === 0) {
      toast({ title: 'Preencha empresa, nome e pelo menos um escopo.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const result = await createApiToken({
        empresaId,
        name: name.trim(),
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      setNovoToken(result.plainToken);
      setName('');
      setExpiresAt('');
      await load();
      toast({ title: 'Token criado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao criar token', description: error instanceof Error ? error.message : 'Falha inesperada', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const onRotate = async (tokenId: string) => {
    try {
      const result = await rotateApiToken(tokenId);
      setNovoToken(result.plainToken);
      await load();
      toast({ title: 'Token rotacionado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao rotacionar token', description: error instanceof Error ? error.message : 'Falha inesperada', variant: 'destructive' });
    }
  };

  const onRevoke = async (tokenId: string) => {
    try {
      await revokeApiToken(tokenId);
      await load();
      toast({ title: 'Token revogado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao revogar token', description: error instanceof Error ? error.message : 'Falha inesperada', variant: 'destructive' });
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(novoToken);
      toast({ title: 'Token copiado' });
    } catch {
      toast({ title: 'Não foi possível copiar automaticamente', description: 'Copie manualmente o token exibido.' });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><KeyRound className="h-6 w-6" />Tokens de API</h1>
          <p className="text-sm text-muted-foreground">Geração, rotação e revogação de tokens de integração com escopo.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar novo token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do token</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="ex: integração ERP" />
            </div>

            <div className="space-y-2">
              <Label>Expira em</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Escopos</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {AVAILABLE_SCOPES.map((scope) => {
                const checked = scopes.includes(scope);
                return (
                  <label key={scope} className="flex items-center gap-2 border rounded-md px-3 py-2">
                    <Checkbox checked={checked} onCheckedChange={(value) => toggleScope(scope, Boolean(value))} />
                    <span className="text-sm">{scope}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button onClick={onCreate} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Gerar token
          </Button>

          {novoToken && (
            <div className="rounded-md border p-3 bg-muted/30 space-y-2">
              <p className="text-sm font-medium">Token gerado (exibido apenas agora):</p>
              <div className="flex gap-2">
                <Input value={novoToken} readOnly />
                <Button variant="outline" onClick={copyToken}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tokens cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-72">
            <Label>Filtrar por empresa</Label>
            <Select value={empresaFiltro} onValueChange={setEmpresaFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Empresa</th>
                  <th className="p-3 text-left">Escopos</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Expiração</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b">
                    <td className="p-3 font-medium">{token.name}</td>
                    <td className="p-3">{empresaNome(token.empresa_id)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {token.scopes?.map((scope) => <Badge key={scope} variant="secondary">{scope}</Badge>)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={token.active ? 'default' : 'destructive'}>{token.active ? 'ATIVO' : 'REVOGADO'}</Badge>
                    </td>
                    <td className="p-3">{token.expires_at ? new Date(token.expires_at).toLocaleString('pt-BR') : 'Sem expiração'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onRotate(token.id)}><RotateCcw className="h-4 w-4 mr-1" />Rotacionar</Button>
                        <Button size="sm" variant="destructive" disabled={!token.active} onClick={() => onRevoke(token.id)}><Ban className="h-4 w-4 mr-1" />Revogar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum token encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
