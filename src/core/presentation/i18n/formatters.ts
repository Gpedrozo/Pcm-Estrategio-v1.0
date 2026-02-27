export interface LocaleContext {
  locale: string;
  timezone: string;
  currency: string;
}

export const DEFAULT_LOCALE_CONTEXT: LocaleContext = {
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
};

export function formatDateTime(value: Date | string, context: LocaleContext = DEFAULT_LOCALE_CONTEXT) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(context.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: context.timezone,
  }).format(date);
}

export function formatCurrency(value: number, context: LocaleContext = DEFAULT_LOCALE_CONTEXT) {
  return new Intl.NumberFormat(context.locale, {
    style: 'currency',
    currency: context.currency,
  }).format(value);
}
