const LOCALE_BY_LANGUAGE: Record<string, string> = { en: "en-US", ja: "ja-JP", es: "es-ES" };

export function localeForLanguage(language: string): string {
  return LOCALE_BY_LANGUAGE[language] ?? "en-US";
}

export function formatMoney(cents: number, currencyCode: string, language = "en"): string {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function formatDate(date: Date, language = "en"): string {
  return new Intl.DateTimeFormat(localeForLanguage(language)).format(date);
}
