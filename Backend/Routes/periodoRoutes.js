const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const periodoController = require('../Controllers/PeriodoC');

router.get('/', auth, periodoController.obtenerPeriodos);
router.post('/crear', auth, periodoController.crearPeriodo);
router.post('/editar', auth, periodoController.actualizarPeriodo);
router.get('/eliminar', auth, periodoController.eliminarPeriodo);

module.exports = router;