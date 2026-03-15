import { useEffect, useMemo, useState } from "react";
import { FiUsers, FiCalendar, FiBookOpen, FiCheckSquare } from "react-icons/fi";
import { obtenerUsuarios } from "../Services/authService";
import { obtenerPeriodos, obtenerPeriodosAdmin } from "../Services/periodoServices";
import { obtenerMaterias, obtenerMateriasAdmin } from "../Services/materiaServices";
import { obtenerActividades, obtenerActividadesAdmin } from "../Services/actividadesService";
import CustomAlert from "../Components/alert";
import "../Styles/admin.css";

function AdminDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

  const [usuarios, setUsuarios] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [actividades, setActividades] = useState([]);
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

  const cargarDashboard = async () => {
    try {
      setCargando(true);

      const [resUsuarios, resPeriodos, resMaterias, resActividades] =
        await Promise.all([
          obtenerUsuarios(),
          obtenerPeriodosAdmin(),
          obtenerMateriasAdmin(),
          obtenerActividadesAdmin()
        ]);

      setUsuarios(resUsuarios.data || []);
      setPeriodos(resPeriodos.data || []);
      setMaterias(resMaterias.data || []);
      setActividades(resActividades.data || []);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar el dashboard administrativo", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const resumen = useMemo(() => {
    return {
      totalUsuarios: usuarios.length,
      totalPeriodos: periodos.length,
      totalMaterias: materias.length,
      totalActividades: actividades.length
    };
  }, [usuarios, periodos, materias, actividades]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    const lista = !texto
      ? [...usuarios]
      : usuarios.filter((u) => {
          const nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
          const correo = (u.email || "").toLowerCase();
          return nombreCompleto.includes(texto) || correo.includes(texto);
        });

    return lista.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
  }, [usuarios, busqueda]);

  const usuariosRecientes = useMemo(() => {
    return usuariosFiltrados.slice(0, 4);
  }, [usuariosFiltrados]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (cargando) {
    return <div className="admin-dashboard-page">Cargando dashboard administrativo...</div>;
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
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>
            Bienvenido, {usuario?.nombre} {usuario?.apellido}. Aquí puedes supervisar el sistema.
          </p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUsers />
          </div>
          <div>
            <small>Usuarios</small>
            <h3>{resumen.totalUsuarios}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCalendar />
          </div>
          <div>
            <small>Períodos</small>
            <h3>{resumen.totalPeriodos}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiBookOpen />
          </div>
          <div>
            <small>Materias</small>
            <h3>{resumen.totalMaterias}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiCheckSquare />
          </div>
          <div>
            <small>Actividades</small>
            <h3>{resumen.totalActividades}</h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-panel-top">
          <div>
            <h2>Usuarios recientes</h2>
            <p>Consulta rápida de las cuentas registradas en el sistema.</p>
          </div>

          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Buscar por nombre o correo"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {usuariosRecientes.length > 0 ? (
          <div className="admin-usuarios-lista">
            {usuariosRecientes.map((item) => (
              <div className="admin-usuario-item" key={item._id || item.id}>
                <div className="admin-usuario-avatar">
                  {(item.nombre?.[0] || "U").toUpperCase()}
                </div>

                <div className="admin-usuario-info">
                  <h4>
                    {item.nombre} {item.apellido}
                  </h4>
                  <p>{item.email}</p>
                </div>

                <div className="admin-usuario-badges">
                  <span className={`admin-badge rol-${item.rol}`}>
                    {item.rol}
                  </span>
                </div>

                <div className="admin-usuario-fecha">
                  {formatearFecha(item.fechaRegistro)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            No se encontraron usuarios.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;