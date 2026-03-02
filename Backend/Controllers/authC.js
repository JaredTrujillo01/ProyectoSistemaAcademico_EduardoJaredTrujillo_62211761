const Usuario = require('../Model/UsuarioM');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function register(req, res) {
  const { nombre, apellido, email, password, rol } = req.body;
  Usuario.findOne({ email }).then(async (existe) => {
        if (existe) return res.status(400).json({ message: 'Este correo ya existe' });
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const nuevo = new Usuario({
        nombre,
        apellido,
        email,
        password: hash,
        rol: rol || 'estudiante',
        activo: true,
      });

      nuevo.save().then((user) => res.status(201).json({message: 'Registro exitoso',
          usuario: { id: user._id, nombre: user.nombre, rol: user.rol }
        }))
        .catch(err => res.status(500).json({ message: err.message }));
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

function login(req, res) {
  const { email, password } = req.body;
  Usuario.findOne({ email, activo: true }).then(async (user) => {
      if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ message: 'Credenciales inválidas' });
      const token = jwt.sign(
        { id: user._id, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN}
      );
      res.json({message: 'Login exitoso',token,
        usuario: { id: user._id, nombre: user.nombre, rol: user.rol }
      });
    })
    .catch(err => res.status(500).json({ message: err.message }));
}

module.exports = { register, login };