const express = require("express");

const {
  obtenerEstudiantes,
  obtenerHorasEstudiante,
  obtenerCertificadosEstudiante,
  generarCertificado,
  eliminarCertificado,
} = require("../controllers/horasController");

const {
  verificarToken,
  autorizarRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// PROTECCIÓN PARA COORDINADOR
// =====================================================

const protegerCoordinador = [
  verificarToken,
  autorizarRoles("coordinador"),
];

// =====================================================
// OBTENER ESTUDIANTES
// =====================================================

router.get(
  "/estudiantes",
  ...protegerCoordinador,
  obtenerEstudiantes
);

// =====================================================
// OBTENER HORAS DEL ESTUDIANTE
// =====================================================

router.get(
  "/:id",
  ...protegerCoordinador,
  obtenerHorasEstudiante
);

// =====================================================
// OBTENER CERTIFICADOS DEL ESTUDIANTE
// =====================================================

router.get(
  "/:id/certificados",
  ...protegerCoordinador,
  obtenerCertificadosEstudiante
);

// =====================================================
// GENERAR CERTIFICADO
// =====================================================

router.post(
  "/:id/certificados",
  ...protegerCoordinador,
  generarCertificado
);

// =====================================================
// ELIMINAR CERTIFICADO
// =====================================================

router.delete(
  "/:id/certificados/:idCertificado",
  ...protegerCoordinador,
  eliminarCertificado
);

// =====================================================
// EXPORTAR ROUTER
// =====================================================

module.exports = router;