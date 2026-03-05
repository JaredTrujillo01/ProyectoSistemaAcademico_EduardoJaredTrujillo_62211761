const Disponibilidad = require('../Model/DisponibilidadM');
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function obtenerDisponibilidad(req, res) {
  Disponibilidad.find({ usuarioId: req.user.id })
    .then((docs) => {
      const map = {};
      docs.forEach(d => {
        map[d.diaSemana] = d.horaDisponible;
      });

      const semana = DIAS.map(dia => ({
        diaSemana: dia,
        horaDisponible: map[dia] ?? 0
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

  const ops = semana.map(item => {
    if (!item.diaSemana) return null;

    return Disponibilidad.findOneAndUpdate(
      { usuarioId: req.user.id, diaSemana: item.diaSemana },
      { $set: { horaDisponible: Number(item.horaDisponible || 0) } },
      { upsert: true, new: true }
    );
  }).filter(Boolean);

  Promise.all(ops)
    .then(() => Disponibilidad.find({ usuarioId: req.user.id }))
    .then((docs) => {
      const map = {};
      docs.forEach(d => { map[d.diaSemana] = d.horaDisponible; });

      const semanaResp = DIAS.map(dia => ({
        diaSemana: dia,
        horaDisponible: map[dia] ?? 0
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

module.exports = {obtenerDisponibilidad, guardarDisponibilidad
}; 