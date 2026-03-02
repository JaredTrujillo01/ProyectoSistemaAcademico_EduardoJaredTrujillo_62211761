const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['estudiante', 'admin'], default: 'estudiante' },
    activo: { type: Boolean, default: true },
    fechaRegistro: { type: Date, default: Date.now }
}, {versionKey: false});

const Usuario = mongoose.model('usuario', UsuarioSchema);

module.exports = Usuario;