import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileText, Download, Trash2, Loader2, File, FileImage, FileSpreadsheet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ArquivoEquipamento {
  id: string;
  equipamento_id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo: string;
  tamanho_bytes: number | null;
  storage_path: string;
  descricao: string | null;
  empresa_id: string | null;
  created_at: string;
}

const TIPOS_ARQUIVO = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'DATASHEET', label: 'Datasheet' },
  { value: 'DESENHO', label: 'Desenho Técnico' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'PROCEDIMENTO', label: 'Procedimento' },
  { value: 'OUTRO', label: 'Outro' },
];

interface Props {
  equipamentoId: string;
  equipamentoTag: string;
  readOnly?: boolean;
}

export default function ManuaisEquipamento({ equipamentoId, equipamentoTag, readOnly = false }: Props) {
  const { empresaId } = useEmpresaQuery();
  const [arquivos, setArquivos] = useState<ArquivoEquipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tipoUpload, setTipoUpload] = useState('MANUAL');
  const [descricao, setDescricao] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arquivos_equipamento')
      .select('*')
      .eq('equipamento_id', equipamentoId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar arquivos', description: error.message, variant: 'destructive' });
    }
    setArquivos((data as ArquivoEquipamento[]) || []);
    setLoading(false);
  }, [equipamentoId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo é 20MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${equipamentoTag}/${Date.now()}_${file.name}`;

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from('manuais_equipamentos')
      .upload(fileName, file, { upsert: false });

    if (storageError) {
      toast({ title: 'Erro no upload', description: storageError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    // Save record
    const { error: dbError } = await supabase
      .from('arquivos_equipamento')
      .insert({
        equipamento_id: equipamentoId,
        nome_arquivo: fileName,
        nome_original: file.name,
        tipo: tipoUpload,
        tamanho_bytes: file.size,
        storage_path: fileName,
        descricao: descricao || null,
        empresa_id: empresaId,
      });

    if (dbError) {
      toast({ title: 'Erro ao salvar registro', description: dbError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    toast({ title: 'Arquivo enviado com sucesso!' });
    setDescricao('');
    setTipoUpload('MANUAL');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    load();
  };

  const handleDownload = (arquivo: ArquivoEquipamento) => {
    const { data } = supabase.storage
      .from('manuais_equipamentos')
      .getPublicUrl(arquivo.storage_path);

    window.open(data.publicUrl, '_blank');
  };

  const handleDelete = async (arquivo: ArquivoEquipamento) => {
    if (readOnly) return;
    if (!confirm(`Remover "${arquivo.nome_original}"?`)) return;

    // Delete from storage
    await supabase.storage
      .from('manuais_equipamentos')
      .remove([arquivo.storage_path]);

    // Delete record
    const { error } = await supabase
      .from('arquivos_equipamento')
      .delete()
      .eq('id', arquivo.id);

    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Arquivo removido!' });
    load();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (nome: string) => {
    const ext = nome.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!readOnly && (
        <div className="border border-dashed rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Enviar Arquivo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo do Documento</Label>
              <Select value={tipoUpload} onValueChange={setTipoUpload}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_ARQUIVO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Manual do fabricante v2.1"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.dwg,.dxf"
              onChange={handleUpload}
              className="hidden"
              id="manual-upload"
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </Button>
            <span className="text-xs text-muted-foreground">PDF, DOC, XLS, JPG, DWG — máx. 20MB</span>
          </div>
        </div>
      )}

      {/* File list */}
      {arquivos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum arquivo vinculado</p>
          <p className="text-xs mt-1">Envie manuais, datasheets ou desenhos técnicos deste equipamento.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">{arquivos.length} arquivo(s) vinculado(s)</p>
          {arquivos.map(arq => (
            <div
              key={arq.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-muted/40 transition-colors"
            >
              {getFileIcon(arq.nome_original)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{arq.nome_original}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {TIPOS_ARQUIVO.find(t => t.value === arq.tipo)?.label || arq.tipo}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{formatSize(arq.tamanho_bytes)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(arq.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {arq.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{arq.descricao}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(arq)}
                  title="Baixar"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(arq)}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
