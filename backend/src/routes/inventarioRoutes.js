const express =
  require("express");

const {
  obtenerInventario,
  obtenerOpcionesInventario,
  crearImplemento,
  actualizarImplemento,
  cambiarEstadoImplemento,
  eliminarImplemento,
} = require(
  "../controllers/inventarioController"
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
// LISTAR
// =====================================================

router.get(
  "/",
  ...protegerCoordinador,
  obtenerInventario
);

// =====================================================
// OPCIONES
// =====================================================

router.get(
  "/opciones",
  ...protegerCoordinador,
  obtenerOpcionesInventario
);

// =====================================================
// CREAR
// =====================================================

router.post(
  "/",
  ...protegerCoordinador,
  crearImplemento
);

// =====================================================
// EDITAR
// =====================================================

router.put(
  "/:id",
  ...protegerCoordinador,
  actualizarImplemento
);

// =====================================================
// CAMBIAR ESTADO
// =====================================================

router.patch(
  "/:id/estado",
  ...protegerCoordinador,
  cambiarEstadoImplemento
);

// =====================================================
// ELIMINAR
// =====================================================

router.delete(
  "/:id",
  ...protegerCoordinador,
  eliminarImplemento
);

module.exports =
  router;