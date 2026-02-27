import { supabase } from '@/integrations/supabase/client';
import { pluginRegistry } from '@/plugins/registry';
import type { PluginContext } from '@/plugins/types';

type EmpresaPluginRow = {
  plugin_id: string;
  enabled: boolean;
};

export async function activateEmpresaPlugins(context: PluginContext): Promise<string[]> {
  const { data, error } = await supabase
    .from('empresa_plugins')
    .select('plugin_id, enabled')
    .eq('empresa_id', context.empresaId)
    .eq('enabled', true);

  if (error) throw error;

  const rows = (data as EmpresaPluginRow[] | null) || [];
  const activated: string[] = [];

  for (const row of rows) {
    try {
      await pluginRegistry.activate(row.plugin_id, context);
      activated.push(row.plugin_id);
    } catch {
      continue;
    }
  }

  return activated;
}
