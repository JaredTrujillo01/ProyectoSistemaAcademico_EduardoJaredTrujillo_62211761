const Plan = require('../Model/PlanM');
const Actividad = require('../Model/ActividadesM');
const Materia = require('../Model/MateriasM');
const Disponibilidad = require('../Model/DisponibilidadM');

function prioridadValor(p) {
  if (p === 'alta') return 3;
  if (p === 'media') return 2;
  return 1;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(from, to) {
  const ms = startOfDay(to) - startOfDay(from);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function dateKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateOnlyLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function tipoPeso(tipo) {
  const pesos = {
    examen: 4,
    proyecto: 3,
    quiz: 2,
    tarea: 1
  };
  return pesos[tipo] || 1;
}

function calcularUltimoDiaEstudio(act) {
  const fechaEntrega = startOfDay(act.fechaEntrega);
  const tipo = act.tipoActividad || 'tarea';

  // Exámenes y quiz deben terminarse de preparar 1 día antes
  if (tipo === 'examen' || tipo === 'quiz') {
    return addDays(fechaEntrega, -1);
  }

  // Tareas y proyectos también quedan mejor listos 1 día antes
  return addDays(fechaEntrega, -1);
}

function calcularVentanaPreparacion(act, hoy) {
  const horas = Number(act.tiempoEstimadoHoras || 1);
  const prioridad = act.prioridad || 'media';
  const tipo = act.tipoActividad || 'tarea';
  const fechaEntrega = startOfDay(act.fechaEntrega);
  const ultimoDiaEstudio = calcularUltimoDiaEstudio(act);

  let diasBase = 0;

  // Base por carga real
  if (horas <= 2) diasBase = 2;
  else if (horas <= 4) diasBase = 3;
  else if (horas <= 6) diasBase = 4;
  else if (horas <= 8) diasBase = 5;
  else if (horas <= 12) diasBase = 6;
  else diasBase = 7;

  // Ajuste por tipo
  if (tipo === 'quiz') diasBase += 1;
  if (tipo === 'proyecto') diasBase += 1;
  if (tipo === 'examen') diasBase += 1;

  // Ajuste por prioridad
  if (prioridad === 'alta') diasBase += 1;
  if (prioridad === 'baja') diasBase -= 1;

  if (diasBase < 2) diasBase = 2;

  // No empezar absurdamente temprano
  let diasMaximosSegunTipo = 0;
  if (tipo === 'tarea') diasMaximosSegunTipo = 5;
  if (tipo === 'quiz') diasMaximosSegunTipo = 6;
  if (tipo === 'proyecto') diasMaximosSegunTipo = 8;
  if (tipo === 'examen') diasMaximosSegunTipo = 7;

  // No puede ser mayor a los días reales disponibles hasta el último día de estudio
  const diasDisponiblesReales = Math.max(1, diffDays(hoy, ultimoDiaEstudio) + 1);

  return Math.min(diasBase, diasMaximosSegunTipo, diasDisponiblesReales);
}

function construirDiasVentana(inicio, fin) {
  const dias = [];
  let cursor = startOfDay(inicio);

  while (cursor <= fin) {
    dias.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return dias;
}

function marcarVencidas(usuarioId) {
  const hoy = startOfDay(new Date());
  return Actividad.updateMany(
    {
      usuarioId,
      fechaEntrega: { $lt: hoy },
      estado: { $nin: ['completada', 'vencida'] }
    },
    { $set: { estado: 'vencida' } }
  );
}

function generarPlan(req, res) {
  const { periodoId } = req.body;

  if (!periodoId) {
    return res.status(400).json({ message: 'periodoId es requerido' });
  }

  const hoy = startOfDay(new Date());

  marcarVencidas(req.user.id)
    .then(() =>
      Promise.all([
        Materia.find({ usuarioId: req.user.id, periodoId }, { _id: 1 }),
        Disponibilidad.find({ usuarioId: req.user.id })
      ])
    )
    .then(([materias, disp]) => {
      const materiaIds = materias.map((m) => m._id);

      if (!materiaIds.length) {
        return res.status(400).json({
          message: 'No hay materias en este período. Crea materias antes de generar el plan.'
        });
      }

      if (!disp.length) {
        return res.status(400).json({
          message: 'Registra tu disponibilidad semanal antes de generar el plan.'
        });
      }

      const mapDisponibilidad = {};
      disp.forEach((d) => {
        const minutosReales =
          d.horaInicio && d.horaFin
            ? parseTimeToMinutes(d.horaFin) - parseTimeToMinutes(d.horaInicio)
            : 0;

        mapDisponibilidad[d.diaSemana] = {
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          minutosDisponibles: minutosReales,
          minutosPlanificables: Math.floor(minutosReales * 0.8)
        };
      });

      return Actividad.find({
        usuarioId: req.user.id,
        materiaId: { $in: materiaIds },
        estado: { $nin: ['completada', 'vencida'] },
        fechaEntrega: { $gte: hoy }
      }).then((acts) => ({ acts, mapDisponibilidad }));
    })
    .then(({ acts, mapDisponibilidad }) => {
      if (!acts.length) {
        return Plan.findOneAndDelete({ usuarioId: req.user.id, periodoId }).then(() => {
          const plan = new Plan({
            usuarioId: req.user.id,
            periodoId,
            fechaGeneracion: new Date(),
            actividadesPlanificadas: []
          });

          return plan.save().then((saved) => ({ saved, noPlanificadas: [] }));
        });
      }

      // Orden equilibrado:
      // 1. fecha límite
      // 2. tipo
      // 3. prioridad
      acts.sort((a, b) => {
        const fechaA = startOfDay(a.fechaEntrega);
        const fechaB = startOfDay(b.fechaEntrega);

        if (fechaA.getTime() !== fechaB.getTime()) {
          return fechaA - fechaB;
        }

        const tipoA = tipoPeso(a.tipoActividad);
        const tipoB = tipoPeso(b.tipoActividad);
        if (tipoA !== tipoB) {
          return tipoB - tipoA;
        }

        const pa = prioridadValor(a.prioridad);
        const pb = prioridadValor(b.prioridad);

        return pb - pa;
      });

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const usadoPorDia = {};
      const planItems = [];
      const noPlanificadas = [];

      acts.forEach((act) => {
        let minutosRestantes = Math.round(Number(act.tiempoEstimadoHoras || 1) * 60);
        if (minutosRestantes <= 0) minutosRestantes = 60;

        const ultimoDiaEstudio = calcularUltimoDiaEstudio(act);
        const diasPreparacion = calcularVentanaPreparacion(act, hoy);

        let inicioSugerido = addDays(ultimoDiaEstudio, -(diasPreparacion - 1));

        if (inicioSugerido < hoy) {
          inicioSugerido = hoy;
        }

        if (ultimoDiaEstudio < inicioSugerido) {
          inicioSugerido = ultimoDiaEstudio;
        }

        const diasVentana = construirDiasVentana(inicioSugerido, ultimoDiaEstudio);

        if (!diasVentana.length) {
          noPlanificadas.push({
            actividadId: act._id,
            titulo: act.titulo,
            tipoActividad: act.tipoActividad || 'tarea',
            horasFaltantes: Number((minutosRestantes / 60).toFixed(2))
          });
          return;
        }

        // Meta ideal por día
        const minutosObjetivoPorDia = Math.ceil(minutosRestantes / diasVentana.length);

        // Primera pasada: reparto principal equilibrado
        diasVentana.forEach((dia) => {
          if (minutosRestantes <= 0) return;

          const nombreDia = diasSemana[dia.getDay()];
          const disp = mapDisponibilidad[nombreDia];

          if (!disp || disp.minutosPlanificables <= 0) return;

          const key = dateKey(dia);
          const yaUsado = Number(usadoPorDia[key] || 0);
          const libres = Math.max(disp.minutosPlanificables - yaUsado, 0);

          if (libres <= 0) return;

          // No saturar una sola actividad en un solo día
          const maxPorActividadEnDia = Math.max(
            60,
            Math.floor(disp.minutosPlanificables * 0.45)
          );

          // Mínimo 1 hora si se puede, pero intentando repartir parejo
          let asignar = Math.min(
            libres,
            minutosRestantes,
            maxPorActividadEnDia,
            Math.max(60, minutosObjetivoPorDia)
          );

          // Si queda poco, dejar cerrarla sin fragmentar de más
          if (minutosRestantes <= 90) {
            asignar = Math.min(libres, minutosRestantes, maxPorActividadEnDia);
          }

          if (asignar <= 0) return;

          const inicioBase = parseTimeToMinutes(disp.horaInicio);
          const inicioAsignado = inicioBase + yaUsado;
          const finAsignado = inicioAsignado + asignar;

          planItems.push({
            actividadId: act._id,
            fechaAsignada: new Date(dia),
            horaInicio: minutesToHHMM(inicioAsignado),
            horaFin: minutesToHHMM(finAsignado),
            horasAsignadas: Number((asignar / 60).toFixed(2))
          });

          usadoPorDia[key] = yaUsado + asignar;
          minutosRestantes -= asignar;
        });

        // Segunda pasada: ajuste fino dentro de la misma ventana
        if (minutosRestantes > 0) {
          diasVentana.forEach((dia) => {
            if (minutosRestantes <= 0) return;

            const nombreDia = diasSemana[dia.getDay()];
            const disp = mapDisponibilidad[nombreDia];

            if (!disp || disp.minutosPlanificables <= 0) return;

            const key = dateKey(dia);
            const yaUsado = Number(usadoPorDia[key] || 0);
            const libres = Math.max(disp.minutosPlanificables - yaUsado, 0);

            if (libres <= 0) return;

            const maxExtra = Math.max(30, Math.floor(disp.minutosPlanificables * 0.25));
            const asignar = Math.min(libres, minutosRestantes, maxExtra);

            if (asignar <= 0) return;

            const inicioBase = parseTimeToMinutes(disp.horaInicio);
            const inicioAsignado = inicioBase + yaUsado;
            const finAsignado = inicioAsignado + asignar;

            planItems.push({
              actividadId: act._id,
              fechaAsignada: new Date(dia),
              horaInicio: minutesToHHMM(inicioAsignado),
              horaFin: minutesToHHMM(finAsignado),
              horasAsignadas: Number((asignar / 60).toFixed(2))
            });

            usadoPorDia[key] = yaUsado + asignar;
            minutosRestantes -= asignar;
          });
        }

        if (minutosRestantes > 0) {
          noPlanificadas.push({
            actividadId: act._id,
            titulo: act.titulo,
            tipoActividad: act.tipoActividad || 'tarea',
            horasFaltantes: Number((minutosRestantes / 60).toFixed(2))
          });
        }
      });

      return Plan.findOneAndDelete({ usuarioId: req.user.id, periodoId }).then(() => {
        const plan = new Plan({
          usuarioId: req.user.id,
          periodoId,
          fechaGeneracion: new Date(),
          actividadesPlanificadas: planItems
        });

        return plan.save().then((saved) => ({ saved, noPlanificadas }));
      });
    })
    .then(({ saved, noPlanificadas }) => {
      res.status(201).json({
        message: 'Plan generado',
        plan: saved,
        advertencias: noPlanificadas.length ? noPlanificadas : []
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

// Obtener plan
function obtenerPlan(req, res) {
  const { periodoId } = req.params;

  marcarVencidas(req.user.id)
    .then(() => {
      return Plan.find({ usuarioId: req.user.id, periodoId })
        .sort({ fechaGeneracion: -1 })
        .limit(1)
        .populate({
          path: 'actividadesPlanificadas.actividadId',
          populate: { path: 'materiaId', model: 'materia' }
        });
    })
    .then((planes) => {
      const plan = planes[0] || null;
      if (!plan) return res.json(null);

      const grupos = {};
      plan.actividadesPlanificadas.forEach((item) => {
        const k = dateKey(item.fechaAsignada);
        if (!grupos[k]) grupos[k] = [];
        grupos[k].push(item);
      });

      const diasOrdenados = Object.keys(grupos)
        .sort()
        .map((k) => {
          const bloques = grupos[k].map((it) => {
            const act = it.actividadId;

            return {
              actividadId: act?._id,
              titulo: act?.titulo,
              descripcion: act?.descripcion,
              tipoActividad: act?.tipoActividad,
              prioridad: act?.prioridad,
              estado: act?.estado,
              fechaEntrega: act?.fechaEntrega,
              materia: act?.materiaId
                ? {
                    id: act.materiaId._id,
                    nombre: act.materiaId.nombre,
                    color: act.materiaId.color
                  }
                : null,
              horasAsignadas: it.horasAsignadas,
              horaInicio: it.horaInicio,
              horaFin: it.horaFin
            };
          });

          return { fecha: k, bloques };
        });

      res.json({
        planId: plan._id,
        fechaGeneracion: plan.fechaGeneracion,
        periodoId: plan.periodoId,
        dias: diasOrdenados
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

// Calendario
function calendario(req, res) {
  const { from, to, periodoId } = req.query;

  if (!from || !to || !periodoId) {
    return res.status(400).json({ message: 'Requiere from, to y periodoId' });
  }

  const desde = startOfDay(parseDateOnlyLocal(from));
  const hasta = endOfDay(parseDateOnlyLocal(to));

  marcarVencidas(req.user.id)
    .then(() => {
      return Plan.find({ usuarioId: req.user.id, periodoId })
        .sort({ fechaGeneracion: -1 })
        .limit(1);
    })
    .then((planes) => {
      const plan = planes[0] || null;

      const planItems = (plan?.actividadesPlanificadas || []).filter((it) => {
        const f = startOfDay(it.fechaAsignada);
        return f >= desde && f <= hasta;
      });

      return Materia.find({ usuarioId: req.user.id, periodoId }, { _id: 1 }).then((mats) => {
        const materiaIds = mats.map((m) => m._id);

        return Promise.all([
          Actividad.find({
            usuarioId: req.user.id,
            materiaId: { $in: materiaIds },
            fechaEntrega: { $gte: desde, $lte: hasta }
          }).populate('materiaId'),
          Actividad.find({ _id: { $in: planItems.map((p) => p.actividadId) } }).populate('materiaId')
        ]).then(([actsDeadline, actsPlan]) => ({ plan, planItems, actsDeadline, actsPlan }));
      });
    })
    .then(({ plan, planItems, actsDeadline, actsPlan }) => {
      const mapAct = {};
      actsPlan.forEach((a) => {
        mapAct[String(a._id)] = a;
      });

      const eventos = [];

      planItems.forEach((it) => {
        const a = mapAct[String(it.actividadId)];
        if (!a) return;

        eventos.push({
          actividadId: a._id,
          tipo: 'plan',
          fecha: dateKey(it.fechaAsignada),
          titulo: a.titulo,
          descripcion: a.descripcion || '',
          tipoActividad: a.tipoActividad || 'tarea',
          fechaEntrega: a.fechaEntrega || null,
          prioridad: a.prioridad || null,
          estado: a.estado || null,
          tiempoEstimadoHoras: a.tiempoEstimadoHoras || null,
          materia: a.materiaId
            ? {
                id: a.materiaId._id,
                nombre: a.materiaId.nombre,
                color: a.materiaId.color
              }
            : null,
          horas: it.horasAsignadas,
          horaInicio: it.horaInicio,
          horaFin: it.horaFin
        });
      });

      actsDeadline.forEach((a) => {
        eventos.push({
          actividadId: a._id,
          tipo: 'deadline',
          fecha: dateKey(a.fechaEntrega),
          titulo: a.titulo,
          descripcion: a.descripcion || '',
          tipoActividad: a.tipoActividad || 'tarea',
          fechaEntrega: a.fechaEntrega || null,
          prioridad: a.prioridad || null,
          estado: a.estado || null,
          tiempoEstimadoHoras: a.tiempoEstimadoHoras || null,
          materia: a.materiaId
            ? {
                id: a.materiaId._id,
                nombre: a.materiaId.nombre,
                color: a.materiaId.color
              }
            : null
        });
      });

      res.json({
        planId: plan?._id || null,
        eventos
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

module.exports = { generarPlan, obtenerPlan, calendario };