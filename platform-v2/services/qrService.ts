export type QrLabelSize = '10x10' | '5x5';

export function buildQrPayload(params: { baseUrl: string; tag: string; empresaId: string }) {
  const base = params.baseUrl.replace(/\/+$/, '');
  return `${base}/app/equipamento/${encodeURIComponent(params.tag)}?empresa=${encodeURIComponent(params.empresaId)}`;
}

export function buildQrPrintModel(params: { tag: string; descricao: string; qrUrl: string; size: QrLabelSize }) {
  return {
    size: params.size,
    header: 'PCM Estratégico',
    tag: params.tag,
    descricao: params.descricao,
    qrUrl: params.qrUrl,
  };
}
