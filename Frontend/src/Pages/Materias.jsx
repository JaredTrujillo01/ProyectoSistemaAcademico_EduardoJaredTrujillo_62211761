import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiBookOpen } from "react-icons/fi";
import { obtenerMaterias, crearMateria } from "../Services/materiaServices";
import { obtenerPeriodos } from "../Services/periodoServices";
import "../Styles/materias.css";

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [color, setColor] = useState("#3B82F6");

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
    "#06B6D4",
  ];

  const cargarDatos = async () => {
    try {
      const [resMaterias, resPeriodos] = await Promise.all([
        obtenerMaterias(),
        obtenerPeriodos()
      ]);

      setMaterias(resMaterias.data);
      setPeriodos(resPeriodos.data);

      const actual = resPeriodos.data.find((p) => p.estadoPeriodo === "en_curso");
      if (actual) {
        setPeriodoId(actual._id);
      }
    } catch (error) {
      console.error(error);
      alert("Error al cargar materias");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const materiasAgrupadas = useMemo(() => {
    return periodosOrdenados.map((periodo) => {
      const materiasDelPeriodo = materias.filter(
        (m) => String(m.periodoId) === String(periodo._id)
      );

      return {
        ...periodo,
        materias: materiasDelPeriodo
      };
    });
  }, [periodosOrdenados, materias]);

  const totalMateriasActivas = useMemo(() => {
    return materias.filter((m) => m.activa !== false).length;
  }, [materias]);

  const obtenerClaseEstado = (estado) => {
    if (estado === "en_curso") return "badge-en_curso";
    if (estado === "finalizado") return "badge-finalizado";
    return "badge-por_empezar";
  };

  const handleCrearMateria = async (e) => {
    e.preventDefault();

    try {
      await crearMateria({
        nombre,
        descripcion,
        color,
        periodoId
      });

      setNombre("");
      setDescripcion("");
      setColor("#3B82F6");
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert("Error al crear materia");
    }
  };

  useEffect(() => {
    if (periodoSeleccionado) {
      const elemento = document.getElementById(`periodo-${periodoSeleccionado}`);

      if (elemento) {
        elemento.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }
  }, [materiasAgrupadas, periodoSeleccionado]);

  return (
    <div className="materias-page">
      <div className="materias-header">
        <div className="materias-header-left">
          <h1>Gestión de Materias</h1>
          <p>Organiza y administra tus materias</p>
        </div>

        <button
          className="btn-crear-materia"
          onClick={() => setMostrarModal(true)}
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
            <span className={`periodo-section-badge ${obtenerClaseEstado(grupo.estadoPeriodo)}`}>
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
                    <span className="materia-code">
                      {materia.nombre.slice(0, 3).toUpperCase()}-{materia.nombre.length}
                    </span>

                    <h3 className="materia-title">{materia.nombre}</h3>
                    <p className="materia-desc">{materia.descripcion}</p>

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
                      <span className="materia-link">Ver detalles →</span>
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
            <h2>Nueva materia</h2>

            <form className="modal-form" onSubmit={handleCrearMateria}>
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
                  onClick={() => setMostrarModal(false)}
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

export default Materias;