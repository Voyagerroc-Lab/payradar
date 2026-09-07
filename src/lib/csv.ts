import type { BillingCycle, CategoryId, Currency, Payment, PricePoint } from "../types";
import { CURRENCIES } from "./fx";
import { parseAmount, parseInstallment, sanitizeCategoryFields, toISO, todayISO } from "./format";

const HEADER =
  "name,price,currency,billingCycle,nextPaymentDate,categoryId,notes,priceHistory,bankName,currentInstallment,totalInstallments,checkNumber,payee,isTrial,isCompleted";


const CYCLES: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly"];
const CATEGORY_IDS: CategoryId[] = [
  "konut",
  "ulasim",
  "faturalar",
  "abonelik",
  "egitim",
  "saglik",
  "sigorta",
  "kredi",
  "cek_senet",
  "oyun",
  "diger",
];

/** Ödemeleri CSV dosyası olarak indirir (Excel uyumlu UTF-8 BOM). */
export function exportCsv(payments: Payment[]): void {
  const rows = payments.map((p) =>
    [
      p.name,
      p.price,
      p.currency,
      p.billingCycle,
      p.nextPaymentDate,
      p.categoryId,
      p.notes ?? "",
      p.priceHistory?.length ? JSON.stringify(p.priceHistory) : "",
      p.bankName ?? "",
      p.currentInstallment ?? "",
      p.totalInstallments ?? "",
      p.checkNumber ?? "",
      p.payee ?? "",
      p.isTrial ? "1" : "",
      p.isCompleted ? "1" : "",
    ]
      .map(csvEscape)
      .join(","),
  );
  // BOM: Excel'in UTF-8'i doğru okuması için
  const csv = "\uFEFF" + [HEADER, ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payradar-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export type CsvSkipReason =
  | "short"
  | "name"
  | "price"
  | "currency"
  | "cycle"
  | "category"
  | "date";

export interface CsvImportResult {
  payments: Payment[];
  skipped: number;
  /** Atlanan satırların neden başına sayısı — toast'ta özet olarak gösterilir */
  skippedReasons: Record<CsvSkipReason, number>;
}

function emptyReasons(): Record<CsvSkipReason, number> {
  return { short: 0, name: 0, price: 0, currency: 0, cycle: 0, category: 0, date: 0 };
}

/** CSV metnini ayrıştırır; geçersiz satırları gerekçesiyle sayıp atlar. */
export function parseCsv(text: string): CsvImportResult {
  const lines = splitCsvLines(text.replace(/^\uFEFF/, ""));
  const payments: Payment[] = [];
  let skipped = 0;
  const skippedReasons = emptyReasons();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Yalnızca GERÇEK başlık satırını atla; "name" adlı bir ödeme kaybolmasın
    if (!line) continue;
    if (i === 0 && line.trim() === HEADER) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 6) {
      if (fields.some((f) => f.trim())) {
        skipped++;
        skippedReasons.short++;
      }
      continue;
    }
    const parsed = toPayment(fields);
    if (parsed.payment) {
      payments.push(parsed.payment);
    } else {
      skipped++;
      skippedReasons[parsed.reason as CsvSkipReason]++;
    }
  }

  return { payments, skipped, skippedReasons };
}

/** Tırnaklı alanları ve gömülü virgülleri doğru işleyen satır bölücü. */
export function splitCsvLines(text: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) out.push(current);
  return out;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function toPayment(
  fields: string[],
): { payment: Payment | null; reason: CsvSkipReason | null } {
  const [
    rawName,
    rawPrice,
    rawCurrency,
    rawCycle,
    rawDate,
    rawCategory,
    notes,
    rawHistory,
    rawBankName,
    rawCurrentInst,
    rawTotalInst,
    rawCheckNumber,
    rawPayee,
    rawIsTrial,
    rawIsCompleted,
  ] = fields.map((f) => f.trim());

  const name = rawName;
  const price = parseAmount(rawPrice);
  const currency = rawCurrency.toUpperCase() as Currency;
  const billingCycle = rawCycle.toLowerCase() as BillingCycle;
  const categoryId = rawCategory.toLowerCase() as CategoryId;
  const nextPaymentDate = normalizeDate(rawDate);

  if (!name) return { payment: null, reason: "name" };
  if (!Number.isFinite(price) || price <= 0) return { payment: null, reason: "price" };
  if (!CURRENCIES.includes(currency)) return { payment: null, reason: "currency" };
  if (!CYCLES.includes(billingCycle)) return { payment: null, reason: "cycle" };
  if (!CATEGORY_IDS.includes(categoryId)) return { payment: null, reason: "category" };
  if (!nextPaymentDate) return { payment: null, reason: "date" };

  return {
    payment: sanitizeCategoryFields({
    id: crypto.randomUUID(),
    name,
    price,
    currency,
    billingCycle,
    nextPaymentDate,
    categoryId,
    notes: notes || undefined,
    createdAt: Date.now(),
    priceHistory: parsePriceHistory(rawHistory),
    bankName: rawBankName || undefined,
    currentInstallment: parseInstallment(rawCurrentInst),
    totalInstallments: parseInstallment(rawTotalInst),
    checkNumber: rawCheckNumber || undefined,
    payee: rawPayee || undefined,
    isTrial: rawIsTrial === "1" || rawIsTrial?.toLowerCase() === "true" || undefined,
    // Arşiv durumu dışa aktarımda da korunur: kapanmış bir kredi CSV turundan
    // sonra yeniden aylık toplamlara sızmasın
    isCompleted:
      rawIsCompleted === "1" || rawIsCompleted?.toLowerCase() === "true" || undefined,
    }),
    reason: null,
  };
}

function parsePriceHistory(raw: string | undefined): PricePoint[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const points = parsed.filter(
      (p): p is PricePoint =>
        typeof p === "object" &&
        p !== null &&
        typeof p.date === "string" &&
        typeof p.price === "number",
    );
    return points.length ? points : undefined;
  } catch {
    return undefined;
  }
}

function normalizeDate(input: string): string | null {
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // gg.aa.yyyy, gg/aa/yyyy veya gg-aa-yyyy — tire de gün-önce kabul edilir,
  // yoksa new Date("12-05-2024") ay/gün sırasını ters çevirirdi.
  const m = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(input);
  // toISOString yerine yerel toISO: gece yarısı UTC+ bölgelerde bir gün geri kayıyordu
  if (!Number.isNaN(parsed.getTime())) return toISO(parsed);
  return null;
}
