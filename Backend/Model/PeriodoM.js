const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PeriodoSchema = new Schema({
    nombre: { type: String, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    activo: { type: Boolean, default: true }
}, {versionKey: false});

const Periodo = mongoose.model('periodo', PeriodoSchema);

module.exports = Periodo;