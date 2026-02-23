const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actividadSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String },
    fechaentrega: { type: Date, required: true },
    prioridad: { type: String, enum: ['baja', 'media', 'alta'], required: true },
    estado: { type: String, enum: ['pendiente', 'completada'], default: 'pendiente'},
    materiaId: { type: Schema.Types.ObjectId, ref: 'Materia', required: true },
    UsuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechacreacion: { type: Date, default: Date.now }
}, {versionKey: false});

const Actividad = mongoose.model('actividad', actividadSchema);

module.exports = Actividad;