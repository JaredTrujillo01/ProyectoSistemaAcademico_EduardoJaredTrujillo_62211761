import { useEffect, useMemo, useState } from "react";
import { obtenerPeriodos, crearPeriodo } from "../Services/periodoServices";
import "../Styles/periodos.css";

function Periodos() {
  const [periodos, setPeriodos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const cargarPeriodos = async () => {
    try {
      const res = await obtenerPeriodos();
      setPeriodos(res.data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar períodos");
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

  const handleCrearPeriodo = async (e) => {
    e.preventDefault();

    try {
      await crearPeriodo({
        nombre,
        fechaInicio,
        fechaFin
      });

      setNombre("");
      setFechaInicio("");
      setFechaFin("");
      setMostrarModal(false);
      cargarPeriodos();
    } catch (error) {
      console.error(error);
      alert("Error al crear período");
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
      <div className="periodos-header">
        <div className="periodos-header-left">
          <h1>Gestión de Períodos</h1>
          <p>Organiza y administra tus periodos académicos</p>
        </div>

        <div className="periodos-header-right">
          <button
            className="btn-crear-periodo"
            onClick={() => setMostrarModal(true)}
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
                  <span className="periodo-link">Ver Materias</span>
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
            <h2>Crear nuevo período</h2>

            <form className="modal-form" onSubmit={handleCrearPeriodo}>
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

export default Periodos;