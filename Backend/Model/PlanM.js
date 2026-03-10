const mongoose = require('mongoose');
const schema = mongoose.Schema;

const PlanSchema = new schema({
    usuarioId: { type: schema.Types.ObjectId, ref: 'usuario', required: true },
    fechaGeneracion: { type: Date, default: Date.now },
    periodoId: { type: schema.Types.ObjectId, ref: 'periodo', required: true },
    actividadesPlanificadas: [
        {
            actividadId: { type: schema.Types.ObjectId, ref: 'actividad', required: true },
            fechaAsignada: { type: Date, required: true },
            horaInicio: { type: String, required: true },   // ejemplo "18:00"
            horaFin: { type: String, required: true },      // ejemplo "20:00"
            horasAsignadas: { type: Number, required: true }
        }
    ]
}, { versionKey: false });

const Plan = mongoose.model('planestudio', PlanSchema);

module.exports = Plan;