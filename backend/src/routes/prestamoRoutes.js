const express = require("express");

const {
  obtenerPrestamos,
  obtenerOpcionesPrestamo,
  registrarPrestamo,
  registrarDevolucion,
} = require("../controllers/prestamoController");

const {
  verificarToken,
  autorizarRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const protegerCoordinador = [
  verificarToken,
  autorizarRoles("coordinador"),
];

// Consultar todos los préstamos
router.get(
  "/",
  ...protegerCoordinador,
  obtenerPrestamos
);

// Consultar implementos y estudiantes disponibles
router.get(
  "/opciones",
  ...protegerCoordinador,
  obtenerOpcionesPrestamo
);

// Registrar un préstamo
router.post(
  "/",
  ...protegerCoordinador,
  registrarPrestamo
);

// Registrar una devolución
router.patch(
  "/:id/devolucion",
  ...protegerCoordinador,
  registrarDevolucion
);

module.exports = router;