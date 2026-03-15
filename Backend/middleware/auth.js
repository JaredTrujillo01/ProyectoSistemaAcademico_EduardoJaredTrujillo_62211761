const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    try{
        const header = req.headers['authorization'];
        if (!header)
            return res.status(401).json({ message: 'Token no proporcionado' });
            const token = header.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
    }catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}

function soloAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo el administrador puede realizar esta acción.' });
  }

  next();
}

module.exports = auth, soloAdmin;