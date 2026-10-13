const pool = require("../config/db");

// =====================================================
// OBTENER INVENTARIO
// =====================================================

const obtenerInventario = async (req, res) => {
  try {
    const [equipos] = await pool.query(`
      SELECT
        e.id_equipo,
        e.nombre,
        e.id_deporte,
        d.nombre AS deporte,

        e.cantidad_total,
        e.cantidad_disponible,
        e.estado,

        GREATEST(
          e.cantidad_total - e.cantidad_disponible,
          0
        ) AS cantidad_prestada,

        (
          SELECT COUNT(*)
          FROM prestamos p
          WHERE
            p.id_equipo = e.id_equipo
            AND p.estado = 'prestado'
        ) AS prestamos_activos,

        (
          SELECT COUNT(*)
          FROM prestamos p
          WHERE
            p.id_equipo = e.id_equipo
            AND p.estado = 'devuelto'
        ) AS prestamos_historicos

      FROM equipos_deportivos e

      LEFT JOIN deportes d
        ON d.id_deporte = e.id_deporte

      WHERE
        e.eliminado = 0

      ORDER BY
        e.nombre ASC
    `);

    const equiposProcesados = equipos.map(
      (equipo) => ({
        ...equipo,

        cantidad_total:
          Number(equipo.cantidad_total) || 0,

        cantidad_disponible:
          Number(equipo.cantidad_disponible) || 0,

        cantidad_prestada:
          Number(equipo.cantidad_prestada) || 0,

        prestamos_activos:
          Number(equipo.prestamos_activos) || 0,

        prestamos_historicos:
          Number(equipo.prestamos_historicos) || 0,
      })
    );

    return res.json({
      ok: true,
      equipos: equiposProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar inventario:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar el inventario",
    });
  }
};

// =====================================================
// OPCIONES
// =====================================================

const obtenerOpcionesInventario = async (
  req,
  res
) => {
  try {
    const [deportes] = await pool.query(`
      SELECT
        id_deporte,
        nombre

      FROM deportes

      WHERE
        estado = 'activo'

      ORDER BY
        nombre ASC
    `);

    return res.json({
      ok: true,
      deportes,
    });
  } catch (error) {
    console.error(
      "Error al consultar opciones:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar las opciones del inventario",
    });
  }
};

// =====================================================
// CREAR IMPLEMENTO
// =====================================================

const crearImplemento = async (
  req,
  res
) => {
  try {
    const {
      nombre,
      id_deporte,
      cantidad_total,
    } = req.body;

    const nombreLimpio =
      String(nombre || "").trim();

    const cantidadTotal =
      Number(cantidad_total);

    if (!nombreLimpio) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El nombre del implemento es obligatorio",
      });
    }

    if (
      !Number.isInteger(cantidadTotal) ||
      cantidadTotal < 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "La cantidad total debe ser un número entero igual o mayor que cero",
      });
    }

    let deporteId = null;

    if (
      id_deporte !== undefined &&
      id_deporte !== null &&
      String(id_deporte) !== ""
    ) {
      deporteId =
        Number(id_deporte);

      const [deportes] = await pool.query(
        `
          SELECT
            id_deporte,
            estado

          FROM deportes

          WHERE
            id_deporte = ?

          LIMIT 1
        `,
        [deporteId]
      );

      if (deportes.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "El deporte seleccionado no existe",
        });
      }

      if (
        deportes[0].estado !== "activo"
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El deporte seleccionado se encuentra inactivo",
        });
      }
    }

    // Solo compara contra implementos NO eliminados
    const [existentes] = await pool.query(
      `
        SELECT
          id_equipo

        FROM equipos_deportivos

        WHERE
          LOWER(nombre) = LOWER(?)
          AND eliminado = 0

        LIMIT 1
      `,
      [nombreLimpio]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje:
          "Ya existe un implemento con ese nombre",
      });
    }

    const [resultado] = await pool.query(
      `
        INSERT INTO equipos_deportivos
        (
          nombre,
          id_deporte,
          cantidad_total,
          cantidad_disponible,
          estado,
          eliminado
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          'activo',
          0
        )
      `,
      [
        nombreLimpio,
        deporteId,
        cantidadTotal,
        cantidadTotal,
      ]
    );

    return res.status(201).json({
      ok: true,
      mensaje:
        "Implemento registrado correctamente",

      id_equipo:
        resultado.insertId,
    });
  } catch (error) {
    console.error(
      "Error al registrar implemento:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al registrar el implemento",
    });
  }
};

// =====================================================
// ACTUALIZAR IMPLEMENTO
// =====================================================

const actualizarImplemento = async (
  req,
  res
) => {
  const conexion =
    await pool.getConnection();

  try {
    const {
      id,
    } = req.params;

    const {
      nombre,
      id_deporte,
      cantidad_total,
    } = req.body;

    const nombreLimpio =
      String(nombre || "").trim();

    const nuevaCantidadTotal =
      Number(cantidad_total);

    if (!nombreLimpio) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El nombre del implemento es obligatorio",
      });
    }

    if (
      !Number.isInteger(
        nuevaCantidadTotal
      ) ||
      nuevaCantidadTotal < 0
    ) {
      return res.status(400).json({
        ok: false,

        mensaje:
          "La cantidad total debe ser un número entero igual o mayor que cero",
      });
    }

    await conexion.beginTransaction();

    const [equipos] =
      await conexion.query(
        `
          SELECT
            id_equipo,
            nombre,
            cantidad_total,
            cantidad_disponible

          FROM equipos_deportivos

          WHERE
            id_equipo = ?
            AND eliminado = 0

          FOR UPDATE
        `,
        [id]
      );

    if (equipos.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        ok: false,
        mensaje:
          "Implemento no encontrado",
      });
    }

    const equipo =
      equipos[0];

    const cantidadActual =
      Number(
        equipo.cantidad_total
      ) || 0;

    const disponibleActual =
      Number(
        equipo.cantidad_disponible
      ) || 0;

    const cantidadPrestada =
      Math.max(
        cantidadActual -
          disponibleActual,
        0
      );

    if (
      nuevaCantidadTotal <
      cantidadPrestada
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          `Actualmente existen ${cantidadPrestada} unidad(es) prestada(s). No puedes reducir el total por debajo de esa cantidad.`,
      });
    }

    let deporteId = null;

    if (
      id_deporte !== undefined &&
      id_deporte !== null &&
      String(id_deporte) !== ""
    ) {
      deporteId =
        Number(id_deporte);

      const [deportes] =
        await conexion.query(
          `
            SELECT
              id_deporte,
              estado

            FROM deportes

            WHERE id_deporte = ?

            LIMIT 1
          `,
          [deporteId]
        );

      if (deportes.length === 0) {
        await conexion.rollback();

        return res.status(404).json({
          ok: false,
          mensaje:
            "El deporte seleccionado no existe",
        });
      }

      if (
        deportes[0].estado !== "activo"
      ) {
        await conexion.rollback();

        return res.status(400).json({
          ok: false,
          mensaje:
            "El deporte seleccionado se encuentra inactivo",
        });
      }
    }

    const [repetidos] =
      await conexion.query(
        `
          SELECT
            id_equipo

          FROM equipos_deportivos

          WHERE
            LOWER(nombre) = LOWER(?)

            AND id_equipo <> ?

            AND eliminado = 0

          LIMIT 1
        `,
        [
          nombreLimpio,
          id,
        ]
      );

    if (repetidos.length > 0) {
      await conexion.rollback();

      return res.status(409).json({
        ok: false,
        mensaje:
          "Ya existe otro implemento con ese nombre",
      });
    }

    const nuevaCantidadDisponible =
      nuevaCantidadTotal -
      cantidadPrestada;

    await conexion.query(
      `
        UPDATE equipos_deportivos

        SET
          nombre = ?,
          id_deporte = ?,
          cantidad_total = ?,
          cantidad_disponible = ?

        WHERE
          id_equipo = ?
      `,
      [
        nombreLimpio,
        deporteId,
        nuevaCantidadTotal,
        nuevaCantidadDisponible,
        id,
      ]
    );

    await conexion.commit();

    return res.json({
      ok: true,
      mensaje:
        "Implemento actualizado correctamente",
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (rollbackError) {
      console.error(
        rollbackError
      );
    }

    console.error(
      "Error al actualizar implemento:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al actualizar el implemento",
    });
  } finally {
    conexion.release();
  }
};

// =====================================================
// CAMBIAR ESTADO
// =====================================================

const cambiarEstadoImplemento = async (
  req,
  res
) => {
  try {
    const {
      id,
    } = req.params;

    const [equipos] = await pool.query(
      `
        SELECT
          id_equipo,
          nombre,
          estado

        FROM equipos_deportivos

        WHERE
          id_equipo = ?
          AND eliminado = 0

        LIMIT 1
      `,
      [id]
    );

    if (equipos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Implemento no encontrado",
      });
    }

    const equipo =
      equipos[0];

    const nuevoEstado =
      equipo.estado === "activo"
        ? "inactivo"
        : "activo";

    await pool.query(
      `
        UPDATE equipos_deportivos

        SET estado = ?

        WHERE id_equipo = ?
      `,
      [
        nuevoEstado,
        id,
      ]
    );

    return res.json({
      ok: true,

      mensaje:
        nuevoEstado === "activo"
          ? `"${equipo.nombre}" fue activado correctamente`
          : `"${equipo.nombre}" fue desactivado correctamente`,

      estado:
        nuevoEstado,
    });
  } catch (error) {
    console.error(
      "Error al cambiar estado:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al cambiar el estado del implemento",
    });
  }
};

// =====================================================
// ELIMINAR IMPLEMENTO
// =====================================================

const eliminarImplemento = async (
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

    const [equipos] =
      await conexion.query(
        `
          SELECT
            id_equipo,
            nombre

          FROM equipos_deportivos

          WHERE
            id_equipo = ?
            AND eliminado = 0

          FOR UPDATE
        `,
        [id]
      );

    if (equipos.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        ok: false,
        mensaje:
          "Implemento no encontrado",
      });
    }

    const equipo =
      equipos[0];

    // =================================================
    // SOLO IMPORTAN LOS PRÉSTAMOS ACTIVOS
    // =================================================

    const [resultadoActivos] =
      await conexion.query(
        `
          SELECT
            COUNT(*) AS total

          FROM prestamos

          WHERE
            id_equipo = ?
            AND estado = 'prestado'
        `,
        [id]
      );

    const prestamosActivos =
      Number(
        resultadoActivos[0].total
      ) || 0;

    if (
      prestamosActivos > 0
    ) {
      await conexion.rollback();

      return res.status(409).json({
        ok: false,

        mensaje:
          `No se puede eliminar "${equipo.nombre}" porque tiene ${prestamosActivos} préstamo(s) activo(s). Primero debes registrar la devolución.`,

        prestamos_activos:
          prestamosActivos,
      });
    }

    // =================================================
    // ELIMINACIÓN LÓGICA
    // =================================================

    await conexion.query(
      `
        UPDATE equipos_deportivos

        SET
          eliminado = 1,
          estado = 'inactivo'

        WHERE
          id_equipo = ?
      `,
      [id]
    );

    await conexion.commit();

    return res.json({
      ok: true,

      mensaje:
        `El implemento "${equipo.nombre}" fue eliminado correctamente.`,
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (rollbackError) {
      console.error(
        rollbackError
      );
    }

    console.error(
      "Error al eliminar implemento:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al eliminar el implemento",
    });
  } finally {
    conexion.release();
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerInventario,
  obtenerOpcionesInventario,
  crearImplemento,
  actualizarImplemento,
  cambiarEstadoImplemento,
  eliminarImplemento,
};