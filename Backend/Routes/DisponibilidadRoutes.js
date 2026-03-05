const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const disponibilidadController = require('../Controllers/DisponibilidaC');

router.get('/', auth, disponibilidadController.obtenerDisponibilidad);
router.post('/guardar', auth, disponibilidadController.guardarDisponibilidad);

module.exports = router;