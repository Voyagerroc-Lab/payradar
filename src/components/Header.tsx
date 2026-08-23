import { useI18n } from "../i18n";

interface HeaderProps {
  onOpenSettings: () => void;
  onLock?: () => void;
}

export default function Header({ onOpenSettings, onLock }: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-icon">📡</span>
          <div>
            <h1>PayRadar</h1>
            <p>{t("tagline")}</p>
          </div>
        </div>
        <div className="header-actions">
          {onLock && (
            <button className="icon-btn" onClick={onLock} aria-label="Kilitle" title="Kilitle">
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
