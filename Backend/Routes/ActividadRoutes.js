const express = require('express');
const router = express.Router();
const actividadC = require('../Controllers/ActividadC');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, actividadC.mostrarActividades);
router.post('/crear', auth, actividadC.crearActividad);
router.post('/editar', auth, actividadC.editarActividad);
router.post('/editar-estado', auth, actividadC.editarEstado);
router.get('/eliminar/:id', auth, actividadC.eliminarActividad);
router.get('/admin/listar', auth, admin, actividadC.obtenerActividadesAdmin);

module.exports = router;