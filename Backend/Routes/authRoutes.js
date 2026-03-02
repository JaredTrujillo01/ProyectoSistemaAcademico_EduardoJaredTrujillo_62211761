const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authC');

router.post('/registro', authController.registro);
router.post('/login', authController.login);

module.exports = router;