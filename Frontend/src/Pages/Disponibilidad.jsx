import { useEffect, useMemo, useState } from "react";
import { obtenerDisponibilidad, guardarDisponibilidad } from "../Services/disponibilidadService";
import CustomAlert from "../Components/alert";
import "../Styles/disponibilidad.css";

const DIAS = [
  { clave: "Lunes", abreviatura: "LU", subtitulo: "Inicio de semana" },
  { clave: "Martes", abreviatura: "MA", subtitulo: "" },
  { clave: "Miércoles", abreviatura: "MI", subtitulo: "" },
  { clave: "Jueves", abreviatura: "JU", subtitulo: "" },
  { clave: "Viernes", abreviatura: "VI", subtitulo: "" },
  { clave: "Sábado", abreviatura: "SA", subtitulo: "Fin de semana" },
  { clave: "Domingo", abreviatura: "DO", subtitulo: "Fin de semana" }
];

function Disponibilidad() {
  const [semana, setSemana] = useState([]);
  const [resumen, setResumen] = useState({
    totalSemanal: 0,
    objetivoSemanal: 40,
    porcentaje: 0
  });

  const [guardando, setGuardando] = useState(false);

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

  const cargarDisponibilidad = async () => {
    try {
      const res = await obtenerDisponibilidad();

      const semanaBase = DIAS.map((dia) => {
        const encontrado = res.data.semana.find((item) => item.diaSemana === dia.clave);

        return {
          diaSemana: dia.clave,
          abreviatura: dia.abreviatura,
          subtitulo: dia.subtitulo,
          horaInicio: encontrado?.horaInicio || "",
          horaFin: encontrado?.horaFin || "",
          horaDisponible: Number(encontrado?.horaDisponible || 0)
        };
      });

      setSemana(semanaBase);
      setResumen(res.data.resumen);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar disponibilidad", "error");
    }
  };

  useEffect(() => {
    cargarDisponibilidad();
  }, []);

  const calcularHoras = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return 0;

    const [hi, mi] = horaInicio.split(":").map(Number);
    const [hf, mf] = horaFin.split(":").map(Number);

    const inicioMin = hi * 60 + mi;
    const finMin = hf * 60 + mf;

    if (finMin <= inicioMin) return 0;

    return Number(((finMin - inicioMin) / 60).toFixed(2));
  };

  const actualizarDia = (diaSemana, campo, valor) => {
    const nuevaSemana = semana.map((dia) => {
      if (dia.diaSemana !== diaSemana) return dia;

      const actualizado = {
        ...dia,
        [campo]: valor
      };

      actualizado.horaDisponible = calcularHoras(
        campo === "horaInicio" ? valor : actualizado.horaInicio,
        campo === "horaFin" ? valor : actualizado.horaFin
      );

      return actualizado;
    });

    setSemana(nuevaSemana);
  };

  const resumenCalculado = useMemo(() => {
    const totalSemanal = semana.reduce((acc, dia) => acc + Number(dia.horaDisponible || 0), 0);
    const objetivoSemanal = 40;
    const porcentaje = objetivoSemanal === 0 ? 0 : Math.round((totalSemanal / objetivoSemanal) * 100);

    return {
      totalSemanal,
      objetivoSemanal,
      porcentaje
    };
  }, [semana]);

  const guardarCambios = async () => {
    const hayError = semana.some((dia) => {
      if ((dia.horaInicio && !dia.horaFin) || (!dia.horaInicio && dia.horaFin)) {
        return true;
      }

      if (dia.horaInicio && dia.horaFin) {
        return calcularHoras(dia.horaInicio, dia.horaFin) <= 0;
      }

      return false;
    });

    if (hayError) {
      mostrarAlerta(
        "Revisa las horas. Debes completar inicio y fin, y la hora final debe ser mayor.",
        "warning"
      );
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        semana: semana.map((dia) => ({
          diaSemana: dia.diaSemana,
          horaInicio: dia.horaInicio,
          horaFin: dia.horaFin
        }))
      };

      const res = await guardarDisponibilidad(payload);

      const semanaResp = DIAS.map((dia) => {
        const encontrado = res.data.semana.find((item) => item.diaSemana === dia.clave);

        return {
          diaSemana: dia.clave,
          abreviatura: dia.abreviatura,
          subtitulo: dia.subtitulo,
          horaInicio: encontrado?.horaInicio || "",
          horaFin: encontrado?.horaFin || "",
          horaDisponible: Number(encontrado?.horaDisponible || 0)
        };
      });

      setSemana(semanaResp);
      setResumen(res.data.resumen);

      mostrarAlerta("Disponibilidad guardada correctamente", "success");
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "Error al guardar disponibilidad",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const limpiarSemana = () => {
    const limpia = DIAS.map((dia) => ({
      diaSemana: dia.clave,
      abreviatura: dia.abreviatura,
      subtitulo: dia.subtitulo,
      horaInicio: "",
      horaFin: "",
      horaDisponible: 0
    }));

    setSemana(limpia);
  };

  const tipTexto = useMemo(() => {
    const mayor = [...semana].sort((a, b) => b.horaDisponible - a.horaDisponible)[0];

    if (!mayor || !mayor.horaDisponible) {
      return "Configura tus bloques de tiempo para que el sistema pueda organizar mejor tu plan de estudio.";
    }

    return `Tu día con más disponibilidad es ${mayor.diaSemana.toLowerCase()}. Puedes aprovecharlo para actividades largas o de alta prioridad.`;
  }, [semana]);

  return (
    <div className="disponibilidad-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <div className="disponibilidad-header">
        <h1>Gestión de Disponibilidad</h1>
        <p>Define tus horas de estudio por día para que el plan de estudio se genere correctamente.</p>
      </div>

      <div className="disponibilidad-layout">
        <div className="config-card">
          <div className="config-card-header">
            <h2>Configurar Horarios</h2>
          </div>

          <div className="dias-grid">
            {semana.map((dia) => (
              <div className="dia-card" key={dia.diaSemana}>
                <div className="dia-badge">{dia.abreviatura}</div>

                <div className="dia-info">
                  <h3>{dia.diaSemana}</h3>
                  <p>{dia.subtitulo}</p>
                </div>

                <div className="dia-horas">
                  <div className="hora-group">
                    <label>Inicio</label>
                    <input
                      type="time"
                      value={dia.horaInicio}
                      onChange={(e) => actualizarDia(dia.diaSemana, "horaInicio", e.target.value)}
                    />
                  </div>
                  <div className="hora-group">
                    <label>Fin</label>
                    <input
                      type="time"
                      value={dia.horaFin}
                      onChange={(e) => actualizarDia(dia.diaSemana, "horaFin", e.target.value)}
                    />
                  </div>
                </div>

                <div className="dia-total">
                  <span>{formatearHoras(dia.horaDisponible)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="config-actions">
            <button className="btn-cancelar-dispo" onClick={limpiarSemana}>
              Limpiar
            </button>
            <button className="btn-guardar-dispo" onClick={guardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        <div className="resumen-side">
          <div className="resumen-card resumen-principal">
            <small>Total Semanal</small>
            <h3>{formatearHoras(resumenCalculado.totalSemanal)}</h3>

            <div className="resumen-meta">
              <span>Objetivo: {formatearHoras(resumenCalculado.objetivoSemanal)}</span>
              <span>{resumenCalculado.porcentaje}%</span>
            </div>

            <div className="resumen-barra">
              <div
                className="resumen-fill"
                style={{ width: `${Math.min(resumenCalculado.porcentaje, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="resumen-card distribucion-card">
            <h4>Distribución Diaria</h4>
            <div className="mini-bars">
              {semana.map((dia) => (
                <div className="mini-bar-item" key={dia.diaSemana}>
                  <div className="mini-bar-wrap">
                    <div
                      className="mini-bar"
                      style={{
                        height: `${Math.max((dia.horaDisponible / 8) * 120, dia.horaDisponible > 0 ? 12 : 0)}px`
                      }}
                    ></div>
                  </div>
                  <span>{dia.abreviatura}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="resumen-card tip-card">
            <h4>Tip para ti</h4>
            <p>{tipTexto}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Disponibilidad;