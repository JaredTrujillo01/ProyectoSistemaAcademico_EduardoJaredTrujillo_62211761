import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerPeriodos,
  crearPeriodo,
  editarPeriodo,
  eliminarPeriodo
} from "../Services/periodoServices";
import CustomAlert from "../Components/alert";
import ConfirmModal from "../Components/confirmacion";
import "../Styles/periodos.css";

function Periodos() {
  const [periodos, setPeriodos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [periodoEditandoId, setPeriodoEditandoId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [periodoAEliminar, setPeriodoAEliminar] = useState(null);

  const navigate = useNavigate();

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
      const res = await obtenerPeriodos();
      setPeriodos(res.data);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar períodos", "error");
    }
  };

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const periodoActual = useMemo(() => {
    return periodos.find((p) => p.estadoPeriodo === "en_curso") || null;
  }, [periodos]);

  const periodosOrdenados = useMemo(() => {
    const prioridadEstado = {
      en_curso: 1,
      por_empezar: 2,
      finalizado: 3
    };

    return [...periodos].sort((a, b) => {
      const prioridadA = prioridadEstado[a.estadoPeriodo] || 99;
      const prioridadB = prioridadEstado[b.estadoPeriodo] || 99;

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      return new Date(a.fechaInicio) - new Date(b.fechaInicio);
    });
  }, [periodos]);

  const limpiarFormulario = () => {
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setModoEditar(false);
    setPeriodoEditandoId(null);
  };

  const cerrarModal = () => {
    limpiarFormulario();
    setMostrarModal(false);
  };

  const handleGuardarPeriodo = async (e) => {
    e.preventDefault();

    try {
      if (modoEditar) {
        await editarPeriodo(periodoEditandoId, {
          nombre,
          fechaInicio,
          fechaFin
        });
        mostrarAlerta("Período actualizado correctamente", "success");
      } else {
        await crearPeriodo({
          nombre,
          fechaInicio,
          fechaFin
        });
        mostrarAlerta("Período creado correctamente", "success");
      }

      cerrarModal();
      cargarPeriodos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "Error al guardar período",
        "error"
      );
    }
  };

  const abrirEditar = (periodo) => {
    setModoEditar(true);
    setPeriodoEditandoId(periodo._id);
    setNombre(periodo.nombre || "");
    setFechaInicio(periodo.fechaInicio?.slice(0, 10) || "");
    setFechaFin(periodo.fechaFin?.slice(0, 10) || "");
    setMostrarModal(true);
    setMenuAbierto(null);
  };

  const pedirEliminarPeriodo = (periodo) => {
    setPeriodoAEliminar(periodo);
    setMostrarConfirmacion(true);
    setMenuAbierto(null);
  };

  const confirmarEliminarPeriodo = async () => {
    if (!periodoAEliminar) return;

    try {
      await eliminarPeriodo(periodoAEliminar._id);
      mostrarAlerta("Período eliminado correctamente", "success");
      setMostrarConfirmacion(false);
      setPeriodoAEliminar(null);
      cargarPeriodos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo eliminar el período",
        "error"
      );
    }
  };

  const formatearFecha = (fecha) => {
    const nuevaFecha = new Date(fecha);
    return nuevaFecha.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "en_curso") return "badge-en_curso";
    if (estado === "finalizado") return "badge-finalizado";
    return "badge-por_empezar";
  };

  return (
    <div className="periodos-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <ConfirmModal
        visible={mostrarConfirmacion}
        title="Eliminar período"
        message={`¿Deseas eliminar el ${periodoAEliminar?.nombre}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmarEliminarPeriodo}
        onCancel={() => {
          setMostrarConfirmacion(false);
          setPeriodoAEliminar(null);
        }}
      />

      <div className="periodos-header">
        <div className="periodos-header-left">
          <h1>Gestión de Períodos</h1>
          <p>Organiza y administra tus periodos académicos</p>
        </div>

        <div className="periodos-header-right">
          <button
            className="btn-crear-periodo"
            onClick={() => {
              limpiarFormulario();
              setMostrarModal(true);
            }}
          >
            + Crear nuevo período
          </button>
        </div>
      </div>

      {periodoActual && (
        <div className="periodo-actual-box">
          <small>Período Actual</small>
          <h3>{periodoActual.nombre}</h3>
        </div>
      )}

      <div className="periodos-grid">
        {periodosOrdenados.length > 0 ? (
          periodosOrdenados.map((periodo) => (
            <div className="periodo-card" key={periodo._id}>
              <span className={`periodo-badge ${obtenerClaseEstado(periodo.estadoPeriodo)}`}>
                {periodo.estadoPeriodo === "en_curso"
                  ? "En curso"
                  : periodo.estadoPeriodo === "finalizado"
                  ? "Finalizado"
                  : "Por empezar"}
              </span>

              <div className={`periodo-card-top ${periodo.estadoPeriodo !== "en_curso" ? "dark" : ""}`}>
                <small>
                  {periodo.estadoPeriodo === "en_curso" ? "Periodo actual" : "Periodo"}
                </small>
                <h3>{periodo.nombre}</h3>
              </div>

              <div className="periodo-card-body">
                <div className="periodo-info">
                  <span>{formatearFecha(periodo.fechaInicio)}</span>
                  <span>{formatearFecha(periodo.fechaFin)}</span>
                </div>

                <div className="progreso-label">
                  <span>Progreso Académico</span>
                  <span>{periodo.progresoAcademico?.progresoPct || 0}%</span>
                </div>

                <div className="progreso-barra">
                  <div
                    className="progreso-fill"
                    style={{
                      width: `${periodo.progresoAcademico?.progresoPct || 0}%`
                    }}
                  ></div>
                </div>

                <div className="periodo-card-footer">
                  <span
                    className="periodo-link"
                    onClick={() => navigate(`/materias?periodo=${periodo._id}`)}
                  >
                    Ver Materias
                  </span>

                  <div className="periodo-actions">
                    <button
                      className="periodo-menu-btn"
                      onClick={() =>
                        setMenuAbierto(menuAbierto === periodo._id ? null : periodo._id)
                      }
                    >
                      ⋯
                    </button>

                    {menuAbierto === periodo._id && (
                      <div className="periodo-menu">
                        <button onClick={() => abrirEditar(periodo)}>
                          Editar
                        </button>
                        <button onClick={() => pedirEliminarPeriodo(periodo)}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="periodo-empty">
            No se encontraron períodos.
          </div>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>{modoEditar ? "Editar período" : "Crear nuevo período"}</h2>

            <form className="modal-form" onSubmit={handleGuardarPeriodo}>
              <div>
                <label>Nombre del período</label>
                <input
                  type="text"
                  placeholder="Ej: Primer Semestre 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Fecha de inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Fecha de finalización</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar">
                  {modoEditar ? "Guardar cambios" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Periodos;