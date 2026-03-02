const mongoose = require('mongoose');
const Usuario = require('./UsuarioM');
const Schema = mongoose.Schema;

const MateriaSchema = new Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    color: { type: String},
    periodoId: { type: Schema.Types.ObjectId, ref: 'periodo', required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    activa: { type: Boolean, default: true }
}, {versionKey: false});

const Materia = mongoose.model('materia', MateriaSchema);

module.exports = Materia;