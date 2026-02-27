export class GerarQrUrlEquipamentoUseCase {
  execute(tag: string, origin: string) {
    const normalizedTag = String(tag || '').trim().toUpperCase();
    const path = `/equipamento/${encodeURIComponent(normalizedTag)}`;
    return `${origin}${path}`;
  }
}
