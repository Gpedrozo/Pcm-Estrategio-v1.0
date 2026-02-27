export interface PluginContext {
  empresaId: string;
  userId: string;
  locale: string;
  timezone: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  module: string;
}

export interface PlatformPlugin {
  manifest: PluginManifest;
  activate: (context: PluginContext) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
}
