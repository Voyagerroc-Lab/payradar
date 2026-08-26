import type { Currency, Language } from "../types";

/**
 * Döviz kuru modülü.
 *
 * İlke: gösterim para birimi KULLANICI TERCİHİDİR (Ayarlar > Para Birimi),
 * dilden bağımsızdır. Her ödeme girildiği andaki gösterim birimiyle saklanır;
 * ekrandaki her tutar (kart fiyatı, özetler, bildirimler) saklanan birimden
 * seçili gösterim birimine güncel kurla çevrilir. Böylece birim değiştirmek
 * veriyi bozmaz, yalnızca bakış açısını değiştirir.
 *
 * Kurlar open.er-api.com'dan (160+ para birimi, anahtarsız, CORS açık,
 * günlük güncellenir) USD tabanlı tek tablo olarak çekilir ve localStorage'da
 * saklanır — kişisel veri içermez. Çevrimdışıyken son bilinen tablo, o da
 * yoksa kasadaki eski manuel usdTry/eurTry değerleri kullanılır.
 */

/** ISO 4217 — dolaşımdaki dünya para birimleri (er-api kapsamı). */
export const CURRENCIES: Currency[] = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY",
  "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP",
  "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP", "GHS",
  "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF",
  "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD",
  "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT",
  "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD",
  "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN",
  "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK",
  "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR",
  "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS", "SRD", "SSP",
  "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD",
  "TVD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES", "VND",
  "VUV", "WST", "XAF", "XCD", "XOF", "XPF", "YER", "ZAR", "ZMW", "ZWL",
];

/** Dil için makul VARSAYILAN gösterim birimi (yalnızca ilk kurulumda;
 *  kullanıcı Ayarlar'dan istediği an değiştirir). */
export function homeCurrency(lang: Language): Currency {
  if (lang === "tr") return "TRY";
  if (lang === "ms") return "MYR";
  if (lang === "es") return "MXN";
  if (lang === "ar") return "AED";
  return "USD";
}

export interface FxTable {
  /** 1 USD karşılıkları (USD tabanlı tablo; USD=1) */
  rates: Partial<Record<Currency, number>>;
  /** epoch ms */
  updatedAt: number;
}

const FX_KEY = "payradar:fx:v1";
/** Kaynak günde bir yayınlar; 12 saatlik tazelik fazlasıyla yeterli. */
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
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates) return null;
    const rates: FxTable["rates"] = {};
    for (const [code, value] of Object.entries(data.rates)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        rates[code] = value;
      }
    }
    if (rates.USD !== 1 || !rates.EUR || !rates.TRY) return null;
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

/** Kod için kullanıcı dilinde okunabilir ad; Intl bilmiyorsa kodun kendisi. */
export function currencyLabel(code: Currency, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "currency" }).of(code);
    return name && name !== code ? `${code} — ${name}` : code;
  } catch {
    return code;
  }
}
