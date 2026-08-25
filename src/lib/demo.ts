import type { CategoryId, Currency, Language, Payment } from "../types";
import type { TranslationKey } from "../i18n/dict";
import { makeT } from "../i18n/t";

/**
 * Örnek ("demo") ödemeler.
 *
 * Bu kayıtlar ürünün parçası, kullanıcı verisi değil — dolayısıyla arayüz
 * hangi dildeyse o dilde üretilirler. Marka adları (Netflix, Spotify, Canva
 * Pro…) özel isimdir, çevrilmez; jenerik kalemler (kira, elektrik faturası,
 * konut kredisi) çevrilir. Banka/alacaklı/çek numarası gibi alanlar da
 * yerelleştirilir: Türkçe demoda Türk bankası, diğerlerinde nötr bir örnek.
 */

interface DemoSpec {
  /** Marka adı: her dilde aynı kalır */
  name?: string;
  /** Jenerik kalem: kullanıcının dilinde üretilir */
  nameKey?: TranslationKey;
  price: number;
  currency?: Currency;
  billingCycle?: Payment["billingCycle"];
  daysFromNow: number;
  categoryId: CategoryId;
  isTrial?: boolean;
  bankKey?: TranslationKey;
  currentInstallment?: number;
  totalInstallments?: number;
  checkKey?: TranslationKey;
  payeeKey?: TranslationKey;
}

/**
 * Sıra ÖNEMLİ: demo kayıtlarının id'si `demo-<zaman>-<sıra>` biçiminde
 * üretilir ve relocalizeDemoPayments() dili değiştiğinde kaydı bu sıradan
 * bulur. Araya kalem eklerken sona ekleyin.
 */
const SPECS: DemoSpec[] = [
  { nameKey: "demo.rent", price: 18500, daysFromNow: 9, categoryId: "konut" },
  {
    nameKey: "demo.mortgage",
    price: 14250,
    daysFromNow: 4,
    categoryId: "kredi",
    bankKey: "demo.bankName",
    currentInstallment: 14,
    totalInstallments: 60,
  },
  {
    nameKey: "demo.supplierCheck",
    price: 45000,
    daysFromNow: 6,
    categoryId: "cek_senet",
    checkKey: "demo.checkNumber",
    payeeKey: "demo.payee",
  },
  { nameKey: "demo.carLease", price: 24000, daysFromNow: 14, categoryId: "ulasim" },
  { nameKey: "demo.electricity", price: 850, daysFromNow: 3, categoryId: "faturalar" },
  { nameKey: "demo.internet", price: 649, daysFromNow: 7, categoryId: "faturalar" },
  { name: "Netflix", price: 149.99, daysFromNow: 2, categoryId: "abonelik" },
  { name: "Spotify Premium", price: 59.99, daysFromNow: 5, categoryId: "abonelik" },
  { name: "Xbox Game Pass Ultimate", price: 249.0, daysFromNow: 20, categoryId: "oyun" },
  { name: "iCloud+ 200GB", price: 29.99, daysFromNow: 8, categoryId: "diger" },
  { name: "ChatGPT Plus", price: 20, currency: "USD", daysFromNow: 15, categoryId: "abonelik" },
  {
    nameKey: "demo.homeInsurance",
    price: 1240,
    billingCycle: "yearly",
    daysFromNow: 45,
    categoryId: "sigorta",
  },
  { name: "Canva Pro", price: 449.99, daysFromNow: 4, categoryId: "diger", isTrial: true },
];

const ALL_LANGS: Language[] = ["tr", "en", "ms"];

export function buildDemoPayments(lang: Language): Payment[] {
  const t = makeT(lang);
  const now = Date.now();
  return SPECS.map((spec, index) => {
    const date = new Date();
    date.setDate(date.getDate() + spec.daysFromNow);
    const name = spec.nameKey ? t(spec.nameKey) : (spec.name as string);
    return {
      id: `demo-${now}-${index}`,
      name,
      price: spec.price,
      currency: spec.currency ?? "TRY",
      billingCycle: spec.billingCycle ?? "monthly",
      nextPaymentDate: date.toISOString().slice(0, 10),
      categoryId: spec.categoryId,
      createdAt: now + index,
      isTrial: spec.isTrial,
      bankName: spec.bankKey ? t(spec.bankKey) : undefined,
      currentInstallment: spec.currentInstallment,
      totalInstallments: spec.totalInstallments,
      checkNumber: spec.checkKey ? t(spec.checkKey) : undefined,
      payee: spec.payeeKey ? t(spec.payeeKey) : undefined,
      // Netflix'e örnek zam geçmişi: grafik özelliğini göstermek için
      priceHistory:
        spec.name === "Netflix"
          ? [
              { date: "2024-01-15", price: 99.99 },
              { date: "2025-02-01", price: 129.99 },
            ]
          : undefined,
    };
  });
}

/** Bir alan hâlâ demo değerinde mi (yani kullanıcı elle değiştirmemiş mi)? */
function isUntouched(value: string | undefined, key: TranslationKey): boolean {
  if (!value) return false;
  return ALL_LANGS.some((l) => makeT(l)(key) === value);
}

/**
 * Dil değiştiğinde demo kayıtlarını yeni dile çevirir.
 *
 * Yalnızca `demo-` id'li kayıtlara ve yalnızca değeri hâlâ bilinen bir demo
 * çevirisine eşit olan alanlara dokunur — kullanıcının elle düzenlediği bir
 * ad asla ezilmez. Değişiklik yoksa AYNI dizi referansı döner, böylece çağıran
 * taraf gereksiz yere kasayı "değişti" diye işaretlemez.
 */
export function relocalizeDemoPayments(payments: Payment[], lang: Language): Payment[] {
  const t = makeT(lang);
  let changed = false;

  const next = payments.map((p) => {
    const match = /^demo-\d+-(\d+)$/.exec(p.id);
    if (!match) return p;
    const spec = SPECS[Number(match[1])];
    if (!spec) return p;

    const updated = { ...p };
    let hit = false;

    if (spec.nameKey && isUntouched(p.name, spec.nameKey) && p.name !== t(spec.nameKey)) {
      updated.name = t(spec.nameKey);
      hit = true;
    }
    if (spec.bankKey && isUntouched(p.bankName, spec.bankKey) && p.bankName !== t(spec.bankKey)) {
      updated.bankName = t(spec.bankKey);
      hit = true;
    }
    if (
      spec.checkKey &&
      isUntouched(p.checkNumber, spec.checkKey) &&
      p.checkNumber !== t(spec.checkKey)
    ) {
      updated.checkNumber = t(spec.checkKey);
      hit = true;
    }
    if (spec.payeeKey && isUntouched(p.payee, spec.payeeKey) && p.payee !== t(spec.payeeKey)) {
      updated.payee = t(spec.payeeKey);
      hit = true;
    }

    if (!hit) return p;
    changed = true;
    return updated;
  });

  return changed ? next : payments;
}
