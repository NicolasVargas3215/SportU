const jwt = require("jsonwebtoken");

// Verificar que el usuario tenga un token válido
const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        mensaje: "No se proporcionó un token de autenticación",
      });
    }

    const token = authHeader.split(" ")[1];

    const usuarioDecodificado = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = usuarioDecodificado;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token inválido o expirado",
    });
  }
};

// Verificar que el usuario tenga uno de los roles permitidos
const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (
      !req.usuario ||
      !rolesPermitidos.includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para acceder a esta función",
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  autorizarRoles,
};