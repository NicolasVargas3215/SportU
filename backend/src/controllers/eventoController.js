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
// PROGRAMACIÓN SEMANAL
// =====================================================

const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const normalizarHora = (valor) => {
  if (!valor) {
    return null;
  }

  const hora = String(valor).slice(0, 8);

  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora)
    ? hora.length === 5
      ? `${hora}:00`
      : hora
    : null;
};

const obtenerProgramacion = (body) => {
  const tieneCampos =
    Object.prototype.hasOwnProperty.call(body, "dias_semana") ||
    Object.prototype.hasOwnProperty.call(body, "hora_inicio") ||
    Object.prototype.hasOwnProperty.call(body, "hora_fin") ||
    Object.prototype.hasOwnProperty.call(body, "horarios");

  const diasRecibidos = Array.isArray(body.dias_semana)
    ? body.dias_semana
    : Array.isArray(body.horarios)
      ? body.horarios.map((horario) => horario.dia_semana)
      : [];

  const dias = [
    ...new Set(
      diasRecibidos
        .map((dia) => String(dia).trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const horaInicio = normalizarHora(
    body.hora_inicio || body.horarios?.[0]?.hora_inicio
  );

  const horaFin = normalizarHora(
    body.hora_fin || body.horarios?.[0]?.hora_fin
  );

  return {
    tieneCampos,
    dias,
    horaInicio,
    horaFin,
  };
};

const validarProgramacion = (programacion) => {
  if (!programacion.tieneCampos) {
    return { valido: true };
  }

  if (programacion.dias.length === 0) {
    return {
      valido: false,
      mensaje: "Debes seleccionar al menos un día programado",
    };
  }

  const diaInvalido = programacion.dias.find(
    (dia) => !DIAS_SEMANA.includes(dia)
  );

  if (diaInvalido) {
    return {
      valido: false,
      mensaje: `Día programado no válido: ${diaInvalido}`,
    };
  }

  if (!programacion.horaInicio || !programacion.horaFin) {
    return {
      valido: false,
      mensaje: "La hora de inicio y la hora de finalización son obligatorias",
    };
  }

  if (programacion.horaInicio >= programacion.horaFin) {
    return {
      valido: false,
      mensaje: "La hora de finalización debe ser posterior a la hora de inicio",
    };
  }

  return { valido: true };
};

const fechaDesdeTexto = (valor) => {
  const fecha = String(valor).slice(0, 10).split("-").map(Number);

  return new Date(Date.UTC(fecha[0], fecha[1] - 1, fecha[2]));
};

const fechaTexto = (fecha) =>
  fecha.toISOString().slice(0, 10);

const generarFechasSesiones = (
  fechaInicio,
  fechaFin,
  dias
) => {
  const inicio = fechaDesdeTexto(fechaInicio);
  const fin = fechaDesdeTexto(fechaFin);
  const diasNumericos = new Set(
    dias.map((dia) => DIAS_SEMANA.indexOf(dia) + 1)
  );
  const fechas = [];

  for (
    const fecha = new Date(inicio);
    fecha <= fin;
    fecha.setUTCDate(fecha.getUTCDate() + 1)
  ) {
    const diaSemana = fecha.getUTCDay() === 0
      ? 7
      : fecha.getUTCDay();

    if (diasNumericos.has(diaSemana)) {
      fechas.push(fechaTexto(fecha));
    }
  }

  return fechas;
};

const guardarProgramacionEvento = async (
  conexion,
  idEvento,
  fechaInicio,
  fechaFin,
  programacion,
  reemplazar = false
) => {
  if (!programacion.tieneCampos) {
    return;
  }

  if (reemplazar) {
    const [asistencias] = await conexion.query(
      `
        SELECT COUNT(*) AS total
        FROM asistencias_sesion a
        INNER JOIN sesiones_evento s
          ON s.id_sesion = a.id_sesion
        WHERE s.id_evento = ?
      `,
      [idEvento]
    );

    if (Number(asistencias[0].total) > 0) {
      const error = new Error(
        "No se puede modificar la programación porque el evento ya tiene asistencias registradas"
      );
      error.statusCode = 409;
      throw error;
    }

    await conexion.query(
      "DELETE FROM sesiones_evento WHERE id_evento = ?",
      [idEvento]
    );

    await conexion.query(
      "DELETE FROM evento_dias_semana WHERE id_evento = ?",
      [idEvento]
    );
  }

  for (const dia of programacion.dias) {
    await conexion.query(
      `
        INSERT INTO evento_dias_semana
          (id_evento, dia_semana)
        VALUES (?, ?)
      `,
      [idEvento, dia]
    );
  }

  const fechas = generarFechasSesiones(
    fechaInicio,
    fechaFin,
    programacion.dias
  );

  if (fechas.length === 0) {
    const error = new Error(
      "La fecha seleccionada no contiene ninguno de los días programados"
    );
    error.statusCode = 400;
    throw error;
  }

  for (const fecha of fechas) {
    await conexion.query(
      `
        INSERT INTO sesiones_evento
          (id_evento, fecha_sesion, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)
      `,
      [
        idEvento,
        fecha,
        programacion.horaInicio,
        programacion.horaFin,
      ]
    );
  }
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

const calcularDuracionHorario = (
  horaInicio,
  horaFin
) => {
  if (!horaInicio || !horaFin) {
    return null;
  }

  const [inicioHoras, inicioMinutos] = horaInicio
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [finHoras, finMinutos] = horaFin
    .slice(0, 5)
    .split(":")
    .map(Number);

  const inicio = inicioHoras * 60 + inicioMinutos;
  const fin = finHoras * 60 + finMinutos;

  if (fin <= inicio) {
    return null;
  }

  return Number(((fin - inicio) / 60).toFixed(2));
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

  // Cuando el formulario envía fechas separadas del horario semanal,
  // combinar la fecha con la hora para conservar fecha_inicio/fecha_fin
  // como valores DATETIME compatibles con la aplicación existente.
  if (
    fechaInicio &&
    String(body.fecha_inicio).length === 10 &&
    body.hora_inicio
  ) {
    fechaInicio = normalizarFechaHora(
      `${String(body.fecha_inicio).slice(0, 10)} ${body.hora_inicio}`
    );
  }

  if (
    fechaFin &&
    String(body.fecha_fin).length === 10 &&
    body.hora_fin
  ) {
    fechaFin = normalizarFechaHora(
      `${String(body.fecha_fin).slice(0, 10)} ${body.hora_fin}`
    );
  }

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
            e.hora_inicio,
            e.hora_fin,
            e.lugar,
            e.duracion_horas,
            e.cupo_maximo,
            e.estado,

            (
              SELECT GROUP_CONCAT(
                ed.dia_semana
                ORDER BY FIELD(
                  ed.dia_semana,
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                  'sabado',
                  'domingo'
                )
                SEPARATOR ','
              )
              FROM evento_dias_semana ed
              WHERE ed.id_evento = e.id_evento
            ) AS dias_semana,

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

          dias_semana:
            evento.dias_semana
              ? evento.dias_semana.split(",")
              : [],

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
              e.hora_inicio,
              e.hora_fin,
              e.lugar,
              e.duracion_horas,
              e.cupo_maximo,
              e.estado,

              (
                SELECT GROUP_CONCAT(
                  ed.dia_semana
                  ORDER BY FIELD(
                    ed.dia_semana,
                    'lunes',
                    'martes',
                    'miercoles',
                    'jueves',
                    'viernes',
                    'sabado',
                    'domingo'
                  )
                  SEPARATOR ','
                )
                FROM evento_dias_semana ed
                WHERE ed.id_evento = e.id_evento
              ) AS dias_semana,

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

        dias_semana:
          eventos[0].dias_semana
            ? eventos[0].dias_semana.split(",")
            : [],
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

    const programacion =
      obtenerProgramacion(
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

    let duracionHoras = programacion.tieneCampos
      ? null
      : calcularDuracionHoras(
          fechaInicio,
          fechaFin
        );

    if (!duracionHoras && !programacion.tieneCampos) {
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
      99.99 &&
      !programacion.tieneCampos
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            "La duración del evento no puede superar 99.99 horas",
        });
    }

    const validacionProgramacion =
      validarProgramacion(
        programacion
      );

    if (
      !validacionProgramacion.valido
    ) {
      return res
        .status(400)
        .json({
          ok: false,

          mensaje:
            validacionProgramacion.mensaje,
        });
    }

    if (programacion.tieneCampos) {
      duracionHoras = calcularDuracionHorario(
        programacion.horaInicio,
        programacion.horaFin
      );
    }

    if (!duracionHoras) {
      return res
        .status(400)
        .json({
          ok: false,
          mensaje:
            "La hora de finalización debe ser posterior a la hora de inicio",
        });
    }

    if (duracionHoras > 99.99) {
      return res
        .status(400)
        .json({
          ok: false,
          mensaje:
            "La duración de cada sesión no puede superar 99.99 horas",
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
            hora_inicio,
            hora_fin,

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

          programacion.horaInicio,
          programacion.horaFin,

          String(
            lugar
          ).trim(),

          duracionHoras,
          cupo,
          estado,
        ]
      );

    await guardarProgramacionEvento(
      conexion,
      resultado.insertId,
      fechaInicio,
      fechaFin,
      programacion
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
      .status(error.statusCode || 500)
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

      const programacion =
        obtenerProgramacion(
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

      let duracionHoras = programacion.tieneCampos
        ? null
        : calcularDuracionHoras(
            fechaInicio,
            fechaFin
          );

      if (!duracionHoras && !programacion.tieneCampos) {
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
        99.99 &&
        !programacion.tieneCampos
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              "La duración del evento no puede superar 99.99 horas",
          });
      }

      const validacionProgramacion =
        validarProgramacion(
          programacion
        );

      if (
        !validacionProgramacion.valido
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            mensaje:
              validacionProgramacion.mensaje,
          });
      }

      if (programacion.tieneCampos) {
        duracionHoras = calcularDuracionHorario(
          programacion.horaInicio,
          programacion.horaFin
        );
      }

      if (!duracionHoras) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "La hora de finalización debe ser posterior a la hora de inicio",
        });
      }

      if (duracionHoras > 99.99) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "La duración de cada sesión no puede superar 99.99 horas",
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
            hora_inicio = COALESCE(?, hora_inicio),
            hora_fin = COALESCE(?, hora_fin),

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

          programacion.horaInicio,
          programacion.horaFin,

          String(
            lugar
          ).trim(),

          duracionHoras,
          cupo,
          estado,

          id,
        ]
      );

      await guardarProgramacionEvento(
        conexion,
        id,
        fechaInicio,
        fechaFin,
        programacion,
        programacion.tieneCampos
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
        .status(error.statusCode || 500)
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
