import "../Styles/detallesAc.css";

function detalleAc({ visible, actividad, onClose }) {
  if (!visible || !actividad) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return "No definida";

    const date = new Date(fecha);
    if (isNaN(date.getTime())) return "No definida";

    return date.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const estadoTexto = {
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    completada: "Completada",
    vencida: "Vencida"
  };

  const prioridadTexto = {
    baja: "Baja",
    media: "Media",
    alta: "Alta"
  };

  const tipoTexto =
    actividad.tipo === "deadline" ? "Fecha límite" : "Bloque de estudio";

  return (
    <div className="detalle-modal-overlay" onClick={onClose}>
      <div className="detalle-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="detalle-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="detalle-modal-header">
          <small>{tipoTexto}</small>
          <h2 className={actividad.estado === "completada" ? "titulo-completado" : ""}>
            {actividad.titulo}
          </h2>
        </div>

        <div className="detalle-modal-body">
          <div className="detalle-grid">
            <div className="detalle-item">
              <strong>Materia</strong>
              <span
                className="detalle-materia-badge"
                style={{
                  color: actividad.materia?.color || "#2563eb",
                  borderColor: `${actividad.materia?.color || "#2563eb"}33`
                }}
              >
                {actividad.materia?.nombre || "Sin materia"}
              </span>
            </div>

            <div className="detalle-item">
              <strong>Fecha límite</strong>
              <span>{formatearFecha(actividad.fechaEntrega)}</span>
            </div>

            {actividad.horaInicio && actividad.horaFin && (
              <div className="detalle-item">
                <strong>Horario planificado</strong>
                <span>{actividad.horaInicio} - {actividad.horaFin}</span>
              </div>
            )}

            {actividad.horas && (
              <div className="detalle-item">
                <strong>Horas asignadas</strong>
                <span>{actividad.horas}h</span>
              </div>
            )}

            <div className="detalle-item">
              <strong>Prioridad</strong>
              <span className={`detalle-badge prioridad-${actividad.prioridad || "media"}`}>
                {prioridadTexto[actividad.prioridad] || "No definida"}
              </span>
            </div>

            <div className="detalle-item">
              <strong>Estado</strong>
              <span className={`detalle-badge estado-${actividad.estado || "pendiente"}`}>
                {estadoTexto[actividad.estado] || "No definido"}
              </span>
            </div>
          </div>

          {actividad.descripcion && actividad.descripcion.trim() !== "" && (
            <div className="detalle-descripcion">
              <strong>Descripción</strong>
              <p>{actividad.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default detalleAc;