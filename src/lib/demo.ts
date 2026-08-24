import type { CategoryId, Currency, Payment } from "../types";

interface DemoPaymentInput {
  name: string;
  price: number;
  currency?: Currency;
  billingCycle?: Payment["billingCycle"];
  daysFromNow: number;
  categoryId: CategoryId;
  isTrial?: boolean;
}

export function buildDemoPayments(): Payment[] {
  const inputs: DemoPaymentInput[] = [
    { name: "Ev Kirası", price: 18500, daysFromNow: 9, categoryId: "konut" },
    { name: "Araç Kirası", price: 24000, daysFromNow: 14, categoryId: "ulasim" },
    { name: "Elektrik Faturası", price: 850, daysFromNow: 3, categoryId: "faturalar" },
    { name: "İnternet (Türk Telekom)", price: 649, daysFromNow: 7, categoryId: "faturalar" },
    { name: "Netflix", price: 149.99, daysFromNow: 2, categoryId: "abonelik" },
    {
      name: "Spotify Premium",
      price: 59.99,
      daysFromNow: 5,
      categoryId: "abonelik",
    },
    { name: "Xbox Game Pass Ultimate", price: 249.0, daysFromNow: 20, categoryId: "oyun" },
    { name: "iCloud+ 200GB", price: 29.99, daysFromNow: 8, categoryId: "diger" },
    {
      name: "ChatGPT Plus",
      price: 20,
      currency: "USD",
      daysFromNow: 15,
      categoryId: "abonelik",
    },
    {
      name: "DASK Sigortası",
      price: 1240,
      billingCycle: "yearly",
      daysFromNow: 45,
      categoryId: "sigorta",
    },
    {
      name: "Canva Pro",
      price: 449.99,
      daysFromNow: 4,
      categoryId: "diger",
      isTrial: true,
    },
  ];

  const now = Date.now();
  return inputs.map((input, index) => {
    const date = new Date();
    date.setDate(date.getDate() + input.daysFromNow);
    return {
      id: `demo-${now}-${index}`,
      name: input.name,
      price: input.price,
      currency: input.currency ?? "TRY",
      billingCycle: input.billingCycle ?? "monthly",
      nextPaymentDate: date.toISOString().slice(0, 10),
      categoryId: input.categoryId,
      createdAt: now + index,
      isTrial: input.isTrial,
      // Netflix'e örnek zam geçmişi: grafik özelliğini göstermek için
      priceHistory:
        input.name === "Netflix"
          ? [
              { date: "2024-01-15", price: 99.99 },
              { date: "2025-02-01", price: 129.99 },
            ]
          : undefined,
    };
  });
}
