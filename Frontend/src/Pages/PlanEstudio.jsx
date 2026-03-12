import { useEffect, useMemo, useState } from "react";
import { generarPlan, obtenerPlan } from "../Services/planService";
import { obtenerPeriodos } from "../Services/periodoServices";
import { obtenerMaterias } from "../Services/materiaServices";
import CustomAlert from "../Components/alert";
import "../Styles/planEstudio.css";

function PlanEstudio() {
  const [plan, setPlan] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [materiaFiltro, setMateriaFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

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

  const formatearHoras = (horasDecimal) => {
    const horas = Number(horasDecimal || 0);

    if (horas <= 0) return "0 min";

    const totalMinutos = Math.round(horas * 60);
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;

    return `${h} h ${m} min`;
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [resPeriodos, resMaterias] = await Promise.all([
        obtenerPeriodos(),
        obtenerMaterias()
      ]);

      setPeriodos(resPeriodos.data);
      setMaterias(resMaterias.data);

      const actual = resPeriodos.data.find((p) => p.estadoPeriodo === "en_curso") || null;
      setPeriodoActual(actual);

      if (actual) {
        const resPlan = await obtenerPlan(actual._id);
        setPlan(resPlan.data);
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar el plan de estudio", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGenerarPlan = async () => {
    if (!periodoActual) {
      mostrarAlerta("No hay un período en curso para generar el plan", "warning");
      return;
    }

    try {
      setGenerando(true);
      await generarPlan(periodoActual._id);
      const resPlan = await obtenerPlan(periodoActual._id);
      setPlan(resPlan.data);
      mostrarAlerta("Plan de estudio generado correctamente", "success");
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo generar el plan",
        "error"
      );
    } finally {
      setGenerando(false);
    }
  };

  const materiasPeriodoActual = useMemo(() => {
    if (!periodoActual) return [];
    return materias.filter(
      (m) => String(m.periodoId) === String(periodoActual._id)
    );
  }, [materias, periodoActual]);

  const diasFiltrados = useMemo(() => {
    if (!plan?.dias) return [];

    const diasBase = !materiaFiltro
      ? plan.dias
      : plan.dias
          .map((dia) => ({
            ...dia,
            bloques: dia.bloques.filter(
              (bloque) => String(bloque.materia?.id) === String(materiaFiltro)
            )
          }))
          .filter((dia) => dia.bloques.length > 0);

    return diasBase.map((dia) => {
      const totalBloques = dia.bloques.length;
      const completadas = dia.bloques.filter((b) => b.estado === "completada").length;
      const vencidas = dia.bloques.filter((b) => b.estado === "vencida").length;
      const porcentaje = totalBloques === 0 ? 0 : Math.round((completadas / totalBloques) * 100);
      const diaCompletado = totalBloques > 0 && completadas === totalBloques;

      return {
        ...dia,
        resumen: {
          totalBloques,
          completadas,
          vencidas,
          porcentaje,
          diaCompletado
        }
      };
    });
  }, [plan, materiaFiltro]);

  const resumen = useMemo(() => {
    const todosLosBloques = plan?.dias?.flatMap((d) => d.bloques) || [];

    const horasTotales = todosLosBloques.reduce(
      (acc, bloque) => acc + Number(bloque.horasAsignadas || 0),
      0
    );

    const completadas = todosLosBloques.filter(
      (bloque) => bloque.estado === "completada"
    ).length;

    const totalBloques = todosLosBloques.length;

    const promedioDiario =
      plan?.dias?.length > 0 ? (horasTotales / plan.dias.length) : 0;

    const materiasActivas = materiasPeriodoActual.length;

    return {
      horasTotales,
      completadas,
      totalBloques,
      promedioDiario,
      materiasActivas
    };
  }, [plan, materiasPeriodoActual]);

  const formatearFecha = (fecha) => {
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  if (cargando) {
    return <div className="plan-page">Cargando plan de estudio...</div>;
  }

  return (
    <div className="plan-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <div className="plan-header">
        <div>
          <h1>Plan de Estudio</h1>
          <p>
            {periodoActual
              ? `Período actual: ${periodoActual.nombre}`
              : "No hay un período en curso"}
          </p>
        </div>

        <button
          className="btn-generar-plan"
          onClick={handleGenerarPlan}
          disabled={generando}
        >
          {generando ? "Generando..." : "Generar Plan"}
        </button>
      </div>

      <div className="plan-stats">
        <div className="stat-card">
          <small>Horas Totales</small>
          <h3>{formatearHoras(resumen.horasTotales)}</h3>
        </div>

        <div className="stat-card">
          <small>Completadas</small>
          <h3>{resumen.completadas}/{resumen.totalBloques}</h3>
        </div>

        <div className="stat-card">
          <small>Promedio Diario</small>
          <h3>{formatearHoras(resumen.promedioDiario)}</h3>
        </div>

        <div className="stat-card">
          <small>Materias Activas</small>
          <h3>{resumen.materiasActivas}</h3>
        </div>
      </div>

      <div className="plan-filtros">
        <button
          className={`chip-filtro ${materiaFiltro === "" ? "active" : ""}`}
          onClick={() => setMateriaFiltro("")}
        >
          Todo
        </button>

        {materiasPeriodoActual.map((materia) => (
          <button
            key={materia._id}
            className={`chip-filtro ${materiaFiltro === materia._id ? "active" : ""}`}
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

      {diasFiltrados.length > 0 ? (
        <div className="plan-dias">
          {diasFiltrados.map((dia) => (
            <div
              className={`dia-plan ${dia.resumen.diaCompletado ? "dia-plan-completado" : ""}`}
              key={dia.fecha}
            >
              <div className="dia-header">
                <div className="dia-header-left">
                  <h2>
                    {dia.resumen.diaCompletado ? "✓ " : ""}
                    {formatearFecha(dia.fecha)}
                  </h2>

                  <div className="dia-meta">
                    <span>{dia.resumen.completadas}/{dia.resumen.totalBloques} completadas</span>
                    {dia.resumen.vencidas > 0 && (
                      <span className="meta-vencidas">
                        {dia.resumen.vencidas} vencida{dia.resumen.vencidas > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dia-progreso-box">
                  <span>{dia.resumen.porcentaje}%</span>
                  <div className="dia-progreso-barra">
                    <div
                      className="dia-progreso-fill"
                      style={{ width: `${dia.resumen.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bloques-dia">
                {dia.bloques.map((bloque, index) => (
                  <div
                    className={`bloque-estudio ${
                      bloque.estado === "completada"
                        ? "bloque-completado"
                        : bloque.estado === "vencida"
                        ? "bloque-vencido"
                        : ""
                    }`}
                    key={`${dia.fecha}-${index}`}
                  >
                    <div className="bloque-hora">
                      <strong>{bloque.horaInicio}</strong>
                      <span>{bloque.horaFin}</span>
                    </div>

                    <div className="bloque-info">
                      <div className="bloque-top">
                        <span
                          className="bloque-materia"
                          style={{
                            color: bloque.materia?.color || "#2563eb",
                            borderColor: `${bloque.materia?.color || "#2563eb"}33`
                          }}
                        >
                          {bloque.materia?.nombre || "Materia"}
                        </span>

                        <span className="bloque-horas">
                          Duración {formatearHoras(bloque.horasAsignadas)}
                        </span>

                        {bloque.estado === "vencida" && (
                          <span className="bloque-estado-badge badge-vencida">Vencida</span>
                        )}

                        {bloque.estado === "completada" && (
                          <span className="bloque-estado-badge badge-completada">Completada</span>
                        )}
                      </div>

                      <h3>{bloque.titulo}</h3>
                      <p>{bloque.descripcion}</p>
                    </div>

                    <div className="bloque-estado">
                      <label className="checkbox-plan">
                        <input
                          type="checkbox"
                          checked={bloque.estado === "completada"}
                          readOnly
                        />
                        <span>Completado</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="plan-empty">
          {periodoActual
            ? "Todavía no hay plan generado o no hay bloques para el filtro seleccionado."
            : "No hay un período en curso para mostrar el plan."}
        </div>
      )}
    </div>
  );
}

export default PlanEstudio;