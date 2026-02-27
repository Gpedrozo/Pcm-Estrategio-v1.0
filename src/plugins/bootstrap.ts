import { insightsPlugin } from '@/plugins/builtin/insightsPlugin';
import { pluginRegistry } from '@/plugins/registry';

let bootstrapped = false;

export function bootstrapPlugins() {
  if (bootstrapped) return;

  pluginRegistry.register(insightsPlugin);
  bootstrapped = true;
}
