import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiPlayCircle, FiClock, FiCheckCircle } from "react-icons/fi";
import { obtenerPeriodosAdmin } from "../Services/periodoServices";
import CustomAlert from "../Components/alert";
import "../Styles/admin.css";

function PeriodosAdmin() {
  const [periodos, setPeriodos] = useState([]);
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

  const cargarPeriodos = async () => {
    try {
      setCargando(true);
      const res = await obtenerPeriodosAdmin();
      setPeriodos(res.data || []);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar períodos", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const resumen = useMemo(() => {
    const total = periodos.length;
    const enCurso = periodos.filter((p) => p.estadoPeriodo === "en_curso").length;
    const porEmpezar = periodos.filter((p) => p.estadoPeriodo === "por_empezar").length;
    const finalizados = periodos.filter((p) => p.estadoPeriodo === "finalizado").length;

    return { total, enCurso, porEmpezar, finalizados };
  }, [periodos]);

  const periodosFiltrados = useMemo(() => {
    let lista = [...periodos];

    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();

      lista = lista.filter((p) => {
        const nombrePeriodo = (p.nombre || "").toLowerCase();
        const usuarioNombre = `${p.usuario?.nombre || ""} ${p.usuario?.apellido || ""}`.toLowerCase();
        const correo = (p.usuario?.email || "").toLowerCase();

        return (
          nombrePeriodo.includes(texto) ||
          usuarioNombre.includes(texto) ||
          correo.includes(texto)
        );
      });
    }

    if (filtroEstado !== "todos") {
      lista = lista.filter((p) => p.estadoPeriodo === filtroEstado);
    }

    return lista.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  }, [periodos, busqueda, filtroEstado]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "en_curso") return "estado-activo";
    if (estado === "finalizado") return "estado-inactivo";
    return "rol-estudiante";
  };

  const obtenerTextoEstado = (estado) => {
    if (estado === "en_curso") return "En curso";
    if (estado === "finalizado") return "Finalizado";
    return "Por empezar";
  };

  if (cargando) {
    return <div className="admin-dashboard-page">Cargando períodos...</div>;
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
        <h1>Períodos Académicos</h1>
        <p>Consulta el estado general de los períodos registrados por los estudiantes.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCalendar />
          </div>
          <div>
            <small>Total períodos</small>
            <h3>{resumen.total}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiPlayCircle />
          </div>
          <div>
            <small>En curso</small>
            <h3>{resumen.enCurso}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiClock />
          </div>
          <div>
            <small>Por empezar</small>
            <h3>{resumen.porEmpezar}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCheckCircle />
          </div>
          <div>
            <small>Finalizados</small>
            <h3>{resumen.finalizados}</h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-filtros-bar">
          <input
            type="text"
            placeholder="Buscar por período, estudiante o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="admin-filtros-right">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="en_curso">En curso</option>
              <option value="por_empezar">Por empezar</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        <div className="admin-periodos-table">
          <div className="admin-periodos-header">
            <div>Período</div>
            <div>Estudiante</div>
            <div>Fechas</div>
            <div>Estado</div>
            <div>Materias</div>
            <div>Progreso</div>
          </div>

          {periodosFiltrados.length > 0 ? (
            periodosFiltrados.map((periodo) => (
              <div className="admin-periodos-row" key={periodo._id}>
                <div className="admin-periodo-main">
                  <h4>{periodo.nombre}</h4>
                  <p>{periodo.progresoAcademico?.totalActividades || 0} actividades</p>
                </div>

                <div className="admin-periodo-usuario">
                  <strong>
                    {periodo.usuario
                      ? `${periodo.usuario.nombre} ${periodo.usuario.apellido}`
                      : "Sin usuario"}
                  </strong>
                  <span>{periodo.usuario?.email || "Sin correo"}</span>
                </div>

                <div className="admin-periodo-fechas">
                  <span>{formatearFecha(periodo.fechaInicio)}</span>
                  <span>{formatearFecha(periodo.fechaFin)}</span>
                </div>

                <div>
                  <span className={`usuario-badge ${obtenerClaseEstado(periodo.estadoPeriodo)}`}>
                    {obtenerTextoEstado(periodo.estadoPeriodo)}
                  </span>
                </div>

                <div className="admin-periodo-materias">
                  {periodo.totalMaterias || 0}
                </div>

                <div className="admin-periodo-progreso">
                  <div className="admin-periodo-progreso-top">
                    <span>{periodo.progresoAcademico?.completadas || 0} completadas</span>
                    <span>{periodo.progresoAcademico?.progresoPct || 0}%</span>
                  </div>
                  <div className="admin-periodo-progreso-bar">
                    <div
                      className="admin-periodo-progreso-fill"
                      style={{
                        width: `${periodo.progresoAcademico?.progresoPct || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="usuarios-admin-empty">
              No se encontraron períodos con los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PeriodosAdmin;
