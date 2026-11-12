const pool =
  require("../config/db");

// =====================================================
// DURACIÓN DE EVENTO
// =====================================================

const DURACION_EVENTO_SQL = `
  COALESCE(
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

// =====================================================
// DASHBOARD COORDINADOR
// =====================================================

const obtenerDashboardCoordinador =
  async (
    req,
    res
  ) => {
    try {
      const [
        resultados,
      ] =
        await pool.query(
          `
          SELECT

            (
              SELECT COUNT(*)

              FROM deportes

              WHERE
                estado = 'activo'
            ) AS deportes_activos,

            (
              SELECT COUNT(*)

              FROM eventos

              WHERE
                estado IN (
                  'inscripciones_abiertas',
                  'en_curso'
                )
            ) AS eventos_activos,

            (
              SELECT
                COALESCE(
                  SUM(
                    cantidad_total
                  ),
                  0
                )

              FROM equipos_deportivos

              WHERE
                eliminado = 0
            ) AS unidades_inventario,

            (
              SELECT COUNT(*)

              FROM prestamos

              WHERE
                estado = 'prestado'
            ) AS prestamos_activos,

            (
              SELECT COUNT(*)

              FROM usuarios

              WHERE
                rol = 'estudiante'
                AND estado = 'activo'
            ) AS estudiantes_activos,

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
            ) AS horas_totales,

            (
              SELECT COUNT(*)

              FROM certificados
            ) AS certificados_generados,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              WHERE a.estado = 'Pendiente'
            ) AS asistencias_pendientes
          `
        );

      const datos =
        resultados[0] || {};

      return res.json({
        ok: true,

        resumen: {
          deportes_activos:
            convertirNumero(
              datos.deportes_activos
            ),

          eventos_activos:
            convertirNumero(
              datos.eventos_activos
            ),

          unidades_inventario:
            convertirNumero(
              datos.unidades_inventario
            ),

          prestamos_activos:
            convertirNumero(
              datos.prestamos_activos
            ),

          estudiantes_activos:
            convertirNumero(
              datos.estudiantes_activos
            ),

          horas_totales:
            convertirNumero(
              datos.horas_totales
            ),

          certificados_generados:
            convertirNumero(
              datos.certificados_generados
            ),

          asistencias_pendientes:
            convertirNumero(
              datos.asistencias_pendientes
            ),
        },
      });
    } catch (error) {
      console.error(
        "Error al consultar dashboard coordinador:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "No fue posible cargar el panel del coordinador.",
        });
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  obtenerDashboardCoordinador,
};
