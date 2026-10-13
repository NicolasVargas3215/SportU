const express = require("express");

const {
  obtenerEventosDisponibles,
  registrarInscripcion,
  obtenerMisInscripciones,
} = require("../controllers/inscripcionController");

const {
  verificarToken,
  autorizarRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// PROTECCIÓN PARA ESTUDIANTES
// =====================================================

const protegerEstudiante = [
  verificarToken,
  autorizarRoles("estudiante"),
];

// =====================================================
// OBTENER EVENTOS DISPONIBLES
// =====================================================

router.get(
  "/eventos",
  ...protegerEstudiante,
  obtenerEventosDisponibles
);

// =====================================================
// OBTENER MIS INSCRIPCIONES
// =====================================================

router.get(
  "/mis-inscripciones",
  ...protegerEstudiante,
  obtenerMisInscripciones
);

// =====================================================
// REGISTRAR INSCRIPCIÓN
// =====================================================

router.post(
  "/eventos/:idEvento",
  ...protegerEstudiante,
  registrarInscripcion
);

// =====================================================
// EXPORTAR ROUTER
// =====================================================

module.exports = router;