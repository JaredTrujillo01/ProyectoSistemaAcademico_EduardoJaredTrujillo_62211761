const Usuario = require('../Model/UsuarioM');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function registro(req, res) {
  const { nombre, apellido, email, password, rol } = req.body;

  Usuario.findOne({ email })
    .then(async (existe) => {
      if (existe) {
        return res.status(400).json({ message: 'Este correo ya existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      let rolFinal = 'estudiante';

      if (req.user?.rol === 'admin' && ['admin', 'estudiante'].includes(rol)) {
        rolFinal = rol;
      }

      const nuevo = new Usuario({
        nombre,
        apellido,
        email,
        password: hash,
        rol: rolFinal,
        activo: true
      });

      nuevo.save()
        .then((user) =>
          res.status(201).json({
            message: 'Registro exitoso',
            usuario: {
              id: user._id,
              nombre: user.nombre,
              apellido: user.apellido,
              email: user.email,
              rol: user.rol,
              activo: user.activo,
              fechaRegistro: user.fechaRegistro
            }
          })
        )
        .catch((err) => res.status(500).json({ message: err.message }));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

function login(req, res) {
  const { email, password } = req.body;

  Usuario.findOne({ email, activo: true })
    .then(async (user) => {
      if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user._id, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login exitoso',
        token,
        usuario: {
          id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol,
          activo: user.activo
        }
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

function listarUsuarios(req, res) {
  Usuario.find({}, { password: 0 })
    .sort({ fechaRegistro: -1 })
    .then((usuarios) => res.json(usuarios))
    .catch((err) => res.status(500).json({ message: err.message }));
}

function editarUsuario(req, res) {
  const { id } = req.params;
  const { nombre, apellido, email, rol, activo } = req.body;

  const camposPermitidos = {};

  if (nombre !== undefined) camposPermitidos.nombre = nombre;
  if (apellido !== undefined) camposPermitidos.apellido = apellido;
  if (email !== undefined) camposPermitidos.email = email;
  if (rol !== undefined) camposPermitidos.rol = rol;
  if (activo !== undefined) camposPermitidos.activo = activo;

  if (rol !== undefined && !['estudiante', 'admin'].includes(rol)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  Usuario.findByIdAndUpdate(
    id,
    { $set: camposPermitidos },
    { new: true, runValidators: true, select: '-password' }
  )
    .then((usuario) => {
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({
        message: 'Usuario actualizado correctamente',
        usuario
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
}

module.exports = {registro, login, listarUsuarios, editarUsuario};