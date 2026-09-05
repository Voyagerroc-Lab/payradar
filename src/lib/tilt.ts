import { useEffect, useRef } from "react";

/**
 * İşaretçi takipli 3B eğim — bağımlılıksız, ~1 KB.
 *
 * Tek bir kapsayıcıya bağlanır ve içindeki kartlar için olay delegasyonu
 * yapar: 20 kart için 20 dinleyici değil, kapsayıcı başına bir tane. Böylece
 * kart eklenip silindiğinde yeniden bağlanmak da gerekmez.
 *
 * Kartın CSS'i şu değişkenleri okur:
 *   --rx / --ry  eğim açıları
 *   --mx / --my  parlama (specular) merkezinin kart üzerindeki konumu
 *
 * Tamamen devre dışı kaldığı durumlar:
 *   - prefers-reduced-motion: reduce  (hareket duyarlılığı)
 *   - kaba işaretçi / dokunmatik      (parmak zaten kartın üstünü kapatıyor)
 */

/** Maksimum eğim. 6°'nin üstü "oyuncak" hissi veriyor, altı fark edilmiyor. */
const MAX_TILT = 6;

export function attachTilt(root: HTMLElement, selector: string): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || calm.matches) return () => {};

  let active: HTMLElement | null = null;
  let px = 0;
  let py = 0;
  let frame = 0;

  function reset(el: HTMLElement | null): void {
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.removeProperty("--rx");
    el.style.removeProperty("--ry");
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  }

  function apply(): void {
    frame = 0;
    if (!active) return;
    const r = active.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Kart içinde 0..1 konum; merkez 0.5
    const nx = (px - r.left) / r.width;
    const ny = (py - r.top) / r.height;
    active.style.setProperty("--ry", `${(nx - 0.5) * 2 * MAX_TILT}deg`);
    active.style.setProperty("--rx", `${(0.5 - ny) * 2 * MAX_TILT}deg`);
    active.style.setProperty("--mx", `${nx * 100}%`);
    active.style.setProperty("--my", `${ny * 100}%`);
  }

  function onMove(e: PointerEvent): void {
    // Hibrit cihazlarda (dokunmatik dizüstü) parmak girdisini yok say
    if (e.pointerType === "touch") return;
    const target = e.target as Element | null;
    const el = target ? target.closest<HTMLElement>(selector) : null;
    if (el !== active) {
      reset(active);
      active = el;
      if (active) active.classList.add("is-tilting");
    }
    if (!active) return;
    px = e.clientX;
    py = e.clientY;
    if (!frame) frame = requestAnimationFrame(apply);
  }

  function onLeave(): void {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    reset(active);
    active = null;
  }

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  return () => {
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    onLeave();
  };
}

/** attachTilt'in React sarmalayıcısı: dönen ref'i kapsayıcıya ver. */
export function useTilt<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return attachTilt(el, selector);
  }, [selector]);
  return ref;
}
