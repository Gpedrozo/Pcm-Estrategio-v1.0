import type { PlatformPlugin, PluginContext } from '@/plugins/types';

class PluginRegistry {
  private plugins = new Map<string, PlatformPlugin>();

  register(plugin: PlatformPlugin) {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin já registrado: ${plugin.manifest.id}`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }

  list() {
    return Array.from(this.plugins.values()).map((plugin) => plugin.manifest);
  }

  async activate(id: string, context: PluginContext) {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin não encontrado: ${id}`);
    await plugin.activate(context);
  }

  async deactivate(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    await plugin.deactivate?.();
  }
}

export const pluginRegistry = new PluginRegistry();
