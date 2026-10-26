const express =
  require("express");

const {
  obtenerEstudiantesHoras,
  obtenerDetalleHorasEstudiante,
  obtenerCertificados,
  generarCertificado,
  eliminarCertificado,
} = require(
  "../controllers/horasController"
);

const {
  verificarToken,
  autorizarRoles,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

// =====================================================
// TODAS LAS RUTAS SON DEL COORDINADOR
// =====================================================

router.use(
  verificarToken,
  autorizarRoles(
    "coordinador"
  )
);

// =====================================================
// ESTUDIANTES Y HORAS
// =====================================================

router.get(
  "/estudiantes",
  obtenerEstudiantesHoras
);

router.get(
  "/estudiantes/:id",
  obtenerDetalleHorasEstudiante
);

// =====================================================
// CERTIFICADOS
// =====================================================

router.get(
  "/certificados",
  obtenerCertificados
);

router.post(
  "/estudiantes/:id/certificados",
  generarCertificado
);

router.delete(
  "/certificados/:id",
  eliminarCertificado
);

module.exports =
  router;