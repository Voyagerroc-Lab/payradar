import type { Language } from "../types";
import { translations, type TranslationKey } from "./dict";

export type TFunc = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

/** Provider dışında da kullanılabilen bağımsız çeviri fonksiyonu üretir.
 *  Seçili sözlükte olmayan anahtar Türkçeye, o da yoksa anahtarın kendisine düşer. */
export function makeT(lang: Language): TFunc {
  return (key, params) => {
    let text = translations[lang][key] ?? translations.tr[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}
