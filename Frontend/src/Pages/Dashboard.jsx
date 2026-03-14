import { useEffect, useMemo, useState } from "react";
import {generarPlan,obtenerCalendarioPlan,obtenerPlan,} from "../Services/planService";
import { obtenerPeriodos } from "../Services/periodoServices";
import { obtenerActividades } from "../Services/actividadesService";
import CustomAlert from "../Components/alert";
import ActivityDetailModal from "../Components/detalleAc";
import "../Styles/dashboard.css";

function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [periodoActual, setPeriodoActual] = useState(null);
  const [plan, setPlan] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [actividades, setActividades] = useState([]);

  const [vista, setVista] = useState("mes");
  const [fechaBase, setFechaBase] = useState(new Date());

  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertaMensaje(mensaje);
    setAlertaTipo(tipo);
    setAlertaVisible(true);

    setTimeout(() => {
      setAlertaVisible(false);
    }, 3000);
  };

  const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const formatDateKey = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const limpiarTituloEntrega = (titulo) => {
    if (!titulo) return "";
    return titulo.replace(/^Entrega:\s*/i, "").trim();
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "Sin fecha";
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "Sin fecha";

    return d.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
    });
  };

  const getRange = () => {
    const base = new Date(fechaBase);

    if (vista === "dia") {
      return {
        from: formatDateKey(startOfDay(base)),
        to: formatDateKey(endOfDay(base)),
      };
    }

    if (vista === "semana") {
      const day = base.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const start = new Date(base);
      start.setDate(base.getDate() + diffToMonday);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return {
        from: formatDateKey(startOfDay(start)),
        to: formatDateKey(endOfDay(end)),
      };
    }

    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);

    return {
      from: formatDateKey(startOfDay(start)),
      to: formatDateKey(endOfDay(end)),
    };
  };

  const cargarDashboard = async () => {
    try {
      setCargando(true);

      const [resPeriodos, resActividades] = await Promise.all([
        obtenerPeriodos(),
        obtenerActividades(),
      ]);

      setActividades(resActividades.data);

      const actual =
        resPeriodos.data.find((p) => p.estadoPeriodo === "en_curso") || null;
      setPeriodoActual(actual);

      if (actual) {
        const range = getRange();

        const [resPlan, resCalendario] = await Promise.all([
          obtenerPlan(actual._id),
          obtenerCalendarioPlan(range.from, range.to, actual._id),
        ]);

        setPlan(resPlan.data);
        setEventos(resCalendario.data?.eventos || []);
      } else {
        setPlan(null);
        setEventos([]);
      }
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar el dashboard", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  useEffect(() => {
    const cargarCalendario = async () => {
      if (!periodoActual) return;

      try {
        const range = getRange();
        const res = await obtenerCalendarioPlan(
          range.from,
          range.to,
          periodoActual._id,
        );
        setEventos(res.data?.eventos || []);
      } catch (error) {
        console.error(error);
      }
    };

    cargarCalendario();
  }, [vista, fechaBase, periodoActual]);

  const handleGenerarPlan = async () => {
    if (!periodoActual) {
      mostrarAlerta("No hay un período en curso", "warning");
      return;
    }

    try {
      setGenerando(true);
      await generarPlan(periodoActual._id);

      const range = getRange();

      const [resPlan, resCalendario] = await Promise.all([
        obtenerPlan(periodoActual._id),
        obtenerCalendarioPlan(range.from, range.to, periodoActual._id),
      ]);

      setPlan(resPlan.data);
      setEventos(resCalendario.data?.eventos || []);

      mostrarAlerta("Plan de estudio generado correctamente", "success");
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo generar el plan",
        "error",
      );
    } finally {
      setGenerando(false);
    }
  };

  const actividadesConMateria = useMemo(() => {
    return actividades.map((actividad) => {
      const materia =
        actividad.materiaId && typeof actividad.materiaId === "object"
          ? actividad.materiaId
          : null;

      return {
        ...actividad,
        materiaNombre: materia?.nombre || "Materia",
        materiaColor: materia?.color || "#3B82F6",
      };
    });
  }, [actividades]);

  const actividadesProximas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return [...actividadesConMateria]
      .filter((a) => {
        const fechaEntrega = new Date(a.fechaEntrega);
        fechaEntrega.setHours(0, 0, 0, 0);

        return (
          a.estado !== "completada" &&
          a.estado !== "vencida" &&
          fechaEntrega >= hoy
        );
      })
      .sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega))
      .slice(0, 5);
  }, [actividadesConMateria]);

  const eventosPorFecha = useMemo(() => {
    const map = {};

    eventos.forEach((evento) => {
      if (!map[evento.fecha]) map[evento.fecha] = [];
      map[evento.fecha].push(evento);
    });

    return map;
  }, [eventos]);

  const leyendaMaterias = useMemo(() => {
    const mapa = new Map();

    eventos.forEach((evento) => {
      if (evento.materia?.nombre && evento.materia?.color) {
        mapa.set(evento.materia.nombre, evento.materia.color);
      }
    });

    return Array.from(mapa.entries()).map(([nombre, color]) => ({
      nombre,
      color,
    }));
  }, [eventos]);

  const textoBotonPlan = plan
    ? "Actualizar Plan de Estudio"
    : "Generar Plan de Estudio";

  const moverFecha = (direccion) => {
    const nueva = new Date(fechaBase);

    if (vista === "dia") {
      nueva.setDate(nueva.getDate() + direccion);
    } else if (vista === "semana") {
      nueva.setDate(nueva.getDate() + 7 * direccion);
    } else {
      nueva.setMonth(nueva.getMonth() + direccion);
    }

    setFechaBase(nueva);
  };

  const irHoy = () => {
    setFechaBase(new Date());
  };

  const seleccionarDia = (fecha) => {
    setFechaBase(new Date(fecha));
    setVista("dia");
  };

  const eventosDiaSeleccionado = useMemo(() => {
    const key = formatDateKey(fechaBase);

    return eventos.filter((evento) => {
      if (!evento.fecha) return false;
      return String(evento.fecha).slice(0, 10) === key;
    });
  }, [eventos, fechaBase]);

  const tituloCalendario = useMemo(() => {
    const opcionesMes = { month: "long", year: "numeric" };
    const opcionesDia = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    if (vista === "dia") {
      return new Date(fechaBase).toLocaleDateString("es-HN", opcionesDia);
    }

    if (vista === "semana") {
      const range = getRange();
      const inicio = new Date(range.from + "T00:00:00");
      const fin = new Date(range.to + "T00:00:00");

      return `${inicio.toLocaleDateString("es-HN", { day: "numeric", month: "short" })} - ${fin.toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}`;
    }

    return new Date(fechaBase).toLocaleDateString("es-HN", opcionesMes);
  }, [fechaBase, vista]);

  const diasMes = useMemo(() => {
    const year = fechaBase.getFullYear();
    const month = fechaBase.getMonth();

    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);

    const startWeekDay = primerDiaMes.getDay();
    const ajusteInicio = startWeekDay === 0 ? 6 : startWeekDay - 1;

    const dias = [];

    for (let i = ajusteInicio; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      dias.push({ fecha: d, actualMes: false });
    }

    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
      dias.push({ fecha: new Date(year, month, d), actualMes: true });
    }

    while (dias.length % 7 !== 0) {
      const nextDay = dias.length - (ajusteInicio + ultimoDiaMes.getDate()) + 1;
      dias.push({
        fecha: new Date(year, month + 1, nextDay),
        actualMes: false,
      });
    }

    return dias;
  }, [fechaBase]);

  const diasSemanaVista = useMemo(() => {
    const base = new Date(fechaBase);
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [fechaBase]);

  const diaVista = useMemo(() => {
    return [new Date(fechaBase)];
  }, [fechaBase]);

  const abrirDetalle = (actividad) => {
    setActividadSeleccionada(actividad);
    setMostrarDetalle(true);
  };

  const renderEventosDia = (fechaKey, limite = 3) => {
  const lista = eventosPorFecha[fechaKey] || [];
  const visibles = lista.slice(0, limite);
  const restantes = lista.length - limite;

  return (
    <>
      {visibles.map((evento, idx) => (
        <div
          key={`${fechaKey}-${idx}`}
          className={`evento-calendario ${evento.estado === "completada" ? "evento-completado" : ""}`}
          style={{
            background:
              evento.estado === "completada"
                ? "#f3f4f6"
                : `${evento.materia?.color || "#3B82F6"}20`,
            borderLeft: `4px solid ${evento.materia?.color || "#3B82F6"}`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            abrirDetalle(evento);
          }}
        >
          <span className="evento-nombre">
            {evento.tipo === "deadline"
              ? `Entrega: ${limpiarTituloEntrega(evento.titulo)}`
              : evento.titulo}
          </span>
        </div>
      ))}

      {restantes > 0 && (
        <div className="evento-mas">
          +{restantes} más
        </div>
      )}
    </>
  );
};

  if (cargando) {
    return <div className="dashboard-page">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <ActivityDetailModal
        visible={mostrarDetalle}
        actividad={actividadSeleccionada}
        onClose={() => setMostrarDetalle(false)}
      />

      <div className="dashboard-top">
        <div className="dashboard-main">
          <div className="dashboard-welcome">
            <h1>
              ¡Hola, {usuario?.nombre} {usuario?.apellido}!
            </h1>
            <p>Aqui esta el resumen de tu mes academico</p>
          </div>

          <div className="calendar-card">
            <div className="calendar-header">
              <div className="calendar-header-left">
                <h2>{tituloCalendario}</h2>
              </div>

              <div className="calendar-controls">
                <div className="vista-switch">
                  <button
                    className={vista === "dia" ? "active" : ""}
                    onClick={() => setVista("dia")}
                  >
                    Día
                  </button>
                  <button
                    className={vista === "semana" ? "active" : ""}
                    onClick={() => setVista("semana")}
                  >
                    Semana
                  </button>
                  <button
                    className={vista === "mes" ? "active" : ""}
                    onClick={() => setVista("mes")}
                  >
                    Mes
                  </button>
                </div>

                <div className="nav-fecha">
                  <button onClick={() => moverFecha(-1)}>‹</button>
                  <button onClick={() => moverFecha(1)}>›</button>
                  <button className="btn-hoy" onClick={irHoy}>
                    Hoy
                  </button>
                </div>
              </div>
            </div>

            {leyendaMaterias.length > 0 && (
              <div className="calendar-legend">
                {leyendaMaterias.map((item) => (
                  <div className="legend-item" key={item.nombre}>
                    <span
                      className="legend-dot"
                      style={{ background: item.color }}
                    ></span>
                    <span>{item.nombre}</span>
                  </div>
                ))}
              </div>
            )}

            {vista === "mes" && (
              <div className="calendario-mes">
                <div className="dias-semana-labels">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>

                <div className="mes-grid">
                  {diasMes.map((item, index) => {
                    const key = formatDateKey(item.fecha);
                    const esHoy = key === formatDateKey(new Date());

                    return (
                      <div
                        key={index}
                        className={`dia-mes ${item.actualMes ? "" : "fuera-mes"} ${esHoy ? "hoy" : ""}`}
                        onClick={() => seleccionarDia(item.fecha)}
                      >
                        <div className="dia-numero">{item.fecha.getDate()}</div>
                        <div className="dia-eventos">
                          {renderEventosDia(key, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {vista === "semana" && (
              <div className="calendario-semana">
                {diasSemanaVista.map((dia, index) => {
                  const key = formatDateKey(dia);
                  const eventosDia = eventosPorFecha[key] || [];

                  return (
                    <div
                      className="semana-col"
                      key={index}
                      onClick={() => seleccionarDia(dia)}
                    >
                      <div className="semana-col-header">
                        <strong>
                          {dia.toLocaleDateString("es-HN", {
                            weekday: "short",
                          })}
                        </strong>
                        <span>{dia.getDate()}</span>
                      </div>

                      <div className="semana-eventos">
                        {eventosDia.length > 0 ? (
                          eventosDia.map((evento, idx) => (
                            <div
                              key={idx}
                              className={`evento-semana ${evento.estado === "completada" ? "evento-completado" : ""}`}
                              style={{
                                background:
                                  evento.estado === "completada"
                                    ? "#f3f4f6"
                                    : `${evento.materia?.color || "#3B82F6"}22`,
                                borderLeft: `4px solid ${evento.materia?.color || "#3B82F6"}`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDetalle(evento);
                              }}
                            >
                              <p>
                                {evento.tipo === "deadline"
                                  ? `Entrega: ${limpiarTituloEntrega(evento.titulo)}`
                                  : evento.titulo}
                              </p>
                              <small>
                                {evento.horaInicio && evento.horaFin
                                  ? `${evento.horaInicio} - ${evento.horaFin}`
                                  : `Límite: ${formatearFechaCorta(evento.fechaEntrega)}`}
                              </small>
                            </div>
                          ))
                        ) : (
                          <div className="sin-eventos">Sin eventos</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {vista === "dia" && (
              <div className="calendario-dia">
                <div className="dia-detalle">
                  <h3>
                    {fechaBase.toLocaleDateString("es-HN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>

                  {eventosDiaSeleccionado.length > 0 ? (
                    <div className="dia-detalle-eventos">
                      {eventosDiaSeleccionado.map((evento, idx) => (
                        <div
                          key={idx}
                          className={`evento-detalle ${evento.estado === "completada" ? "evento-completado" : ""}`}
                          style={{
                            background:
                              evento.estado === "completada"
                                ? "#f3f4f6"
                                : `${evento.materia?.color || "#3B82F6"}18`,
                            borderLeft: `5px solid ${evento.materia?.color || "#3B82F6"}`,
                          }}
                          onClick={() => abrirDetalle(evento)}
                        >
                          <div>
                            <strong>
                              {evento.tipo === "deadline"
                                ? `Entrega: ${limpiarTituloEntrega(evento.titulo)}`
                                : evento.titulo}
                            </strong>
                            {evento.materia?.nombre && (
                              <p>{evento.materia.nombre}</p>
                            )}
                          </div>

                          <span>
                            {evento.horaInicio && evento.horaFin
                              ? `${evento.horaInicio} - ${evento.horaFin}`
                              : `Límite: ${formatearFechaCorta(evento.fechaEntrega)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sin-eventos">
                      No hay eventos para este día.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-side">
          <div className="smart-card">
            <h3>Planificación Inteligente</h3>
            <p>
              Genera automáticamente tu plan de estudio usando tus actividades y
              tu disponibilidad.
            </p>

            <button
              className="btn-smart-plan"
              onClick={handleGenerarPlan}
              disabled={generando}
            >
              {generando ? "Generando..." : textoBotonPlan}
            </button>
          </div>

          <div className="proximas-card">
            <div className="proximas-header">
              <h3>Próximas actividades</h3>
            </div>

            <div className="proximas-lista">
              {actividadesProximas.length > 0 ? (
                actividadesProximas.map((actividad) => (
                  <div
                    className="proxima-item"
                    key={actividad._id}
                    onClick={() =>
                      abrirDetalle({
                        ...actividad,
                        tipo: "deadline",
                        materia: {
                          nombre: actividad.materiaNombre,
                          color: actividad.materiaColor,
                        },
                      })
                    }
                  >
                    <div className="proxima-fecha">
                      <span>
                        {new Date(actividad.fechaEntrega)
                          .toLocaleDateString("es-HN", {
                            month: "short",
                          })
                          .toUpperCase()}
                      </span>
                      <strong>
                        {new Date(actividad.fechaEntrega).toLocaleDateString(
                          "es-HN",
                          {
                            day: "2-digit",
                          },
                        )}
                      </strong>
                    </div>

                    <div className="proxima-info">
                      <div className="proxima-top">
                        <h4>{actividad.titulo}</h4>
                        <span
                          className={`proxima-prioridad prioridad-${actividad.prioridad}`}
                        >
                          {actividad.prioridad}
                        </span>
                      </div>

                      <div className="proxima-materia-row">
                        <span
                          className="proxima-materia-dot"
                          style={{ background: actividad.materiaColor }}
                        ></span>
                        <span className="proxima-materia-texto">
                          {actividad.materiaNombre}
                        </span>
                      </div>

                      <p>{actividad.descripcion || "Sin descripción"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sin-eventos">No hay actividades próximas.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
