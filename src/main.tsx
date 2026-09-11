import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

/**
 * Yükseltme bağlantısı: `/?update=1` (veya `?guncelle`) ile açılınca kurulu
 * uygulamanın service worker'ı ve önbelleği temizlenir, sayfa temiz adrese
 * yeniden yüklenir. Normalde gerekmez — sayfa gezinmeleri "önce ağ" olduğu
 * için yeni deploy bir sonraki açılışta kendiliğinden gelir; bu bağlantı
 * eski bir sürümde takılı kalmış cihaz için tek dokunuşluk çıkış yoludur.
 * Veriye dokunulmaz: yalnızca SW kaydı ve Cache Storage silinir.
 */
const updateParams = new URLSearchParams(window.location.search);
if (updateParams.has("update") || updateParams.has("guncelle")) {
  void (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } finally {
      window.location.replace(import.meta.env.BASE_URL);
    }
  })();
}

/**
 * Son savunma hattı: render/effect aşamasında yakalanmamış bir hata React
 * ağacını söker ve kurulu uygulamada kalıcı BOŞ EKRAN bırakır (bunu bir kez
 * yaşadık: Android'de desteklenmeyen Notification kurucusu her açılışta
 * fırlatıyordu). Boş ekran yerine tek dokunuşla kurtarma ekranı gösterilir;
 * veri silinmez, yalnızca sayfa yeniden yüklenir.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#07080c",
          color: "#eef0f4",
        }}
      >
        <div>
          {/* Kurtarma ekranı bilinçli olarak bağımsız: uygulama modüllerinden
              hiçbir şey import etmez, ikon satır içi SVG'dir */}
          <div style={{ marginBottom: 12, color: "#45f0ae" }}>
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8.2" />
              <circle cx="12" cy="12" r="4.4" />
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              <path d="M12 12l5.4-5.8" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>
            Bir şeyler ters gitti / Something went wrong
          </h1>
          <p style={{ margin: "0 0 20px", color: "#949cad", fontSize: 14 }}>
            Verilerin güvende. / Your data is safe.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 28px",
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Yeniden Yükle / Reload
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
