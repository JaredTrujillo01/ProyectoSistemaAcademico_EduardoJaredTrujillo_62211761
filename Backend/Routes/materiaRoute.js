const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const materiaController = require('../Controllers/MateriaC');
const admin = require('../middleware/admin');

router.get('/', auth, materiaController.mostrarMaterias);
router.post('/crear', auth, materiaController.crearMateria);
router.post('/editar', auth, materiaController.editarMateria);
router.delete('/eliminar/:id', auth, materiaController.eliminarMateria);
router.get('/admin/listar', auth, admin, materiaController.mostrarMateriasAdmin);

module.exports = router;