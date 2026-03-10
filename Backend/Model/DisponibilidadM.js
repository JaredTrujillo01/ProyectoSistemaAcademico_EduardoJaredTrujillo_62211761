const mongoose = require('mongoose');
const schema = mongoose.Schema;

const DisponibilidadSchema = new schema({
    usuarioId: { type: schema.Types.ObjectId, ref: 'usuario', required: true },
    diaSemana: {
        type: String,
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: true},
    horaInicio: { type: String, default: '' }, 
    horaFin: { type: String, default: '' },      
    horaDisponible: { type: Number, default: 0 } 
}, { versionKey: false });

DisponibilidadSchema.index({ usuarioId: 1, diaSemana: 1 }, { unique: true });

const Disponibilidad = mongoose.model('disponibilidad', DisponibilidadSchema);

module.exports = Disponibilidad;