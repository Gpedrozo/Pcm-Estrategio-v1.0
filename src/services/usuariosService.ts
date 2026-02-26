import { supabase } from '@/integrations/supabase/client';
import type { UsuarioProfile, UsuarioRole } from '@/types/domain';

export async function fetchUsuariosData() {
  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from('profiles').select('id, nome, created_at, empresa_id').order('nome'),
    supabase.from('user_roles').select('id, user_id, role, empresa_id'),
  ]);

  return {
    profiles: (profilesResult.data || []) as UsuarioProfile[],
    roles: (rolesResult.data || []) as UsuarioRole[],
  };
}
