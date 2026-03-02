const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlanSchema = new Schema({
    usuarioId: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    fechaGeneracion: { type: Date, default: Date.now },
    periodoId: { type: Schema.Types.ObjectId, ref: 'periodo', required: true },
    actividadesPlanificadas: [
        {
            actividadId: { type: Schema.Types.ObjectId, ref: 'actividad', required: true },
            fechaAsignada: { type: Date, required: true },
            horasAsignadas: { type: Number, required: true, min: 0 }
        }
    ]
}, { versionKey: false });

const Plan = mongoose.model('planestudio', PlanSchema);

module.exports = Plan;
