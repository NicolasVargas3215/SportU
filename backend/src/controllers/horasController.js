const pool = require("../config/db");

// =====================================================
// CONSTANTES
// =====================================================

const PORCENTAJE_MINIMO_CERTIFICADO = 85;

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

const normalizarTexto = (texto) => {
  if (!texto) {
    return "";
  }

  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

const asistio = (estado) => {
  return normalizarTexto(estado) === "asistio";
};

const noAsistio = (estado) => {
  return normalizarTexto(estado) === "no asistio";
};

// =====================================================
// CALCULAR RESUMEN DE HORAS Y ASISTENCIA
// =====================================================

const calcularResumenHoras = (actividades) => {
  let horasAsistidas = 0;
  let horasEvaluadas = 0;

  actividades.forEach((actividad) => {
    const duracion =
      Number(actividad.duracion_horas) || 0;

    // Si asistió:
    // suma horas asistidas y horas evaluadas
    if (asistio(actividad.asistencia)) {
      horasAsistidas += duracion;
      horasEvaluadas += duracion;
    }

    // Si no asistió:
    // solamente suma al total evaluado
    else if (
      noAsistio(actividad.asistencia)
    ) {
      horasEvaluadas += duracion;
    }

    // Pendiente no se tiene en cuenta
    // para calcular el porcentaje.
  });

  horasAsistidas = Number(
    horasAsistidas.toFixed(2)
  );

  horasEvaluadas = Number(
    horasEvaluadas.toFixed(2)
  );

  const porcentajeAsistencia =
    horasEvaluadas > 0
      ? Number(
          (
            (horasAsistidas /
              horasEvaluadas) *
            100
          ).toFixed(2)
        )
      : 0;

  const puedeGenerarCertificado =
    horasAsistidas > 0 &&
    porcentajeAsistencia >=
      PORCENTAJE_MINIMO_CERTIFICADO;

  return {
    horasAsistidas,
    horasEvaluadas,
    porcentajeAsistencia,
    puedeGenerarCertificado,
  };
};

// =====================================================
// OBTENER ESTUDIANTES ACTIVOS
// =====================================================

const obtenerEstudiantes = async (
  req,
  res
) => {
  try {
    const [estudiantes] =
      await pool.query(`
        SELECT
          id_usuario,
          nombre,
          correo,
          estado
        FROM usuarios
        WHERE rol = 'estudiante'
          AND estado = 'activo'
        ORDER BY nombre ASC
      `);

    return res.json({
      ok: true,
      estudiantes,
    });
  } catch (error) {
    console.error(
      "Error al consultar estudiantes:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar los estudiantes",
    });
  }
};

// =====================================================
// OBTENER HORAS DE UN ESTUDIANTE
// =====================================================

const obtenerHorasEstudiante = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------
    // VALIDAR ESTUDIANTE
    // -------------------------------------------------

    const [estudiantes] =
      await pool.query(
        `
          SELECT
            id_usuario,
            nombre,
            correo,
            estado
          FROM usuarios
          WHERE id_usuario = ?
            AND rol = 'estudiante'
        `,
        [id]
      );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Estudiante no encontrado",
      });
    }

    const estudiante =
      estudiantes[0];

    // -------------------------------------------------
    // CONSULTAR ACTIVIDADES
    // -------------------------------------------------

    const [actividades] =
      await pool.query(
        `
          SELECT
            i.id_inscripcion,
            i.id_evento,
            e.nombre AS evento,
            e.fecha,
            e.hora,
            e.lugar,
            e.duracion_horas,
            i.asistencia
          FROM inscripciones i
          INNER JOIN eventos e
            ON e.id_evento = i.id_evento
          WHERE i.id_usuario = ?
          ORDER BY
            e.fecha DESC,
            e.hora DESC
        `,
        [id]
      );

    // -------------------------------------------------
    // PROCESAR ACTIVIDADES
    // -------------------------------------------------

    const actividadesProcesadas =
      actividades.map((actividad) => {
        const duracion =
          Number(
            actividad.duracion_horas
          ) || 0;

        const horasObtenidas =
          asistio(
            actividad.asistencia
          )
            ? duracion
            : 0;

        return {
          ...actividad,
          horas_obtenidas:
            horasObtenidas,
        };
      });

    // -------------------------------------------------
    // CALCULAR RESUMEN
    // -------------------------------------------------

    const resumen =
      calcularResumenHoras(
        actividades
      );

    return res.json({
      ok: true,

      estudiante,

      actividades:
        actividadesProcesadas,

      total_horas:
        resumen.horasAsistidas,

      horas_evaluadas:
        resumen.horasEvaluadas,

      porcentaje_asistencia:
        resumen.porcentajeAsistencia,

      porcentaje_minimo:
        PORCENTAJE_MINIMO_CERTIFICADO,

      puede_generar_certificado:
        resumen.puedeGenerarCertificado,
    });
  } catch (error) {
    console.error(
      "Error al consultar horas deportivas:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar las horas deportivas",
    });
  }
};

// =====================================================
// OBTENER CERTIFICADOS DE UN ESTUDIANTE
// =====================================================

const obtenerCertificadosEstudiante =
  async (req, res) => {
    try {
      const { id } = req.params;

      // -------------------------------------------------
      // VALIDAR ESTUDIANTE
      // -------------------------------------------------

      const [estudiantes] =
        await pool.query(
          `
            SELECT
              id_usuario,
              nombre,
              correo
            FROM usuarios
            WHERE id_usuario = ?
              AND rol = 'estudiante'
          `,
          [id]
        );

      if (
        estudiantes.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "Estudiante no encontrado",
        });
      }

      // -------------------------------------------------
      // CONSULTAR CERTIFICADOS
      // -------------------------------------------------

      const [certificados] =
        await pool.query(
          `
            SELECT
              c.id_certificado,
              c.id_estudiante,
              u.nombre AS estudiante,
              u.correo,
              c.horas_certificadas,
              c.fecha_generacion
            FROM certificados c
            INNER JOIN usuarios u
              ON u.id_usuario =
                 c.id_estudiante
            WHERE c.id_estudiante = ?
            ORDER BY
              c.fecha_generacion DESC,
              c.id_certificado DESC
          `,
          [id]
        );

      return res.json({
        ok: true,
        certificados,
      });
    } catch (error) {
      console.error(
        "Error al consultar certificados:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "Error al consultar los certificados",
      });
    }
  };

// =====================================================
// GENERAR CERTIFICADO
// =====================================================

const generarCertificado = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------
    // VALIDAR ESTUDIANTE
    // -------------------------------------------------

    const [estudiantes] =
      await pool.query(
        `
          SELECT
            id_usuario,
            nombre,
            correo
          FROM usuarios
          WHERE id_usuario = ?
            AND rol = 'estudiante'
        `,
        [id]
      );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Estudiante no encontrado",
      });
    }

    // -------------------------------------------------
    // CONSULTAR ACTIVIDADES
    // -------------------------------------------------

    const [actividades] =
      await pool.query(
        `
          SELECT
            i.asistencia,
            e.duracion_horas
          FROM inscripciones i
          INNER JOIN eventos e
            ON e.id_evento = i.id_evento
          WHERE i.id_usuario = ?
        `,
        [id]
      );

    // -------------------------------------------------
    // CALCULAR HORAS Y PORCENTAJE
    // -------------------------------------------------

    const resumen =
      calcularResumenHoras(
        actividades
      );

    // -------------------------------------------------
    // IMPEDIR CERTIFICADO CON 0 HORAS
    // -------------------------------------------------

    if (
      resumen.horasAsistidas <= 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "No se puede generar el certificado porque el estudiante no tiene horas deportivas asistidas.",
      });
    }

    // -------------------------------------------------
    // VALIDAR 85% MÍNIMO DE ASISTENCIA
    // -------------------------------------------------

    if (
      resumen.porcentajeAsistencia <
      PORCENTAJE_MINIMO_CERTIFICADO
    ) {
      return res.status(400).json({
        ok: false,

        mensaje:
          `No se puede generar el certificado. ` +
          `El estudiante tiene ${resumen.porcentajeAsistencia}% de asistencia ` +
          `y debe cumplir como mínimo con el ${PORCENTAJE_MINIMO_CERTIFICADO}%.`,
      });
    }

    // -------------------------------------------------
    // REGISTRAR CERTIFICADO
    // -------------------------------------------------

    const [resultado] =
      await pool.query(
        `
          INSERT INTO certificados
          (
            id_estudiante,
            horas_certificadas,
            fecha_generacion
          )
          VALUES (?, ?, NOW())
        `,
        [
          id,
          resumen.horasAsistidas,
        ]
      );

    // -------------------------------------------------
    // CONSULTAR CERTIFICADO GENERADO
    // -------------------------------------------------

    const [certificados] =
      await pool.query(
        `
          SELECT
            c.id_certificado,
            c.id_estudiante,
            u.nombre AS estudiante,
            u.correo,
            c.horas_certificadas,
            c.fecha_generacion
          FROM certificados c
          INNER JOIN usuarios u
            ON u.id_usuario =
               c.id_estudiante
          WHERE c.id_certificado = ?
        `,
        [
          resultado.insertId,
        ]
      );

    return res.status(201).json({
      ok: true,

      mensaje:
        "Certificado generado correctamente",

      porcentaje_asistencia:
        resumen.porcentajeAsistencia,

      certificado:
        certificados[0],
    });
  } catch (error) {
    console.error(
      "Error al generar certificado:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al generar el certificado",
    });
  }
};

// =====================================================
// ELIMINAR CERTIFICADO
// =====================================================

const eliminarCertificado = async (
  req,
  res
) => {
  try {
    const {
      id,
      idCertificado,
    } = req.params;

    // -------------------------------------------------
    // BUSCAR CERTIFICADO
    // -------------------------------------------------

    const [certificados] =
      await pool.query(
        `
          SELECT
            id_certificado,
            id_estudiante
          FROM certificados
          WHERE id_certificado = ?
            AND id_estudiante = ?
        `,
        [
          idCertificado,
          id,
        ]
      );

    if (certificados.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Certificado no encontrado",
      });
    }

    // -------------------------------------------------
    // ELIMINAR CERTIFICADO
    // -------------------------------------------------

    await pool.query(
      `
        DELETE FROM certificados
        WHERE id_certificado = ?
          AND id_estudiante = ?
      `,
      [
        idCertificado,
        id,
      ]
    );

    return res.json({
      ok: true,
      mensaje:
        "Certificado eliminado correctamente",
    });
  } catch (error) {
    console.error(
      "Error al eliminar certificado:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al eliminar el certificado",
    });
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerEstudiantes,
  obtenerHorasEstudiante,
  obtenerCertificadosEstudiante,
  generarCertificado,
  eliminarCertificado,
};