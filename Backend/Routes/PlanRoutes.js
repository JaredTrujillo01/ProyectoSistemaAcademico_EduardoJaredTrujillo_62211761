const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const planController = require('../Controllers/PlanC');

router.post('/generar', auth, planController.generarPlan);
router.get('/periodo/:periodoId', auth, planController.obtenerPlan);
router.get('/calendario', auth, planController.calendario);

module.exports = router;