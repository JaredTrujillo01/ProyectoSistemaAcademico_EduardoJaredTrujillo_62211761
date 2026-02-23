const mongoose = require('mongoose');
const Usuario = require('./UsuarioM');
const Schema = mongoose.Schema;

const PeriodoSchema = new Schema({
    nombre: { type: String, required: true },
    fechainicio: { type: Date, required: true },
    fechafin: { type: Date, required: true },
    Usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    activo: { type: Boolean, default: true }
}, {versionKey: false});

const Periodo = mongoose.model('periodo', PeriodoSchema);

module.exports = Periodo;