import { useI18n } from "../i18n";
import { localeFor } from "../lib/format";
import type { CloudUser } from "../lib/cloud";
import { Icon } from "./icons";

interface HeaderProps {
  onOpenSettings: () => void;
  onLock?: () => void;
  cloudEnabled?: boolean;
  cloudUser?: CloudUser | null;
  onOpenAccount?: () => void;
}

export default function Header({
  onOpenSettings,
  onLock,
  cloudEnabled,
  cloudUser,
  onOpenAccount,
}: HeaderProps) {
  const { t, lang } = useI18n();

  const identity = cloudUser?.displayName ?? cloudUser?.email ?? "";
  const initial = identity ? identity.charAt(0).toLocaleUpperCase(localeFor(lang)) : "";

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            {/* Radar glifi: uygulama ikonuyla aynı motif, platform emojisine bağımlı değil.
                Çizgiler currentColor ile gider (.brand-icon rengi --accent-ink) — kulüp
                temalarında zemin altın/beyaz olunca beyaz glif kaybolurdu. Temas noktası
                temanın ikinci rengidir. */}
            <svg viewBox="0 0 24 24" width="25" height="25" fill="none">
              <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeOpacity="0.42" strokeWidth="1.5" />
              <path d="M12 12 L18.6 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1.7" fill="currentColor" />
              <circle cx="17" cy="8.1" r="2" fill="var(--brand-blip)" />
            </svg>
          </span>
          <div>
            <h1 translate="no">PayRadar</h1>
            <p>{t("tagline")}</p>
          </div>
        </div>
        <div className="header-actions">
          {cloudEnabled && onOpenAccount && (
            <button
              className="account-chip"
              onClick={onOpenAccount}
              aria-label={cloudUser ? t("auth.profile.title") : t("auth.signIn")}
              title={cloudUser ? t("auth.profile.title") : t("auth.signIn")}
            >
              {cloudUser ? (
                <>
                  <span className="account-chip-avatar">{initial}</span> <Icon name="cloud" size={14} />
                </>
              ) : (
                t("auth.signIn")
              )}
            </button>
          )}
          {onLock && (
            <button
              className="icon-btn"
              onClick={onLock}
              aria-label={t("action.lock")}
              title={t("action.lock")}
            >
              <Icon name="lock" />
            </button>
          )}
          <button className="icon-btn" onClick={onOpenSettings} aria-label={t("settings.title")}>
            <Icon name="gear" size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
