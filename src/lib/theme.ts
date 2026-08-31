import type { ThemeId } from "../types";

/**
 * Temanın belgeye uygulanması tek yerden geçer: hem kalıcı tercih (App)
 * hem de Ayarlar'daki canlı önizleme aynı fonksiyonu çağırır.
 */

/* Tarayıcı ve kurulu uygulama çubuğunun rengi seçili temayı izler.
   index.html'deki iki medya koşullu meta yalnızca "sistemle aynı" için
   doğrudur; belirli bir tema seçilince medyasız bir meta head'in başına
   eklenir (tarayıcı ilk eşleşeni kullanır), "sistemle aynı"ya dönülünce
   kaldırılır ve medya koşullu metalar yeniden devralır. */
const THEME_COLORS: Record<Exclude<ThemeId, "auto">, string> = {
  light: "#f6f7f9",
  dark: "#07080c",
  paper: "#faf8f5",
  gs: "#14070a",
  fb: "#061024",
  bjk: "#050506",
  ts: "#10060b",
};

const META_ID = "app-theme-color";

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme === "auto" ? "" : theme;

  const existing = document.getElementById(META_ID);
  if (theme === "auto") {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.setAttribute("content", THEME_COLORS[theme]);
    return;
  }
  const meta = document.createElement("meta");
  meta.id = META_ID;
  meta.name = "theme-color";
  meta.content = THEME_COLORS[theme];
  document.head.prepend(meta);
}
