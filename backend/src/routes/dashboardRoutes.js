const express =
  require("express");

const {
  obtenerDashboardCoordinador,
} = require(
  "../controllers/dashboardController"
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
// DASHBOARD COORDINADOR
// =====================================================

router.get(
  "/coordinador",

  verificarToken,

  autorizarRoles(
    "coordinador"
  ),

  obtenerDashboardCoordinador
);

module.exports =
  router;