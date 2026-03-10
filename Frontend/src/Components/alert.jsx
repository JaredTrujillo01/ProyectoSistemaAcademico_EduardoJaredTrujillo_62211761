import "../Styles/alert.css";

function CustomAlert({ message, type = "success", visible, onClose }) {
  if (!visible) return null;

  return (
    <div className={`custom-alert ${type}`}>
      <div className="custom-alert-content">
        <strong>
          {type === "success" ? "Éxito" : type === "error" ? "Error" : "Aviso"}
        </strong>
        <p>{message}</p>
      </div>

      <button className="custom-alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default CustomAlert;