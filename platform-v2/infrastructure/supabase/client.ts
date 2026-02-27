import { createClient } from '@supabase/supabase-js';

export function createSupabaseClients() {
  const url = process.env.SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return {
    authClient: createClient(url, anon),
    adminClient: createClient(url, service),
  };
}
