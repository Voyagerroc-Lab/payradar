import Modal from "./Modal";
import type { CancelGuide } from "../types";
import { useI18n } from "../i18n";
import { Icon } from "./icons";

interface GuideModalProps {
  guide: CancelGuide;
  serviceName: string;
  onClose: () => void;
}

export default function GuideModal({ guide, serviceName, onClose }: GuideModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      title={t("guide.modalTitle", { name: serviceName })}
      onClose={onClose}
      wide
    >
      <p className="guide-intro">{t("guide.intro")}</p>
      <ol className="guide-steps">
        {guide.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {guide.tip && (
        <div className="guide-tip">
          <Icon name="bulb" size={14} /> <strong>{t("guide.tipLabel")}</strong> {guide.tip}
        </div>
      )}
      {guide.cancelUrl && (
        <a
          className="btn btn-primary guide-link"
          href={guide.cancelUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t("guide.openPage")}
        </a>
      )}
    </Modal>
  );
}
