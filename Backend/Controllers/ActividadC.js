const actividadM = require('../Model/ActividadesM');

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

function marcarVencidas(usuarioId) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return actividadM.updateMany(
        {
            usuarioId: usuarioId,
            fechaEntrega: { $lt: hoy },
            estado: { $nin: ['completada', 'vencida'] }
        },
        { $set: { estado: 'vencida' } }
    );
}

function mostrarActividades(req, res) {
    marcarVencidas(req.user.id)
        .then(() => {
            const filtro = { usuarioId: req.user.id };

            if (req.query.materiaId) {
                filtro.materiaId = req.query.materiaId;
            }

            return actividadM.find(filtro).sort({ fechaEntrega: 1 });
        })
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ message: err.message }));
}

function editarActividad(req, res) {
    const id = req.body.id;

    actividadM.findOne({ _id: id, usuarioId: req.user.id })
        .then((actividad) => {
            if (!actividad) {
                return res.status(404).json({ message: 'Actividad no encontrada' });
            }

            if (actividad.estado === 'completada' || actividad.estado === 'vencida') {
                return res.status(400).json({ message: 'No se puede editar una actividad completada o vencida' });
            }

            return actividadM.findOneAndUpdate(
                { _id: id, usuarioId: req.user.id },
                req.body,
                { new: true }
            ).then(data => res.json(data));
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

function editarEstado(req, res) {
    const id = req.body.id;
    const nuevoEstado = req.body.estado;

    actividadM.findOne({ _id: id, usuarioId: req.user.id })
        .then((actividad) => {
            if (!actividad) {
                return res.status(404).json({ message: 'Actividad no encontrada' });
            }

            if (actividad.estado === 'vencida') {
                return res.status(400).json({ message: 'Una actividad vencida no puede cambiar de estado' });
            }

            if (actividad.estado === 'completada' && nuevoEstado !== 'completada') {
                return res.status(400).json({ message: 'Una actividad completada no puede volver a estados anteriores' });
            }

            return actividadM.findOneAndUpdate(
                { _id: id, usuarioId: req.user.id },
                { $set: { estado: nuevoEstado } },
                { new: true }
            ).then(data => res.json(data));
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

function eliminarActividad(req, res) {
    const id = req.params.id;

    actividadM.findOne({ _id: id, usuarioId: req.user.id })
        .then((actividad) => {
            if (!actividad) {
                return res.status(404).json({ message: 'Actividad no encontrada' });
            }

            if (actividad.estado === 'completada' || actividad.estado === 'vencida') {
                return res.status(400).json({ message: 'No se puede eliminar una actividad completada o vencida' });
            }

            return actividadM.findOneAndDelete({ _id: id, usuarioId: req.user.id })
                .then(() => res.json({ message: 'Actividad eliminada correctamente' }));
        })
        .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {crearActividad, mostrarActividades, editarActividad, editarEstado, eliminarActividad};