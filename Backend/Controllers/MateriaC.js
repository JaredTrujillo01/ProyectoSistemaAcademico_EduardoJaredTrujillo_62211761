const Materia = require('../Model/MateriasM');
const Actividad = require('../Model/ActividadesM');

function crearMateria(req, res) {
  const materia = new Materia({
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    color: req.body.color,
    periodoId: req.body.periodoId,
    usuarioId: req.user.id,
    activa: true
  });

  materia.save()
    .then(data => res.status(201).json(data))
    .catch(err => res.status(500).json({ message: err.message }));
}

function mostrarMaterias(req, res) {
  const filtro = { usuarioId: req.user.id };
  if (req.query.periodoId) filtro.periodoId = req.query.periodoId;

  Materia.find(filtro).sort({ nombre: 1 })
    .then(async (materias) => {
      const materiasConProgreso = await Promise.all(
        materias.map(async (m) => {
          const total = await Actividad.countDocuments({ materiaId: m._id, usuarioId: req.user.id });
          const completadas = await Actividad.countDocuments({ materiaId: m._id, usuarioId: req.user.id, estado: 'completada' });

          const progresoPct = total === 0 ? 0 : Math.round((completadas / total) * 100);

          return {
            ...m.toObject(),
            progreso: {
              totalActividades: total,
              completadas,
              progresoPct
            }
          };
        })
      );

      res.json(materiasConProgreso);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function editarMateria(req, res) {
  const id = req.body.id;

  Materia.findOneAndUpdate(
    { _id: id, usuarioId: req.user.id },
    req.body,
    { new: true }
  )
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Materia no encontrada' });
      res.json(data);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function eliminarMateria(req, res) {
  const id = req.params.id;

  Materia.findOneAndDelete({ _id: id, usuarioId: req.user.id })
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Materia no encontrada' });
      res.json({ message: 'Materia eliminada correctamente' });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = { crearMateria, mostrarMaterias, editarMateria, eliminarMateria };