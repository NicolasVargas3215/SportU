const express =
  require("express");

const {
  obtenerResumenDocente,
  obtenerActividadesDocente,
  obtenerActividadDocente,
  guardarAsistencia,
} = require(
  "../controllers/docenteController"
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
// SOLO DOCENTES
// =====================================================

router.use(
  verificarToken,
  autorizarRoles(
    "docente"
  )
);

// =====================================================
// DASHBOARD
// =====================================================

router.get(
  "/resumen",
  obtenerResumenDocente
);

// =====================================================
// ACTIVIDADES
// =====================================================

router.get(
  "/actividades",
  obtenerActividadesDocente
);

router.get(
  "/actividades/:id",
  obtenerActividadDocente
);

// =====================================================
// ASISTENCIA
// =====================================================

router.put(
  "/actividades/:id/asistencia",
  guardarAsistencia
);

module.exports =
  router;