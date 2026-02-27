import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEnterpriseServices } from '@/core/presentation/useEnterpriseServices';

interface Props {
  tag: string;
  nome: string;
}

export default function GerarQRCode({ tag, nome }: Props) {
  const { gerarQrUrlEquipamentoUseCase } = useEnterpriseServices();
  const fullUrl = gerarQrUrlEquipamentoUseCase.execute(tag, window.location.origin);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    toast({ title: 'Link do QR copiado!' });
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 flex flex-col items-center gap-3 bg-muted/20">
        <img src={qrImageUrl} alt={`QR Code ${tag}`} className="w-56 h-56 object-contain" />
        <div className="text-center">
          <p className="font-mono font-bold text-primary">{tag}</p>
          <p className="text-sm text-muted-foreground">{nome}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL do QR</Label>
        <div className="flex gap-2">
          <Input value={fullUrl} readOnly className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
          <Button asChild variant="outline" size="icon"><a href={fullUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
        </div>
      </div>
    </div>
  );
}
