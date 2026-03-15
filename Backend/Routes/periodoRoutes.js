const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const periodoController = require('../Controllers/PeriodoC');
const admin = require('../middleware/admin')

router.get('/', auth, periodoController.obtenerPeriodos);
router.post('/crear', auth, periodoController.crearPeriodo);
router.put('/editar/:id', auth, periodoController.actualizarPeriodo);
router.delete('/eliminar/:id', auth, periodoController.eliminarPeriodo);
router.get('/admin/listar', auth, admin, periodoController.obtenerPeriodosAdmin);

module.exports = router;