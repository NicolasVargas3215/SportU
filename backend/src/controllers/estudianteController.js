const pool =
  require("../config/db");

// =====================================================
// CONFIGURACIÓN
// =====================================================

const DURACION_EVENTO_SQL = `
  COALESCE(
    NULLIF(
      GREATEST(
        TIMESTAMPDIFF(
          MINUTE,
          CONCAT('2000-01-01 ', e.hora_inicio),
          CONCAT('2000-01-01 ', e.hora_fin)
        ) / 60.0,
        0
      ),
      0
    ),
    NULLIF(
      GREATEST(
        TIMESTAMPDIFF(
          MINUTE,
          e.fecha_inicio,
          e.fecha_fin
        ) / 60.0,
        0
      ),
      0
    ),
    e.duracion_horas,
    0
  )
`;

const HORAS_ASISTIDAS_SQL = `
  COALESCE(
    (
      SELECT SUM(
        CASE
          WHEN a.estado = 'Asistió'
          THEN TIMESTAMPDIFF(
            MINUTE,
            CONCAT(s.fecha_sesion, ' ', s.hora_inicio),
            CONCAT(s.fecha_sesion, ' ', s.hora_fin)
          ) / 60.0
          ELSE 0
        END
      )
      FROM sesiones_evento s
      LEFT JOIN asistencias_sesion a
        ON a.id_sesion = s.id_sesion
        AND a.id_inscripcion = i.id_inscripcion
      WHERE s.id_evento = e.id_evento
    ),
    CASE
      WHEN i.asistencia = 'asistio'
      THEN ${DURACION_EVENTO_SQL}
      ELSE 0
    END
  )
`;

const HORAS_EVALUADAS_SQL = `
  COALESCE(
    (
      SELECT SUM(
        CASE
          WHEN a.estado IN ('Asistió', 'No asistió')
          THEN TIMESTAMPDIFF(
            MINUTE,
            CONCAT(s.fecha_sesion, ' ', s.hora_inicio),
            CONCAT(s.fecha_sesion, ' ', s.hora_fin)
          ) / 60.0
          ELSE 0
        END
      )
      FROM sesiones_evento s
      LEFT JOIN asistencias_sesion a
        ON a.id_sesion = s.id_sesion
        AND a.id_inscripcion = i.id_inscripcion
      WHERE s.id_evento = e.id_evento
    ),
    CASE
      WHEN i.asistencia IN ('asistio', 'no_asistio')
      THEN ${DURACION_EVENTO_SQL}
      ELSE 0
    END
  )
`;

// =====================================================
// HELPERS
// =====================================================

const convertirNumero =
  (valor) => {
    const numero =
      Number(valor);

    return Number.isFinite(
      numero
    )
      ? numero
      : 0;
  };

const redondear =
  (
    valor,
    decimales = 2
  ) => {
    const numero =
      convertirNumero(
        valor
      );

    const factor =
      10 ** decimales;

    return (
      Math.round(
        numero *
          factor
      ) / factor
    );
  };

// =====================================================
// PERFIL
// =====================================================

const obtenerPerfilEstudiante =
  async (
    req,
    res
  ) => {
    try {
      const idEstudiante =
        req.usuario.id_usuario;

      const [usuarios] =
        await pool.query(
          `
          SELECT
            id_usuario,
            nombre,
            correo,
            rol,
            estado
          FROM usuarios
          WHERE
            id_usuario = ?
            AND rol = 'estudiante'
          LIMIT 1
          `,
          [
            idEstudiante,
          ]
        );

      if (
        usuarios.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            ok: false,

            mensaje:
              "No se encontró el perfil del estudiante.",
          });
      }

      return res.json({
        ok: true,

        estudiante:
          usuarios[0],
      });
    } catch (error) {
      console.error(
        "Error al consultar perfil estudiante:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "No fue posible consultar el perfil.",
        });
    }
  };

// =====================================================
// RESUMEN
// =====================================================

const obtenerResumenEstudiante =
  async (
    req,
    res
  ) => {
    try {
      const idEstudiante =
        req.usuario.id_usuario;

      const [
        resultados,
      ] =
        await pool.query(
          `
          SELECT

            (
              SELECT COUNT(*)

              FROM inscripciones i

              WHERE
                i.id_usuario = ?
            ) AS total_inscripciones,

            (
              SELECT COUNT(*)

              FROM inscripciones i

              INNER JOIN eventos e
                ON
                  e.id_evento =
                  i.id_evento

              WHERE
                i.id_usuario = ?
                AND e.fecha_inicio >= NOW()
                AND e.estado <> 'cancelado'
            ) AS eventos_proximos,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN inscripciones i
                ON i.id_inscripcion = a.id_inscripcion
              WHERE
                i.id_usuario = ?
                AND a.estado = 'Asistió'
            ) AS asistencias_confirmadas,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN inscripciones i
                ON i.id_inscripcion = a.id_inscripcion
              WHERE
                i.id_usuario = ?
                AND a.estado = 'Pendiente'
            ) AS asistencias_pendientes,

            (
              SELECT
                ROUND(
                  COALESCE(
                    SUM(${HORAS_ASISTIDAS_SQL}),
                    0
                  ),
                  2
                )

              FROM inscripciones i

              INNER JOIN eventos e
                ON
                  e.id_evento =
                  i.id_evento

              WHERE
                i.id_usuario = ?
            ) AS horas_acumuladas,

            (
              SELECT
                ROUND(
                  COALESCE(
                    SUM(${HORAS_EVALUADAS_SQL}),
                    0
                  ),
                  2
                )

              FROM inscripciones i

              INNER JOIN eventos e
                ON
                  e.id_evento =
                  i.id_evento

              WHERE
                i.id_usuario = ?
            ) AS horas_evaluadas,

            (
              SELECT COUNT(*)

              FROM certificados c

              WHERE
                c.id_estudiante = ?
            ) AS certificados_generados
          `,
          [
            idEstudiante,
            idEstudiante,
            idEstudiante,
            idEstudiante,
            idEstudiante,
            idEstudiante,
            idEstudiante,
          ]
        );

      const resumenBD =
        resultados[0] || {};

      const horasAcumuladas =
        convertirNumero(
          resumenBD.horas_acumuladas
        );

      const horasEvaluadas =
        convertirNumero(
          resumenBD.horas_evaluadas
        );

      const porcentajeAsistencia =
        horasEvaluadas > 0
          ? redondear(
              (
                horasAcumuladas /
                horasEvaluadas
              ) *
                100,
              1
            )
          : 0;

      // =================================================
      // PRÓXIMAS ACTIVIDADES
      // =================================================

      const [
        proximasActividades,
      ] =
        await pool.query(
          `
          SELECT
            i.id_inscripcion,

            e.id_evento,

            e.nombre AS evento,

            d.nombre AS deporte,

            u.nombre AS docente,

            DATE_FORMAT(
              e.fecha_inicio,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_inicio,

            DATE_FORMAT(
              e.fecha_fin,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_fin,

            e.lugar,

            ROUND(
              ${DURACION_EVENTO_SQL},
              2
            ) AS duracion_horas,

            e.estado,

            CASE
              WHEN i.asistencia = 'asistio' THEN 'Asistió'
              WHEN i.asistencia = 'no_asistio' THEN 'No asistió'
              ELSE 'Pendiente'
            END AS asistencia

          FROM inscripciones i

          INNER JOIN eventos e
            ON
              e.id_evento =
              i.id_evento

          INNER JOIN deportes d
            ON
              d.id_deporte =
              e.id_deporte

          LEFT JOIN usuarios u
            ON
              u.id_usuario =
              e.id_docente

          WHERE
            i.id_usuario = ?
            AND e.fecha_inicio >= NOW()
            AND e.estado <> 'cancelado'

          ORDER BY
            e.fecha_inicio ASC

          LIMIT 5
          `,
          [
            idEstudiante,
          ]
        );

      // =================================================
      // CERTIFICADOS RECIENTES
      // =================================================

      const [
        certificados,
      ] =
        await pool.query(
          `
          SELECT
            id_certificado,
            horas_certificadas,

            DATE_FORMAT(
              fecha_generacion,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_generacion

          FROM certificados

          WHERE
            id_estudiante = ?

          ORDER BY
            fecha_generacion DESC,
            id_certificado DESC

          LIMIT 3
          `,
          [
            idEstudiante,
          ]
        );

      return res.json({
        ok: true,

        resumen: {
          total_inscripciones:
            convertirNumero(
              resumenBD.total_inscripciones
            ),

          eventos_proximos:
            convertirNumero(
              resumenBD.eventos_proximos
            ),

          asistencias_confirmadas:
            convertirNumero(
              resumenBD.asistencias_confirmadas
            ),

          asistencias_pendientes:
            convertirNumero(
              resumenBD.asistencias_pendientes
            ),

          horas_acumuladas:
            horasAcumuladas,

          horas_evaluadas:
            horasEvaluadas,

          porcentaje_asistencia:
            porcentajeAsistencia,

          certificados_generados:
            convertirNumero(
              resumenBD.certificados_generados
            ),
        },

        proximas_actividades:
          proximasActividades.map(
            (
              actividad
            ) => ({
              ...actividad,

              duracion_horas:
                convertirNumero(
                  actividad.duracion_horas
                ),
            })
          ),

        certificados_recientes:
          certificados.map(
            (
              certificado
            ) => ({
              ...certificado,

              horas_certificadas:
                convertirNumero(
                  certificado.horas_certificadas
                ),
            })
          ),
      });
    } catch (error) {
      console.error(
        "Error al consultar resumen estudiante:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "No fue posible consultar el resumen del estudiante.",
        });
    }
  };

// =====================================================
// CERTIFICADOS DEL ESTUDIANTE
// =====================================================

const obtenerCertificadosEstudiante =
  async (
    req,
    res
  ) => {
    try {
      const idEstudiante =
        req.usuario.id_usuario;

      const [
        certificados,
      ] =
        await pool.query(
          `
          SELECT
            c.id_certificado,

            c.id_estudiante,

            u.nombre AS estudiante,

            u.correo,

            c.horas_certificadas,

            DATE_FORMAT(
              c.fecha_generacion,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_generacion

          FROM certificados c

          INNER JOIN usuarios u
            ON
              u.id_usuario =
              c.id_estudiante

          WHERE
            c.id_estudiante = ?

          ORDER BY
            c.fecha_generacion DESC,
            c.id_certificado DESC
          `,
          [
            idEstudiante,
          ]
        );

      return res.json({
        ok: true,

        certificados:
          certificados.map(
            (
              certificado
            ) => ({
              ...certificado,

              horas_certificadas:
                convertirNumero(
                  certificado.horas_certificadas
                ),
            })
          ),
      });
    } catch (error) {
      console.error(
        "Error al consultar certificados estudiante:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "No fue posible consultar tus certificados.",
        });
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  obtenerPerfilEstudiante,
  obtenerResumenEstudiante,
  obtenerCertificadosEstudiante,
};
