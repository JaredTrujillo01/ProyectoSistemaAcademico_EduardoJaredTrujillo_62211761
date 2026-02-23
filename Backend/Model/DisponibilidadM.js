const mongoose = require('mongoose');
const Usuario = require('./UsuarioM');
const schema = mongoose.Schema;

const DisponibilidadSchema = new schema({
    UsuarioId: { type: schema.Types.ObjectId, ref: 'Usuario', required: true },
    dia: { type: String, enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], required: true },
    horadisponible: { type: String, required: true }
}, {versionKey: false});

const Disponibilidad = mongoose.model('disponibilidad', DisponibilidadSchema);

module.exports = Disponibilidad;