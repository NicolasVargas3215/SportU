const pool = require("../config/db");

// =====================================================
// OBTENER TODOS LOS PRÉSTAMOS
// =====================================================

const obtenerPrestamos = async (req, res) => {
  try {
    const [prestamos] = await pool.query(`
      SELECT
        p.id_prestamo,

        p.id_equipo,
        e.nombre AS equipo,
        e.eliminado AS equipo_eliminado,

        p.id_usuario,
        u.nombre AS usuario,
        u.correo,
        u.rol,

        p.cantidad,

        DATE_FORMAT(
          p.fecha_prestamo,
          '%Y-%m-%d %H:%i'
        ) AS fecha_prestamo,

        DATE_FORMAT(
          p.fecha_devolucion,
          '%Y-%m-%d %H:%i'
        ) AS fecha_devolucion,

        p.estado

      FROM prestamos p

      INNER JOIN equipos_deportivos e
        ON e.id_equipo = p.id_equipo

      INNER JOIN usuarios u
        ON u.id_usuario = p.id_usuario

      ORDER BY
        p.id_prestamo DESC
    `);

    const prestamosProcesados =
      prestamos.map((prestamo) => ({
        ...prestamo,

        cantidad:
          Number(prestamo.cantidad) || 0,

        equipo_eliminado:
          Boolean(
            prestamo.equipo_eliminado
          ),
      }));

    return res.json({
      ok: true,
      prestamos:
        prestamosProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar préstamos:",
      error
    );

    return res.status(500).json({
      ok: false,

      mensaje:
        "Error al consultar los préstamos",
    });
  }
};

// =====================================================
// OBTENER OPCIONES PARA REGISTRAR PRÉSTAMO
// =====================================================

const obtenerOpcionesPrestamo = async (
  req,
  res
) => {
  try {
    // =================================================
    // IMPLEMENTOS
    // =================================================
    //
    // Solo aparecen:
    // - activos
    // - no eliminados
    // - con disponibilidad
    // =================================================

    const [equipos] = await pool.query(`
      SELECT
        id_equipo,
        nombre,
        cantidad_total,
        cantidad_disponible,
        estado

      FROM equipos_deportivos

      WHERE
        estado = 'activo'

        AND
        eliminado = 0

        AND
        cantidad_disponible > 0

      ORDER BY
        nombre ASC
    `);

    // =================================================
    // USUARIOS
    // =================================================

    const [usuarios] = await pool.query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.correo,
        u.rol,

        EXISTS(
          SELECT 1

          FROM prestamos p

          WHERE
            p.id_usuario =
            u.id_usuario

            AND
            p.estado =
            'prestado'
        ) AS tiene_prestamo_activo

      FROM usuarios u

      WHERE
        u.estado =
        'activo'

      ORDER BY
        u.nombre ASC
    `);

    const usuariosProcesados =
      usuarios.map((usuario) => ({
        ...usuario,

        tiene_prestamo_activo:
          Boolean(
            usuario.tiene_prestamo_activo
          ),
      }));

    const equiposProcesados =
      equipos.map((equipo) => ({
        ...equipo,

        cantidad_total:
          Number(
            equipo.cantidad_total
          ) || 0,

        cantidad_disponible:
          Number(
            equipo.cantidad_disponible
          ) || 0,
      }));

    return res.json({
      ok: true,

      equipos:
        equiposProcesados,

      usuarios:
        usuariosProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar opciones de préstamo:",
      error
    );

    return res.status(500).json({
      ok: false,

      mensaje:
        "Error al consultar las opciones de préstamo",
    });
  }
};

// =====================================================
// REGISTRAR PRÉSTAMO
// =====================================================

const registrarPrestamo = async (
  req,
  res
) => {
  const conexion =
    await pool.getConnection();

  try {
    const {
      id_equipo,
      id_usuario,
      cantidad,
    } = req.body;

    // =================================================
    // VALIDACIONES GENERALES
    // =================================================

    if (
      !id_equipo ||
      !id_usuario
    ) {
      return res.status(400).json({
        ok: false,

        mensaje:
          "El implemento y el usuario son obligatorios",
      });
    }

    const cantidadSolicitada =
      Number(cantidad);

    if (
      !Number.isInteger(
        cantidadSolicitada
      ) ||
      cantidadSolicitada <= 0
    ) {
      return res.status(400).json({
        ok: false,

        mensaje:
          "La cantidad debe ser un número entero mayor que cero",
      });
    }

    // =================================================
    // INICIAR TRANSACCIÓN
    // =================================================

    await conexion.beginTransaction();

    // =================================================
    // USUARIO
    // =================================================
    //
    // Lo bloqueamos para evitar dos préstamos
    // simultáneos al mismo usuario.
    // =================================================

    const [usuarios] =
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

          FOR UPDATE
        `,
        [id_usuario]
      );

    if (
      usuarios.length === 0
    ) {
      await conexion.rollback();

      return res.status(404).json({
        ok: false,

        mensaje:
          "El usuario seleccionado no existe",
      });
    }

    const usuario =
      usuarios[0];

    if (
      usuario.estado !==
      "activo"
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          "El usuario seleccionado se encuentra inactivo",
      });
    }

    // =================================================
    // VERIFICAR PRÉSTAMO ACTIVO DEL USUARIO
    // =================================================

    const [
      prestamosActivos,
    ] =
      await conexion.query(
        `
          SELECT
            p.id_prestamo,
            p.id_equipo,
            e.nombre AS equipo,
            p.cantidad,
            p.fecha_prestamo

          FROM prestamos p

          INNER JOIN equipos_deportivos e
            ON e.id_equipo =
            p.id_equipo

          WHERE
            p.id_usuario = ?

            AND
            p.estado =
            'prestado'

          LIMIT 1
        `,
        [id_usuario]
      );

    if (
      prestamosActivos.length >
      0
    ) {
      const prestamoActivo =
        prestamosActivos[0];

      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          `El usuario ya tiene un préstamo activo de "${prestamoActivo.equipo}". ` +
          "Debe registrar la devolución antes de realizar otro préstamo.",

        prestamo_activo: {
          id_prestamo:
            prestamoActivo.id_prestamo,

          equipo:
            prestamoActivo.equipo,

          cantidad:
            prestamoActivo.cantidad,

          fecha_prestamo:
            prestamoActivo.fecha_prestamo,
        },
      });
    }

    // =================================================
    // CONSULTAR IMPLEMENTO
    // =================================================

    const [equipos] =
      await conexion.query(
        `
          SELECT
            id_equipo,
            nombre,
            cantidad_total,
            cantidad_disponible,
            estado,
            eliminado

          FROM equipos_deportivos

          WHERE
            id_equipo = ?

          FOR UPDATE
        `,
        [id_equipo]
      );

    if (
      equipos.length === 0
    ) {
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
    // VALIDAR ELIMINACIÓN LÓGICA
    // =================================================

    if (
      Number(
        equipo.eliminado
      ) === 1
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          `"${equipo.nombre}" fue eliminado del inventario y ya no está disponible para nuevos préstamos.`,
      });
    }

    // =================================================
    // VALIDAR ESTADO
    // =================================================

    if (
      equipo.estado !==
      "activo"
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          "El implemento seleccionado se encuentra inactivo",
      });
    }

    // =================================================
    // DISPONIBILIDAD
    // =================================================

    const disponibles =
      Number(
        equipo.cantidad_disponible
      ) || 0;

    if (
      cantidadSolicitada >
      disponibles
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          `No hay suficientes unidades disponibles. Actualmente existen ${disponibles} unidad(es) disponibles.`,
      });
    }

    // =================================================
    // REGISTRAR PRÉSTAMO
    // =================================================

    const [resultado] =
      await conexion.query(
        `
          INSERT INTO prestamos
          (
            id_equipo,
            id_usuario,
            cantidad,
            fecha_prestamo,
            fecha_devolucion,
            estado
          )
          VALUES
          (
            ?,
            ?,
            ?,
            NOW(),
            NULL,
            'prestado'
          )
        `,
        [
          id_equipo,
          id_usuario,
          cantidadSolicitada,
        ]
      );

    // =================================================
    // DESCONTAR INVENTARIO
    // =================================================

    await conexion.query(
      `
        UPDATE equipos_deportivos

        SET
          cantidad_disponible =
          cantidad_disponible - ?

        WHERE
          id_equipo = ?
      `,
      [
        cantidadSolicitada,
        id_equipo,
      ]
    );

    // =================================================
    // CONFIRMAR
    // =================================================

    await conexion.commit();

    return res.status(201).json({
      ok: true,

      mensaje:
        "Préstamo registrado correctamente",

      id_prestamo:
        resultado.insertId,

      prestamo: {
        usuario:
          usuario.nombre,

        equipo:
          equipo.nombre,

        cantidad:
          cantidadSolicitada,

        estado:
          "prestado",
      },
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (
      rollbackError
    ) {
      console.error(
        "Error al revertir préstamo:",
        rollbackError
      );
    }

    console.error(
      "Error al registrar préstamo:",
      error
    );

    return res.status(500).json({
      ok: false,

      mensaje:
        "Error al registrar el préstamo",
    });
  } finally {
    conexion.release();
  }
};

// =====================================================
// REGISTRAR DEVOLUCIÓN
// =====================================================

const registrarDevolucion = async (
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
    // OBTENER PRÉSTAMO
    // =================================================

    const [prestamos] =
      await conexion.query(
        `
          SELECT
            id_prestamo,
            id_equipo,
            id_usuario,
            cantidad,
            estado

          FROM prestamos

          WHERE
            id_prestamo = ?

          FOR UPDATE
        `,
        [id]
      );

    if (
      prestamos.length === 0
    ) {
      await conexion.rollback();

      return res.status(404).json({
        ok: false,

        mensaje:
          "Préstamo no encontrado",
      });
    }

    const prestamo =
      prestamos[0];

    // =================================================
    // VALIDAR DEVOLUCIÓN PREVIA
    // =================================================

    if (
      prestamo.estado ===
      "devuelto"
    ) {
      await conexion.rollback();

      return res.status(400).json({
        ok: false,

        mensaje:
          "Este préstamo ya fue devuelto",
      });
    }

    // =================================================
    // ACTUALIZAR PRÉSTAMO
    // =================================================

    await conexion.query(
      `
        UPDATE prestamos

        SET
          estado = 'devuelto',
          fecha_devolucion = NOW()

        WHERE
          id_prestamo = ?
      `,
      [id]
    );

    // =================================================
    // DEVOLVER UNIDADES AL INVENTARIO
    // =================================================
    //
    // Aunque normalmente no puede eliminarse un
    // implemento con un préstamo activo, mantenemos
    // esta operación independiente del campo eliminado
    // para proteger la consistencia del inventario.
    // =================================================

    await conexion.query(
      `
        UPDATE equipos_deportivos

        SET
          cantidad_disponible =
          cantidad_disponible + ?

        WHERE
          id_equipo = ?
      `,
      [
        prestamo.cantidad,
        prestamo.id_equipo,
      ]
    );

    await conexion.commit();

    return res.json({
      ok: true,

      mensaje:
        "Devolución registrada correctamente",
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (
      rollbackError
    ) {
      console.error(
        "Error al revertir devolución:",
        rollbackError
      );
    }

    console.error(
      "Error al registrar devolución:",
      error
    );

    return res.status(500).json({
      ok: false,

      mensaje:
        "Error al registrar la devolución",
    });
  } finally {
    conexion.release();
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerPrestamos,
  obtenerOpcionesPrestamo,
  registrarPrestamo,
  registrarDevolucion,
};