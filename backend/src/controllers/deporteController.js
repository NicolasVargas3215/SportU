const pool = require("../config/db");

const obtenerCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT id_categoria, nombre, descripcion FROM categorias_deportivas WHERE estado = 'activo' ORDER BY nombre"
    );
    return res.json({ ok: true, categorias });
  } catch (error) {
    console.error("Error al consultar categorías deportivas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al consultar las categorías deportivas" });
  }
};

// =====================================================
// OBTENER TODOS LOS DEPORTES
// =====================================================

const obtenerDeportes = async (req, res) => {
  try {
    const [deportes] = await pool.query(`
      SELECT
        d.id_deporte,
        d.nombre,
        d.descripcion,
        d.estado,
        d.id_categoria,
        c.nombre AS categoria,

        (
          SELECT COUNT(*)
          FROM eventos e
          WHERE e.id_deporte = d.id_deporte
        ) AS eventos_asociados

      FROM deportes d
      LEFT JOIN categorias_deportivas c ON c.id_categoria = d.id_categoria

      ORDER BY d.id_deporte DESC
    `);

    const deportesProcesados = deportes.map((deporte) => ({
      ...deporte,

      eventos_asociados:
        Number(deporte.eventos_asociados) || 0,
    }));

    return res.json({
      ok: true,
      deportes: deportesProcesados,
    });
  } catch (error) {
    console.error(
      "Error al consultar deportes:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al consultar los deportes",
    });
  }
};

// =====================================================
// CREAR DEPORTE
// =====================================================

const crearDeporte = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      id_categoria,
    } = req.body;

    const nombreLimpio =
      String(nombre || "").trim();

    const descripcionLimpia =
      String(descripcion || "").trim();

    if (!id_categoria) {
      return res.status(400).json({ ok: false, mensaje: "La categoría del deporte es obligatoria" });
    }

    if (!nombreLimpio) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El nombre del deporte es obligatorio",
      });
    }

    // =================================================
    // VALIDAR NOMBRE REPETIDO
    // =================================================

    const [existentes] = await pool.query(
      `
        SELECT
          id_deporte
        FROM deportes
        WHERE LOWER(nombre) = LOWER(?)
        LIMIT 1
      `,
      [nombreLimpio]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje:
          "Ya existe un deporte con ese nombre",
      });
    }

    // =================================================
    // INSERTAR
    // =================================================

    const [resultado] = await pool.query(
      `
        INSERT INTO deportes
        (
          nombre,
          descripcion,
          id_categoria,
          estado
        )
        VALUES
        (
          ?,
          ?,
          ?,
          'activo'
        )
      `,
      [
        nombreLimpio,
        descripcionLimpia || null,
        id_categoria,
      ]
    );

    return res.status(201).json({
      ok: true,

      mensaje:
        "Deporte registrado correctamente",

      id_deporte:
        resultado.insertId,
    });
  } catch (error) {
    console.error(
      "Error al registrar deporte:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al registrar el deporte",
    });
  }
};

// =====================================================
// ACTUALIZAR DEPORTE
// =====================================================

const actualizarDeporte = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    const {
      nombre,
      descripcion,
      id_categoria,
    } = req.body;

    const nombreLimpio =
      String(nombre || "").trim();

    const descripcionLimpia =
      String(descripcion || "").trim();

    if (!id_categoria) {
      return res.status(400).json({ ok: false, mensaje: "La categoría del deporte es obligatoria" });
    }

    if (!nombreLimpio) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El nombre del deporte es obligatorio",
      });
    }

    // =================================================
    // VALIDAR EXISTENCIA
    // =================================================

    const [deportes] = await pool.query(
      `
        SELECT
          id_deporte
        FROM deportes
        WHERE id_deporte = ?
        LIMIT 1
      `,
      [id]
    );

    if (deportes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Deporte no encontrado",
      });
    }

    // =================================================
    // VALIDAR NOMBRE REPETIDO
    // =================================================

    const [repetidos] = await pool.query(
      `
        SELECT
          id_deporte
        FROM deportes

        WHERE
          LOWER(nombre) = LOWER(?)
          AND id_deporte <> ?

        LIMIT 1
      `,
      [
        nombreLimpio,
        id,
      ]
    );

    if (repetidos.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje:
          "Ya existe otro deporte con ese nombre",
      });
    }

    // =================================================
    // ACTUALIZAR
    // =================================================

    await pool.query(
      `
        UPDATE deportes

        SET
          nombre = ?,
          descripcion = ?,
          id_categoria = ?

        WHERE
          id_deporte = ?
      `,
      [
        nombreLimpio,
        descripcionLimpia || null,
        id_categoria,
        id,
      ]
    );

    return res.json({
      ok: true,
      mensaje:
        "Deporte actualizado correctamente",
    });
  } catch (error) {
    console.error(
      "Error al actualizar deporte:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al actualizar el deporte",
    });
  }
};

// =====================================================
// CAMBIAR ESTADO
// =====================================================

const cambiarEstadoDeporte = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    const [deportes] = await pool.query(
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
      [id]
    );

    if (deportes.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje:
          "Deporte no encontrado",
      });
    }

    const deporte =
      deportes[0];

    const nuevoEstado =
      deporte.estado === "activo"
        ? "inactivo"
        : "activo";

    await pool.query(
      `
        UPDATE deportes

        SET estado = ?

        WHERE
          id_deporte = ?
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
          ? `"${deporte.nombre}" fue activado correctamente`
          : `"${deporte.nombre}" fue desactivado correctamente`,

      estado: nuevoEstado,
    });
  } catch (error) {
    console.error(
      "Error al cambiar estado del deporte:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al cambiar el estado del deporte",
    });
  }
};

// =====================================================
// ELIMINAR DEPORTE
// =====================================================

const eliminarDeporte = async (req, res) => {
  const conexion =
    await pool.getConnection();

  try {
    const {
      id,
    } = req.params;

    await conexion.beginTransaction();

    // =================================================
    // BUSCAR DEPORTE
    // =================================================

    const [deportes] = await conexion.query(
      `
        SELECT
          id_deporte,
          nombre,
          estado

        FROM deportes

        WHERE
          id_deporte = ?

        FOR UPDATE
      `,
      [id]
    );

    if (deportes.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        ok: false,
        mensaje:
          "Deporte no encontrado",
      });
    }

    const deporte =
      deportes[0];

    // =================================================
    // CONSULTAR EVENTOS ASOCIADOS
    // =================================================

    const [resultadoEventos] =
      await conexion.query(
        `
          SELECT
            COUNT(*) AS total

          FROM eventos

          WHERE
            id_deporte = ?
        `,
        [id]
      );

    const totalEventos =
      Number(
        resultadoEventos[0].total
      ) || 0;

    // =================================================
    // PROTEGER HISTORIAL
    // =================================================

    if (totalEventos > 0) {
      await conexion.rollback();

      return res.status(409).json({
        ok: false,

        mensaje:
          `No se puede eliminar "${deporte.nombre}" porque tiene ${totalEventos} evento(s) asociado(s). Puedes desactivarlo para evitar que se utilice en nuevos eventos.`,

        eventos_asociados:
          totalEventos,
      });
    }

    // =================================================
    // ELIMINAR
    // =================================================

    await conexion.query(
      `
        DELETE FROM deportes
        WHERE id_deporte = ?
      `,
      [id]
    );

    await conexion.commit();

    return res.json({
      ok: true,

      mensaje:
        `El deporte "${deporte.nombre}" fue eliminado correctamente.`,
    });
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (rollbackError) {
      console.error(
        "Error al revertir eliminación:",
        rollbackError
      );
    }

    console.error(
      "Error al eliminar deporte:",
      error
    );

    return res.status(500).json({
      ok: false,
      mensaje:
        "Error al eliminar el deporte",
    });
  } finally {
    conexion.release();
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  obtenerCategorias,
  obtenerDeportes,
  crearDeporte,
  actualizarDeporte,
  cambiarEstadoDeporte,
  eliminarDeporte,
};
