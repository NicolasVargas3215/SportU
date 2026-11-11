const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const pool = require("../config/db");

const googleClient = new OAuth2Client();
const DOMINIO_INSTITUCIONAL =
  process.env.GOOGLE_ALLOWED_DOMAIN || "uniautonoma.edu.co";

const crearRespuestaSesion = (usuario) => {
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

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
};

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
    const dominioInstitucional = `@${DOMINIO_INSTITUCIONAL}`;

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

    const sesion = crearRespuestaSesion(usuario);

    return res.json({
      ok: true,
      mensaje: "Inicio de sesión correcto",
      ...sesion,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor",
    });
  }
};

const loginConGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId || clientId.startsWith("tu-client-id")) {
      return res.status(503).json({
        ok: false,
        mensaje: "El inicio de sesión con Google todavía no está configurado.",
      });
    }

    if (!credential) {
      return res.status(400).json({
        ok: false,
        mensaje: "Google no envió las credenciales necesarias.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const correo = String(payload?.email || "").trim().toLowerCase();
    const dominioGoogle = String(payload?.hd || "").trim().toLowerCase();

    if (
      !payload?.email_verified ||
      dominioGoogle !== DOMINIO_INSTITUCIONAL.toLowerCase() ||
      !correo.endsWith(`@${DOMINIO_INSTITUCIONAL.toLowerCase()}`)
    ) {
      return res.status(403).json({
        ok: false,
        mensaje: "Debes usar una cuenta institucional de la Universidad.",
      });
    }

    const [usuarios] = await pool.query(
      `
      SELECT id_usuario, nombre, correo, rol, estado
      FROM usuarios
      WHERE LOWER(correo) = ?
      LIMIT 1
      `,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: "Tu correo institucional no está registrado en SportU.",
      });
    }

    const usuario = usuarios[0];

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        ok: false,
        mensaje: "El usuario se encuentra inactivo.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Inicio de sesión con Google correcto",
      ...crearRespuestaSesion(usuario),
    });
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);

    return res.status(401).json({
      ok: false,
      mensaje: "No fue posible validar la cuenta de Google.",
    });
  }
};

module.exports = {
  login,
  loginConGoogle,
};
