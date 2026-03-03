const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const periodoController = require('../Controllers/MateriaC');

router.get('/', auth, periodoController.mostrarMaterias);
router.post('/crear', auth, periodoController.crearMateria);
router.post('/editar', auth, periodoController.editarMateria);
router.get('/eliminar', auth, periodoController.eliminarMateria);

module.exports = router;