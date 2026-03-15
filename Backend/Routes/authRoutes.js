const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authC');
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.post('/register', authController.registro);
router.post('/login', authController.login);
router.post('/admin/register', auth, admin, authController.registro);
router.get('/listar', auth, admin, authController.listarUsuarios);
router.put('/editar/:id', auth, admin, authController.editarUsuario);

module.exports = router;