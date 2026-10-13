const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Validar campos obligatorios
    if (!correo || !contrasena) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo y la contraseña son obligatorios",
      });
    }

    // Validar correo institucional
    const dominioInstitucional = "@uniautonoma.edu.co";

    if (!correo.toLowerCase().endsWith(dominioInstitucional)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Solo se permiten correos institucionales",
      });
    }

    // Buscar usuario
    const [usuarios] = await pool.query(
      `
      SELECT
        id_usuario,
        nombre,
        correo,
        contrasena,
        rol,
        estado
      FROM usuarios
      WHERE correo = ?
      LIMIT 1
      `,
      [correo]
    );

    // Verificar existencia
    if (usuarios.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const usuario = usuarios[0];

    // Verificar estado
    if (usuario.estado !== "activo") {
      return res.status(403).json({
        ok: false,
        mensaje: "El usuario se encuentra inactivo",
      });
    }

    // Comparar contraseña
    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasena
    );

    if (!contrasenaCorrecta) {
      return res.status(401).json({
        ok: false,
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    // Crear token
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );

    return res.json({
      ok: true,
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
};

module.exports = {
  login,
};