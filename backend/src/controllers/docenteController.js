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

const normalizarEvento = (evento) => ({
  ...evento,

  duracion_horas:
    convertirNumero(
      evento.duracion_horas
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
              SELECT COUNT(*)
              FROM inscripciones i
              INNER JOIN eventos e
                ON e.id_evento = i.id_evento
              WHERE
                e.id_docente = ?
                AND i.asistencia = 'Pendiente'
            ) AS asistencias_pendientes,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              INNER JOIN eventos e
                ON e.id_evento = i.id_evento
              WHERE
                e.id_docente = ?
                AND i.asistencia = 'Asistió'
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

            e.lugar,

            ROUND(
              ${DURACION_EVENTO_SQL},
              2
            ) AS duracion_horas,

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
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'Asistió'
            ) AS asistieron,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'No asistió'
            ) AS no_asistieron,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'Pendiente'
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

            e.lugar,

            ROUND(
              ${DURACION_EVENTO_SQL},
              2
            ) AS duracion_horas,

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
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'Asistió'
            ) AS asistieron,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'No asistió'
            ) AS no_asistieron,

            (
              SELECT COUNT(*)
              FROM inscripciones i
              WHERE
                i.id_evento =
                e.id_evento
                AND
                i.asistencia =
                'Pendiente'
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

            i.asistencia

          FROM inscripciones i

          INNER JOIN usuarios u
            ON
              u.id_usuario =
              i.id_usuario

          WHERE
            i.id_evento = ?

          ORDER BY
            u.nombre ASC
          `,
          [
            idEvento,
          ]
        );

      return res.json({
        ok: true,

        evento,

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
      } = req.body;

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
          asistencias
        ) ||
        asistencias.length === 0
      ) {
        return res.status(400).json({
          ok: false,

          mensaje:
            "Debes enviar al menos un registro de asistencia.",
        });
      }

      const estadosValidos = [
        "Pendiente",
        "Asistió",
        "No asistió",
      ];

      for (
        const registro
        of asistencias
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

      // =================================================
      // EVITAR IDs REPETIDOS
      // =================================================

      const idsInscripciones =
        asistencias.map(
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
        of asistencias
      ) {
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
            registro.asistencia,
            registro.id_inscripcion,
            idEvento,
          ]
        );
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