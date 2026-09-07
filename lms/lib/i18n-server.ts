import "server-only";
import { cookies } from "next/headers";
import { coerceLocale, translator, type Locale, LOCALE_COOKIE } from "@/lib/i18n";

/** The locale selected via the cookie (defaults to English). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return coerceLocale(store.get(LOCALE_COOKIE)?.value);
}

/** A translator bound to the current request's locale. */
export async function getTranslator(): Promise<(key: string) => string> {
  return translator(await getLocale());
}
