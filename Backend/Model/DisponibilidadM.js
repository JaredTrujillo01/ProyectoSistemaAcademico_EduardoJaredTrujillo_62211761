const mongoose = require('mongoose');
const schema = mongoose.Schema;

const DisponibilidadSchema = new schema({
    UsuarioId: { type: schema.Types.ObjectId, ref: 'usuario', required: true },
    diaSemana: { type: String, enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], required: true },
    horadisponible: { type: String, required: true }
}, {versionKey: false});

const Disponibilidad = mongoose.model('disponibilidad', DisponibilidadSchema);

module.exports = Disponibilidad;