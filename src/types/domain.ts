export interface OrdemServicoBase {
  id: string;
  numero_os: number;
  status: string;
  equipamento: string;
}

export interface UsuarioProfile {
  id: string;
  nome: string | null;
  created_at: string;
  empresa_id: string | null;
}

export interface UsuarioRole {
  id: string;
  user_id: string;
  role: 'USUARIO' | 'ADMIN' | 'MASTER_TI' | string;
  empresa_id: string | null;
}
