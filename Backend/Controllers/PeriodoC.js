const Periodo = require('../Model/PeriodoM');
const Materia = require('../Model/MateriasM');
const Actividad = require('../Model/ActividadesM');

function crearPeriodo(req, res) {
  const periodoNuevo = new Periodo({
    nombre: req.body.nombre,
    fechaInicio: req.body.fechaInicio,
    fechaFin: req.body.fechaFin,
    usuarioId: req.user.id
  });

  periodoNuevo.save()
    .then(data => res.status(201).json(data))
    .catch(err => res.status(500).json({ message: err.message }));
}

function obtenerPeriodos(req, res) {
  Periodo.find({ usuarioId: req.user.id }).sort({ fechaInicio: -1 })
    .then(async (periodos) => {
      const hoy = new Date();

      const periodosConDatos = await Promise.all(
        periodos.map(async (p) => {
          let estadoPeriodo = 'por_empezar';
          if (hoy >= p.fechaInicio && hoy <= p.fechaFin) estadoPeriodo = 'en_curso';
          if (hoy > p.fechaFin) estadoPeriodo = 'finalizado';

          const materias = await Materia.find(
            { periodoId: p._id, usuarioId: req.user.id },
            { _id: 1 }
          );

          const materiaIds = materias.map(m => m._id);

          let totalActividades = 0;
          let completadas = 0;

          if (materiaIds.length > 0) {
            totalActividades = await Actividad.countDocuments({
              usuarioId: req.user.id,
              materiaId: { $in: materiaIds }
            });

            completadas = await Actividad.countDocuments({
              usuarioId: req.user.id,
              materiaId: { $in: materiaIds },
              estado: 'completada'
            });
          }

          const progresoPct = totalActividades === 0 ? 0 : Math.round((completadas / totalActividades) * 100);

          return {
            ...p.toObject(),
            estadoPeriodo,
            progresoAcademico: { totalActividades, completadas, progresoPct }
          };
        })
      );

      res.json(periodosConDatos);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function actualizarPeriodo(req, res) {
  const id = req.body.id;

  Periodo.findOneAndUpdate(
    { _id: id, usuarioId: req.user.id },
    req.body,
    { new: true }
  )
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Periodo no encontrado' });
      res.json(data);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function eliminarPeriodo(req, res) {
  const id = req.params.id;

  Periodo.findOneAndDelete({ _id: id, usuarioId: req.user.id })
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Periodo no encontrado' });
      res.json({ message: 'Periodo eliminado correctamente' });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = { crearPeriodo, obtenerPeriodos, actualizarPeriodo, eliminarPeriodo };