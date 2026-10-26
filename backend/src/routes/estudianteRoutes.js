const express =
  require("express");

const {
  obtenerPerfilEstudiante,
  obtenerResumenEstudiante,
  obtenerCertificadosEstudiante,
} = require(
  "../controllers/estudianteController"
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
// SOLO ESTUDIANTE
// =====================================================

router.use(
  verificarToken,
  autorizarRoles(
    "estudiante"
  )
);

// =====================================================
// RESUMEN
// =====================================================

router.get(
  "/resumen",
  obtenerResumenEstudiante
);

// =====================================================
// PERFIL
// =====================================================

router.get(
  "/perfil",
  obtenerPerfilEstudiante
);

// =====================================================
// CERTIFICADOS
// =====================================================

router.get(
  "/certificados",
  obtenerCertificadosEstudiante
);

module.exports =
  router;