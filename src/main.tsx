import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

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
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
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
