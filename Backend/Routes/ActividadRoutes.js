const express = require('express');
const router = express.Router();
const actividadC = require('../Controllers/ActividadC');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, actividadC.mostrarActividades);
router.post('/crear', authMiddleware, actividadC.crearActividad);
router.post('/editar', authMiddleware, actividadC.editarActividad);
router.post('/editar-estado', authMiddleware, actividadC.editarEstado);
router.get('/eliminar/:id', authMiddleware, actividadC.eliminarActividad);

module.exports = router;