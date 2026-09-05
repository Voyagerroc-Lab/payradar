import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Language } from "../types";
import { makeT, type TFunc } from "./t";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  lang: Language;
  onChange: (lang: Language) => void;
  children: ReactNode;
}

export function I18nProvider({ lang, onChange, children }: I18nProviderProps) {
  const setLang = useCallback((next: Language) => onChange(next), [onChange]);

  const t = useMemo(() => makeT(lang), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
