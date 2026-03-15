import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiCheckCircle, FiBarChart2, FiLayers } from "react-icons/fi";
import { obtenerMateriasAdmin } from "../Services/materiaServices";
import CustomAlert from "../Components/alert";
import "../Styles/admin.css";

function MateriasAdmin() {
  const [materias, setMaterias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
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

  const cargarMaterias = async () => {
    try {
      setCargando(true);
      const res = await obtenerMateriasAdmin();
      setMaterias(res.data || []);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar materias", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMaterias();
  }, []);

  const resumen = useMemo(() => {
    const total = materias.length;
    const conActividades = materias.filter((m) => (m.progreso?.totalActividades || 0) > 0).length;
    const completadas = materias.filter((m) => (m.progreso?.progresoPct || 0) === 100).length;
    const activas = materias.filter((m) => m.activa !== false).length;

    return { total, conActividades, completadas, activas };
  }, [materias]);

  const materiasFiltradas = useMemo(() => {
    let lista = [...materias];

    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();

      lista = lista.filter((m) => {
        const nombreMateria = (m.nombre || "").toLowerCase();
        const periodo = (m.periodo?.nombre || "").toLowerCase();
        const usuarioNombre = `${m.usuario?.nombre || ""} ${m.usuario?.apellido || ""}`.toLowerCase();
        const correo = (m.usuario?.email || "").toLowerCase();

        return (
          nombreMateria.includes(texto) ||
          periodo.includes(texto) ||
          usuarioNombre.includes(texto) ||
          correo.includes(texto)
        );
      });
    }

    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [materias, busqueda]);

  if (cargando) {
    return <div className="admin-dashboard-page">Cargando materias...</div>;
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
        <h1>Materias</h1>
        <p>Consulta las materias registradas por los estudiantes y su progreso general.</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiBookOpen />
          </div>
          <div>
            <small>Total materias</small>
            <h3>{resumen.total}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiLayers />
          </div>
          <div>
            <small>Activas</small>
            <h3>{resumen.activas}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiBarChart2 />
          </div>
          <div>
            <small>Con actividades</small>
            <h3>{resumen.conActividades}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCheckCircle />
          </div>
          <div>
            <small>Completadas al 100%</small>
            <h3>{resumen.completadas}</h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-filtros-bar">
          <input
            type="text"
            placeholder="Buscar por materia, período, estudiante o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="admin-periodos-table">
          <div className="admin-periodos-header admin-materias-header">
            <div>Materia</div>
            <div>Estudiante</div>
            <div>Período</div>
            <div>Color</div>
            <div>Actividades</div>
            <div>Progreso</div>
          </div>

          {materiasFiltradas.length > 0 ? (
            materiasFiltradas.map((materia) => (
              <div className="admin-periodos-row admin-materias-row" key={materia._id}>
                <div className="admin-periodo-main">
                  <h4>{materia.nombre}</h4>
                  <p>{materia.descripcion || "Sin descripción"}</p>
                </div>

                <div className="admin-periodo-usuario">
                  <strong>
                    {materia.usuario
                      ? `${materia.usuario.nombre} ${materia.usuario.apellido}`
                      : "Sin usuario"}
                  </strong>
                  <span>{materia.usuario?.email || "Sin correo"}</span>
                </div>

                <div className="admin-periodo-usuario">
                  <strong>{materia.periodo?.nombre || "Sin período"}</strong>
                </div>

                <div>
                  <span
                    className="admin-color-dot"
                    style={{ background: materia.color || "#3B82F6" }}
                  ></span>
                </div>

                <div className="admin-periodo-materias">
                  {materia.progreso?.totalActividades || 0}
                </div>

                <div className="admin-periodo-progreso">
                  <div className="admin-periodo-progreso-top">
                    <span>{materia.progreso?.completadas || 0} completadas</span>
                    <span>{materia.progreso?.progresoPct || 0}%</span>
                  </div>
                  <div className="admin-periodo-progreso-bar">
                    <div
                      className="admin-periodo-progreso-fill"
                      style={{
                        width: `${materia.progreso?.progresoPct || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="usuarios-admin-empty">
              No se encontraron materias con la búsqueda aplicada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MateriasAdmin;