import type { Currency, Language } from "../types";

/**
 * Döviz kuru modülü.
 *
 * İlke: dil = ana para birimi. Toplamlar kullanıcının dilinin ülkesindeki
 * para biriminde hesaplanır (tr→TRY, ms→MYR, en→USD). Kurlar frankfurter.app
 * üzerinden (Avrupa Merkez Bankası referans kurları, anahtar gerektirmez,
 * CORS açık) USD tabanlı tek tablo olarak günde bir çekilir ve localStorage'da
 * saklanır — kişisel veri içermez, kasa şifrelemesine girmesi gerekmez.
 * Çevrimdışıyken son bilinen tablo, o da yoksa kasadaki eski manuel
 * usdTry/eurTry değerleri kullanılır.
 */

export const CURRENCIES: Currency[] = ["TRY", "USD", "EUR", "MYR", "MXN", "AED"];

/** Dilin ana para birimi: özet toplamları ve bildirim özetleri bu birimde.
 *  tr→TRY, ms→MYR, es→MXN (Latin Amerika), ar→AED (BAE dirhemi), en→USD. */
export function homeCurrency(lang: Language): Currency {
  if (lang === "tr") return "TRY";
  if (lang === "ms") return "MYR";
  if (lang === "es") return "MXN";
  if (lang === "ar") return "AED";
  return "USD";
}

/** AED, 1997'den beri USD'ye merkez bankası kararıyla sabitlenmiştir
 *  (1 USD = 3,6725 AED). ECB verisi AED yayınlamadığı için kur bu resmî
 *  pegden türetilir — peg değişirse burası güncellenmeli. */
const AED_PER_USD = 3.6725;

export interface FxTable {
  /** 1 USD karşılıkları (USD tabanlı tablo; USD=1) */
  rates: Partial<Record<Currency, number>>;
  /** epoch ms */
  updatedAt: number;
}

const FX_KEY = "payradar:fx:v1";
/** ECB günde bir yayınlar; 12 saatlik tazelik fazlasıyla yeterli. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function loadFx(): FxTable | null {
  try {
    const raw = localStorage.getItem(FX_KEY);
    if (!raw) return null;
    const fx = JSON.parse(raw) as FxTable;
    if (!fx || typeof fx !== "object" || !fx.rates) return null;
    return fx;
  } catch {
    return null;
  }
}

function saveFx(fx: FxTable): void {
  try {
    localStorage.setItem(FX_KEY, JSON.stringify(fx));
  } catch {
    /* depolama dolu/kapalıysa sessizce geç: kur yalnızca konfor */
  }
}

async function fetchFx(): Promise<FxTable | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY,EUR,MYR,MXN",
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const r = data.rates ?? {};
    const rates: FxTable["rates"] = {
      USD: 1,
      TRY: r.TRY,
      EUR: r.EUR,
      MYR: r.MYR,
      MXN: r.MXN,
      AED: AED_PER_USD,
    };
    const valid = [rates.TRY, rates.EUR, rates.MYR, rates.MXN].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n > 0,
    );
    if (!valid) return null;
    const fx: FxTable = { rates, updatedAt: Date.now() };
    saveFx(fx);
    return fx;
  } catch {
    return null;
  }
}

/** Tazeyse önbelleği verir, değilse çekmeyi dener; ağ yoksa eldekine düşer. */
export async function ensureFx(force = false): Promise<FxTable | null> {
  const cached = loadFx();
  if (!force && cached && Date.now() - cached.updatedAt < MAX_AGE_MS) return cached;
  return (await fetchFx()) ?? cached;
}

/** Kasadaki eski manuel kurlar; canlı tablo yokken TRY tabanı için yedek. */
export interface LegacyRates {
  usdTry: number;
  eurTry: number;
}

/**
 * amount tutarını from→to çevirir. Canlı tablo yoksa ve hedef TRY ise eski
 * manuel kurlara, o da mümkün değilse 1:1'e düşer (eksik kur yüzünden tutarı
 * yok saymak, yanlış göstermekten daha kötü olurdu).
 */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  fx: FxTable | null,
  legacy?: LegacyRates,
): number {
  if (from === to) return amount;
  const rFrom = fx?.rates[from];
  const rTo = fx?.rates[to];
  if (rFrom && rTo) return amount * (rTo / rFrom);
  if (legacy && to === "TRY") {
    if (from === "USD") return amount * (legacy.usdTry || 1);
    if (from === "EUR") return amount * (legacy.eurTry || 1);
  }
  return amount;
}
