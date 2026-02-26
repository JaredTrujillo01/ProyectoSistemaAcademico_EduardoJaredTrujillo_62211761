const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actividadSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String },
    fechaEntrega: { type: Date, required: true },
    prioridad: { type: String, enum: ['baja', 'media', 'alta'], required: true },
    estado: { type: String, enum: ['pendiente', 'en_progreso', 'completada'], default: 'pendiente'
    },
    tiempoEstimadoHoras: { type: Number, required: true },
    materiaId: { type: Schema.Types.ObjectId, ref: 'materia', required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    fechaCreacion: { type: Date, default: Date.now }
}, { versionKey: false });

const Actividad = mongoose.model('actividad', actividadSchema);

module.exports = Actividad;