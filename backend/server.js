const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./src/config/db");
const deporteRoutes = require("./src/routes/deporteRoutes");
const authRoutes = require("./src/routes/authRoutes");
const eventoRoutes = require("./src/routes/eventoRoutes");
const inventarioRoutes = require("./src/routes/inventarioRoutes");
const prestamoRoutes = require("./src/routes/prestamoRoutes");
const horasRoutes = require("./src/routes/horasRoutes");
const inscripcionRoutes = require("./src/routes/inscripcionRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    mensaje: "API de SPORTU funciona correctamente",
  });
});

// Ruta para comprobar la conexión con MySQL
app.get("/api/db-test", async (req, res) => {
  try {
    const [resultado] = await pool.query(
      "SELECT DATABASE() AS base_datos, VERSION() AS version_mysql"
    );

    res.json({
      conexion: true,
      mensaje: "SPORTU está conectado correctamente con MySQL",
      base_datos: resultado[0].base_datos,
      version_mysql: resultado[0].version_mysql,
    });
  } catch (error) {
    console.error("Error de conexión con MySQL:", error);

    res.status(500).json({
      conexion: false,
      mensaje: "No fue posible conectar SPORTU con MySQL",
    });
  }
});

// Rutas
app.use("/api/deportes", deporteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/prestamos", prestamoRoutes);
app.use("/api/horas", horasRoutes);
app.use("/api/inscripciones", inscripcionRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor SPORTU ejecutándose en http://localhost:${PORT}`);
});