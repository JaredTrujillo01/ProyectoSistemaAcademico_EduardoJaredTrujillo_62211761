const Disponibilidad = require('../Model/DisponibilidadM');

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function parseTimeToMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60) + m;
}

function calcularHorasDisponibles(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0;
  const inicio = parseTimeToMinutes(horaInicio);
  const fin = parseTimeToMinutes(horaFin);
  if (fin <= inicio) return -1;
  return Number(((fin - inicio) / 60).toFixed(2));
}

function obtenerDisponibilidad(req, res) {
  Disponibilidad.find({ usuarioId: req.user.id })
    .then((docs) => {
      const map = {};

      docs.forEach(d => {
        map[d.diaSemana] = {
          horaInicio: d.horaInicio || '',
          horaFin: d.horaFin || '',
          horaDisponible: Number(d.horaDisponible || 0)
        };
      });
      const semana = DIAS.map(dia => ({
        diaSemana: dia,
        horaInicio: map[dia]?.horaInicio || '',
        horaFin: map[dia]?.horaFin || '',
        horaDisponible: map[dia]?.horaDisponible || 0
      }));
      const totalSemanal = semana.reduce((acc, x) => acc + Number(x.horaDisponible || 0), 0);
      const objetivoSemanal = 40;
      const porcentaje = objetivoSemanal === 0 ? 0 : Math.round((totalSemanal / objetivoSemanal) * 100);
      res.json({
        semana,
        resumen: {
          totalSemanal,
          objetivoSemanal,
          porcentaje
        }
      });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function guardarDisponibilidad(req, res) {
  const semana = req.body.semana;
  if (!Array.isArray(semana)) {
    return res.status(400).json({ message: 'Formato inválido. Debes enviar { semana: [...] }' });
  }
  const errores = [];
  const ops = semana.map(item => {
    if (!item.diaSemana) return null;
    const horaInicio = item.horaInicio || '';
    const horaFin = item.horaFin || '';
    let horaDisponible = 0;
    if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
      errores.push(`Debes completar horaInicio y horaFin en ${item.diaSemana}`);
      return null;
    }
    if (horaInicio && horaFin) {
      horaDisponible = calcularHorasDisponibles(horaInicio, horaFin);
      if (horaDisponible < 0) {
        errores.push(`La hora final debe ser mayor que la hora inicial en ${item.diaSemana}`);
        return null;
      }
    }
    return Disponibilidad.findOneAndUpdate(
      { usuarioId: req.user.id, diaSemana: item.diaSemana },
      {
        $set: {
          horaInicio,
          horaFin,
          horaDisponible
        }
      },
      { upsert: true, new: true }
    );
  }).filter(Boolean);
  if (errores.length > 0) {
    return res.status(400).json({ message: errores.join('. ') });
  }
  Promise.all(ops)
    .then(() => Disponibilidad.find({ usuarioId: req.user.id }))
    .then((docs) => {
      const map = {};
      docs.forEach(d => {
        map[d.diaSemana] = {
          horaInicio: d.horaInicio || '',
          horaFin: d.horaFin || '',
          horaDisponible: Number(d.horaDisponible || 0)
        };
      });
      const semanaResp = DIAS.map(dia => ({
        diaSemana: dia,
        horaInicio: map[dia]?.horaInicio || '',
        horaFin: map[dia]?.horaFin || '',
        horaDisponible: map[dia]?.horaDisponible || 0
      }));
      const totalSemanal = semanaResp.reduce((acc, x) => acc + Number(x.horaDisponible || 0), 0);
      const objetivoSemanal = 40;
      const porcentaje = objetivoSemanal === 0 ? 0 : Math.round((totalSemanal / objetivoSemanal) * 100);
      res.json({
        message: 'Disponibilidad guardada',
        semana: semanaResp,
        resumen: {
          totalSemanal,
          objetivoSemanal,
          porcentaje
        }
      });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {obtenerDisponibilidad, guardarDisponibilidad};