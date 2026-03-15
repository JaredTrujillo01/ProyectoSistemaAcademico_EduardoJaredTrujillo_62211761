const Materia = require('../Model/MateriasM');
const Actividad = require('../Model/ActividadesM');
const Periodo = require('../Model/PeriodoM');
const Usuario = require ('../Model/UsuarioM');

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
          const total = await Actividad.countDocuments({
            materiaId: m._id,
            usuarioId: req.user.id
          });

          const completadas = await Actividad.countDocuments({
            materiaId: m._id,
            usuarioId: req.user.id,
            estado: 'completada'
          });

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
    {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      color: req.body.color,
      periodoId: req.body.periodoId
    },
    { new: true, runValidators: true }
  )
    .then(data => {
      if (!data) {
        return res.status(404).json({ message: 'Materia no encontrada' });
      }
      res.json(data);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

async function eliminarMateria(req, res) {
  try {
    const id = req.params.id;

    const materia = await Materia.findOne({ _id: id, usuarioId: req.user.id });

    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }

    const totalActividades = await Actividad.countDocuments({
      materiaId: id,
      usuarioId: req.user.id
    });

    if (totalActividades > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar la materia porque tiene actividades asociadas'
      });
    }

    await Materia.findOneAndDelete({ _id: id, usuarioId: req.user.id });

    res.json({ message: 'Materia eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function mostrarMateriasAdmin(req, res) {
  Materia.find({}).sort({ nombre: 1 })
    .then(async (materias) => {
      const materiasConDatos = await Promise.all(
        materias.map(async (m) => {
          const total = await Actividad.countDocuments({
            materiaId: m._id,
            usuarioId: m.usuarioId
          });

          const completadas = await Actividad.countDocuments({
            materiaId: m._id,
            usuarioId: m.usuarioId,
            estado: 'completada'
          });

          const progresoPct =
            total === 0 ? 0 : Math.round((completadas / total) * 100);

          const usuario = await Usuario.findById(m.usuarioId, {
            nombre: 1,
            apellido: 1,
            email: 1
          });

          const periodo = await Periodo.findById(m.periodoId, {
            nombre: 1,
            fechaInicio: 1,
            fechaFin: 1
          });

          return {
            ...m.toObject(),
            progreso: {
              totalActividades: total,
              completadas,
              progresoPct
            },
            usuario: usuario
              ? {
                  id: usuario._id,
                  nombre: usuario.nombre,
                  apellido: usuario.apellido,
                  email: usuario.email
                }
              : null,
            periodo: periodo
              ? {
                  id: periodo._id,
                  nombre: periodo.nombre,
                  fechaInicio: periodo.fechaInicio,
                  fechaFin: periodo.fechaFin
                }
              : null
          };
        })
      );

      res.json(materiasConDatos);
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = {crearMateria,mostrarMaterias,editarMateria,eliminarMateria, mostrarMateriasAdmin};