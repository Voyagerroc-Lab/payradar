import { useI18n } from "../i18n";
import { localeFor } from "../lib/format";
import type { CloudUser } from "../lib/cloud";

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

  const identity = cloudUser?.displayName ?? cloudUser?.email ?? cloudUser?.phone ?? "";
  const initial = identity ? identity.charAt(0).toLocaleUpperCase(localeFor(lang)) : "";

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            📡
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
              aria-label={cloudUser ? t("auth.profile.title") : t("auth.tabSignIn")}
              title={cloudUser ? t("auth.profile.title") : t("auth.tabSignIn")}
            >
              {cloudUser ? (
                <>
                  <span className="account-chip-avatar">{initial}</span> ☁️
                </>
              ) : (
                <>👤 {t("auth.tabSignIn")}</>
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
              🔒
            </button>
          )}
          <button className="icon-btn" onClick={onOpenSettings} aria-label={t("settings.title")}>
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
}
