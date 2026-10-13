const express =
  require("express");

const {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerOpcionesEvento,
  crearEvento,
  actualizarEvento,
  cambiarEstadoEvento,
  eliminarEvento,
} = require(
  "../controllers/eventoController"
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
// PROTECCIÓN COORDINADOR
// =====================================================

const protegerCoordinador = [
  verificarToken,
  autorizarRoles(
    "coordinador"
  ),
];

// =====================================================
// RUTAS
// =====================================================

// Listar eventos
router.get(
  "/",
  ...protegerCoordinador,
  obtenerEventos
);

// Opciones para formulario
// IMPORTANTE: debe estar antes de /:id
router.get(
  "/opciones",
  ...protegerCoordinador,
  obtenerOpcionesEvento
);

// Consultar un evento
router.get(
  "/:id",
  ...protegerCoordinador,
  obtenerEventoPorId
);

// Crear
router.post(
  "/",
  ...protegerCoordinador,
  crearEvento
);

// Editar
router.put(
  "/:id",
  ...protegerCoordinador,
  actualizarEvento
);

// Cambiar estado
router.patch(
  "/:id/estado",
  ...protegerCoordinador,
  cambiarEstadoEvento
);

// Eliminar
router.delete(
  "/:id",
  ...protegerCoordinador,
  eliminarEvento
);

module.exports =
  router;