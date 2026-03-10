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

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(d) {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
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

function marcarVencidas(usuarioId) {
  const hoy = startOfDay(new Date());
  return Actividad.updateMany(
    { usuarioId, fechaEntrega: { $lt: hoy }, estado: { $nin: ['completada', 'vencida'] } },
    { $set: { estado: 'vencida' } }
  );
}

function generarPlan(req, res) {
  const { periodoId } = req.body;
  if (!periodoId) return res.status(400).json({ message: 'periodoId es requerido' });
  const hoy = startOfDay(new Date());
  marcarVencidas(req.user.id)
    .then(() => Promise.all([
      Materia.find({ usuarioId: req.user.id, periodoId: periodoId }, { _id: 1 }),
      Disponibilidad.find({ usuarioId: req.user.id })
    ]))
    .then(([materias, disp]) => {
      const materiaIds = materias.map(m => m._id);
      if (!materiaIds.length) {
        return res.status(400).json({ message: 'No hay materias en este período. Crea materias antes de generar el plan.' });
      }
      if (!disp.length) {
        return res.status(400).json({ message: 'Registra tu disponibilidad semanal antes de generar el plan.' });
      }
      const mapDisponibilidad = {};
      disp.forEach(d => {
        mapDisponibilidad[d.diaSemana] = {
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          minutosDisponibles: d.horaInicio && d.horaFin
            ? parseTimeToMinutes(d.horaFin) - parseTimeToMinutes(d.horaInicio)
            : 0
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
        return Plan.findOneAndDelete({ usuarioId: req.user.id, periodoId })
          .then(() => {
            const plan = new Plan({
              usuarioId: req.user.id,
              periodoId,
              fechaGeneracion: new Date(),
              actividadesPlanificadas: []
            });
            return plan.save().then(saved => ({ saved, noPlanificadas: [] }));
          });
      }

      acts.sort((a, b) => {
        const pa = prioridadValor(a.prioridad);
        const pb = prioridadValor(b.prioridad);
        if (pb !== pa) return pb - pa;
        return new Date(a.fechaEntrega) - new Date(b.fechaEntrega);
      });

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      const usadoPorDia = {};
      const planItems = [];
      const noPlanificadas = [];

      acts.forEach(act => {
        let minutosRestantes = Math.round(Number(act.tiempoEstimadoHoras || 1) * 60);
        if (minutosRestantes <= 0) minutosRestantes = 60;

        let dia = startOfDay(new Date());
        const limite = startOfDay(act.fechaEntrega);

        while (minutosRestantes > 0 && dia <= limite) {
          const nombreDia = diasSemana[dia.getDay()];
          const disp = mapDisponibilidad[nombreDia];

          if (disp && disp.minutosDisponibles > 0) {
            const key = dateKey(dia);
            const yaUsado = Number(usadoPorDia[key] || 0);
            const libres = Math.max(disp.minutosDisponibles - yaUsado, 0);

            if (libres > 0) {
              const asignar = Math.min(libres, minutosRestantes);

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
            }
          }

          dia = addDays(dia, 1);
        }

        if (minutosRestantes > 0) {
          noPlanificadas.push({
            actividadId: act._id,
            titulo: act.titulo,
            horasFaltantes: Number((minutosRestantes / 60).toFixed(2))
          });
        }
      });

      return Plan.findOneAndDelete({ usuarioId: req.user.id, periodoId })
        .then(() => {
          const plan = new Plan({
            usuarioId: req.user.id,
            periodoId,
            fechaGeneracion: new Date(),
            actividadesPlanificadas: planItems
          });

          return plan.save().then(saved => ({ saved, noPlanificadas }));
        });
    })
    .then(({ saved, noPlanificadas }) => {
      res.status(201).json({
        message: 'Plan generado',
        plan: saved,
        advertencias: noPlanificadas.length ? noPlanificadas : []
      });
    })
    .catch(err => res.status(500).json({ message: err.message }));
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
      plan.actividadesPlanificadas.forEach(item => {
        const k = dateKey(item.fechaAsignada);
        if (!grupos[k]) grupos[k] = [];
        grupos[k].push(item);
      });

      const diasOrdenados = Object.keys(grupos).sort().map(k => {
        const bloques = grupos[k].map(it => {
          const act = it.actividadId;

          return {
            actividadId: act?._id,
            titulo: act?.titulo,
            descripcion: act?.descripcion,
            prioridad: act?.prioridad,
            estado: act?.estado,
            fechaEntrega: act?.fechaEntrega,
            materia: act?.materiaId ? {
              id: act.materiaId._id,
              nombre: act.materiaId.nombre,
              color: act.materiaId.color
            } : null,
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
    .catch(err => res.status(500).json({ message: err.message }));
}

// Calendario
function calendario(req, res) {
  const { from, to, periodoId } = req.query;
  if (!from || !to || !periodoId) {
    return res.status(400).json({ message: 'Requiere from, to y periodoId' });
  }

  const desde = startOfDay(new Date(from));
  const hasta = startOfDay(new Date(to));

  marcarVencidas(req.user.id)
    .then(() => {
      return Plan.find({ usuarioId: req.user.id, periodoId })
        .sort({ fechaGeneracion: -1 })
        .limit(1);
    })
    .then((planes) => {
      const plan = planes[0] || null;

      const planItems = (plan?.actividadesPlanificadas || []).filter(it => {
        const f = startOfDay(it.fechaAsignada);
        return f >= desde && f <= hasta;
      });

      return Materia.find({ usuarioId: req.user.id, periodoId }, { _id: 1 })
        .then(mats => {
          const materiaIds = mats.map(m => m._id);

          return Promise.all([
            Actividad.find({
              usuarioId: req.user.id,
              materiaId: { $in: materiaIds },
              fechaEntrega: { $gte: desde, $lte: hasta }
            }).populate('materiaId'),
            Actividad.find({ _id: { $in: planItems.map(p => p.actividadId) } }).populate('materiaId'),
          ])
          .then(([actsDeadline, actsPlan]) => ({ plan, planItems, actsDeadline, actsPlan }));
        });
    })
    .then(({ plan, planItems, actsDeadline, actsPlan }) => {
      const mapAct = {};
      actsPlan.forEach(a => { mapAct[String(a._id)] = a; });

      const eventos = [];

      planItems.forEach(it => {
        const a = mapAct[String(it.actividadId)];
        if (!a) return;

        eventos.push({
          tipo: 'plan',
          fecha: dateKey(it.fechaAsignada),
          titulo: a.titulo,
          materia: a.materiaId ? { nombre: a.materiaId.nombre, color: a.materiaId.color } : null,
          horas: it.horasAsignadas,
          horaInicio: it.horaInicio,
          horaFin: it.horaFin
        });
      });

      actsDeadline.forEach(a => {
        eventos.push({
          tipo: 'deadline',
          fecha: dateKey(a.fechaEntrega),
          titulo: `Entrega: ${a.titulo}`,
          materia: a.materiaId ? { nombre: a.materiaId.nombre, color: a.materiaId.color } : null,
          estado: a.estado,
          prioridad: a.prioridad
        });
      });

      res.json({
        planId: plan?._id || null,
        eventos
      });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = { generarPlan, obtenerPlan, calendario };