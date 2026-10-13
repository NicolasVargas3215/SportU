const pool = require("../config/db");

// =====================================================
// ESTADOS PERMITIDOS
// =====================================================

const ESTADOS_EVENTO = [
  "borrador",
  "inscripciones_abiertas",
  "en_curso",
  "finalizado",
  "cancelado",
];

// =====================================================
// NORMALIZAR ESTADO
// =====================================================

const normalizarEstado = (estado) => {
  if (!estado) {
    return "borrador";
  }

  if (estado === "activo") {
    return "inscripciones_abiertas";
  }

  if (estado === "inactivo") {
    return "borrador";
  }

  return estado;
};

// =====================================================
// NORMALIZAR FECHA
// =====================================================

const normalizarFechaHora = (valor) => {
  if (!valor) {
    return null;
  }

  return String(valor)
    .replace("T", " ")
    .slice(0, 19);
};

// =====================================================
// CALCULAR DURACIÓN
// =====================================================

const calcularDuracionHoras = (
  fechaInicio,
  fechaFin
) => {
  if (
    !fechaInicio ||
    !fechaFin
  ) {
    return null;
  }

  const convertir = (valor) => {
    const limpio =
      String(valor)
        .replace("T", " ")
        .slice(0, 19);

    const [
      fecha,
      hora = "00:00:00",
    ] = limpio.split(" ");

    const [
      anio,
      mes,
      dia,
    ] = fecha
      .split("-")
      .map(Number);

    const [
      horas = 0,
      minutos = 0,
      segundos = 0,
    ] = hora
      .split(":")
      .map(Number);

    return Date.UTC(
      anio,
      mes - 1,
      dia,
      horas,
      minutos,
      segundos
    );
  };

  const inicio =
    convertir(fechaInicio);

  const fin =
    convertir(fechaFin);

  const diferencia =
    fin - inicio;

  if (
    !Number.isFinite(
      diferencia
    ) ||
    diferencia <= 0
  ) {
    return null;
  }

  return Number(
    (
      diferencia /
      3600000
    ).toFixed(2)
  );
};

// =====================================================
// OBTENER FECHAS
// =====================================================

const obtenerFechasEvento = (
  body
) => {
  let fechaInicio =
    normalizarFechaHora(
      body.fecha_inicio
    );

  let fechaFin =
    normalizarFechaHora(
      body.fecha_fin
    );

  // Compatibilidad con estructura anterior
  if (
    !fechaInicio &&
    body.fecha &&
    body.hora
  ) {
    fechaInicio =
      normalizarFechaHora(
        `${body.fecha} ${body.hora}`
      );
  }

  if (
    !fechaFin &&
    fechaInicio &&
    body.duracion_horas
  ) {
    const duracion =
      Number(
        body.duracion_horas
      );

    if (
      Number.isFinite(
        duracion
      ) &&
      duracion > 0
    ) {
      const inicio =
        new Date(
          fechaInicio.replace(
            " ",
            "T"
          )
        );

      fechaFin =
        normalizarFechaHora(
          new Date(
            inicio.getTime() +
              duracion *
                3600000
          )
            .toISOString()
            .slice(0, 19)
        );
    }
  }

  return {
    fechaInicio,
    fechaFin,
  };
};

// =====================================================
// VALIDAR DEPORTE
// =====================================================

const validarDeporte = async (
  conexion,
  idDeporte
) => {
  const [deportes] =
    await conexion.query(
      `
        SELECT
          id_deporte,
          nombre,
          estado

        FROM deportes

        WHERE
          id_deporte = ?

        LIMIT 1
      `,
      [idDeporte]
    );

  if (
    deportes.length === 0
  ) {
    return {
      valido: false,

      mensaje:
        "El deporte seleccionado no existe",
    };
  }

  if (
    deportes[0].estado !==
    "activo"
  ) {
    return {
      valido: false,

      mensaje:
        "El deporte seleccionado se encuentra inactivo",
    };
  }

  return {
    valido: true,

    deporte:
      deportes[0],
  };
};

// =====================================================
// VALIDAR DOCENTE
// =====================================================

const validarDocente = async (
  conexion,
  idDocente
) => {
  const [docentes] =
    await conexion.query(
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

        LIMIT 1
      `,
      [idDocente]
    );

  if (
    docentes.length === 0
  ) {
    return {
      valido: false,

      mensaje:
        "El docente seleccionado no existe",
    };
  }

  if (
    docentes[0].rol !==
    "docente"
  ) {
    return {
      valido: false,

      mensaje:
        "El usuario seleccionado no corresponde a un docente",
    };
  }

  if (
    docentes[0].estado !==
    "activo"
  ) {
    return {
      valido: false,

      mensaje:
        "El docente seleccionado se encuentra inactivo",
    };
  }

  return {
    valido: true,

    docente:
      docentes[0],
  };
};

// =====================================================
// OBTENER EVENTOS
// =====================================================

const obtenerEventos = async (
  req,
  res
) => {
  try {
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

            e.fecha,
            e.hora,
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

            (
              SELECT COUNT(*)

              FROM inscripciones i

              WHERE
                i.id_evento =
                e.id_evento

                AND
                i.asistencia IN (
                  'Asistió',
                  'No asistió'
                )
            ) AS asistencias_registradas,

            (
              SELECT COUNT(*)

              FROM inscripciones i

              WHERE
                i.id_evento =
                e.id_evento

                AND
                i.asistencia =
                'Pendiente'
            ) AS inscripciones_pendientes

          FROM eventos e

          INNER JOIN deportes d
            ON d.id_deporte =
            e.id_deporte

          INNER JOIN usuarios u
            ON u.id_usuario =
            e.id_docente

          ORDER BY
            e.fecha_inicio DESC
        `
      );

    const eventosProcesados =
      eventos.map(
        (evento) => ({
          ...evento,

          inscritos:
            Number(
              evento.inscritos
            ) || 0,

          asistencias_registradas:
            Number(
              evento.asistencias_registradas
            ) || 0,

          inscripciones_pendientes:
            Number(
              evento.inscripciones_pendientes
            ) || 0,
        })
      );

    return res.json({
      ok: true,

      eventos:
        eventosProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar eventos:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        mensaje:
          "Error al consultar los eventos",
      });
  }
};

// =====================================================
// OBTENER EVENTO POR ID
// =====================================================

const obtenerEventoPorId =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

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

              e.fecha,
              e.hora,
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

              (
                SELECT COUNT(*)

                FROM inscripciones i

                WHERE
                  i.id_evento =
                  e.id_evento

                  AND
                  i.asistencia IN (
                    'Asistió',
                    'No asistió'
                  )
              ) AS asistencias_registradas

            FROM eventos e

            INNER JOIN deportes d
              ON d.id_deporte =
              e.id_deporte

            INNER JOIN usuarios u
              ON u.id_usuario =
              e.id_docente

            WHERE
              e.id_evento = ?

            LIMIT 1
          `,
          [id]
        );

      if (
        eventos.length === 0
      ) {
        return res
          .status(404)
          .json({
            ok: false,

            mensaje:
              "Evento no encontrado",
          });
      }

      const evento = {
        ...eventos[0],

        inscritos:
          Number(
            eventos[0].inscritos
          ) || 0,

        asistencias_registradas:
          Number(
            eventos[0]
              .asistencias_registradas
          ) || 0,
      };

      return res.json({
        ok: true,
        evento,
      });
    } catch (error) {
      console.error(
        "Error al consultar evento:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al consultar el evento",
        });
    }
  };

// =====================================================
// OPCIONES
// =====================================================

const obtenerOpcionesEvento =
  async (req, res) => {
    try {
      const [deportes] =
        await pool.query(
          `
            SELECT
              id_deporte,
              nombre

            FROM deportes

            WHERE
              estado = 'activo'

            ORDER BY
              nombre ASC
          `
        );

      const [docentes] =
        await pool.query(
          `
            SELECT
              id_usuario,
              nombre,
              correo

            FROM usuarios

            WHERE
              rol = 'docente'

              AND
              estado = 'activo'

            ORDER BY
              nombre ASC
          `
        );

      return res.json({
        ok: true,
        deportes,
        docentes,
      });
    } catch (error) {
      console.error(
        "Error al consultar opciones del evento:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al consultar las opciones del evento",
        });
    }
  };

// =====================================================
// CREAR EVENTO
// =====================================================

const crearEvento = async (
  req,
  res
) => {
  const conexion =
    await pool.getConnection();

  try {
    const {
      nombre,
      id_deporte,
      id_docente,
      lugar,
      cupo_maximo,
    } = req.body;

    const estado =
      normalizarEstado(
        req.body.estado
      );

    const {
      fechaInicio,
      fechaFin,
    } =
      obtenerFechasEvento(
        req.body
      );

    // =================================================
    // VALIDACIONES
    // =================================================

    if (
      !nombre ||
      !String(nombre).trim()
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "El nombre del evento es obligatorio",
        });
    }

    if (!id_deporte) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "El deporte es obligatorio",
        });
    }

    if (!id_docente) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "El docente es obligatorio",
        });
    }

    if (
      !lugar ||
      !String(lugar).trim()
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "El lugar es obligatorio",
        });
    }

    const cupo =
      Number(
        cupo_maximo
      );

    if (
      !Number.isInteger(
        cupo
      ) ||
      cupo <= 0
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "El cupo máximo debe ser un número entero mayor que cero",
        });
    }

    if (
      !ESTADOS_EVENTO.includes(
        estado
      )
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "Estado de evento no válido",
        });
    }

    if (
      !fechaInicio ||
      !fechaFin
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "La fecha de inicio y la fecha final son obligatorias",
        });
    }

    const duracionHoras =
      calcularDuracionHoras(
        fechaInicio,
        fechaFin
      );

    if (!duracionHoras) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "La fecha final debe ser posterior a la fecha de inicio",
        });
    }

    if (
      duracionHoras >
      99.99
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "La duración del evento no puede superar 99.99 horas",
        });
    }

    await conexion.beginTransaction();

    // =================================================
    // VALIDAR DEPORTE
    // =================================================

    const validacionDeporte =
      await validarDeporte(
        conexion,
        id_deporte
      );

    if (
      !validacionDeporte.valido
    ) {
      await conexion.rollback();

      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            validacionDeporte.mensaje,
        });
    }

    // =================================================
    // VALIDAR DOCENTE
    // =================================================

    const validacionDocente =
      await validarDocente(
        conexion,
        id_docente
      );

    if (
      !validacionDocente.valido
    ) {
      await conexion.rollback();

      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            validacionDocente.mensaje,
        });
    }

    // =================================================
    // INSERTAR
    // =================================================

    const [resultado] =
      await conexion.query(
        `
          INSERT INTO eventos
          (
            nombre,
            id_deporte,
            id_docente,

            fecha_inicio,
            fecha_fin,

            fecha,
            hora,

            lugar,
            duracion_horas,
            cupo_maximo,
            estado
          )
          VALUES
          (
            ?,
            ?,
            ?,

            ?,
            ?,

            DATE(?),
            TIME(?),

            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          String(
            nombre
          ).trim(),

          id_deporte,
          id_docente,

          fechaInicio,
          fechaFin,

          fechaInicio,
          fechaInicio,

          String(
            lugar
          ).trim(),

          duracionHoras,
          cupo,
          estado,
        ]
      );

    await conexion.commit();

    return res
      .status(201)
      .json({
        ok: true,

        mensaje:
          "Evento creado correctamente",

        id_evento:
          resultado.insertId,

        duracion_horas:
          duracionHoras,
      });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (
      rollbackError
    ) {
      console.error(
        "Error al revertir creación:",
        rollbackError
      );
    }

    console.error(
      "Error al crear evento:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        mensaje:
          "Error al crear el evento",
      });
  } finally {
    conexion.release();
  }
};

// =====================================================
// ACTUALIZAR EVENTO
// =====================================================

const actualizarEvento =
  async (req, res) => {
    const conexion =
      await pool.getConnection();

    try {
      const {
        id,
      } = req.params;

      const {
        nombre,
        id_deporte,
        id_docente,
        lugar,
        cupo_maximo,
      } = req.body;

      const estado =
        normalizarEstado(
          req.body.estado
        );

      const {
        fechaInicio,
        fechaFin,
      } =
        obtenerFechasEvento(
          req.body
        );

      if (
        !nombre ||
        !String(nombre).trim() ||
        !id_deporte ||
        !id_docente ||
        !lugar ||
        !String(lugar).trim()
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "Completa todos los campos obligatorios",
          });
      }

      const cupo =
        Number(
          cupo_maximo
        );

      if (
        !Number.isInteger(
          cupo
        ) ||
        cupo <= 0
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "El cupo máximo debe ser un número entero mayor que cero",
          });
      }

      if (
        !ESTADOS_EVENTO.includes(
          estado
        )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "Estado de evento no válido",
          });
      }

      const duracionHoras =
        calcularDuracionHoras(
          fechaInicio,
          fechaFin
        );

      if (!duracionHoras) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "La fecha final debe ser posterior a la fecha de inicio",
          });
      }

      if (
        duracionHoras >
        99.99
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "La duración del evento no puede superar 99.99 horas",
          });
      }

      await conexion.beginTransaction();

      // =================================================
      // EVENTO
      // =================================================

      const [eventos] =
        await conexion.query(
          `
            SELECT
              id_evento

            FROM eventos

            WHERE
              id_evento = ?

            FOR UPDATE
          `,
          [id]
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

      // =================================================
      // DEPORTE
      // =================================================

      const validacionDeporte =
        await validarDeporte(
          conexion,
          id_deporte
        );

      if (
        !validacionDeporte.valido
      ) {
        await conexion.rollback();

        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              validacionDeporte.mensaje,
          });
      }

      // =================================================
      // DOCENTE
      // =================================================

      const validacionDocente =
        await validarDocente(
          conexion,
          id_docente
        );

      if (
        !validacionDocente.valido
      ) {
        await conexion.rollback();

        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              validacionDocente.mensaje,
          });
      }

      // =================================================
      // INSCRITOS
      // =================================================

      const [
        resultadoInscritos,
      ] =
        await conexion.query(
          `
            SELECT
              COUNT(*) AS total

            FROM inscripciones

            WHERE
              id_evento = ?
          `,
          [id]
        );

      const inscritos =
        Number(
          resultadoInscritos[0]
            .total
        ) || 0;

      if (
        cupo < inscritos
      ) {
        await conexion.rollback();

        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              `El cupo máximo no puede ser menor a los ${inscritos} estudiante(s) inscritos actualmente.`,
          });
      }

      // =================================================
      // ACTUALIZAR
      // =================================================

      await conexion.query(
        `
          UPDATE eventos

          SET
            nombre = ?,
            id_deporte = ?,
            id_docente = ?,

            fecha_inicio = ?,
            fecha_fin = ?,

            fecha = DATE(?),
            hora = TIME(?),

            lugar = ?,
            duracion_horas = ?,
            cupo_maximo = ?,
            estado = ?

          WHERE
            id_evento = ?
        `,
        [
          String(
            nombre
          ).trim(),

          id_deporte,
          id_docente,

          fechaInicio,
          fechaFin,

          fechaInicio,
          fechaInicio,

          String(
            lugar
          ).trim(),

          duracionHoras,
          cupo,
          estado,

          id,
        ]
      );

      await conexion.commit();

      return res.json({
        ok: true,

        mensaje:
          "Evento actualizado correctamente",

        duracion_horas:
          duracionHoras,
      });
    } catch (error) {
      try {
        await conexion.rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Error al revertir actualización:",
          rollbackError
        );
      }

      console.error(
        "Error al actualizar evento:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al actualizar el evento",
        });
    } finally {
      conexion.release();
    }
  };

// =====================================================
// CAMBIAR ESTADO
// =====================================================

const cambiarEstadoEvento =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const estado =
        normalizarEstado(
          req.body.estado
        );

      if (
        !ESTADOS_EVENTO.includes(
          estado
        )
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "Estado de evento no válido",
          });
      }

      const [resultado] =
        await pool.query(
          `
            UPDATE eventos

            SET
              estado = ?

            WHERE
              id_evento = ?
          `,
          [
            estado,
            id,
          ]
        );

      if (
        resultado.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            ok: false,

            mensaje:
              "Evento no encontrado",
          });
      }

      return res.json({
        ok: true,

        mensaje:
          "Estado del evento actualizado correctamente",
      });
    } catch (error) {
      console.error(
        "Error al cambiar estado:",
        error
      );

      return res
        .status(500)
        .json({
          ok: false,

          mensaje:
            "Error al cambiar el estado del evento",
        });
    }
  };

// =====================================================
// ELIMINAR EVENTO
// =====================================================

const eliminarEvento = async (
  req,
  res
) => {
  const conexion =
    await pool.getConnection();

  try {
    const {
      id,
    } = req.params;

    await conexion.beginTransaction();

    // =================================================
    // BUSCAR EVENTO
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

          FOR UPDATE
        `,
        [id]
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
    // ANALIZAR INSCRIPCIONES
    // =================================================

    const [
      resultadoInscripciones,
    ] =
      await conexion.query(
        `
          SELECT

            COUNT(*) AS total,

            SUM(
              CASE

                WHEN asistencia =
                  'Pendiente'

                THEN 1

                ELSE 0

              END
            ) AS pendientes,

            SUM(
              CASE

                WHEN asistencia IN (
                  'Asistió',
                  'No asistió'
                )

                THEN 1

                ELSE 0

              END
            ) AS asistencias_registradas

          FROM inscripciones

          WHERE
            id_evento = ?
        `,
        [id]
      );

    const total =
      Number(
        resultadoInscripciones[0]
          .total
      ) || 0;

    const pendientes =
      Number(
        resultadoInscripciones[0]
          .pendientes
      ) || 0;

    const asistenciasRegistradas =
      Number(
        resultadoInscripciones[0]
          .asistencias_registradas
      ) || 0;

    // =================================================
    // SI HAY HISTORIAL DE ASISTENCIA, NO ELIMINAR
    // =================================================

    if (
      asistenciasRegistradas >
      0
    ) {
      await conexion.rollback();

      return res
        .status(409)
        .json({
          ok: false,

          mensaje:
            `No se puede eliminar "${evento.nombre}" porque tiene asistencia registrada. Este evento ya hace parte del historial deportivo de los estudiantes. Puedes cambiar su estado a "Cancelado".`,

          total_inscripciones:
            total,

          asistencias_registradas:
            asistenciasRegistradas,
        });
    }

    // =================================================
    // SI SOLO HAY INSCRIPCIONES PENDIENTES
    // SE PUEDEN ELIMINAR
    // =================================================

    if (
      total > 0 &&
      pendientes === total
    ) {
      await conexion.query(
        `
          DELETE FROM inscripciones

          WHERE
            id_evento = ?
        `,
        [id]
      );
    }

    // =================================================
    // ELIMINAR EVENTO
    // =================================================

    await conexion.query(
      `
        DELETE FROM eventos

        WHERE
          id_evento = ?
      `,
      [id]
    );

    await conexion.commit();

    let mensaje =
      `El evento "${evento.nombre}" fue eliminado correctamente.`;

    if (
      total > 0
    ) {
      mensaje =
        `El evento "${evento.nombre}" y ${total} inscripción(es) pendiente(s) fueron eliminados correctamente.`;
    }

    return res.json({
      ok: true,

      mensaje,

      inscripciones_eliminadas:
        total,
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (
      rollbackError
    ) {
      console.error(
        "Error al revertir eliminación:",
        rollbackError
      );
    }

    console.error(
      "Error al eliminar evento:",
      error
    );

    return res
      .status(500)
      .json({
        ok: false,

        mensaje:
          "Error al eliminar el evento",
      });
  } finally {
    conexion.release();
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerOpcionesEvento,
  crearEvento,
  actualizarEvento,
  cambiarEstadoEvento,
  eliminarEvento,

  // Compatibilidad
  obtenerEvento:
    obtenerEventoPorId,

  cambiarEstado:
    cambiarEstadoEvento,
};