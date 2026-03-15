import { useEffect, useMemo, useState } from "react";
import {
  FiCheckSquare,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle
} from "react-icons/fi";
import { obtenerActividadesAdmin } from "../Services/actividadesService";
import CustomAlert from "../Components/alert";
import "../Styles/admin.css";

function Aactividades() {
  const [actividades, setActividades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertaMensaje(mensaje);
    setAlertaTipo(tipo);
    setAlertaVisible(true);

    setTimeout(() => {
      setAlertaVisible(false);
    }, 3000);
  };

  const cargarActividades = async () => {
    try {
      setCargando(true);
      const res = await obtenerActividadesAdmin();
      setActividades(res.data || []);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar actividades", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  const resumen = useMemo(() => {
    const total = actividades.length;
    const pendientes = actividades.filter((a) => a.estado === "pendiente").length;
    const enProgreso = actividades.filter((a) => a.estado === "en_progreso").length;
    const completadas = actividades.filter((a) => a.estado === "completada").length;
    const vencidas = actividades.filter((a) => a.estado === "vencida").length;

    return {
      total,
      pendientes,
      enProgreso,
      completadas,
      vencidas
    };
  }, [actividades]);

  const actividadesFiltradas = useMemo(() => {
    let lista = [...actividades];

    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();

      lista = lista.filter((a) => {
        const titulo = (a.titulo || "").toLowerCase();
        const materia = (a.materiaId?.nombre || "").toLowerCase();
        const usuarioNombre = `${a.usuario?.nombre || ""} ${a.usuario?.apellido || ""}`.toLowerCase();
        const correo = (a.usuario?.email || "").toLowerCase();

        return (
          titulo.includes(texto) ||
          materia.includes(texto) ||
          usuarioNombre.includes(texto) ||
          correo.includes(texto)
        );
      });
    }

    if (filtroEstado !== "todos") {
      lista = lista.filter((a) => a.estado === filtroEstado);
    }

    return lista.sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));
  }, [actividades, busqueda, filtroEstado]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "completada") return "estado-activo";
    if (estado === "vencida") return "estado-inactivo";
    if (estado === "en_progreso") return "rol-admin";
    return "rol-estudiante";
  };

  const obtenerTextoEstado = (estado) => {
    if (estado === "completada") return "Completada";
    if (estado === "vencida") return "Vencida";
    if (estado === "en_progreso") return "En progreso";
    return "Pendiente";
  };

  if (cargando) {
    return <div className="admin-dashboard-page">Cargando actividades...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <div className="admin-dashboard-header">
        <h1>Actividades</h1>
        <p>Consulta las actividades registradas por los estudiantes y su estado general.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCheckSquare />
          </div>
          <div>
            <small>Total actividades</small>
            <h3>{resumen.total}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiClock />
          </div>
          <div>
            <small>Pendientes</small>
            <h3>{resumen.pendientes}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiClock />
          </div>
          <div>
            <small>En progreso</small>
            <h3>{resumen.enProgreso}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCheckCircle />
          </div>
          <div>
            <small>Completadas</small>
            <h3>{resumen.completadas}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiAlertTriangle />
          </div>
          <div>
            <small>Vencidas</small>
            <h3>{resumen.vencidas}</h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-filtros-bar">
          <input
            type="text"
            placeholder="Buscar por actividad, materia, estudiante o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="admin-filtros-right">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
        </div>

        <div className="admin-periodos-table">
          <div className="admin-periodos-header admin-actividades-header">
            <div>Actividad</div>
            <div>Estudiante</div>
            <div>Materia</div>
            <div>Fecha límite</div>
            <div>Prioridad</div>
            <div>Estado</div>
          </div>

          {actividadesFiltradas.length > 0 ? (
            actividadesFiltradas.map((actividad) => (
              <div
                className="admin-periodos-row admin-actividades-row"
                key={actividad._id}
              >
                <div className="admin-periodo-main">
                  <h4>{actividad.titulo}</h4>
                  <p>{actividad.descripcion || "Sin descripción"}</p>
                </div>

                <div className="admin-periodo-usuario">
                  <strong>
                    {actividad.usuario
                      ? `${actividad.usuario.nombre} ${actividad.usuario.apellido}`
                      : "Sin usuario"}
                  </strong>
                  <span>{actividad.usuario?.email || "Sin correo"}</span>
                </div>

                <div className="admin-periodo-usuario">
                  <strong>{actividad.materiaId?.nombre || "Sin materia"}</strong>
                  <span>{actividad.tipoActividad || "tarea"}</span>
                </div>

                <div className="admin-periodo-fechas">
                  <span>{formatearFecha(actividad.fechaEntrega)}</span>
                </div>

                <div>
                  <span className={`usuario-badge prioridad-${actividad.prioridad}`}>
                    {actividad.prioridad}
                  </span>
                </div>

                <div>
                  <span className={`usuario-badge ${obtenerClaseEstado(actividad.estado)}`}>
                    {obtenerTextoEstado(actividad.estado)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="usuarios-admin-empty">
              No se encontraron actividades con los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Aactividades;