import { getRequestConfig } from "next-intl/server";

export const SUPPORTED_LOCALES = ["en", "ja", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/**
 * Locale here is NOT tied to the URL — it's a per-restaurant setting (see
 * RestaurantSettings.language), independent of currency/measurement (section 19).
 * Pages call getTranslations({ locale: settings.language, namespace }) explicitly;
 * this config just resolves that override (or falls back to English).
 */
export default getRequestConfig(async ({ locale, requestLocale }) => {
  const resolved = locale ?? (await requestLocale);
  const activeLocale = isSupportedLocale(resolved) ? resolved : "en";

  return {
    locale: activeLocale,
    messages: (await import(`../../messages/${activeLocale}.json`)).default,
  };
});
