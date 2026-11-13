const express =
  require("express");

const {
  obtenerDeportes,
  obtenerCategorias,
  crearDeporte,
  actualizarDeporte,
  cambiarEstadoDeporte,
  eliminarDeporte,
} = require(
  "../controllers/deporteController"
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
// PROTECCIÓN
// =====================================================

const protegerCoordinador = [
  verificarToken,
  autorizarRoles(
    "coordinador"
  ),
];

// =====================================================
// CONSULTAR DEPORTES
// =====================================================

router.get(
  "/",
  ...protegerCoordinador,
  obtenerDeportes
);

router.get(
  "/categorias",
  ...protegerCoordinador,
  obtenerCategorias
);

// =====================================================
// CREAR DEPORTE
// =====================================================

router.post(
  "/",
  ...protegerCoordinador,
  crearDeporte
);

// =====================================================
// ACTUALIZAR DEPORTE
// =====================================================

router.put(
  "/:id",
  ...protegerCoordinador,
  actualizarDeporte
);

// =====================================================
// CAMBIAR ESTADO
// =====================================================

router.patch(
  "/:id/estado",
  ...protegerCoordinador,
  cambiarEstadoDeporte
);

// =====================================================
// ELIMINAR DEPORTE
// =====================================================

router.delete(
  "/:id",
  ...protegerCoordinador,
  eliminarDeporte
);

module.exports =
  router;
