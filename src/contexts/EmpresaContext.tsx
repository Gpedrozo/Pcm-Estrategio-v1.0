import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { normalizeModuleList, normalizeModuleName } from '@/constants/modules';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  logo_url: string | null;
  nome_sistema: string;
  cor_primaria: string;
  cor_secundaria: string;
  plano: string;
  ativo: boolean;
}

interface Assinatura {
  id: string;
  plano_id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  plano_nome?: string;
  modulos_ativos?: string[];
}

interface EmpresaContextType {
  empresa: Empresa | null;
  assinatura: Assinatura | null;
  isLoading: boolean;
  moduloAtivo: (modulo: string) => boolean;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetTemaPadrao = useCallback(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '213 56% 24%');
    root.style.setProperty('--secondary', '210 14% 89%');
    root.style.setProperty('--sidebar-primary', '199 89% 48%');
    root.style.setProperty('--sidebar-accent', '215 25% 25%');
    document.title = 'PCM ESTRATÉGICO';
  }, []);

  const aplicarTemaEmpresa = useCallback((empresaAtual: Empresa | null) => {
    if (!empresaAtual) {
      resetTemaPadrao();
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--primary', empresaAtual.cor_primaria || '213 56% 24%');
    root.style.setProperty('--secondary', empresaAtual.cor_secundaria || '210 14% 89%');
    root.style.setProperty('--sidebar-primary', empresaAtual.cor_primaria || '199 89% 48%');
    root.style.setProperty('--sidebar-accent', empresaAtual.cor_secundaria || '215 25% 25%');
    document.title = empresaAtual.nome_sistema || 'PCM ESTRATÉGICO';
  }, [resetTemaPadrao]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setEmpresa(null);
      setAssinatura(null);
      setIsLoading(false);
      resetTemaPadrao();
      return;
    }

    async function loadEmpresa() {
      try {
        // Get user's empresa_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user!.id)
          .maybeSingle();

        if (!profile?.empresa_id) {
          setIsLoading(false);
          return;
        }

        // Load empresa
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', profile.empresa_id)
          .maybeSingle();

        if (empresaData) {
          setEmpresa(empresaData as Empresa);
        }

        // Load assinatura with plano info
        const { data: assinaturaData } = await supabase
          .from('assinaturas')
          .select('*')
          .eq('empresa_id', profile.empresa_id)
          .eq('status', 'ATIVA')
          .maybeSingle();

        if (assinaturaData) {
          const { data: planoData } = await supabase
            .from('planos_saas')
            .select('nome, modulos_ativos')
            .eq('id', assinaturaData.plano_id)
            .maybeSingle();

          setAssinatura({
            ...assinaturaData,
            plano_nome: planoData?.nome,
            modulos_ativos: planoData?.modulos_ativos as string[] || [],
          } as Assinatura);
        }
      } catch (error) {
        console.error('Error loading empresa:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadEmpresa();
  }, [isAuthenticated, user]);

  useEffect(() => {
    aplicarTemaEmpresa(empresa);
  }, [empresa, aplicarTemaEmpresa]);

  const modulosAtivosNormalizados = useMemo(
    () => normalizeModuleList(assinatura?.modulos_ativos),
    [assinatura?.modulos_ativos]
  );

  const moduloAtivo = useCallback((modulo: string): boolean => {
    if (user?.tipo === 'MASTER_TI') return true;
    const moduloNormalizado = normalizeModuleName(modulo);
    if (!moduloNormalizado) return false;
    return modulosAtivosNormalizados.includes(moduloNormalizado);
  }, [modulosAtivosNormalizados, user?.tipo]);

  return (
    <EmpresaContext.Provider value={{ empresa, assinatura, isLoading, moduloAtivo }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
}
