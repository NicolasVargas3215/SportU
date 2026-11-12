const pool = require("./db");

const ensureAttendanceStatusSchema = async () => {
  const [columns] = await pool.query(
    `
      SELECT COLUMN_TYPE AS column_type
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'asistencias_sesion'
        AND COLUMN_NAME = 'estado'
      LIMIT 1
    `
  );

  if (!columns.length) return;

  const columnType = String(columns[0].column_type || "");
  if (columnType.includes("Asistió") && columnType.includes("No asistió")) {
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
        ALTER TABLE asistencias_sesion
        MODIFY COLUMN estado VARCHAR(20)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        NOT NULL DEFAULT 'Pendiente'
      `
    );

    await connection.query(
      `
        UPDATE asistencias_sesion
        SET estado = CASE LOWER(TRIM(estado))
          WHEN 'asistio' THEN 'Asistió'
          WHEN 'asistió' THEN 'Asistió'
          WHEN 'no asistio' THEN 'No asistió'
          WHEN 'no asistió' THEN 'No asistió'
          ELSE 'Pendiente'
        END
      `
    );

    await connection.query(
      `
        ALTER TABLE asistencias_sesion
        MODIFY COLUMN estado ENUM('Pendiente', 'Asistió', 'No asistió')
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        NOT NULL DEFAULT 'Pendiente'
      `
    );

    await connection.commit();
    console.log("Esquema de asistencias_sesion actualizado correctamente.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { ensureAttendanceStatusSchema };
