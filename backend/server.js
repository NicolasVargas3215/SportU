const express =
  require("express");

const cors =
  require("cors");

require("dotenv").config();

const pool =
  require("./src/config/db");

const {
  ensureAttendanceStatusSchema,
} = require("./src/config/migrations");

// =====================================================
// RUTAS
// =====================================================

const authRoutes =
  require(
    "./src/routes/authRoutes"
  );

const deporteRoutes =
  require(
    "./src/routes/deporteRoutes"
  );

const eventoRoutes =
  require(
    "./src/routes/eventoRoutes"
  );

const inscripcionRoutes =
  require(
    "./src/routes/inscripcionRoutes"
  );

const inventarioRoutes =
  require(
    "./src/routes/inventarioRoutes"
  );

const prestamoRoutes =
  require(
    "./src/routes/prestamoRoutes"
  );

const horasRoutes =
  require(
    "./src/routes/horasRoutes"
  );

const docenteRoutes =
  require(
    "./src/routes/docenteRoutes"
  );

const estudianteRoutes =
  require(
    "./src/routes/estudianteRoutes"
  );

const dashboardRoutes =
  require(
    "./src/routes/dashboardRoutes"
  );

// =====================================================
// APP
// =====================================================

const app =
  express();

const PORT =
  process.env.PORT ||
  3000;

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(
  cors()
);

app.use(
  express.json()
);

// =====================================================
// PRINCIPAL
// =====================================================

app.get(
  "/",
  (
    req,
    res
  ) => {
    return res.json({
      ok: true,

      mensaje:
        "API de SportU funciona correctamente",
    });
  }
);

// =====================================================
// PRUEBA BD
// =====================================================

app.get(
  "/api/db-test",
  async (
    req,
    res
  ) => {
    try {
      const [
        resultado,
      ] =
        await pool.query(
          `
          SELECT
            DATABASE()
              AS base_datos,

            VERSION()
              AS version_mysql
          `
        );

      return res.json({
        conexion: true,

        mensaje:
          "SportU está conectado correctamente con MySQL",

        base_datos:
          resultado[0]
            .base_datos,

        version_mysql:
          resultado[0]
            .version_mysql,
      });
    } catch (error) {
      console.error(
        "Error de conexión con MySQL:",
        error
      );

      return res
        .status(500)
        .json({
          conexion: false,

          mensaje:
            "No fue posible conectar SportU con MySQL",
        });
    }
  }
);

// =====================================================
// ENDPOINTS
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/deportes",
  deporteRoutes
);

app.use(
  "/api/eventos",
  eventoRoutes
);

app.use(
  "/api/inscripciones",
  inscripcionRoutes
);

app.use(
  "/api/inventario",
  inventarioRoutes
);

app.use(
  "/api/prestamos",
  prestamoRoutes
);

app.use(
  "/api/horas",
  horasRoutes
);

app.use(
  "/api/docente",
  docenteRoutes
);

app.use(
  "/api/estudiante",
  estudianteRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// =====================================================
// 404
// =====================================================

app.use(
  (
    req,
    res
  ) => {
    return res
      .status(404)
      .json({
        ok: false,

        mensaje:
          "La ruta solicitada no existe.",
      });
  }
);

// =====================================================
// ERROR GENERAL
// =====================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Error general:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        mensaje:
          "Ocurrió un error interno en SportU.",
      });
  }
);

// =====================================================
// SERVIDOR
// =====================================================

(async () => {
  try {
    await ensureAttendanceStatusSchema();
  } catch (error) {
    console.error(
      "No fue posible validar el esquema de asistencias:",
      error
    );
  }

  app.listen(
    PORT,
    () => {
      console.log(
        `Servidor SportU ejecutándose en http://localhost:${PORT}`
      );
    }
  );
})();
