import "../Styles/alert.css";

function ConfirmModal({
  visible,
  title = "Confirmar acción",
  message = "¿Estás seguro de continuar?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  type = "danger",
  onConfirm,
  onCancel
}) {
  if (!visible) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-box">
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-btn cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;