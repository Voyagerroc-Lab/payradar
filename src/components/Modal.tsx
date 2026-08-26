import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../i18n";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Üst katman: başka bir modalın üzerine açılan onay/anahtar diyalogları.
   *  Görsel olarak her zaman üstte boyanır (z-index). */
  top?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Açık modalların yığını. Escape ve Tab tuzağı YALNIZCA en üstteki modalda
 * çalışır — aksi halde Ayarlar'ın üzerine açılan bir onay penceresinde
 * Escape ikisini birden kapatıyor, iki odak tuzağı birbirine giriyordu.
 */
const modalStack: symbol[] = [];

export default function Modal({ title, onClose, children, wide, top }: ModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(Symbol("modal"));

  // Yığına kaydol; sökülünce çık
  useEffect(() => {
    const id = idRef.current;
    modalStack.push(id);
    return () => {
      const i = modalStack.indexOf(id);
      if (i >= 0) modalStack.splice(i, 1);
    };
  }, []);

  // Escape ile kapatma — yalnızca en üstteki modal tepki verir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalStack[modalStack.length - 1] !== idRef.current) return;
      onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Odak yönetimi: aç -> içeri taşı, Tab'ı içeride tut, kapat -> tetikleyiciye dön
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog) {
      const first = dialog.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialog).focus();
    }

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      // Alt kattaki modalın tuzağı devreye girmesin
      if (modalStack[modalStack.length - 1] !== idRef.current) return;
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap, true);

    return () => {
      document.removeEventListener("keydown", trap, true);
      previouslyFocused?.focus?.();
    };
  }, []);

  // Arka planın kaydırmasını kilitle (üst üste açılan modallar için sayaç)
  useEffect(() => {
    const body = document.body;
    const openCount = Number(body.dataset.modalCount ?? "0") + 1;
    body.dataset.modalCount = String(openCount);
    if (openCount === 1) {
      body.dataset.prevOverflow = body.style.overflow;
      body.style.overflow = "hidden";
    }
    return () => {
      const remaining = Number(body.dataset.modalCount ?? "1") - 1;
      body.dataset.modalCount = String(remaining);
      if (remaining <= 0) {
        body.style.overflow = body.dataset.prevOverflow ?? "";
        delete body.dataset.modalCount;
        delete body.dataset.prevOverflow;
      }
    };
  }, []);

  return (
    <div
      className={`modal-backdrop ${top ? "modal-backdrop-top" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t("action.close")}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
