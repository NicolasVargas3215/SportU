const pool = require("../config/db");

// =====================================================
// OBTENER EVENTOS DISPONIBLES PARA EL ESTUDIANTE
// =====================================================

const obtenerEventosDisponibles = async (
  req,
  res
) => {
  try {
    const idUsuario =
      req.usuario.id_usuario;

    const [eventos] =
      await pool.query(
        `
          SELECT
            e.id_evento,
            e.nombre,

            e.id_deporte,
            d.nombre AS deporte,

            e.id_docente,
            u.nombre AS docente,

            DATE_FORMAT(
              e.fecha_inicio,
              '%Y-%m-%dT%H:%i'
            ) AS fecha_inicio,

            DATE_FORMAT(
              e.fecha_fin,
              '%Y-%m-%dT%H:%i'
            ) AS fecha_fin,

            -- Compatibilidad temporal
            DATE_FORMAT(
              e.fecha_inicio,
              '%Y-%m-%d'
            ) AS fecha,

            TIME_FORMAT(
              e.fecha_inicio,
              '%H:%i'
            ) AS hora,

            e.hora_inicio,
            e.hora_fin,

            (
              SELECT GROUP_CONCAT(
                ed.dia_semana
                ORDER BY FIELD(
                  ed.dia_semana,
                  'lunes', 'martes', 'miercoles', 'jueves',
                  'viernes', 'sabado', 'domingo'
                )
                SEPARATOR ','
              )
              FROM evento_dias_semana ed
              WHERE ed.id_evento = e.id_evento
            ) AS dias_semana,

            e.lugar,
            e.duracion_horas,
            e.cupo_maximo,
            e.estado,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
            ) AS inscritos,

            EXISTS(
              SELECT 1
              FROM inscripciones i2
              WHERE
                i2.id_evento =
                e.id_evento
                AND
                i2.id_usuario = ?
            ) AS inscrito

          FROM eventos e

          INNER JOIN deportes d
            ON d.id_deporte =
            e.id_deporte

          INNER JOIN usuarios u
            ON u.id_usuario =
            e.id_docente

          WHERE
            e.estado =
            'inscripciones_abiertas'

          ORDER BY
            e.fecha_inicio ASC
        `,
        [idUsuario]
      );

    const eventosProcesados =
      eventos.map(
        (evento) => {
          const cupoMaximo =
            Number(
              evento.cupo_maximo
            ) || 0;

          const inscritos =
            Number(
              evento.inscritos
            ) || 0;

          const cuposDisponibles =
            Math.max(
              cupoMaximo -
                inscritos,
              0
            );

          return {
            ...evento,

            inscritos,

            cupos_disponibles:
              cuposDisponibles,

            inscrito:
              Boolean(
                evento.inscrito
              ),

            dias_semana:
              evento.dias_semana
                ? String(evento.dias_semana).split(",")
                : [],
          };
        }
      );

    return res.json({
      ok: true,

      eventos:
        eventosProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar eventos disponibles:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        mensaje:
          "Error al consultar los eventos disponibles",
      });
  }
};

// =====================================================
// REGISTRAR INSCRIPCIÓN
// =====================================================

const registrarInscripcion =
  async (req, res) => {
    const conexion =
      await pool.getConnection();

    try {
      const idUsuario =
        req.usuario.id_usuario;

      const {
        idEvento,
      } = req.params;

      if (!idEvento) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "El evento es obligatorio",
          });
      }

      await conexion.beginTransaction();

      // =================================================
      // VALIDAR ESTUDIANTE
      // =================================================

      const [
        usuarios,
      ] =
        await conexion.query(
          `
            SELECT
              id_usuario,
              rol,
              estado
            FROM usuarios
            WHERE id_usuario = ?
            FOR UPDATE
          `,
          [idUsuario]
        );

      if (
        usuarios.length ===
        0
      ) {
        await conexion.rollback();

        return res
          .status(404)
          .json({
            ok: false,

            mensaje:
              "Usuario no encontrado",
          });
      }

      const usuario =
        usuarios[0];

      if (
        usuario.rol !==
        "estudiante"
      ) {
        await conexion.rollback();

        return res
          .status(403)
          .json({
            ok: false,

            mensaje:
              "Solo los estudiantes pueden inscribirse en eventos",
          });
      }

      if (
        usuario.estado !==
        "activo"
      ) {
        await conexion.rollback();

        return res
          .status(403)
          .json({
            ok: false,

            mensaje:
              "El estudiante se encuentra inactivo",
          });
      }

      // =================================================
      // VALIDAR EVENTO
      // =================================================

      const [
        eventos,
      ] =
        await conexion.query(
          `
            SELECT
              id_evento,
              nombre,
              cupo_maximo,
              estado,
              fecha_inicio,
              fecha_fin
            FROM eventos
            WHERE id_evento = ?
            FOR UPDATE
          `,
          [idEvento]
        );

      if (
        eventos.length === 0
      ) {
        await conexion.rollback();

        return res
          .status(404)
          .json({
            ok: false,

            mensaje:
              "Evento no encontrado",
          });
      }

      const evento =
        eventos[0];

      // =================================================
      // NUEVA REGLA DE ESTADO
      // =================================================

      if (
        evento.estado !==
        "inscripciones_abiertas"
      ) {
        await conexion.rollback();

        let mensaje =
          "El evento no se encuentra disponible para inscripción";

        if (
          evento.estado ===
          "borrador"
        ) {
          mensaje =
            "Las inscripciones de este evento todavía no están abiertas";
        }

        if (
          evento.estado ===
          "en_curso"
        ) {
          mensaje =
            "El evento ya se encuentra en curso";
        }

        if (
          evento.estado ===
          "finalizado"
        ) {
          mensaje =
            "El evento ya finalizó";
        }

        if (
          evento.estado ===
          "cancelado"
        ) {
          mensaje =
            "El evento fue cancelado";
        }

        return res
          .status(400)
          .json({
            ok: false,
            mensaje,
          });
      }

      // =================================================
      // EVITAR INSCRIPCIÓN DUPLICADA
      // =================================================

      const [
        inscripcionesExistentes,
      ] =
        await conexion.query(
          `
            SELECT
              id_inscripcion
            FROM inscripciones
            WHERE
              id_usuario = ?
              AND
              id_evento = ?
            LIMIT 1
          `,
          [
            idUsuario,
            idEvento,
          ]
        );

      if (
        inscripcionesExistentes.length >
        0
      ) {
        await conexion.rollback();

        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "Ya estás inscrito en este evento",
          });
      }

      // =================================================
      // CONSULTAR CUPO
      // =================================================

      const [
        resultadoCantidad,
      ] =
        await conexion.query(
          `
            SELECT
              COUNT(*) AS total
            FROM inscripciones
            WHERE id_evento = ?
          `,
          [idEvento]
        );

      const inscritos =
        Number(
          resultadoCantidad[0]
            .total
        ) || 0;

      const cupoMaximo =
        Number(
          evento.cupo_maximo
        ) || 0;

      if (
        inscritos >=
        cupoMaximo
      ) {
        await conexion.rollback();

        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "No existen cupos disponibles para este evento",
          });
      }

      // =================================================
      // INSERTAR INSCRIPCIÓN
      // =================================================

      const [
        resultado,
      ] =
        await conexion.query(
          `
            INSERT INTO inscripciones
            (
              id_usuario,
              id_evento,
              fecha_inscripcion,
              asistencia
            )
            VALUES
            (
              ?,
              ?,
              NOW(),
              'Pendiente'
            )
          `,
          [
            idUsuario,
            idEvento,
          ]
        );

      await conexion.commit();

      return res
        .status(201)
        .json({
          ok: true,

          mensaje:
            "Inscripción realizada correctamente",

          id_inscripcion:
            resultado.insertId,

          cupos_disponibles:
            cupoMaximo -
            inscritos -
            1,
        });
    } catch (error) {
      try {
        await conexion.rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Error al revertir la transacción:",
          rollbackError
        );
      }

      console.error(
        "Error al registrar inscripción:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al registrar la inscripción",
        });
    } finally {
      conexion.release();
    }
  };

// =====================================================
// OBTENER MIS INSCRIPCIONES
// =====================================================

const obtenerMisInscripciones =
  async (req, res) => {
    try {
      const idUsuario =
        req.usuario.id_usuario;

      const [
        inscripciones,
      ] =
        await pool.query(
          `
            SELECT
              i.id_inscripcion,
              i.id_evento,

              e.nombre AS evento,

              d.nombre AS deporte,

              u.nombre AS docente,

              DATE_FORMAT(
                e.fecha_inicio,
                '%Y-%m-%dT%H:%i'
              ) AS fecha_inicio,

              DATE_FORMAT(
                e.fecha_fin,
                '%Y-%m-%dT%H:%i'
              ) AS fecha_fin,

              -- Compatibilidad temporal
              DATE_FORMAT(
                e.fecha_inicio,
                '%Y-%m-%d'
              ) AS fecha,

              TIME_FORMAT(
                e.fecha_inicio,
                '%H:%i'
              ) AS hora,

              e.lugar,
              e.duracion_horas,
              e.estado AS estado_evento,

              COALESCE(
                sesiones_totales.sesiones_programadas,
                0
              ) AS sesiones_programadas,

              COALESCE(
                sesiones_asistencia.sesiones_evaluadas,
                0
              ) AS sesiones_evaluadas,

              COALESCE(
                sesiones_asistencia.asistencias,
                0
              ) AS asistencias,

              COALESCE(
                sesiones_asistencia.no_asistencias,
                0
              ) AS no_asistencias,

              COALESCE(
                sesiones_asistencia.pendientes,
                0
              ) AS pendientes,

              COALESCE(
                sesiones_asistencia.horas_obtenidas,
                0
              ) AS horas_obtenidas,

              CASE
                WHEN COALESCE(
                  sesiones_totales.sesiones_programadas,
                  0
                ) > 0 THEN
                  CASE
                    WHEN COALESCE(sesiones_asistencia.pendientes, 0) > 0
                      THEN 'Pendiente'
                    WHEN COALESCE(sesiones_asistencia.asistencias, 0) > 0
                      AND COALESCE(sesiones_asistencia.no_asistencias, 0) = 0
                      THEN 'Asistió'
                    WHEN COALESCE(sesiones_asistencia.no_asistencias, 0) > 0
                      AND COALESCE(sesiones_asistencia.asistencias, 0) = 0
                      THEN 'No asistió'
                    ELSE 'Pendiente'
                  END
                WHEN i.asistencia = 'asistio'
                  THEN 'Asistió'
                WHEN i.asistencia = 'no_asistio'
                  THEN 'No asistió'
                ELSE 'Pendiente'
              END AS asistencia,

              DATE_FORMAT(
                i.fecha_inscripcion,
                '%Y-%m-%d'
              ) AS fecha_inscripcion

            FROM inscripciones i

            INNER JOIN eventos e
              ON e.id_evento =
              i.id_evento

            INNER JOIN deportes d
              ON d.id_deporte =
              e.id_deporte

            INNER JOIN usuarios u
              ON u.id_usuario =
              e.id_docente

            LEFT JOIN (
              SELECT
                id_evento,
                COUNT(*) AS sesiones_programadas
              FROM sesiones_evento
              GROUP BY id_evento
            ) sesiones_totales
              ON sesiones_totales.id_evento = e.id_evento

            LEFT JOIN (
              SELECT
                s.id_evento,
                a.id_inscripcion,
                SUM(
                  CASE
                    WHEN a.estado IN ('Asistió', 'No asistió')
                      THEN 1
                    ELSE 0
                  END
                ) AS sesiones_evaluadas,
                SUM(
                  CASE WHEN a.estado = 'Asistió' THEN 1 ELSE 0 END
                ) AS asistencias,
                SUM(
                  CASE WHEN a.estado = 'No asistió' THEN 1 ELSE 0 END
                ) AS no_asistencias,
                SUM(
                  CASE WHEN a.estado = 'Pendiente' THEN 1 ELSE 0 END
                ) AS pendientes,
                SUM(
                  CASE
                    WHEN a.estado = 'Asistió' THEN
                      TIME_TO_SEC(
                        TIMEDIFF(s.hora_fin, s.hora_inicio)
                      ) / 3600
                    ELSE 0
                  END
                ) AS horas_obtenidas
              FROM sesiones_evento s
              LEFT JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
              GROUP BY
                s.id_evento,
                a.id_inscripcion
            ) sesiones_asistencia
              ON sesiones_asistencia.id_evento = e.id_evento
              AND sesiones_asistencia.id_inscripcion = i.id_inscripcion

            WHERE
              i.id_usuario = ?

            ORDER BY
              e.fecha_inicio DESC
          `,
          [idUsuario]
        );

      return res.json({
        ok: true,

        inscripciones,
      });
    } catch (error) {
      console.error(
        "Error al consultar mis inscripciones:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al consultar las inscripciones",
        });
    }
  };

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerEventosDisponibles,
  registrarInscripcion,
  obtenerMisInscripciones,
};
