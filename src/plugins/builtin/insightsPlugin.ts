import type { PlatformPlugin } from '@/plugins/types';

export const insightsPlugin: PlatformPlugin = {
  manifest: {
    id: 'insights-core',
    name: 'Insights Core',
    version: '1.0.0',
    description: 'Plugin base para insights avançados por empresa.',
    module: 'builtin/insights-core',
  },
  activate: () => {
    return;
  },
};
