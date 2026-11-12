const pool = require("../config/db");

// =====================================================
// DURACIÓN DEL EVENTO
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

const DURACION_TOTAL_EVENTO_SQL = `
  COALESCE(
    NULLIF(
      (
        SELECT SUM(
          TIMESTAMPDIFF(
            MINUTE,
            CONCAT(s.fecha_sesion, ' ', s.hora_inicio),
            CONCAT(s.fecha_sesion, ' ', s.hora_fin)
          ) / 60.0
        )
        FROM sesiones_evento s
        WHERE s.id_evento = e.id_evento
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

// =====================================================
// HELPERS
// =====================================================

const convertirNumero = (valor) => {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
};

const normalizarAsistencia = (valor) => {
  const estado = String(valor || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const equivalencias = {
    pendiente: "Pendiente",
    asistio: "Asistió",
    "no asistio": "No asistió",
  };

  return equivalencias[estado] || null;
};

const asistenciaLegacy = (valor) => {
  const equivalencias = {
    Pendiente: "pendiente",
    "Asistió": "asistio",
    "No asistió": "no_asistio",
  };

  return equivalencias[valor] || "pendiente";
};

const normalizarEvento = (evento) => ({
  ...evento,

  hora_inicio: evento.hora_inicio
    ? String(evento.hora_inicio).slice(0, 5)
    : null,

  hora_fin: evento.hora_fin
    ? String(evento.hora_fin).slice(0, 5)
    : null,

  dias_semana: evento.dias_semana
    ? String(evento.dias_semana).split(",")
    : [],

  duracion_horas:
    convertirNumero(
      evento.duracion_horas
    ),

  duracion_total_horas:
    convertirNumero(
      evento.duracion_total_horas
    ),

  cupo_maximo:
    convertirNumero(
      evento.cupo_maximo
    ),

  inscritos:
    convertirNumero(
      evento.inscritos
    ),

  asistieron:
    convertirNumero(
      evento.asistieron
    ),

  no_asistieron:
    convertirNumero(
      evento.no_asistieron
    ),

  pendientes:
    convertirNumero(
      evento.pendientes
    ),

  puede_registrar_asistencia:
    [
      "en_curso",
      "finalizado",
    ].includes(
      evento.estado
    ),
});

// =====================================================
// DASHBOARD DOCENTE
// =====================================================

const obtenerResumenDocente =
  async (req, res) => {
    try {
      const idDocente =
        req.usuario.id_usuario;

      const [resultado] =
        await pool.query(
          `
          SELECT

            (
              SELECT COUNT(*)
              FROM eventos
              WHERE id_docente = ?
            ) AS total_eventos,

            (
              SELECT COUNT(*)
              FROM eventos
              WHERE
                id_docente = ?
                AND estado = 'inscripciones_abiertas'
            ) AS eventos_abiertos,

            (
              SELECT COUNT(*)
              FROM eventos
              WHERE
                id_docente = ?
                AND estado = 'en_curso'
            ) AS eventos_en_curso,

            (
              SELECT COUNT(*)
              FROM eventos
              WHERE
                id_docente = ?
                AND estado = 'finalizado'
            ) AS eventos_finalizados,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              INNER JOIN eventos e
                ON e.id_evento = i.id_evento
              WHERE
                e.id_docente = ?
            ) AS total_inscripciones,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              INNER JOIN eventos e
                ON e.id_evento = s.id_evento
              WHERE
                e.id_docente = ?
                AND a.estado = 'Pendiente'
            ) AS asistencias_pendientes,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              INNER JOIN eventos e
                ON e.id_evento = s.id_evento
              WHERE
                e.id_docente = ?
                AND a.estado = 'Asistió'
            ) AS asistencias_confirmadas
          `,
          [
            idDocente,
            idDocente,
            idDocente,
            idDocente,
            idDocente,
            idDocente,
            idDocente,
          ]
        );

      const resumen =
        resultado[0] || {};

      return res.json({
        ok: true,

        resumen: {
          total_eventos:
            convertirNumero(
              resumen.total_eventos
            ),

          eventos_abiertos:
            convertirNumero(
              resumen.eventos_abiertos
            ),

          eventos_en_curso:
            convertirNumero(
              resumen.eventos_en_curso
            ),

          eventos_finalizados:
            convertirNumero(
              resumen.eventos_finalizados
            ),

          total_inscripciones:
            convertirNumero(
              resumen.total_inscripciones
            ),

          asistencias_pendientes:
            convertirNumero(
              resumen.asistencias_pendientes
            ),

          asistencias_confirmadas:
            convertirNumero(
              resumen.asistencias_confirmadas
            ),
        },
      });
    } catch (error) {
      console.error(
        "Error al consultar resumen docente:",
        error
      );

      return res.status(500).json({
        ok: false,

        mensaje:
          "No fue posible consultar el resumen del docente.",
      });
    }
  };

// =====================================================
// OBTENER ACTIVIDADES DEL DOCENTE
// =====================================================

const obtenerActividadesDocente =
  async (req, res) => {
    try {
      const idDocente =
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

            DATE_FORMAT(
              e.fecha_inicio,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_inicio,

            DATE_FORMAT(
              e.fecha_fin,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_fin,

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

            ROUND(
              ${DURACION_EVENTO_SQL},
              2
            ) AS duracion_horas,

            ROUND(
              ${DURACION_TOTAL_EVENTO_SQL},
              2
            ) AS duracion_total_horas,

            e.cupo_maximo,
            e.estado,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
            ) AS inscritos,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'Asistió'
            ) AS asistieron,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'No asistió'
            ) AS no_asistieron,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'Pendiente'
            ) AS pendientes

          FROM eventos e

          INNER JOIN deportes d
            ON
              d.id_deporte =
              e.id_deporte

          WHERE
            e.id_docente = ?

          ORDER BY
            e.fecha_inicio DESC
          `,
          [
            idDocente,
          ]
        );

      return res.json({
        ok: true,

        eventos:
          eventos.map(
            normalizarEvento
          ),
      });
    } catch (error) {
      console.error(
        "Error al consultar actividades del docente:",
        error
      );

      return res.status(500).json({
        ok: false,

        mensaje:
          "No fue posible consultar las actividades asignadas.",
      });
    }
  };

// =====================================================
// OBTENER ACTIVIDAD + INSCRITOS
// =====================================================

const obtenerActividadDocente =
  async (req, res) => {
    try {
      const idDocente =
        req.usuario.id_usuario;

      const idEvento =
        Number(
          req.params.id
        );

      const idSesionSolicitada =
        req.query.id_sesion
          ? Number(req.query.id_sesion)
          : null;

      if (
        !Number.isInteger(
          idEvento
        ) ||
        idEvento <= 0
      ) {
        return res.status(400).json({
          ok: false,

          mensaje:
            "El evento seleccionado no es válido.",
        });
      }

      const [eventos] =
        await pool.query(
          `
          SELECT
            e.id_evento,
            e.nombre,
            e.id_deporte,

            d.nombre AS deporte,

            e.id_docente,

            DATE_FORMAT(
              e.fecha_inicio,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_inicio,

            DATE_FORMAT(
              e.fecha_fin,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_fin,

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

            ROUND(
              ${DURACION_EVENTO_SQL},
              2
            ) AS duracion_horas,

            ROUND(
              ${DURACION_TOTAL_EVENTO_SQL},
              2
            ) AS duracion_total_horas,

            e.cupo_maximo,
            e.estado,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
            ) AS inscritos,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'Asistió'
            ) AS asistieron,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'No asistió'
            ) AS no_asistieron,

            (
              SELECT COUNT(DISTINCT a.id_inscripcion)
              FROM asistencias_sesion a
              INNER JOIN sesiones_evento s
                ON s.id_sesion = a.id_sesion
              WHERE
                s.id_evento = e.id_evento
                AND a.estado = 'Pendiente'
            ) AS pendientes

          FROM eventos e

          INNER JOIN deportes d
            ON
              d.id_deporte =
              e.id_deporte

          WHERE
            e.id_evento = ?
            AND
            e.id_docente = ?

          LIMIT 1
          `,
          [
            idEvento,
            idDocente,
          ]
        );

      if (
        eventos.length === 0
      ) {
        return res.status(404).json({
          ok: false,

          mensaje:
            "La actividad no existe o no está asignada a tu usuario.",
        });
      }

      const evento =
        normalizarEvento(
          eventos[0]
        );

      const [sesiones] =
        await pool.query(
          `
          SELECT
            s.id_sesion,
            DATE_FORMAT(
              s.fecha_sesion,
              '%Y-%m-%d'
            ) AS fecha_sesion,
            TIME_FORMAT(
              s.hora_inicio,
              '%H:%i'
            ) AS hora_inicio,
            TIME_FORMAT(
              s.hora_fin,
              '%H:%i'
            ) AS hora_fin,
            s.estado,
            COUNT(a.id_asistencia) AS asistencias_registradas
          FROM sesiones_evento s
          LEFT JOIN asistencias_sesion a
            ON a.id_sesion = s.id_sesion
          WHERE s.id_evento = ?
          GROUP BY
            s.id_sesion,
            s.fecha_sesion,
            s.hora_inicio,
            s.hora_fin,
            s.estado
          ORDER BY s.fecha_sesion ASC
          `,
          [idEvento]
        );

      const idSesion =
        sesiones.some(
          (sesion) =>
            Number(sesion.id_sesion) ===
            idSesionSolicitada
        )
          ? idSesionSolicitada
          : sesiones[0]?.id_sesion || null;

      const [inscritos] =
        await pool.query(
          `
          SELECT
            i.id_inscripcion,

            i.id_usuario,

            u.nombre AS estudiante,
            u.correo,

            DATE_FORMAT(
              i.fecha_inscripcion,
              '%Y-%m-%d %H:%i:%s'
            ) AS fecha_inscripcion,

            CASE
              WHEN a.estado IS NOT NULL THEN a.estado
              ELSE 'Pendiente'
            END AS asistencia,

            COALESCE(
              resumen.sesiones_programadas,
              0
            ) AS sesiones_programadas,

            COALESCE(
              resumen.sesiones_evaluadas,
              0
            ) AS sesiones_evaluadas,

            COALESCE(
              resumen.asistencias,
              0
            ) AS asistencias,

            COALESCE(
              resumen.no_asistencias,
              0
            ) AS no_asistencias,

            ROUND(
              CASE
                WHEN COALESCE(
                  resumen.sesiones_programadas,
                  0
                ) > 0
                THEN (
                  COALESCE(
                    resumen.asistencias,
                    0
                  ) /
                  resumen.sesiones_programadas
                ) * 100
                ELSE 0
              END,
              1
            ) AS porcentaje_asistencia

          FROM inscripciones i

          INNER JOIN usuarios u
            ON
              u.id_usuario =
              i.id_usuario

          LEFT JOIN asistencias_sesion a
            ON a.id_inscripcion = i.id_inscripcion
            AND a.id_sesion = ?

          LEFT JOIN (
            SELECT
              i2.id_inscripcion,
              COUNT(
                DISTINCT s2.id_sesion
              ) AS sesiones_programadas,
              COUNT(
                DISTINCT CASE
                  WHEN a2.estado IN ('Asistió', 'No asistió')
                  THEN s2.id_sesion
                END
              ) AS sesiones_evaluadas,
              COUNT(
                DISTINCT CASE
                  WHEN a2.estado = 'Asistió'
                  THEN s2.id_sesion
                END
              ) AS asistencias,
              COUNT(
                DISTINCT CASE
                  WHEN a2.estado = 'No asistió'
                  THEN s2.id_sesion
                END
              ) AS no_asistencias
            FROM inscripciones i2
            LEFT JOIN sesiones_evento s2
              ON s2.id_evento = i2.id_evento
            LEFT JOIN asistencias_sesion a2
              ON a2.id_sesion = s2.id_sesion
              AND a2.id_inscripcion = i2.id_inscripcion
            WHERE i2.id_evento = ?
            GROUP BY i2.id_inscripcion
          ) resumen
            ON resumen.id_inscripcion = i.id_inscripcion

          WHERE
            i.id_evento = ?

          ORDER BY
            u.nombre ASC
          `,
          [
            idSesion,
            idEvento,
            idEvento,
          ]
        );

      return res.json({
        ok: true,

        evento,

        sesiones,

        id_sesion: idSesion,

        inscritos,
      });
    } catch (error) {
      console.error(
        "Error al consultar actividad docente:",
        error
      );

      return res.status(500).json({
        ok: false,

        mensaje:
          "No fue posible consultar la actividad.",
      });
    }
  };

// =====================================================
// GUARDAR ASISTENCIA
// =====================================================

const guardarAsistencia =
  async (req, res) => {
    let conexion;

    try {
      const idDocente =
        req.usuario.id_usuario;

      const idEvento =
        Number(
          req.params.id
        );

      const {
        asistencias,
        id_sesion: idSesionBody,
      } = req.body;

      const asistenciasNormalizadas = Array.isArray(asistencias)
        ? asistencias.map((registro) => ({
            ...registro,
            asistencia: normalizarAsistencia(
              registro.asistencia
            ),
          }))
        : asistencias;

      const idSesion = idSesionBody
        ? Number(idSesionBody)
        : null;

      if (
        !Number.isInteger(
          idEvento
        ) ||
        idEvento <= 0
      ) {
        return res.status(400).json({
          ok: false,

          mensaje:
            "El evento seleccionado no es válido.",
        });
      }

      if (
        !Array.isArray(
        asistenciasNormalizadas
        ) ||
        asistencias.length === 0
      ) {
        return res.status(400).json({
          ok: false,

          mensaje:
            "Debes enviar al menos un registro de asistencia.",
        });
      }

      if (
        idSesionBody &&
        (!Number.isInteger(idSesion) || idSesion <= 0)
      ) {
        return res.status(400).json({
          ok: false,
          mensaje: "La sesión seleccionada no es válida.",
        });
      }

      const estadosValidos = [
        "Pendiente",
        "Asistió",
        "No asistió",
      ];

      for (
        const registro
        of asistenciasNormalizadas
      ) {
        const idInscripcion =
          Number(
            registro.id_inscripcion
          );

        if (
          !Number.isInteger(
            idInscripcion
          ) ||
          idInscripcion <= 0
        ) {
          return res.status(400).json({
            ok: false,

            mensaje:
              "Existe una inscripción no válida.",
          });
        }

        if (
          !estadosValidos.includes(
            registro.asistencia
          )
        ) {
          return res.status(400).json({
            ok: false,

            mensaje:
              "Uno de los estados de asistencia no es válido.",
          });
        }
      }

      conexion =
        await pool.getConnection();

      await conexion.beginTransaction();

      // =================================================
      // VALIDAR QUE EL EVENTO SEA DEL DOCENTE
      // =================================================

      const [eventos] =
        await conexion.query(
          `
          SELECT
            id_evento,
            nombre,
            estado

          FROM eventos

          WHERE
            id_evento = ?
            AND
            id_docente = ?

          LIMIT 1

          FOR UPDATE
          `,
          [
            idEvento,
            idDocente,
          ]
        );

      if (
        eventos.length === 0
      ) {
        await conexion.rollback();

        return res.status(403).json({
          ok: false,

          mensaje:
            "No tienes permiso para registrar asistencia en esta actividad.",
        });
      }

      const evento =
        eventos[0];

      // =================================================
      // VALIDAR ESTADO
      // =================================================

      const estadosPermitidos = [
        "en_curso",
        "finalizado",
      ];

      if (
        !estadosPermitidos.includes(
          evento.estado
        )
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,

          mensaje:
            "La asistencia solo puede registrarse cuando el evento está en curso o finalizado.",
        });
      }

      if (idSesion) {
        const [sesiones] = await conexion.query(
          `
            SELECT id_sesion
            FROM sesiones_evento
            WHERE id_sesion = ?
              AND id_evento = ?
            FOR UPDATE
          `,
          [idSesion, idEvento]
        );

        if (sesiones.length === 0) {
          await conexion.rollback();

          return res.status(400).json({
            ok: false,
            mensaje: "La sesión no pertenece al evento seleccionado.",
          });
        }
      }

      // =================================================
      // EVITAR IDs REPETIDOS
      // =================================================

      const idsInscripciones =
        asistenciasNormalizadas.map(
          (registro) =>
            Number(
              registro.id_inscripcion
            )
        );

      const idsUnicos =
        [
          ...new Set(
            idsInscripciones
          ),
        ];

      if (
        idsUnicos.length !==
        idsInscripciones.length
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,

          mensaje:
            "La solicitud contiene inscripciones repetidas.",
        });
      }

      // =================================================
      // VALIDAR QUE TODOS PERTENEZCAN AL EVENTO
      // =================================================

      const placeholders =
        idsUnicos
          .map(
            () => "?"
          )
          .join(",");

      const [inscripcionesValidas] =
        await conexion.query(
          `
          SELECT
            id_inscripcion

          FROM inscripciones

          WHERE
            id_evento = ?
            AND
            id_inscripcion
              IN (${placeholders})

          FOR UPDATE
          `,
          [
            idEvento,
            ...idsUnicos,
          ]
        );

      if (
        inscripcionesValidas.length !==
        idsUnicos.length
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,

          mensaje:
            "Uno o más estudiantes no pertenecen a esta actividad.",
        });
      }

      // =================================================
      // ACTUALIZAR ASISTENCIAS
      // =================================================

      for (
        const registro
        of asistenciasNormalizadas
      ) {
        if (idSesion) {
          await conexion.query(
            `
              INSERT INTO asistencias_sesion
                (id_sesion, id_inscripcion, estado)
              VALUES (?, ?, ?)
              ON DUPLICATE KEY UPDATE
                estado = VALUES(estado)
            `,
            [
              idSesion,
              registro.id_inscripcion,
              registro.asistencia,
            ]
          );
        }

        await conexion.query(
          `
          UPDATE inscripciones

          SET
            asistencia = ?

          WHERE
            id_inscripcion = ?
            AND
            id_evento = ?
          `,
          [
            asistenciaLegacy(
              registro.asistencia
            ),
            registro.id_inscripcion,
            idEvento,
          ]
        );
      }

      if (idSesion) {
        for (const idInscripcion of idsUnicos) {
          await conexion.query(
            `
            UPDATE inscripciones i
            SET asistencia = (
              SELECT CASE
                WHEN SUM(CASE WHEN a.estado = 'Pendiente' THEN 1 ELSE 0 END) > 0
                  THEN 'pendiente'
                WHEN SUM(CASE WHEN a.estado = 'Asistió' THEN 1 ELSE 0 END) > 0
                  AND SUM(CASE WHEN a.estado = 'No asistió' THEN 1 ELSE 0 END) = 0
                  THEN 'asistio'
                WHEN SUM(CASE WHEN a.estado = 'No asistió' THEN 1 ELSE 0 END) > 0
                  AND SUM(CASE WHEN a.estado = 'Asistió' THEN 1 ELSE 0 END) = 0
                  THEN 'no_asistio'
                ELSE 'pendiente'
              END
              FROM sesiones_evento s
              LEFT JOIN asistencias_sesion a
                ON a.id_sesion = s.id_sesion
                AND a.id_inscripcion = ?
              WHERE s.id_evento = ?
            )
            WHERE i.id_inscripcion = ?
              AND i.id_evento = ?
            `,
            [
              idInscripcion,
              idEvento,
              idInscripcion,
              idEvento,
            ]
          );
        }
      }

      await conexion.commit();

      return res.json({
        ok: true,

        mensaje:
          "Asistencia guardada correctamente.",
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
        "Error al guardar asistencia:",
        error
      );

      return res.status(500).json({
        ok: false,

        mensaje:
          "No fue posible guardar la asistencia.",
      });
    } finally {
      if (conexion) {
        conexion.release();
      }
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  obtenerResumenDocente,
  obtenerActividadesDocente,
  obtenerActividadDocente,
  guardarAsistencia,
};
