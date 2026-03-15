import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";
import {
  obtenerMaterias,
  crearMateria,
  editarMateria,
  eliminarMateria
} from "../Services/materiaServices";
import { obtenerPeriodos } from "../Services/periodoServices";
import CustomAlert from "../Components/alert";
import ConfirmModal from "../Components/confirmacion";
import "../Styles/materias.css";

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [materiaEditandoId, setMateriaEditandoId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodoSeleccionado = searchParams.get("periodo");

  const coloresDisponibles = [
    "#3B82F6",
    "#10B981",
    "#A855F7",
    "#F97316",
    "#EC4899",
    "#F59E0B",
    "#DC2626",
    "#06B6D4"
  ];

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertaMensaje(mensaje);
    setAlertaTipo(tipo);
    setAlertaVisible(true);

    setTimeout(() => {
      setAlertaVisible(false);
    }, 3000);
  };

  const obtenerPeriodoIdReal = (periodoRef) => {
    if (!periodoRef) return "";
    if (typeof periodoRef === "object" && periodoRef._id) {
      return periodoRef._id;
    }
    return periodoRef;
  };

  const cargarDatos = async () => {
    try {
      const [resMaterias, resPeriodos] = await Promise.all([
        obtenerMaterias(),
        obtenerPeriodos()
      ]);

      let materiasData = resMaterias.data || [];
      const periodosData = resPeriodos.data || [];

      if (periodoSeleccionado) {
        materiasData = materiasData.filter(
          (m) =>
            String(obtenerPeriodoIdReal(m.periodoId)) === String(periodoSeleccionado)
        );
      }

      setMaterias(materiasData);
      setPeriodos(periodosData);

      const actual = periodosData.find((p) => p.estadoPeriodo === "en_curso");

      if (!modoEditar) {
        if (periodoSeleccionado) {
          setPeriodoId(periodoSeleccionado);
        } else if (actual) {
          setPeriodoId(actual._id);
        }
      }
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar materias", "error");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [periodoSeleccionado]);

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

  const periodoFiltradoInfo = useMemo(() => {
    if (!periodoSeleccionado) return null;
    return periodos.find((p) => String(p._id) === String(periodoSeleccionado)) || null;
  }, [periodos, periodoSeleccionado]);

  const materiasAgrupadas = useMemo(() => {
    return periodosOrdenados
      .map((periodo) => {
        const materiasDelPeriodo = materias.filter(
          (m) =>
            String(obtenerPeriodoIdReal(m.periodoId)) === String(periodo._id)
        );

        return {
          ...periodo,
          materias: materiasDelPeriodo
        };
      })
      .filter((grupo) => {
        if (periodoSeleccionado) {
          return String(grupo._id) === String(periodoSeleccionado);
        }
        return true;
      });
  }, [periodosOrdenados, materias, periodoSeleccionado]);

  const totalMateriasActivas = useMemo(() => {
    return materias.filter((m) => m.activa !== false).length;
  }, [materias]);

  const obtenerClaseEstado = (estado) => {
    if (estado === "en_curso") return "badge-en_curso";
    if (estado === "finalizado") return "badge-finalizado";
    return "badge-por_empezar";
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setPeriodoId("");
    setColor("#3B82F6");
    setModoEditar(false);
    setMateriaEditandoId(null);

    const actual = periodos.find((p) => p.estadoPeriodo === "en_curso");

    if (periodoSeleccionado) {
      setPeriodoId(periodoSeleccionado);
    } else if (actual) {
      setPeriodoId(actual._id);
    }
  };

  const cerrarModal = () => {
    limpiarFormulario();
    setMostrarModal(false);
  };

  const handleGuardarMateria = async (e) => {
    e.preventDefault();

    try {
      if (modoEditar) {
        await editarMateria({
          id: materiaEditandoId,
          nombre,
          descripcion,
          color,
          periodoId
        });
        mostrarAlerta("Materia actualizada correctamente", "success");
      } else {
        await crearMateria({
          nombre,
          descripcion,
          color,
          periodoId
        });
        mostrarAlerta("Materia creada correctamente", "success");
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "Error al guardar materia",
        "error"
      );
    }
  };

  const abrirEditar = (materia) => {
    setModoEditar(true);
    setMateriaEditandoId(materia._id);
    setNombre(materia.nombre || "");
    setDescripcion(materia.descripcion || "");
    setPeriodoId(obtenerPeriodoIdReal(materia.periodoId));
    setColor(materia.color || "#3B82F6");
    setMostrarModal(true);
    setMenuAbierto(null);
  };

  const pedirEliminarMateria = (materia) => {
    setMateriaAEliminar(materia);
    setMostrarConfirmacion(true);
    setMenuAbierto(null);
  };

  const confirmarEliminarMateria = async () => {
    if (!materiaAEliminar) return;

    try {
      await eliminarMateria(materiaAEliminar._id);
      mostrarAlerta("Materia eliminada correctamente", "success");
      setMostrarConfirmacion(false);
      setMateriaAEliminar(null);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo eliminar la materia",
        "error"
      );
    }
  };

  return (
    <div className="materias-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <ConfirmModal
        visible={mostrarConfirmacion}
        title="Eliminar materia"
        message={`¿Deseas eliminar la materia "${materiaAEliminar?.nombre || ""}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmarEliminarMateria}
        onCancel={() => {
          setMostrarConfirmacion(false);
          setMateriaAEliminar(null);
        }}
      />

      <div className="materias-header">
        <div className="materias-header-left">
          <h1>Gestión de Materias</h1>
          <p>
            {periodoFiltradoInfo
              ? `Mostrando materias del período: ${periodoFiltradoInfo.nombre}`
              : "Organiza y administra tus materias"}
          </p>
        </div>

        <button
          className="btn-crear-materia"
          onClick={() => {
            limpiarFormulario();
            setMostrarModal(true);
          }}
        >
          + Nueva Materia
        </button>
      </div>

      <div className="materias-resumen">
        <div className="materias-resumen-icon">
          <FiBookOpen />
        </div>
        <div>
          <h3>Materias Activas</h3>
          <p>{totalMateriasActivas}</p>
        </div>
      </div>

      {materiasAgrupadas.map((grupo) => (
        <div
          className="periodo-section"
          key={grupo._id}
          id={`periodo-${grupo._id}`}
        >
          <div className="periodo-section-header">
            <h2 className="periodo-section-title">{grupo.nombre}</h2>
            <span
              className={`periodo-section-badge ${obtenerClaseEstado(grupo.estadoPeriodo)}`}
            >
              {grupo.estadoPeriodo === "en_curso"
                ? "En curso"
                : grupo.estadoPeriodo === "finalizado"
                ? "Finalizado"
                : "Por empezar"}
            </span>
          </div>

          {grupo.materias.length > 0 ? (
            <div className="materias-grid">
              {grupo.materias.map((materia) => (
                <div className="materia-card" key={materia._id}>
                  <div
                    className="materia-color-bar"
                    style={{ background: materia.color || "#3B82F6" }}
                  ></div>

                  <div className="materia-card-content">
                    <div className="materia-card-top">
                      <span className="materia-code">
                        {materia.nombre.slice(0, 3).toUpperCase()}-{materia.nombre.length}
                      </span>

                      <div className="materia-actions">
                        <button
                          className="materia-menu-btn"
                          onClick={() =>
                            setMenuAbierto(menuAbierto === materia._id ? null : materia._id)
                          }
                        >
                          ⋯
                        </button>

                        {menuAbierto === materia._id && (
                          <div className="materia-menu">
                            <button onClick={() => abrirEditar(materia)}>
                              Editar
                            </button>
                            <button onClick={() => pedirEliminarMateria(materia)}>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="materia-title">{materia.nombre}</h3>
                    <p className="materia-desc">{materia.descripcion}</p>

                    <div className="materia-content-spacer"></div>

                    <div className="materia-progress-row">
                      <span>Progreso</span>
                      <span>{materia.progreso?.progresoPct || 0}%</span>
                    </div>

                    <div className="materia-progress-bar">
                      <div
                        className="materia-progress-fill"
                        style={{
                          width: `${materia.progreso?.progresoPct || 0}%`,
                          background: materia.color || "#3B82F6"
                        }}
                      ></div>
                    </div>

                    <div className="materia-footer">
                      <span>
                        {materia.progreso?.totalActividades || 0} actividades
                      </span>
                      <span
                        className="materia-link"
                        onClick={() => navigate(`/actividades?materia=${materia._id}`)}
                      >
                        Ver actividades →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="materias-empty">
              No hay materias registradas en este período.
            </div>
          )}
        </div>
      ))}
            {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>{modoEditar ? "Editar materia" : "Nueva materia"}</h2>

            <form className="modal-form" onSubmit={handleGuardarMateria}>
              <div>
                <label>Nombre de la materia</label>
                <input
                  type="text"
                  placeholder="Ej: Cálculo Diferencial"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Descripción</label>
                <textarea
                  placeholder="Describe la materia"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Período</label>
                <select
                  value={periodoId}
                  onChange={(e) => setPeriodoId(e.target.value)}
                  required
                >
                  <option value="">Selecciona un período</option>
                  {periodosOrdenados.map((periodo) => (
                    <option key={periodo._id} value={periodo._id}>
                      {periodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Color</label>
                <div className="color-options">
                  {coloresDisponibles.map((item) => (
                    <div
                      key={item}
                      className={`color-circle ${color === item ? "active" : ""}`}
                      style={{ background: item }}
                      onClick={() => setColor(item)}
                    ></div>
                  ))}
                </div>
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

export default Materias;