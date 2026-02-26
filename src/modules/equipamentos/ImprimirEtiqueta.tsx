import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';

interface Props {
  tag: string;
  nome: string;
}

export default function ImprimirEtiqueta({ tag, nome }: Props) {
  const [size, setSize] = useState<'10' | '5'>('10');
  const cm = size === '10' ? 10 : 5;
  const qrPx = size === '10' ? 320 : 170;

  const qrPath = `/equipamento/${encodeURIComponent(tag)}`;
  const fullUrl = `${window.location.origin}${qrPath}`;
  const qrImageUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(fullUrl)}`,
    [fullUrl]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <Label>Tamanho da etiqueta</Label>
        <Select value={size} onValueChange={(v) => setSize(v as '10' | '5')}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 cm x 10 cm</SelectItem>
            <SelectItem value="5">5 cm x 5 cm</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />Imprimir Etiqueta
        </Button>
      </div>

      <div className="print-container flex justify-center">
        <div
          className="border border-border rounded-md bg-white text-black flex flex-col items-center justify-center"
          style={{ width: `${cm}cm`, height: `${cm}cm`, padding: size === '10' ? '0.5cm' : '0.25cm' }}
        >
          <img src={qrImageUrl} alt={`QR ${tag}`} style={{ width: qrPx, height: qrPx, maxWidth: '100%', maxHeight: '70%' }} />
          <div className="text-center mt-2">
            <p style={{ fontSize: size === '10' ? '16px' : '12px', fontWeight: 700 }}>{tag}</p>
            <p style={{ fontSize: size === '10' ? '12px' : '9px' }} className="line-clamp-2">{nome}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
