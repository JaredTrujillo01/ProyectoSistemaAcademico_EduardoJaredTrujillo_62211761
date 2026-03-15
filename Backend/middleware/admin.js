function soloAdmin(req, res, next) {
  if (req.user?.rol !== "admin") {
    return res.status(403).json({
      message: "Acceso denegado. Solo administradores."
    });
  }

  next();
}

module.exports = soloAdmin;
