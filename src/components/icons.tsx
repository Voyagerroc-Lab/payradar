/**
 * PayRadar ikon seti — tek kalınlıkta çizgi ikonlar.
 *
 * Emoji yerine bunlar kullanılır: her platformda aynı çizilir, currentColor
 * ile bulunduğu metnin rengini alır ve mono mikro-etiket sesiyle aynı
 * "teknik" dilde konuşur. 24×24 tuval, 1.7 kalem; boyut `size` ile.
 */
import type { JSX } from "react";

export type IconName =
  | "home" | "car" | "receipt" | "screen" | "book" | "pulse" | "shield"
  | "bank" | "scroll" | "gamepad" | "box"
  | "coins" | "trend" | "layers" | "radar"
  | "pencil" | "trash" | "share" | "check" | "chart" | "bell" | "sparkle"
  | "gift"
  | "cloud" | "star" | "refresh" | "globe" | "bulb"
  | "lock" | "unlock" | "gear" | "warn" | "download" | "upload";

const PATHS: Record<IconName, JSX.Element> = {
  home: (
    <>
      <path d="M4 11.5 12 4.5l8 7" />
      <path d="M6 10.2V19.5h12v-9.3" />
      <path d="M10.3 19.5v-4.6h3.4v4.6" />
    </>
  ),
  car: (
    <>
      <path d="M4.5 16V12l2-4.5h11L19.5 12v4" />
      <path d="M4.5 12h15" />
      <circle cx="7.6" cy="16.5" r="1.7" />
      <circle cx="16.4" cy="16.5" r="1.7" />
    </>
  ),
  receipt: (
    <>
      <path d="M6.5 3.5h11V20l-1.8-1.3-1.9 1.3-1.8-1.3L10.2 20l-1.9-1.3L6.5 20z" />
      <path d="M9.5 8.5h5M9.5 12h5" />
    </>
  ),
  screen: (
    <>
      <rect x="3.8" y="5.5" width="16.4" height="11.5" rx="1.8" />
      <path d="M9.5 20.3h5" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.7C10.4 5.1 8 4.6 4.7 4.6v13.1c3.3 0 5.7.5 7.3 2.1 1.6-1.6 4-2.1 7.3-2.1V4.6C16 4.6 13.6 5.1 12 6.7z" />
      <path d="M12 6.7v13.1" />
    </>
  ),
  pulse: <path d="M3.5 12.5h4l2-5.5 4.5 10 2-4.5h4.5" />,
  shield: <path d="M12 3.5 19 6v5.8c0 4.4-2.9 7.5-7 9.2-4.1-1.7-7-4.8-7-9.2V6z" />,
  bank: (
    <>
      <path d="M4 9.3 12 4l8 5.3z" />
      <path d="M6.3 9.3v8M12 9.3v8M17.7 9.3v8" />
      <path d="M4.5 20.3h15" />
    </>
  ),
  scroll: (
    <>
      <path d="M6.5 3.7h7l4 4v12.6h-11z" />
      <path d="M13.5 3.7v4h4" />
      <path d="M9.3 12.3h5.4M9.3 15.7h5.4" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7.2 8.8h9.6a4.6 4.6 0 0 1 4.5 5.5l-.6 3a2.5 2.5 0 0 1-4.5 1l-1.6-2.3H9.4l-1.6 2.3a2.5 2.5 0 0 1-4.5-1l-.6-3a4.6 4.6 0 0 1 4.5-5.5z" />
      <path d="M8.2 11.3v3.2M6.6 12.9h3.2" />
      <circle cx="15.3" cy="14.2" r="0.4" fill="currentColor" />
      <circle cx="17.5" cy="11.9" r="0.4" fill="currentColor" />
    </>
  ),
  box: (
    <>
      <path d="M4.5 8 12 4.4 19.5 8v8L12 19.6 4.5 16z" />
      <path d="M4.5 8 12 11.5 19.5 8M12 11.5v8.1" />
    </>
  ),
  coins: (
    <>
      <rect x="3.6" y="7" width="16.8" height="10" rx="1.8" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6.6 12h.01M17.4 12h.01" />
    </>
  ),
  trend: (
    <>
      <path d="M4 17l5-5 3.4 3.4L20 7.8" />
      <path d="M15.6 7.8H20v4.4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4.2 20 8.6 12 13 4 8.6z" />
      <path d="M4 12.6 12 17l8-4.4" />
      <path d="M4 16.4 12 20.8l8-4.4" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 12l5.4-5.8" />
    </>
  ),
  pencil: (
    <>
      <path d="M4.3 19.7l1-4L16.4 4.6a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8.3 18.7z" />
      <path d="M14.3 5.7 18.3 9.7" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.7h15" />
      <path d="M9.6 6.7V5.2A1.4 1.4 0 0 1 11 3.8h2a1.4 1.4 0 0 1 1.4 1.4v1.5" />
      <path d="M6.6 6.7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.8-12.3" />
      <path d="M10.1 10.6v6M13.9 10.6v6" />
    </>
  ),
  share: (
    <>
      <path d="M12 14.8V4.6M8.6 8 12 4.6 15.4 8" />
      <path d="M5.6 12.6V18a1.6 1.6 0 0 0 1.6 1.6h9.6A1.6 1.6 0 0 0 18.4 18v-5.4" />
    </>
  ),
  check: <path d="M5 12.6 10 17.6 19 7" />,
  chart: (
    <>
      <path d="M4.6 4.5v15h15" />
      <path d="M8 15.2l3.4-4 3 2.6 4.6-5.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6.2 16.4V11a5.8 5.8 0 0 1 11.6 0v5.4l1.5 2H4.7z" />
      <path d="M10.6 20.2a1.7 1.7 0 0 0 2.8 0" />
    </>
  ),
  sparkle: <path d="M12 4.6 13.7 10.3 19.4 12l-5.7 1.7L12 19.4 10.3 13.7 4.6 12l5.7-1.7z" />,
  gift: (
    <>
      <path d="M5 11v9.2h14V11" />
      <path d="M3.7 7.6h16.6V11H3.7z" />
      <path d="M12 7.6v12.6" />
      <path d="M12 7.6c-1.9 0-4.3-.7-4.3-2.2 0-1.4 1.5-1.9 2.4-1.2C11.1 5 12 7.6 12 7.6zm0 0c1.9 0 4.3-.7 4.3-2.2 0-1.4-1.5-1.9-2.4-1.2C12.9 5 12 7.6 12 7.6z" />
    </>
  ),
  cloud: <path d="M7 17.6h9.4a4.1 4.1 0 0 0 .7-8.1A5.6 5.6 0 0 0 6.3 8.5 4.3 4.3 0 0 0 7 17.6z" />,
  star: <path d="M12 4.4l2.2 4.6 5.1.7-3.7 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.7-3.5 5.1-.7z" />,
  refresh: (
    <>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.1-5.2" />
      <path d="M19.4 3.9v3.4H16" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.8c2.5 2.5 2.5 13.9 0 16.4M12 3.8c-2.5 2.5-2.5 13.9 0 16.4" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3.8a5.6 5.6 0 0 0-3.2 10.2c.7.5 1.2 1.2 1.2 2h4c0-.8.5-1.5 1.2-2A5.6 5.6 0 0 0 12 3.8z" />
      <path d="M9.8 19h4.4M10.6 21.2h2.8" />
    </>
  ),
  lock: (
    <>
      <rect x="5.6" y="10.6" width="12.8" height="9.6" rx="1.8" />
      <path d="M8.6 10.6V8.1a3.4 3.4 0 0 1 6.8 0v2.5" />
    </>
  ),
  unlock: (
    <>
      <rect x="5.6" y="10.6" width="12.8" height="9.6" rx="1.8" />
      <path d="M8.6 10.6V8.1a3.4 3.4 0 0 1 6.7-.9" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      {/* Gerçek dişli silueti: güneşle karışmaz (düz ışın değil, dişli diş) */}
      <path d="M19.1 14.4a1.5 1.5 0 0 0 .3 1.65l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.5 1.5 0 0 0-2.55 1.06V21a2 2 0 0 1-4 0v-.08a1.5 1.5 0 0 0-2.55-1.06l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.5 1.5 0 0 0 4.9 14.4a1.5 1.5 0 0 0-1.37-.9H3.4a2 2 0 0 1 0-4h.08a1.5 1.5 0 0 0 1.37-2.45l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.5 1.5 0 0 0 9.6 4.9a1.5 1.5 0 0 0 .9-1.37V3.4a2 2 0 0 1 4 0v.08a1.5 1.5 0 0 0 2.55 1.06l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05a1.5 1.5 0 0 0-.3 1.65 1.5 1.5 0 0 0 1.37.9h.14a2 2 0 0 1 0 4h-.08a1.5 1.5 0 0 0-1.37.9z" />
    </>
  ),
  warn: (
    <>
      <path d="M12 4.6 20.8 19.3H3.2z" />
      <path d="M12 10.2v3.9M12 16.6h.01" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.6v9.8M8.6 11 12 14.4 15.4 11" />
      <path d="M5.6 12.6V18a1.6 1.6 0 0 0 1.6 1.6h9.6A1.6 1.6 0 0 0 18.4 18v-5.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 14.4V4.6M8.6 8 12 4.6 15.4 8" />
      <path d="M5.6 12.6V18a1.6 1.6 0 0 0 1.6 1.6h9.6A1.6 1.6 0 0 0 18.4 18v-5.4" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
