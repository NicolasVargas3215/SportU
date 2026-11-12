const pool = require("../config/db");

// =====================================================
// CONFIGURACIÓN
// =====================================================

const PORCENTAJE_MINIMO_CERTIFICADO = 85;

/*
  Los eventos actuales utilizan fecha_inicio y fecha_fin.

  duracion_horas se conserva como respaldo porque la migración
  anterior dejó los campos antiguos en la tabla.
*/
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

// Para eventos con programación semanal, las horas se calculan por sesión.
// El respaldo antiguo solo se usa en eventos que todavía no tienen sesiones.
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

const convertirNumero = (valor) => {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
};

const redondear = (
  valor,
  decimales = 2
) => {
  const numero =
    convertirNumero(valor);

  const factor =
    10 ** decimales;

  return (
    Math.round(
      numero * factor
    ) / factor
  );
};

const calcularResumen =
  (actividades = []) => {
    let horasAcumuladas = 0;
    let horasEvaluadas = 0;

    let eventosAsistidos = 0;
    let eventosNoAsistidos = 0;
    let eventosPendientes = 0;

    actividades.forEach(
      (actividad) => {
        const duracion =
          convertirNumero(
            actividad.duracion_horas
          );

        if (
          actividad.asistencia ===
          "Asistió"
        ) {
          horasAcumuladas +=
            duracion;

          horasEvaluadas +=
            duracion;

          eventosAsistidos += 1;
        }

        if (
          actividad.asistencia ===
          "No asistió"
        ) {
          horasEvaluadas +=
            duracion;

          eventosNoAsistidos += 1;
        }

        if (
          actividad.asistencia ===
          "Pendiente"
        ) {
          eventosPendientes += 1;
        }
      }
    );

    horasAcumuladas =
      redondear(
        horasAcumuladas
      );

    horasEvaluadas =
      redondear(
        horasEvaluadas
      );

    const porcentajeAsistencia =
      horasEvaluadas > 0
        ? redondear(
            (
              horasAcumuladas /
              horasEvaluadas
            ) * 100,
            1
          )
        : 0;

    return {
      horas_acumuladas:
        horasAcumuladas,

      horas_evaluadas:
        horasEvaluadas,

      porcentaje_asistencia:
        porcentajeAsistencia,

      eventos_asistidos:
        eventosAsistidos,

      eventos_no_asistidos:
        eventosNoAsistidos,

      eventos_pendientes:
        eventosPendientes,

      eventos_evaluados:
        eventosAsistidos +
        eventosNoAsistidos,

      elegible_certificado:
        horasAcumuladas > 0 &&
        horasEvaluadas > 0 &&
        porcentajeAsistencia >=
          PORCENTAJE_MINIMO_CERTIFICADO,

      porcentaje_minimo:
        PORCENTAJE_MINIMO_CERTIFICADO,
    };
  };

// =====================================================
// OBTENER ESTUDIANTES CON RESUMEN DE HORAS
// =====================================================

const obtenerEstudiantesHoras =
  async (req, res) => {
    try {
      const [estudiantes] =
        await pool.query(`
          SELECT
            u.id_usuario,
            u.nombre,
            u.correo,

            ROUND(
              COALESCE(
                SUM(${HORAS_ASISTIDAS_SQL}),
                0
              ),
              2
            ) AS horas_acumuladas,

            ROUND(
              COALESCE(
                SUM(${HORAS_EVALUADAS_SQL}),
                0
              ),
              2
            ) AS horas_evaluadas,

            (
              SELECT COUNT(DISTINCT s.id_evento)
              FROM sesiones_evento s
              INNER JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
              INNER JOIN inscripciones i2
                ON i2.id_inscripcion = a.id_inscripcion
              WHERE i2.id_usuario = u.id_usuario
                AND a.estado = 'Asistió'
            ) AS eventos_asistidos,

            (
              SELECT COUNT(DISTINCT s.id_evento)
              FROM sesiones_evento s
              INNER JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
              INNER JOIN inscripciones i2
                ON i2.id_inscripcion = a.id_inscripcion
              WHERE i2.id_usuario = u.id_usuario
                AND a.estado = 'No asistió'
            ) AS eventos_no_asistidos,

            (
              SELECT COUNT(DISTINCT s.id_evento)
              FROM sesiones_evento s
              INNER JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
              INNER JOIN inscripciones i2
                ON i2.id_inscripcion = a.id_inscripcion
              WHERE i2.id_usuario = u.id_usuario
                AND a.estado = 'Pendiente'
            ) AS eventos_pendientes,

            (
              SELECT COUNT(DISTINCT s.id_evento)
              FROM sesiones_evento s
              INNER JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
              INNER JOIN inscripciones i2
                ON i2.id_inscripcion = a.id_inscripcion
              WHERE i2.id_usuario = u.id_usuario
                AND a.estado IN ('Asistió', 'No asistió')
            ) AS eventos_evaluados,

            CASE
              WHEN
                COALESCE(
                  SUM(${HORAS_EVALUADAS_SQL}),
                  0
                ) > 0
              THEN
                ROUND(
                  (
                    COALESCE(
                      SUM(${HORAS_ASISTIDAS_SQL}),
                      0
                    )
                    /
                    COALESCE(
                      SUM(${HORAS_EVALUADAS_SQL}),
                      0
                    )
                  ) * 100,
                  1
                )
              ELSE 0
            END AS porcentaje_asistencia,

            (
              SELECT COUNT(*)
              FROM certificados c
              WHERE
                c.id_estudiante =
                u.id_usuario
            ) AS certificados_generados

          FROM usuarios u

          LEFT JOIN inscripciones i
            ON
              i.id_usuario =
              u.id_usuario

          LEFT JOIN eventos e
            ON
              e.id_evento =
              i.id_evento

          WHERE
            u.rol = 'estudiante'
            AND
            u.estado = 'activo'

          GROUP BY
            u.id_usuario,
            u.nombre,
            u.correo

          ORDER BY
            u.nombre ASC
        `);

      const resultado =
        estudiantes.map(
          (estudiante) => {
            const horasAcumuladas =
              convertirNumero(
                estudiante.horas_acumuladas
              );

            const horasEvaluadas =
              convertirNumero(
                estudiante.horas_evaluadas
              );

            const porcentaje =
              convertirNumero(
                estudiante.porcentaje_asistencia
              );

            return {
              ...estudiante,

              horas_acumuladas:
                horasAcumuladas,

              horas_evaluadas:
                horasEvaluadas,

              porcentaje_asistencia:
                porcentaje,

              eventos_asistidos:
                convertirNumero(
                  estudiante.eventos_asistidos
                ),

              eventos_no_asistidos:
                convertirNumero(
                  estudiante.eventos_no_asistidos
                ),

              eventos_pendientes:
                convertirNumero(
                  estudiante.eventos_pendientes
                ),

              eventos_evaluados:
                convertirNumero(
                  estudiante.eventos_evaluados
                ),

              certificados_generados:
                convertirNumero(
                  estudiante.certificados_generados
                ),

              elegible_certificado:
                horasAcumuladas > 0 &&
                horasEvaluadas > 0 &&
                porcentaje >=
                  PORCENTAJE_MINIMO_CERTIFICADO,
            };
          }
        );

      return res.json({
        ok: true,

        porcentaje_minimo:
          PORCENTAJE_MINIMO_CERTIFICADO,

        estudiantes:
          resultado,
      });
    } catch (error) {
      console.error(
        "Error al consultar horas:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No fue posible consultar las horas deportivas.",
      });
    }
  };

// =====================================================
// DETALLE DE HORAS DE UN ESTUDIANTE
// =====================================================

const obtenerDetalleHorasEstudiante =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const idEstudiante =
        Number(id);

      if (
        !Number.isInteger(
          idEstudiante
        ) ||
        idEstudiante <= 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El estudiante seleccionado no es válido.",
        });
      }

      const [usuarios] =
        await pool.query(
          `
          SELECT
            id_usuario,
            nombre,
            correo,
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
        usuarios.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "El estudiante no existe.",
        });
      }

      const [actividades] =
        await pool.query(
          `
          SELECT
            i.id_inscripcion,

            e.id_evento,

            e.nombre AS evento,

            d.nombre AS deporte,

            s.id_sesion,

            DATE_FORMAT(
              COALESCE(s.fecha_sesion, e.fecha_inicio),
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_inicio,

            DATE_FORMAT(
              COALESCE(s.fecha_sesion, e.fecha_fin),
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_fin,

            ROUND(
              COALESCE(
                TIMESTAMPDIFF(
                  MINUTE,
                  CONCAT(s.fecha_sesion, ' ', s.hora_inicio),
                  CONCAT(s.fecha_sesion, ' ', s.hora_fin)
                ) / 60.0,
                ${DURACION_EVENTO_SQL}
              ),
              2
            ) AS duracion_horas,

            CASE
              WHEN a.estado IS NOT NULL THEN a.estado
              WHEN i.asistencia = 'asistio' THEN 'Asistió'
              WHEN i.asistencia = 'no_asistio' THEN 'No asistió'
              ELSE 'Pendiente'
            END AS asistencia,

            CASE
              WHEN a.estado = 'Asistió'
                OR (a.estado IS NULL AND i.asistencia = 'asistio')
              THEN
                ROUND(
                  COALESCE(
                    TIMESTAMPDIFF(
                      MINUTE,
                      CONCAT(s.fecha_sesion, ' ', s.hora_inicio),
                      CONCAT(s.fecha_sesion, ' ', s.hora_fin)
                    ) / 60.0,
                    ${DURACION_EVENTO_SQL}
                  ),
                  2
                )
              ELSE 0
            END AS horas_obtenidas

          FROM inscripciones i

          INNER JOIN eventos e
            ON
              e.id_evento =
              i.id_evento

          LEFT JOIN deportes d
            ON
              d.id_deporte =
              e.id_deporte

          LEFT JOIN sesiones_evento s
            ON
              s.id_evento =
              e.id_evento

          LEFT JOIN asistencias_sesion a
            ON
              a.id_sesion =
              s.id_sesion
              AND
              a.id_inscripcion =
              i.id_inscripcion

          WHERE
            i.id_usuario = ?

          ORDER BY
            COALESCE(s.fecha_sesion, DATE(e.fecha_inicio)) DESC
          `,
          [
            idEstudiante,
          ]
        );

      const actividadesNormalizadas =
        actividades.map(
          (actividad) => ({
            ...actividad,

            duracion_horas:
              convertirNumero(
                actividad.duracion_horas
              ),

            horas_obtenidas:
              convertirNumero(
                actividad.horas_obtenidas
              ),
          })
        );

      const resumen =
        calcularResumen(
          actividadesNormalizadas
        );

      const [certificados] =
        await pool.query(
          `
          SELECT
            id_certificado,
            id_estudiante,
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
          `,
          [
            idEstudiante,
          ]
        );

      return res.json({
        ok: true,

        estudiante:
          usuarios[0],

        resumen,

        actividades:
          actividadesNormalizadas,

        certificados:
          certificados.map(
            (certificado) => ({
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
        "Error al consultar detalle de horas:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No fue posible consultar el detalle de horas deportivas.",
      });
    }
  };

// =====================================================
// CONSULTAR TODOS LOS CERTIFICADOS
// =====================================================

const obtenerCertificados =
  async (req, res) => {
    try {
      const [certificados] =
        await pool.query(`
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

          ORDER BY
            c.fecha_generacion DESC,
            c.id_certificado DESC
        `);

      return res.json({
        ok: true,

        certificados:
          certificados.map(
            (certificado) => ({
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
        "Error al consultar certificados:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No fue posible consultar los certificados.",
      });
    }
  };

// =====================================================
// GENERAR CERTIFICADO
// =====================================================

const generarCertificado =
  async (req, res) => {
    let conexion;

    try {
      const {
        id,
      } = req.params;

      const idEstudiante =
        Number(id);

      if (
        !Number.isInteger(
          idEstudiante
        ) ||
        idEstudiante <= 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El estudiante seleccionado no es válido.",
        });
      }

      conexion =
        await pool.getConnection();

      await conexion.beginTransaction();

      const [usuarios] =
        await conexion.query(
          `
          SELECT
            id_usuario,
            nombre,
            correo,
            estado

          FROM usuarios

          WHERE
            id_usuario = ?
            AND rol = 'estudiante'

          LIMIT 1

          FOR UPDATE
          `,
          [
            idEstudiante,
          ]
        );

      if (
        usuarios.length === 0
      ) {
        await conexion.rollback();

        return res.status(404).json({
          ok: false,
          mensaje:
            "El estudiante no existe.",
        });
      }

      const estudiante =
        usuarios[0];

      if (
        estudiante.estado !==
        "activo"
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,
          mensaje:
            "No se puede generar un certificado para un estudiante inactivo.",
        });
      }

      const [resultadoHoras] =
        await conexion.query(
          `
          SELECT

            ROUND(
              COALESCE(
                SUM(${HORAS_ASISTIDAS_SQL}),
                0
              ),
              2
            ) AS horas_acumuladas,

            ROUND(
              COALESCE(
                SUM(${HORAS_EVALUADAS_SQL}),
                0
              ),
              2
            ) AS horas_evaluadas

          FROM inscripciones i

          INNER JOIN eventos e
            ON
              e.id_evento =
              i.id_evento

          WHERE
            i.id_usuario = ?
          `,
          [
            idEstudiante,
          ]
        );

      const horasAcumuladas =
        convertirNumero(
          resultadoHoras[0]
            ?.horas_acumuladas
        );

      const horasEvaluadas =
        convertirNumero(
          resultadoHoras[0]
            ?.horas_evaluadas
        );

      const porcentajeAsistencia =
        horasEvaluadas > 0
          ? redondear(
              (
                horasAcumuladas /
                horasEvaluadas
              ) * 100,
              1
            )
          : 0;

      if (
        horasAcumuladas <= 0
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,
          mensaje:
            "El estudiante todavía no tiene horas deportivas asistidas para certificar.",
        });
      }

      if (
        porcentajeAsistencia <
        PORCENTAJE_MINIMO_CERTIFICADO
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,

          mensaje:
            `El estudiante tiene ${porcentajeAsistencia}% de asistencia. ` +
            `Se requiere mínimo ${PORCENTAJE_MINIMO_CERTIFICADO}% para generar el certificado.`,
        });
      }

      const [resultado] =
        await conexion.query(
          `
          INSERT INTO certificados
          (
            id_estudiante,
            horas_certificadas,
            fecha_generacion
          )
          VALUES
          (
            ?,
            ?,
            NOW()
          )
          `,
          [
            idEstudiante,
            horasAcumuladas,
          ]
        );

      const [certificados] =
        await conexion.query(
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
            c.id_certificado = ?

          LIMIT 1
          `,
          [
            resultado.insertId,
          ]
        );

      await conexion.commit();

      return res.status(201).json({
        ok: true,

        mensaje:
          "Certificado generado correctamente.",

        certificado: {
          ...certificados[0],

          horas_certificadas:
            convertirNumero(
              certificados[0]
                .horas_certificadas
            ),

          porcentaje_asistencia:
            porcentajeAsistencia,
        },
      });
    } catch (error) {
      if (conexion) {
        try {
          await conexion.rollback();
        } catch {
          // Sin acción adicional.
        }
      }

      console.error(
        "Error al generar certificado:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No fue posible generar el certificado.",
      });
    } finally {
      if (conexion) {
        conexion.release();
      }
    }
  };

// =====================================================
// ELIMINAR CERTIFICADO
// =====================================================

const eliminarCertificado =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const idCertificado =
        Number(id);

      if (
        !Number.isInteger(
          idCertificado
        ) ||
        idCertificado <= 0
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El certificado seleccionado no es válido.",
        });
      }

      const [certificados] =
        await pool.query(
          `
          SELECT
            id_certificado
          FROM certificados
          WHERE
            id_certificado = ?
          LIMIT 1
          `,
          [
            idCertificado,
          ]
        );

      if (
        certificados.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "El certificado no existe.",
        });
      }

      await pool.query(
        `
        DELETE FROM certificados
        WHERE
          id_certificado = ?
        `,
        [
          idCertificado,
        ]
      );

      return res.json({
        ok: true,
        mensaje:
          "Certificado eliminado correctamente.",
      });
    } catch (error) {
      console.error(
        "Error al eliminar certificado:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No fue posible eliminar el certificado.",
      });
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  obtenerEstudiantesHoras,
  obtenerDetalleHorasEstudiante,
  obtenerCertificados,
  generarCertificado,
  eliminarCertificado,
};
