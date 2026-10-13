require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../config/db");

const actualizarContrasenas = async () => {
  try {
    const contrasenaTemporal = "password_temporal";

    const hash = await bcrypt.hash(contrasenaTemporal, 10);

    const [resultado] = await pool.query(
      `
      UPDATE usuarios
      SET contrasena = ?
      WHERE correo IN (?, ?, ?)
      `,
      [
        hash,
        "laura.gomez@uniautonoma.edu.co",
        "juan.perez@uniautonoma.edu.co",
        "carlos.martinez@uniautonoma.edu.co",
      ]
    );

    console.log(
      `Contraseñas actualizadas correctamente. Usuarios modificados: ${resultado.affectedRows}`
    );
  } catch (error) {
    console.error("Error al actualizar las contraseñas:", error);
  } finally {
    await pool.end();
  }
};

actualizarContrasenas();