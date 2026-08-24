import Modal from "./Modal";
import { useI18n } from "../i18n";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  const { t } = useI18n();
  return (
    <Modal title={t("confirm.title")} onClose={onCancel}>
      <p className="field-hint">{message}</p>
      <div className="form-actions security-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          {t("action.cancel")}
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          {t("action.confirm")}
        </button>
      </div>
    </Modal>
  );
}
