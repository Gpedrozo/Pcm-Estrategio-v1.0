export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analise_causa_raiz: {
        Row: {
          acao_corretiva: string | null
          causa_raiz_identificada: string | null
          created_at: string
          data_falha: string
          descricao_falha: string
          equipamento: string
          id: string
          metodo: string
          porque_1: string | null
          porque_2: string | null
          porque_3: string | null
          porque_4: string | null
          porque_5: string | null
          prazo: string | null
          responsavel: string | null
          status: string
          tag: string
          updated_at: string
        }
        Insert: {
          acao_corretiva?: string | null
          causa_raiz_identificada?: string | null
          created_at?: string
          data_falha?: string
          descricao_falha: string
          equipamento: string
          id?: string
          metodo?: string
          porque_1?: string | null
          porque_2?: string | null
          porque_3?: string | null
          porque_4?: string | null
          porque_5?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          tag: string
          updated_at?: string
        }
        Update: {
          acao_corretiva?: string | null
          causa_raiz_identificada?: string | null
          created_at?: string
          data_falha?: string
          descricao_falha?: string
          equipamento?: string
          id?: string
          metodo?: string
          porque_1?: string | null
          porque_2?: string | null
          porque_3?: string | null
          porque_4?: string | null
          porque_5?: string | null
          prazo?: string | null
          responsavel?: string | null
          status?: string
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          acao: string
          created_at: string
          descricao: string
          id: string
          tag: string | null
          usuario_id: string | null
          usuario_nome: string
        }
        Insert: {
          acao: string
          created_at?: string
          descricao: string
          id?: string
          tag?: string | null
          usuario_id?: string | null
          usuario_nome: string
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string
          id?: string
          tag?: string | null
          usuario_id?: string | null
          usuario_nome?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          fornecedor_id: string | null
          fornecedor_nome: string
          id: string
          numero: string
          status: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome: string
          id?: string
          numero: string
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string
          id?: string
          numero?: string
          status?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_tecnicos: {
        Row: {
          codigo: string
          created_at: string
          data_validade: string | null
          descricao: string | null
          id: string
          responsavel: string | null
          status: string
          tags_associadas: string[] | null
          tipo: string
          titulo: string
          updated_at: string
          versao: string | null
        }
        Insert: {
          codigo: string
          created_at?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          responsavel?: string | null
          status?: string
          tags_associadas?: string[] | null
          tipo?: string
          titulo: string
          updated_at?: string
          versao?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string
          data_validade?: string | null
          descricao?: string | null
          id?: string
          responsavel?: string | null
          status?: string
          tags_associadas?: string[] | null
          tipo?: string
          titulo?: string
          updated_at?: string
          versao?: string | null
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          ativo: boolean
          created_at: string
          criticidade: Database["public"]["Enums"]["criticidade_abc"]
          data_instalacao: string | null
          fabricante: string | null
          id: string
          localizacao: string | null
          modelo: string | null
          nivel_risco: Database["public"]["Enums"]["nivel_risco"]
          nome: string
          numero_serie: string | null
          tag: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade_abc"]
          data_instalacao?: string | null
          fabricante?: string | null
          id?: string
          localizacao?: string | null
          modelo?: string | null
          nivel_risco?: Database["public"]["Enums"]["nivel_risco"]
          nome: string
          numero_serie?: string | null
          tag: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade_abc"]
          data_instalacao?: string | null
          fabricante?: string | null
          id?: string
          localizacao?: string | null
          modelo?: string | null
          nivel_risco?: Database["public"]["Enums"]["nivel_risco"]
          nome?: string
          numero_serie?: string | null
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      execucoes_os: {
        Row: {
          created_at: string
          custo_mao_obra: number | null
          custo_materiais: number | null
          custo_terceiros: number | null
          custo_total: number | null
          data_execucao: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          mecanico_id: string | null
          mecanico_nome: string
          os_id: string
          servico_executado: string | null
          tempo_execucao: number | null
        }
        Insert: {
          created_at?: string
          custo_mao_obra?: number | null
          custo_materiais?: number | null
          custo_terceiros?: number | null
          custo_total?: number | null
          data_execucao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mecanico_id?: string | null
          mecanico_nome: string
          os_id: string
          servico_executado?: string | null
          tempo_execucao?: number | null
        }
        Update: {
          created_at?: string
          custo_mao_obra?: number | null
          custo_materiais?: number | null
          custo_terceiros?: number | null
          custo_total?: number | null
          data_execucao?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          mecanico_id?: string | null
          mecanico_nome?: string
          os_id?: string
          servico_executado?: string | null
          tempo_execucao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_os_mecanico_id_fkey"
            columns: ["mecanico_id"]
            isOneToOne: false
            referencedRelation: "mecanicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_os_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      fmea: {
        Row: {
          acao_recomendada: string | null
          causa_potencial: string
          componente: string
          created_at: string
          deteccao: number
          efeito_falha: string
          id: string
          modo_falha: string
          ocorrencia: number
          prazo: string | null
          responsavel: string | null
          rpn: number
          severidade: number
          status: string
          tag: string
          updated_at: string
        }
        Insert: {
          acao_recomendada?: string | null
          causa_potencial: string
          componente: string
          created_at?: string
          deteccao?: number
          efeito_falha: string
          id?: string
          modo_falha: string
          ocorrencia?: number
          prazo?: string | null
          responsavel?: string | null
          rpn?: number
          severidade?: number
          status?: string
          tag: string
          updated_at?: string
        }
        Update: {
          acao_recomendada?: string | null
          causa_potencial?: string
          componente?: string
          created_at?: string
          deteccao?: number
          efeito_falha?: string
          id?: string
          modo_falha?: string
          ocorrencia?: number
          prazo?: string | null
          responsavel?: string | null
          rpn?: number
          severidade?: number
          status?: string
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inspecoes: {
        Row: {
          created_at: string
          data_inspecao: string
          equipamento: string
          id: string
          observacoes: string | null
          proxima_inspecao: string | null
          responsavel: string | null
          resultado: string | null
          status: string
          tag: string
          tipo_inspecao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inspecao?: string
          equipamento: string
          id?: string
          observacoes?: string | null
          proxima_inspecao?: string | null
          responsavel?: string | null
          resultado?: string | null
          status?: string
          tag: string
          tipo_inspecao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inspecao?: string
          equipamento?: string
          id?: string
          observacoes?: string | null
          proxima_inspecao?: string | null
          responsavel?: string | null
          resultado?: string | null
          status?: string
          tag?: string
          tipo_inspecao?: string
          updated_at?: string
        }
        Relationships: []
      }
      lubrificacao: {
        Row: {
          ativo: boolean
          created_at: string
          equipamento: string
          id: string
          lubrificante: string
          observacoes: string | null
          periodicidade: Database["public"]["Enums"]["periodicidade_plano"]
          ponto: string
          proxima_execucao: string
          quantidade: string | null
          responsavel: string | null
          tag: string
          ultima_execucao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          equipamento: string
          id?: string
          lubrificante: string
          observacoes?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade_plano"]
          ponto: string
          proxima_execucao?: string
          quantidade?: string | null
          responsavel?: string | null
          tag: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          equipamento?: string
          id?: string
          lubrificante?: string
          observacoes?: string | null
          periodicidade?: Database["public"]["Enums"]["periodicidade_plano"]
          ponto?: string
          proxima_execucao?: string
          quantidade?: string | null
          responsavel?: string | null
          tag?: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          custo_unitario: number
          estoque_atual: number
          estoque_minimo: number
          id: string
          localizacao: string | null
          nome: string
          tags_associadas: string[] | null
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          custo_unitario?: number
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          localizacao?: string | null
          nome: string
          tags_associadas?: string[] | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          custo_unitario?: number
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          localizacao?: string | null
          nome?: string
          tags_associadas?: string[] | null
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      materiais_utilizados: {
        Row: {
          created_at: string
          custo_total: number
          custo_unitario: number
          execucao_id: string
          id: string
          material_id: string | null
          material_nome: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          custo_total?: number
          custo_unitario?: number
          execucao_id: string
          id?: string
          material_id?: string | null
          material_nome: string
          quantidade?: number
        }
        Update: {
          created_at?: string
          custo_total?: number
          custo_unitario?: number
          execucao_id?: string
          id?: string
          material_id?: string | null
          material_nome?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiais_utilizados_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes_os"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_utilizados_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      mecanicos: {
        Row: {
          ativo: boolean
          created_at: string
          custo_hora: number | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
          tipo: Database["public"]["Enums"]["tipo_mecanico"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_hora?: number | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mecanico"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_hora?: number | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mecanico"]
          updated_at?: string
        }
        Relationships: []
      }
      melhorias: {
        Row: {
          area: string | null
          beneficio_esperado: string | null
          created_at: string
          custo_estimado: number | null
          descricao: string
          id: string
          prazo: string | null
          prioridade: string
          responsavel: string | null
          status: string
          tag: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          beneficio_esperado?: string | null
          created_at?: string
          custo_estimado?: number | null
          descricao: string
          id?: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          tag?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          beneficio_esperado?: string | null
          created_at?: string
          custo_estimado?: number | null
          descricao?: string
          id?: string
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          status?: string
          tag?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_materiais: {
        Row: {
          created_at: string
          id: string
          material_id: string
          observacao: string | null
          os_id: string | null
          quantidade: number
          tipo: string
          usuario: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          observacao?: string | null
          os_id?: string | null
          quantidade: number
          tipo?: string
          usuario: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          observacao?: string | null
          os_id?: string | null
          quantidade?: number
          tipo?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_materiais_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_materiais_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          acao_corretiva: string | null
          causa_raiz: string | null
          created_at: string
          custo_estimado: number | null
          data_fechamento: string | null
          data_solicitacao: string
          equipamento: string
          id: string
          licoes_aprendidas: string | null
          modo_falha: string | null
          numero_os: number
          plano_preventivo_id: string | null
          prioridade: Database["public"]["Enums"]["prioridade_os"]
          problema: string
          solicitante: string
          status: Database["public"]["Enums"]["status_os"]
          tag: string
          tempo_estimado: number | null
          tipo: Database["public"]["Enums"]["tipo_os"]
          updated_at: string
          usuario_abertura: string
          usuario_abertura_id: string | null
          usuario_fechamento: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          causa_raiz?: string | null
          created_at?: string
          custo_estimado?: number | null
          data_fechamento?: string | null
          data_solicitacao?: string
          equipamento: string
          id?: string
          licoes_aprendidas?: string | null
          modo_falha?: string | null
          numero_os?: number
          plano_preventivo_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          problema: string
          solicitante: string
          status?: Database["public"]["Enums"]["status_os"]
          tag: string
          tempo_estimado?: number | null
          tipo?: Database["public"]["Enums"]["tipo_os"]
          updated_at?: string
          usuario_abertura: string
          usuario_abertura_id?: string | null
          usuario_fechamento?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          causa_raiz?: string | null
          created_at?: string
          custo_estimado?: number | null
          data_fechamento?: string | null
          data_solicitacao?: string
          equipamento?: string
          id?: string
          licoes_aprendidas?: string | null
          modo_falha?: string | null
          numero_os?: number
          plano_preventivo_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          problema?: string
          solicitante?: string
          status?: Database["public"]["Enums"]["status_os"]
          tag?: string
          tempo_estimado?: number | null
          tipo?: Database["public"]["Enums"]["tipo_os"]
          updated_at?: string
          usuario_abertura?: string
          usuario_abertura_id?: string | null
          usuario_fechamento?: string | null
        }
        Relationships: []
      }
      planos_preventivos: {
        Row: {
          ativo: boolean
          checklist: Json | null
          created_at: string
          duracao_estimada: number | null
          equipamento: string
          id: string
          nome: string
          periodicidade: Database["public"]["Enums"]["periodicidade_plano"]
          proxima_execucao: string
          responsavel: string | null
          tag: string
          ultima_execucao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          checklist?: Json | null
          created_at?: string
          duracao_estimada?: number | null
          equipamento: string
          id?: string
          nome: string
          periodicidade?: Database["public"]["Enums"]["periodicidade_plano"]
          proxima_execucao?: string
          responsavel?: string | null
          tag: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          checklist?: Json | null
          created_at?: string
          duracao_estimada?: number | null
          equipamento?: string
          id?: string
          nome?: string
          periodicidade?: Database["public"]["Enums"]["periodicidade_plano"]
          proxima_execucao?: string
          responsavel?: string | null
          tag?: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          created_at: string
          descricao: string
          equipamento: string
          id: string
          os_gerada_id: string | null
          prioridade: Database["public"]["Enums"]["prioridade_os"]
          solicitante: string
          status: string
          tag: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          equipamento: string
          id?: string
          os_gerada_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          solicitante: string
          status?: string
          tag: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          equipamento?: string
          id?: string
          os_gerada_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_os"]
          solicitante?: string
          status?: string
          tag?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_os_gerada_id_fkey"
            columns: ["os_gerada_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ssma_registros: {
        Row: {
          acao_tomada: string | null
          created_at: string
          data_ocorrencia: string
          descricao: string
          gravidade: string
          id: string
          local: string | null
          responsavel: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          acao_tomada?: string | null
          created_at?: string
          data_ocorrencia?: string
          descricao: string
          gravidade?: string
          id?: string
          local?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          acao_tomada?: string | null
          created_at?: string
          data_ocorrencia?: string
          descricao?: string
          gravidade?: string
          id?: string
          local?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "USUARIO" | "MASTER_TI"
      criticidade_abc: "A" | "B" | "C"
      nivel_risco: "CRITICO" | "ALTO" | "MEDIO" | "BAIXO"
      periodicidade_plano:
        | "DIARIA"
        | "SEMANAL"
        | "QUINZENAL"
        | "MENSAL"
        | "BIMESTRAL"
        | "TRIMESTRAL"
        | "SEMESTRAL"
        | "ANUAL"
      prioridade_os: "URGENTE" | "ALTA" | "MEDIA" | "BAIXA"
      status_os:
        | "ABERTA"
        | "EM_ANDAMENTO"
        | "AGUARDANDO_MATERIAL"
        | "AGUARDANDO_APROVACAO"
        | "FECHADA"
      tipo_mecanico: "PROPRIO" | "TERCEIRIZADO"
      tipo_os:
        | "CORRETIVA"
        | "PREVENTIVA"
        | "PREDITIVA"
        | "INSPECAO"
        | "MELHORIA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "USUARIO", "MASTER_TI"],
      criticidade_abc: ["A", "B", "C"],
      nivel_risco: ["CRITICO", "ALTO", "MEDIO", "BAIXO"],
      periodicidade_plano: [
        "DIARIA",
        "SEMANAL",
        "QUINZENAL",
        "MENSAL",
        "BIMESTRAL",
        "TRIMESTRAL",
        "SEMESTRAL",
        "ANUAL",
      ],
      prioridade_os: ["URGENTE", "ALTA", "MEDIA", "BAIXA"],
      status_os: [
        "ABERTA",
        "EM_ANDAMENTO",
        "AGUARDANDO_MATERIAL",
        "AGUARDANDO_APROVACAO",
        "FECHADA",
      ],
      tipo_mecanico: ["PROPRIO", "TERCEIRIZADO"],
      tipo_os: ["CORRETIVA", "PREVENTIVA", "PREDITIVA", "INSPECAO", "MELHORIA"],
    },
  },
} as const
