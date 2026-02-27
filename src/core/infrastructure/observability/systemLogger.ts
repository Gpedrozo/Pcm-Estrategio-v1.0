import { supabase } from '@/integrations/supabase/client';
import type { StructuredLogger } from '@/core/application/ports';

type LogLevel = 'INFO' | 'ERROR';

async function write(level: LogLevel, event: string, payload?: Record<string, unknown>) {
  const empresaId = typeof payload?.empresa_id === 'string' ? payload.empresa_id : null;
  const message = typeof payload?.message === 'string' ? payload.message : event;

  try {
    await supabase.from('system_logs').insert({
      empresa_id: empresaId,
      level,
      event,
      message,
      metadata: payload ?? {},
    });
  } catch {
    // fallback silencioso para não quebrar fluxo transacional principal
  }
}

export class SystemLogger implements StructuredLogger {
  async info(event: string, payload?: Record<string, unknown>) {
    await write('INFO', event, payload);
  }

  async error(event: string, payload?: Record<string, unknown>) {
    await write('ERROR', event, payload);
  }
}
