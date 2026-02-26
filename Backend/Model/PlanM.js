const mongoose = require('mongoose');
const { act } = require('react');
const schema = mongoose.Schema;

const PlanSchema = new schema({
    UsuarioId: { type: schema.Types.ObjectId, ref: 'usuario', required: true },
    fechageneracion: { type: Date, default: Date.now },
    periodoid: { type: schema.Types.ObjectId, ref: 'periodo', required: true },
    actividades: [
        {
        actividadId: { type: schema.Types.ObjectId, ref: 'actividad', required: true },
        fechaasignada: { type: Date, required: true },
        horaasignada: { type: String, required: true }
        }
    ]
}, {versionKey: false});

const Plan = mongoose.model('planestudio', PlanSchema);

module.exports = Plan;

