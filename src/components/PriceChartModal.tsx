import { formatDateTR, localeFor, todayISO } from "../lib/format";
import type { Payment } from "../types";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";
import Modal from "./Modal";

interface PriceChartModalProps {
  payment: Payment;
  onClose: () => void;
}

const W = 320;
const H = 170;
const PAD_X = 34;
const PAD_Y = 26;

export default function PriceChartModal({ payment, onClose }: PriceChartModalProps) {
  const { t, lang } = useI18n();

  const history = payment.priceHistory ?? [];
  // Geçmiş + bugünkü fiyat = son nokta (bugünün tarihiyle; gelecek ödeme tarihi değil)
  const points = [...history, { date: todayISO(), price: payment.price }];

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  // Eksen aralığına %15 nefes payı — çizgi kutunun kenarlarına yapışmasın
  const domainMin = min * 0.85;
  const domainMax = max * 1.15;
  const range = domainMax - domainMin || domainMax || 1;
  const spanX = W - PAD_X * 2;
  const spanY = H - PAD_Y * 2;

  const coords = points.map((point, i) => ({
    x: PAD_X + (points.length === 1 ? spanX / 2 : (spanX * i) / (points.length - 1)),
    y: PAD_Y + spanY - ((point.price - domainMin) / range) * spanY,
    ...point,
  }));

  const path = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const fmt = (v: number) =>
    new Intl.NumberFormat(localeFor(lang), {
      style: "currency",
      currency: payment.currency,
      maximumFractionDigits: v % 1 === 0 ? 0 : 2,
    }).format(v);

  // "İlk fiyattan değişim" — etiketin dediği gibi ilk kayda göre yüzde
  const firstPrice = points[0].price;
  const changePct =
    firstPrice > 0 ? Math.round(((payment.price - firstPrice) / firstPrice) * 100) : 0;

  return (
    <Modal title={t("chart.title", { name: payment.name })} onClose={onClose} wide>
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="chart-svg"
          role="img"
          aria-label={t("chart.title", { name: payment.name })}
        >
          {/* yatay kılavuz çizgileri */}
          {[0, 0.5, 1].map((r) => (
            <line
              key={r}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_Y + spanY * r}
              y2={PAD_Y + spanY * r}
              className="chart-grid"
            />
          ))}

          <polyline points={path} className="chart-line" />

          {coords.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r="4" className="chart-dot" />
              {(i === 0 || i === coords.length - 1) && (
                <text
                  x={c.x}
                  y={H - 6}
                  textAnchor="middle"
                  className="chart-label"
                >
                  {new Intl.DateTimeFormat(localeFor(lang), {
                    month: "short",
                    year: "2-digit",
                  }).format(new Date(c.date))}
                </text>
              )}
            </g>
          ))}

          <text x={PAD_X - 6} y={PAD_Y + 4} textAnchor="end" className="chart-label">
            {fmt(max)}
          </text>
          <text x={PAD_X - 6} y={PAD_Y + spanY + 4} textAnchor="end" className="chart-label">
            {fmt(min)}
          </text>
        </svg>

        <div className="chart-summary">
          <div>
            <span className="summary-label">{t("chart.current")}</span>
            <strong>
              {fmt(payment.price)}
              <small> {t(`suffix.${payment.billingCycle}` as TranslationKey)}</small>
            </strong>
          </div>
          {points.length > 1 && (
            <div>
              <span className="summary-label">{t("chart.change")}</span>
              <strong className={changePct > 0 ? "up" : changePct < 0 ? "down" : ""}>
                {changePct > 0 ? `▲ +${changePct}%` : changePct < 0 ? `▼ ${changePct}%` : "0%"}
              </strong>
            </div>
          )}
        </div>

        {points.length > 1 && (
          <ul className="chart-history-list">
            {points.map((p, i) => (
              <li key={i}>
                <span>{formatDateTR(p.date, lang)}</span>
                <strong>{fmt(p.price)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
