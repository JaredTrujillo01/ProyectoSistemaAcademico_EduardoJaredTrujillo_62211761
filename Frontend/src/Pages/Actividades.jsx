import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  obtenerActividades,
  crearActividad,
  editarEstadoActividad,
  editarActividad,
  eliminarActividad
} from "../Services/actividadesService";
import { obtenerMaterias } from "../Services/materiaServices";
import { obtenerPeriodos } from "../Services/periodoServices";
import CustomAlert from "../Components/alert";
import ConfirmModal from "../Components/confirmacion";
import "../Styles/actividades.css";

function Actividades() {
  const [actividades, setActividades] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [actividadEditandoId, setActividadEditandoId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const [materiaFiltro, setMateriaFiltro] = useState("");
  const [prioridadFiltro, setPrioridadFiltro] = useState("todas");
  const [fechaFiltro, setFechaFiltro] = useState("todas");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [tipoActividad, setTipoActividad] = useState("tarea");
  const [prioridad, setPrioridad] = useState("media");
  const [tiempoEstimadoHoras, setTiempoEstimadoHoras] = useState("");
  const [materiaId, setMateriaId] = useState("");

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actividadAEliminar, setActividadAEliminar] = useState(null);

  const [searchParams] = useSearchParams();
  const materiaDesdeURL = searchParams.get("materia");

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertaMensaje(mensaje);
    setAlertaTipo(tipo);
    setAlertaVisible(true);

    setTimeout(() => {
      setAlertaVisible(false);
    }, 3000);
  };

  const cargarDatos = async () => {
    try {
      const [resActividades, resMaterias, resPeriodos] = await Promise.all([
        obtenerActividades(),
        obtenerMaterias(),
        obtenerPeriodos()
      ]);

      setActividades(resActividades.data);
      setMaterias(resMaterias.data);
      setPeriodos(resPeriodos.data);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar actividades", "error");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (materiaDesdeURL) {
      setMateriaFiltro(materiaDesdeURL);
    }
  }, [materiaDesdeURL]);

  const periodoActual = useMemo(() => {
    return periodos.find((p) => p.estadoPeriodo === "en_curso") || null;
  }, [periodos]);

  const materiasPeriodoActual = useMemo(() => {
    if (!periodoActual) return [];
    return materias.filter((m) => String(m.periodoId) === String(periodoActual._id));
  }, [materias, periodoActual]);

  const pendientesSemana = useMemo(() => {
    return actividades.filter(
      (a) => a.estado === "pendiente" || a.estado === "en_progreso"
    ).length;
  }, [actividades]);

  const obtenerMateria = (materiaRef) => {
    if (!materiaRef) return null;

    if (typeof materiaRef === "object" && materiaRef._id) {
      return materiaRef;
    }

    return materias.find((m) => String(m._id) === String(materiaRef)) || null;
  };

  const obtenerMateriaIdReal = (materiaRef) => {
    if (!materiaRef) return "";
    if (typeof materiaRef === "object" && materiaRef._id) {
      return materiaRef._id;
    }
    return materiaRef;
  };

  const obtenerPeriodoDeActividad = (actividad) => {
    const materia = obtenerMateria(actividad.materiaId);
    if (!materia) return null;
    return periodos.find((p) => String(p._id) === String(materia.periodoId));
  };

  const actividadesFiltradas = useMemo(() => {
    let lista = [...actividades];

    if (materiaFiltro) {
      lista = lista.filter((a) => {
        const materiaIdReal = obtenerMateriaIdReal(a.materiaId);
        return String(materiaIdReal) === String(materiaFiltro);
      });
    }

    if (prioridadFiltro !== "todas") {
      lista = lista.filter((a) => a.prioridad === prioridadFiltro);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const finSemana = new Date(hoy);
    finSemana.setDate(hoy.getDate() + 7);

    const finMes = new Date(hoy);
    finMes.setMonth(hoy.getMonth() + 1);

    if (fechaFiltro === "hoy") {
      lista = lista.filter((a) => {
        const fecha = new Date(a.fechaEntrega);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === hoy.getTime();
      });
    }

    if (fechaFiltro === "semana") {
      lista = lista.filter((a) => {
        const fecha = new Date(a.fechaEntrega);
        return fecha >= hoy && fecha <= finSemana;
      });
    }

    if (fechaFiltro === "mes") {
      lista = lista.filter((a) => {
        const fecha = new Date(a.fechaEntrega);
        return fecha >= hoy && fecha <= finMes;
      });
    }

    if (fechaFiltro === "vencidas") {
      lista = lista.filter((a) => a.estado === "vencida");
    }

    const prioridadEstadoActividad = {
      en_progreso: 1,
      pendiente: 2,
      completada: 3,
      vencida: 4
    };

    const prioridadEstadoPeriodo = {
      en_curso: 1,
      por_empezar: 2,
      finalizado: 3
    };

    lista.sort((a, b) => {
      const periodoA = obtenerPeriodoDeActividad(a);
      const periodoB = obtenerPeriodoDeActividad(b);

      const estadoPeriodoA = prioridadEstadoPeriodo[periodoA?.estadoPeriodo] || 99;
      const estadoPeriodoB = prioridadEstadoPeriodo[periodoB?.estadoPeriodo] || 99;

      if (estadoPeriodoA !== estadoPeriodoB) {
        return estadoPeriodoA - estadoPeriodoB;
      }

      const estadoA = prioridadEstadoActividad[a.estado] || 99;
      const estadoB = prioridadEstadoActividad[b.estado] || 99;

      if (estadoA !== estadoB) {
        return estadoA - estadoB;
      }

      return new Date(a.fechaEntrega) - new Date(b.fechaEntrega);
    });

    return lista;
  }, [actividades, materiaFiltro, prioridadFiltro, fechaFiltro, materias, periodos]);

  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
    setFechaEntrega("");
    setTipoActividad("tarea");
    setPrioridad("media");
    setTiempoEstimadoHoras("");
    setMateriaId("");
    setModoEditar(false);
    setActividadEditandoId(null);
  };

  const handleCrearActividad = async (e) => {
    e.preventDefault();

    try {
      if (modoEditar) {
        await editarActividad({
          id: actividadEditandoId,
          titulo,
          descripcion,
          fechaEntrega,
          tipoActividad,
          prioridad,
          tiempoEstimadoHoras,
          materiaId
        });
        mostrarAlerta("Actividad actualizada correctamente", "success");
      } else {
        await crearActividad({
          titulo,
          descripcion,
          fechaEntrega,
          tipoActividad,
          prioridad,
          tiempoEstimadoHoras,
          materiaId
        });
        mostrarAlerta("Actividad creada correctamente", "success");
      }

      limpiarFormulario();
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo guardar la actividad",
        "error"
      );
    }
  };

  const cambiarEstado = async (actividad, nuevoEstado) => {
    if (actividad.estado === "completada" && nuevoEstado !== "completada") {
      mostrarAlerta("Una actividad completada ya no puede volver a estados anteriores", "warning");
      return;
    }

    if (actividad.estado === "vencida") {
      mostrarAlerta("Una actividad vencida no puede cambiar de estado", "warning");
      return;
    }

    try {
      await editarEstadoActividad(actividad._id, nuevoEstado);
      mostrarAlerta("Estado actualizado correctamente", "success");
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo cambiar el estado",
        "error"
      );
    }
  };

  const abrirEditar = (actividad) => {
    if (actividad.estado === "completada" || actividad.estado === "vencida") {
      mostrarAlerta("No se puede editar una actividad completada o vencida", "warning");
      return;
    }

    setModoEditar(true);
    setActividadEditandoId(actividad._id);
    setTitulo(actividad.titulo);
    setDescripcion(actividad.descripcion || "");
    setFechaEntrega(actividad.fechaEntrega?.slice(0, 10));
    setTipoActividad(actividad.tipoActividad || "tarea");
    setPrioridad(actividad.prioridad);
    setTiempoEstimadoHoras(actividad.tiempoEstimadoHoras);
    setMateriaId(obtenerMateriaIdReal(actividad.materiaId));
    setMostrarModal(true);
    setMenuAbierto(null);
  };

  const pedirEliminarActividad = (actividad) => {
    if (actividad.estado === "completada" || actividad.estado === "vencida") {
      mostrarAlerta("No se puede eliminar una actividad completada o vencida", "warning");
      return;
    }

    setActividadAEliminar(actividad);
    setMostrarConfirmacion(true);
    setMenuAbierto(null);
  };

  const confirmarEliminarActividad = async () => {
    if (!actividadAEliminar) return;

    try {
      await eliminarActividad(actividadAEliminar._id);
      mostrarAlerta("Actividad eliminada correctamente", "success");
      setMostrarConfirmacion(false);
      setActividadAEliminar(null);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo eliminar la actividad",
        "error"
      );
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short"
    });
  };

  return (
    <div className="actividades-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <ConfirmModal
        visible={mostrarConfirmacion}
        title="Eliminar actividad"
        message={`¿Deseas eliminar la actividad "${actividadAEliminar?.titulo || ""}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmarEliminarActividad}
        onCancel={() => {
          setMostrarConfirmacion(false);
          setActividadAEliminar(null);
        }}
      />

      <div className="actividades-header">
        <div className="actividades-header-left">
          <h1>Gestión de Actividades</h1>
          <p>
            Tienes <span>{pendientesSemana} actividades pendientes</span> por realizar.
          </p>
        </div>

        <button
          className="btn-crear-actividad"
          onClick={() => {
            limpiarFormulario();
            setMostrarModal(true);
          }}
        >
          + Nueva Actividad
        </button>
      </div>

      <div className="actividades-filtros">
        <div className="filtros-left">
          <span className="filtro-label">Materia:</span>

          <button
            className={`filtro-chip ${materiaFiltro === "" ? "active" : ""}`}
            onClick={() => setMateriaFiltro("")}
          >
            Todas
          </button>

          {materiasPeriodoActual.map((materia) => (
            <button
              key={materia._id}
              className={`filtro-chip ${materiaFiltro === materia._id ? "active" : ""}`}
              onClick={() => setMateriaFiltro(materia._id)}
            >
              <span
                className="chip-dot"
                style={{ background: materia.color || "#3B82F6" }}
              ></span>
              {materia.nombre}
            </button>
          ))}
        </div>

        <div className="filtros-right">
          <span className="filtro-label">Prioridad:</span>
          <select
            className="filtro-select"
            value={prioridadFiltro}
            onChange={(e) => setPrioridadFiltro(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <span className="filtro-label">Fecha límite:</span>
          <select
            className="filtro-select"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="vencidas">Vencidas</option>
          </select>
        </div>
      </div>

      <div className="actividades-tabla">
        <div className="tabla-header">
          <div>Actividad</div>
          <div>Materia</div>
          <div>Fecha límite</div>
          <div>Prioridad</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        {actividadesFiltradas.length > 0 ? (
          actividadesFiltradas.map((actividad) => {
            const materia = obtenerMateria(actividad.materiaId);
            const bloqueada = actividad.estado === "completada" || actividad.estado === "vencida";

            return (
              <div className="tabla-row" key={actividad._id}>
                <div className="actividad-col">
                  <h4>{actividad.titulo}</h4>
                  <p>{actividad.descripcion}</p>
                </div>

                <div>
                  <span
                    className="materia-badge"
                    style={{
                      color: materia?.color || "#374151",
                      border: `1px solid ${materia?.color || "#d1d5db"}33`
                    }}
                  >
                    {materia?.nombre || "Materia"}
                  </span>
                </div>

                <div className="fecha-texto">{formatearFecha(actividad.fechaEntrega)}</div>

                <div>
                  <span className={`prioridad-badge prioridad-${actividad.prioridad}`}>
                    {actividad.prioridad}
                  </span>
                </div>

                <div>
                  {actividad.estado === "vencida" ? (
                    <span className="estado-vencida">Vencida</span>
                  ) : (
                    <div className="estado-botones">
                      <button
                        className={actividad.estado === "pendiente" ? "activo" : ""}
                        disabled={actividad.estado === "completada"}
                        onClick={() => cambiarEstado(actividad, "pendiente")}
                      >
                        To Do
                      </button>
                      <button
                        className={actividad.estado === "en_progreso" ? "activo" : ""}
                        disabled={actividad.estado === "completada"}
                        onClick={() => cambiarEstado(actividad, "en_progreso")}
                      >
                        Doing
                      </button>
                      <button
                        className={actividad.estado === "completada" ? "activo" : ""}
                        onClick={() => cambiarEstado(actividad, "completada")}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                <div className="acciones-col">
                  <button
                    className="menu-acciones-btn"
                    onClick={() =>
                      setMenuAbierto(menuAbierto === actividad._id ? null : actividad._id)
                    }
                  >
                    ⋯
                  </button>

                  {menuAbierto === actividad._id && (
                    <div className="menu-acciones">
                      <button disabled={bloqueada} onClick={() => abrirEditar(actividad)}>
                        Editar
                      </button>
                      <button disabled={bloqueada} onClick={() => pedirEliminarActividad(actividad)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="actividades-empty">
            No hay actividades registradas.
          </div>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box actividad-modal-box">
            <h2>{modoEditar ? "Editar actividad" : "Nueva actividad"}</h2>

            <form className="modal-form actividad-modal-form" onSubmit={handleCrearActividad}>
              <div>
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ej: Entrega Final Proyecto"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Descripción</label>
                <textarea
                  placeholder="Describe la actividad"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div>
                <label>Materia</label>
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {materiasPeriodoActual.map((materia) => (
                    <option key={materia._id} value={materia._id}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-grid actividad-modal-grid">
                <div>
                  <label>Fecha límite</label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Tipo de actividad</label>
                  <select
                    value={tipoActividad}
                    onChange={(e) => setTipoActividad(e.target.value)}
                  >
                    <option value="tarea">Tarea</option>
                    <option value="proyecto">Proyecto</option>
                    <option value="quiz">Quiz</option>
                    <option value="examen">Examen</option>
                  </select>
                </div>
              </div>

              <div className="modal-grid actividad-modal-grid">
                <div>
                  <label>Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label>Tiempo estimado (horas)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 3"
                    value={tiempoEstimadoHoras}
                    onChange={(e) => setTiempoEstimadoHoras(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions actividad-modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarModal(false);
                  }}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Actividades;
