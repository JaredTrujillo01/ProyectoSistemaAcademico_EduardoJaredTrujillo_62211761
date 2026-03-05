const actividadM = require('../Model/ActividadesM');

// Marcar vencidas: cambia estado a "vencida"
function MarcarVencidas(usuarioId) {
  const hoy = new Date();
  return actividadM.updateMany(
    {
      usuarioId: usuarioId,
      fechaEntrega: { $lt: hoy },
      estado: { $nin: ['completada', 'vencida'] }
    },
    { $set: { estado: 'vencida' } }
  );
}

function crearActividad(req, res) {
  const actividad = new actividadM({
    titulo: req.body.titulo,
    descripcion: req.body.descripcion,
    fechaEntrega: req.body.fechaEntrega,
    prioridad: req.body.prioridad,
    estado: 'pendiente',
    tiempoEstimadoHoras: req.body.tiempoEstimadoHoras,
    materiaId: req.body.materiaId,
    usuarioId: req.user.id
  });

  actividad.save()
    .then(data => res.status(201).json(data))
    .catch(err => res.status(500).json({ message: err.message }));
}

function mostrarActividades(req, res) {
  MarcarVencidas(req.user.id)
    .then(() => {
      const filtro = { usuarioId: req.user.id };
      if (req.query.materiaId) filtro.materiaId = req.query.materiaId;
      return actividadM.find(filtro).sort({ fechaEntrega: 1 });
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ message: err.message }));
}

function editarActividad(req, res) {
  const id = req.body.id;

  actividadM.findOneAndUpdate(
    { _id: id, usuarioId: req.user.id },
    req.body,
    { new: true }
  )
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Actividad no encontrada' });
      res.json(data);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function editarEstado(req, res) {
  const id = req.body.id;
  const nuevoEstado = req.body.estado;

  MarcarVencidas(req.user.id)
    .then(() => actividadM.findOne({ _id: id, usuarioId: req.user.id }))
    .then(act => {
      if (!act) return res.status(404).json({ message: 'Actividad no encontrada' });

      if (act.estado === 'vencida') {
        return res.status(400).json({ message: 'No puedes cambiar el estado: la actividad está vencida.' });
      }

      const hoy = new Date();
      if (nuevoEstado === 'completada' && hoy > new Date(act.fechaEntrega)) {
        return res.status(400).json({ message: 'No puedes marcar como completada: la fecha límite ya pasó.' });
      }

      if (nuevoEstado === 'vencida') {
        return res.status(400).json({ message: 'El estado "vencida" se genera automáticamente.' });
      }
      return actividadM.findOneAndUpdate(
        { _id: id, usuarioId: req.user.id },
        { $set: { estado: nuevoEstado } },
        { new: true }
      );
    })
    .then(data => {if (!data) return;res.json(data);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function eliminarActividad(req, res) {
  const id = req.params.id;
  actividadM.findOneAndDelete({ _id: id, usuarioId: req.user.id })
    .then(data => {
      if (!data) return res.status(404).json({ message: 'Actividad no encontrada' });
      res.json({ message: 'Actividad eliminada correctamente' });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {crearActividad, mostrarActividades, editarActividad, editarEstado, eliminarActividad};