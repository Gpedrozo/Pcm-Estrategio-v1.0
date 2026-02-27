import * as XLSX from 'xlsx';

type Criticidade = 'A' | 'B' | 'C';
type NivelRisco = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';

export interface EquipamentoImportRow {
  tag: string;
  nome: string;
  localizacao: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  data_instalacao: string | null;
  criticidade: Criticidade;
  nivel_risco: NivelRisco;
}

export interface ComponenteImportRow {
  equipamento_tag: string;
  codigo: string;
  nome: string;
  parent_codigo: string | null;
  tipo: string;
  criticidade: Criticidade;
  ordem: number;
  observacoes: string | null;
}

export interface ImportError {
  sheet: 'Equipamentos' | 'Componentes';
  row: number;
  reason: string;
}

const VALID_CRITICIDADE = new Set(['A', 'B', 'C']);
const VALID_RISCO = new Set(['CRITICO', 'ALTO', 'MEDIO', 'BAIXO']);

function normalizeDate(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return null;
    const month = String(date.m).padStart(2, '0');
    const day = String(date.d).padStart(2, '0');
    return `${date.y}-${month}-${day}`;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return raw;
  }

  return null;
}

export function generateEquipmentTreeTemplate() {
  const equipamentosHeaders = [
    'TAG',
    'Nome do Equipamento',
    'Setor/Localização',
    'Fabricante',
    'Modelo',
    'Número de Série',
    'Data de Instalação (DD/MM/AAAA)',
    'Criticidade (A/B/C)',
    'Nível de Risco (CRITICO/ALTO/MEDIO/BAIXO)',
  ];

  const equipamentosRows = [
    equipamentosHeaders,
    ['BOM-001', 'Bomba Principal', 'Utilidades/Sala de Bombas', 'KSB', 'MegaCP', 'SN-001', '01/01/2023', 'A', 'ALTO'],
    ['COMP-010', 'Compressor de Ar', 'Utilidades/Compressores', 'Atlas Copco', 'GA-90', 'SN-010', '15/03/2022', 'B', 'MEDIO'],
  ];

  const componentesHeaders = [
    'TAG Equipamento',
    'Código Componente',
    'Nome Componente',
    'Código Componente Pai (opcional)',
    'Tipo (opcional)',
    'Criticidade (A/B/C opcional)',
    'Ordem (opcional)',
    'Observações (opcional)',
  ];

  const componentesRows = [
    componentesHeaders,
    ['BOM-001', 'CJ-001', 'Conjunto Bomba', '', 'CONJUNTO', 'A', 1, 'Nó raiz da árvore'],
    ['BOM-001', 'MTR-001', 'Motor Elétrico', 'CJ-001', 'MOTOR', 'A', 2, '75CV'],
    ['BOM-001', 'BRG-001', 'Rolamento Lado Acoplamento', 'MTR-001', 'ROLAMENTO', 'B', 3, '6208'],
    ['COMP-010', 'CJ-010', 'Conjunto Compressor', '', 'CONJUNTO', 'B', 1, 'Raiz'],
  ];

  const wb = XLSX.utils.book_new();

  const wsEquip = XLSX.utils.aoa_to_sheet(equipamentosRows);
  wsEquip['!cols'] = equipamentosHeaders.map((header) => ({ wch: Math.max(24, header.length + 2) }));

  const wsComp = XLSX.utils.aoa_to_sheet(componentesRows);
  wsComp['!cols'] = componentesHeaders.map((header) => ({ wch: Math.max(28, header.length + 2) }));

  XLSX.utils.book_append_sheet(wb, wsEquip, 'Equipamentos');
  XLSX.utils.book_append_sheet(wb, wsComp, 'Componentes');

  XLSX.writeFile(wb, 'Modelo_Cadastro_Equipamentos_Arvore.xlsx');
}

export function parseEquipmentTreeFile(file: File): Promise<{
  equipamentos: EquipamentoImportRow[];
  componentes: ComponenteImportRow[];
  errors: ImportError[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const wb = XLSX.read(event.target?.result, { type: 'binary' });
        const errors: ImportError[] = [];

        const equipSheetName = wb.SheetNames.find((name) => name.toLowerCase() === 'equipamentos') || wb.SheetNames[0];
        const compSheetName = wb.SheetNames.find((name) => name.toLowerCase() === 'componentes');

        const equipRows = XLSX.utils.sheet_to_json(wb.Sheets[equipSheetName], { header: 1 }) as unknown[][];
        const compRows = compSheetName
          ? (XLSX.utils.sheet_to_json(wb.Sheets[compSheetName], { header: 1 }) as unknown[][])
          : [];

        const equipamentos: EquipamentoImportRow[] = [];
        const componentes: ComponenteImportRow[] = [];
        const tagSet = new Set<string>();

        for (let i = 1; i < equipRows.length; i++) {
          const row = equipRows[i];
          if (!row || row.length === 0) continue;

          const tag = String(row[0] || '').trim().toUpperCase();
          const nome = String(row[1] || '').trim();
          const criticidade = String(row[7] || 'C').trim().toUpperCase();
          const nivelRisco = String(row[8] || 'BAIXO').trim().toUpperCase();

          if (!tag) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: 'TAG vazia' });
            continue;
          }

          if (!nome) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: 'Nome do equipamento vazio' });
            continue;
          }

          if (tagSet.has(tag)) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: `TAG duplicada na planilha: ${tag}` });
            continue;
          }

          if (!VALID_CRITICIDADE.has(criticidade)) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: `Criticidade inválida: ${criticidade}` });
            continue;
          }

          if (!VALID_RISCO.has(nivelRisco)) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: `Nível de risco inválido: ${nivelRisco}` });
            continue;
          }

          const dataInstalacao = normalizeDate(row[6]);
          if (row[6] && !dataInstalacao) {
            errors.push({ sheet: 'Equipamentos', row: i + 1, reason: 'Data de instalação inválida. Use DD/MM/AAAA ou AAAA-MM-DD' });
            continue;
          }

          tagSet.add(tag);

          equipamentos.push({
            tag,
            nome,
            localizacao: String(row[2] || '').trim() || null,
            fabricante: String(row[3] || '').trim() || null,
            modelo: String(row[4] || '').trim() || null,
            numero_serie: String(row[5] || '').trim() || null,
            data_instalacao: dataInstalacao,
            criticidade: criticidade as Criticidade,
            nivel_risco: nivelRisco as NivelRisco,
          });
        }

        for (let i = 1; i < compRows.length; i++) {
          const row = compRows[i];
          if (!row || row.length === 0) continue;

          const equipamentoTag = String(row[0] || '').trim().toUpperCase();
          const codigo = String(row[1] || '').trim().toUpperCase();
          const nome = String(row[2] || '').trim();
          const parentCodigo = String(row[3] || '').trim().toUpperCase() || null;
          const tipo = String(row[4] || 'COMPONENTE').trim().toUpperCase();
          const criticidade = String(row[5] || 'C').trim().toUpperCase();
          const ordemRaw = Number(row[6]);
          const ordem = Number.isFinite(ordemRaw) && ordemRaw > 0 ? Math.floor(ordemRaw) : 1;

          if (!equipamentoTag) {
            errors.push({ sheet: 'Componentes', row: i + 1, reason: 'TAG Equipamento vazia' });
            continue;
          }

          if (!codigo) {
            errors.push({ sheet: 'Componentes', row: i + 1, reason: 'Código do componente vazio' });
            continue;
          }

          if (!nome) {
            errors.push({ sheet: 'Componentes', row: i + 1, reason: 'Nome do componente vazio' });
            continue;
          }

          if (!VALID_CRITICIDADE.has(criticidade)) {
            errors.push({ sheet: 'Componentes', row: i + 1, reason: `Criticidade inválida: ${criticidade}` });
            continue;
          }

          componentes.push({
            equipamento_tag: equipamentoTag,
            codigo,
            nome,
            parent_codigo: parentCodigo,
            tipo,
            criticidade: criticidade as Criticidade,
            ordem,
            observacoes: String(row[7] || '').trim() || null,
          });
        }

        resolve({ equipamentos, componentes, errors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Falha ao ler arquivo de planilha.'));
    reader.readAsBinaryString(file);
  });
}