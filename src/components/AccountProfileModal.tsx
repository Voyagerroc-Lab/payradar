import { useMemo, useState } from "react";
import Modal from "./Modal";
import type { CloudUser } from "../lib/cloud";
import type { SyncState } from "../App";
import { localeFor } from "../lib/format";
import { useI18n } from "../i18n";

interface AccountProfileModalProps {
  user: CloudUser;
  syncState: SyncState;
  lastSyncTime: number;
  onSyncNow: () => void;
  onSignOut: () => void;
  onSwitchAccount: () => void;
  onClose: () => void;
}

export default function AccountProfileModal({
  user,
  syncState,
  lastSyncTime,
  onSyncNow,
  onSignOut,
  onSwitchAccount,
  onClose,
}: AccountProfileModalProps) {
  const { t, lang } = useI18n();

  const identity = user.email ?? user.phone ?? "";
  const displayName = user.displayName ?? (user.email ? user.email.split("@")[0] : identity);
  const initial = (displayName || identity || "U").charAt(0).toLocaleUpperCase("tr-TR");

  // Modal açıldığı andaki zaman; render sırasında Date.now() çağırmamak için lazy init
  const [openedAt] = useState(() => Date.now());
  const lastSyncText = useMemo(
    () =>
      lastSyncTime <= 0 || openedAt - lastSyncTime < 60_000
        ? t("auth.profile.justNow")
        : new Intl.DateTimeFormat(localeFor(lang), {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          }).format(new Date(lastSyncTime)),
    [lastSyncTime, openedAt, lang, t],
  );

  return (
    <Modal title={t("auth.profile.title")} onClose={onClose}>
      <div className="profile-head">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-identity">
          <strong>{displayName}</strong>
          {user.email && <span>{user.email}</span>}
          {!user.email && user.phone && <span>{user.phone}</span>}
        </div>
      </div>

      <p className="profile-synced">✅ {t("auth.profile.synced")}</p>
      <p className="field-hint">{t("auth.profile.lastSync", { time: lastSyncText })}</p>

      <button
        className="btn btn-secondary profile-sync-btn"
        disabled={syncState === "syncing"}
        onClick={onSyncNow}
      >
        <span className={`sync-icon ${syncState === "syncing" ? "spinning" : ""}`}>🔄</span>{" "}
        {syncState === "syncing" ? t("auth.profile.syncing") : t("auth.profile.syncNow")}
      </button>

      <div className="profile-webaccess">
        <strong>🌐 {t("auth.profile.webAccess")}</strong>
        <p>{t("auth.profile.webAccessDesc", { email: identity })}</p>
      </div>

      <div className="form-actions security-actions">
        <button className="btn btn-secondary" onClick={onSwitchAccount}>
          {t("auth.profile.switchAccount")}
        </button>
        <button className="btn btn-danger" onClick={onSignOut}>
          {t("auth.profile.signOut")}
        </button>
      </div>
    </Modal>
  );
}
