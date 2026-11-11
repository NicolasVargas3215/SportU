import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaSave,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  guardarAsistencia,
  obtenerActividadDocente,
} from "../../services/docenteService";

const formatearFechaHora =
  (fecha) => {
    if (!fecha) {
      return "—";
    }

    const objeto =
      new Date(
        String(
          fecha
        ).replace(
          " ",
          "T"
        )
      );

    if (
      Number.isNaN(
        objeto.getTime()
      )
    ) {
      return fecha;
    }

    return objeto.toLocaleString(
      "es-CO",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

const etiquetaEstado =
  (estado) => {
    const estados = {
      borrador:
        "Borrador",

      inscripciones_abiertas:
        "Inscripciones abiertas",

      en_curso:
        "En curso",

      finalizado:
        "Finalizado",

      cancelado:
        "Cancelado",
    };

    return (
      estados[
        estado
      ] ||
      estado
    );
  };

function AsistenciaPage() {
  const {
    id,
  } = useParams();

  const [
    evento,
    setEvento,
  ] = useState(null);

  const [
    inscritos,
    setInscritos,
  ] = useState([]);

  const [
    sesiones,
    setSesiones,
  ] = useState([]);

  const [
    idSesion,
    setIdSesion,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exito,
    setExito,
  ] = useState("");

  const cargarActividad =
    async (sesionParaCargar = "") => {
      try {
        setCargando(
          true
        );

        setError("");

        const datos =
          await obtenerActividadDocente(
            id,
            sesionParaCargar
          );

        setEvento(
          datos.evento
        );

        setInscritos(
          datos.inscritos ||
            []
        );

        setSesiones(
          datos.sesiones || []
        );

        setIdSesion(
          String(
            datos.id_sesion ||
              sesionParaCargar ||
              datos.sesiones?.[0]?.id_sesion ||
              ""
          )
        );
      } catch (err) {
        setError(
          err.message ||
            "No fue posible consultar la actividad."
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarActividad();
  }, [
    id,
  ]);

  const cambiarSesion = async (event) => {
    const nuevaSesion = event.target.value;
    setIdSesion(nuevaSesion);
    await cargarActividad(nuevaSesion);
  };

  const resumen =
    useMemo(() => {
      return inscritos.reduce(
        (
          acumulado,
          estudiante
        ) => {
          acumulado.total +=
            1;

          if (
            estudiante.asistencia ===
            "Asistió"
          ) {
            acumulado.asistieron +=
              1;
          }

          if (
            estudiante.asistencia ===
            "No asistió"
          ) {
            acumulado.noAsistieron +=
              1;
          }

          if (
            estudiante.asistencia ===
            "Pendiente"
          ) {
            acumulado.pendientes +=
              1;
          }

          return acumulado;
        },
        {
          total: 0,
          asistieron: 0,
          noAsistieron: 0,
          pendientes: 0,
        }
      );
    }, [
      inscritos,
    ]);

  const cambiarAsistencia =
    (
      idInscripcion,
      asistencia
    ) => {
      setInscritos(
        (
          actuales
        ) =>
          actuales.map(
            (
              estudiante
            ) =>
              estudiante.id_inscripcion ===
              idInscripcion
                ? {
                    ...estudiante,
                    asistencia,
                  }
                : estudiante
          )
      );

      setExito("");
    };

  const marcarTodos =
    (
      asistencia
    ) => {
      setInscritos(
        (
          actuales
        ) =>
          actuales.map(
            (
              estudiante
            ) => ({
              ...estudiante,
              asistencia,
            })
          )
      );

      setExito("");
    };

  const manejarGuardar =
    async () => {
      if (
        !evento
          ?.puede_registrar_asistencia
      ) {
        return;
      }

      if (
        inscritos.length ===
        0
      ) {
        return;
      }

      try {
        setGuardando(
          true
        );

        setError("");
        setExito("");

        const asistencias =
          inscritos.map(
            (
              estudiante
            ) => ({
              id_inscripcion:
                estudiante.id_inscripcion,

              asistencia:
                estudiante.asistencia,
            })
          );

        const resultado =
          await guardarAsistencia(
            evento.id_evento,
            asistencias,
            idSesion
          );

        setExito(
          resultado.mensaje ||
            "Asistencia guardada correctamente."
        );

        await cargarActividad(idSesion);
      } catch (err) {
        setError(
          err.message ||
            "No fue posible guardar la asistencia."
        );
      } finally {
        setGuardando(
          false
        );
      }
    };

  const descargarListadoInscritos = async () => {
    if (!inscritos.length) {
      return;
    }

    const XLSX = await import("xlsx");

    const filas = inscritos.map((estudiante) => ({
      Estudiante: estudiante.estudiante,
      Correo: estudiante.correo,
      "Sesiones programadas": Number(
        estudiante.sesiones_programadas || 0
      ),
      "Sesiones evaluadas": Number(
        estudiante.sesiones_evaluadas || 0
      ),
      Asistencias: Number(
        estudiante.asistencias || 0
      ),
      "No asistencias": Number(
        estudiante.no_asistencias || 0
      ),
      "Ponderado de asistencia": Number(
        estudiante.porcentaje_asistencia || 0
      ) / 100,
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [
      { wch: 28 },
      { wch: 34 },
      { wch: 20 },
      { wch: 19 },
      { wch: 14 },
      { wch: 17 },
      { wch: 25 },
    ];
    hoja["!autofilter"] = {
      ref: `A1:G${filas.length + 1}`,
    };
    hoja["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
    };

    for (let fila = 2; fila <= filas.length + 1; fila += 1) {
      const celda = hoja[`G${fila}`];
      if (celda) {
        celda.z = "0.0%";
      }
    }

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      "Asistencia"
    );
    const nombreEvento = String(evento?.nombre || "evento")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    XLSX.writeFile(
      libro,
      `listado-inscritos-${nombreEvento || "evento"}.xlsx`
    );
  };

  if (cargando) {
    return (
      <div className="teacher-page">

        <div className="teacher-dashboard-card teacher-loading">
          Cargando actividad...
        </div>

      </div>
    );
  }

  if (
    !evento
  ) {
    return (
      <div className="teacher-page">

        <div className="teacher-alert error">
          {error ||
            "No fue posible cargar la actividad."}
        </div>

      </div>
    );
  }

  return (
    <div className="teacher-page">

      <Link
        to="/docente/actividades"
        className="teacher-back-link"
      >
        <FaArrowLeft />

        Volver a mis actividades
      </Link>

      <section className="teacher-header attendance-header">

        <div>

          <span className="teacher-eyebrow">
            CONTROL DE ASISTENCIA
          </span>

          <h1>
            {evento.nombre}
          </h1>

          <p>
            {evento.deporte}
          </p>

        </div>

        <span
          className={`teacher-state teacher-state-${evento.estado}`}
        >
          {etiquetaEstado(
            evento.estado
          )}
        </span>

      </section>

      {error && (
        <div className="teacher-alert error">
          <FaExclamationTriangle />

          {error}
        </div>
      )}

      {exito && (
        <div className="teacher-alert success">
          <FaCheckCircle />

          {exito}
        </div>
      )}

      {!evento.puede_registrar_asistencia && (
        <div className="teacher-alert warning">

          <FaExclamationTriangle />

          <div>

            <strong>
              Asistencia en modo consulta
            </strong>

            <span>
              Solo se puede modificar cuando el
              evento está En curso o Finalizado.
            </span>

          </div>

        </div>
      )}

      <section className="teacher-event-info">

        <div>

          <FaCalendarAlt />

          <div>
            <span>
              Inicio
            </span>

            <strong>
              {formatearFechaHora(
                evento.fecha_inicio
              )}
            </strong>
          </div>

        </div>

        <div>

          <FaClock />

          <div>
            <span>
                Duración de la sesión
            </span>

            <strong>
              {
                evento.duracion_horas
              }{" "}
              h
            </strong>
          </div>

        </div>

          <div>

            <FaClock />

            <div>
              <span>
                Total programado
              </span>

              <strong>
                {
                  evento.duracion_total_horas
                } h
              </strong>
            </div>

          </div>

        <div>

          <FaMapMarkerAlt />

          <div>
            <span>
              Lugar
            </span>

            <strong>
              {
                evento.lugar
              }
            </strong>
          </div>

        </div>

        <div>

          <FaUsers />

          <div>
            <span>
              Inscritos
            </span>

            <strong>
              {
                inscritos.length
              }
            </strong>
          </div>

        </div>

      </section>

      {sesiones.length > 0 && (
        <section className="teacher-dashboard-card attendance-session-selector">
          <label htmlFor="sesion_asistencia">
            Sesión a registrar
          </label>

          <select
            id="sesion_asistencia"
            value={idSesion}
            onChange={cambiarSesion}
            disabled={cargando || guardando}
          >
            {sesiones.map((sesion) => (
              <option
                key={sesion.id_sesion}
                value={sesion.id_sesion}
              >
                {sesion.fecha_sesion} — {sesion.hora_inicio} a {sesion.hora_fin}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="teacher-summary-grid attendance-summary">

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon blue">
            <FaUsers />
          </div>

          <div>
            <span>
              Inscritos
            </span>

            <strong>
              {
                resumen.total
              }
            </strong>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Asistieron
            </span>

            <strong>
              {
                resumen.asistieron
              }
            </strong>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon red">
            <FaTimesCircle />
          </div>

          <div>
            <span>
              No asistieron
            </span>

            <strong>
              {
                resumen.noAsistieron
              }
            </strong>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon warning">
            <FaClock />
          </div>

          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {
                resumen.pendientes
              }
            </strong>
          </div>

        </article>

      </section>

      <section className="teacher-dashboard-card">

        <div className="teacher-section-heading attendance-toolbar">

          <div>

            <h2>
              Participantes
            </h2>

            <p>
              Define la asistencia de cada estudiante
              inscrito.
            </p>

          </div>

          <div className="teacher-bulk-buttons">

            {inscritos.length > 0 && (
              <button
                type="button"
                className="teacher-outline-download"
                onClick={descargarListadoInscritos}
              >
                <FaDownload />
                Descargar listado
              </button>
            )}

            {evento.puede_registrar_asistencia &&
              inscritos.length > 0 && (
                <>
                <button
                  type="button"
                  className="teacher-outline-success"
                  onClick={() =>
                    marcarTodos(
                      "Asistió"
                    )
                  }
                >
                  <FaCheckCircle />

                  Todos asistieron
                </button>

                <button
                  type="button"
                  className="teacher-outline-warning"
                  onClick={() =>
                    marcarTodos(
                      "Pendiente"
                    )
                  }
                >
                  Dejar pendientes
                </button>

                </>

              )}

          </div>

        </div>

        {inscritos.length ===
        0 ? (
          <div className="teacher-empty">

            <FaUsers />

            <strong>
              No hay estudiantes inscritos
            </strong>

            <span>
              Esta actividad todavía no tiene participantes.
            </span>

          </div>
        ) : (
          <div className="teacher-attendance-table-wrapper">

            <table className="teacher-attendance-table">

              <thead>
                <tr>
                  <th>
                    Estudiante
                  </th>

                  <th>
                    Correo
                  </th>

                  <th>
                    Estado actual
                  </th>

                  <th>
                    Asistencia
                  </th>

                  <th>
                    Ponderado
                  </th>
                </tr>
              </thead>

              <tbody>

                {inscritos.map(
                  (
                    estudiante
                  ) => (
                    <tr
                      key={
                        estudiante.id_inscripcion
                      }
                    >

                      <td
                        data-label="Estudiante"
                      >
                        <div className="teacher-student-cell">

                          <div className="teacher-student-avatar">
                            {estudiante.estudiante
                              ?.charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <strong>
                            {
                              estudiante.estudiante
                            }
                          </strong>

                        </div>
                      </td>

                      <td
                        data-label="Correo"
                      >
                        {
                          estudiante.correo
                        }
                      </td>

                      <td
                        data-label="Estado actual"
                      >
                        <span
                          className={`teacher-attendance-badge ${
                            estudiante.asistencia ===
                            "Asistió"
                              ? "attended"
                              : estudiante.asistencia ===
                                "No asistió"
                              ? "absent"
                              : "pending"
                          }`}
                        >
                          {
                            estudiante.asistencia
                          }
                        </span>
                      </td>

                      <td
                        data-label="Asistencia"
                      >
                        <select
                          className="teacher-attendance-select"
                          value={
                            estudiante.asistencia
                          }
                          disabled={
                            !evento.puede_registrar_asistencia
                          }
                          onChange={(
                            event
                          ) =>
                            cambiarAsistencia(
                              estudiante.id_inscripcion,
                              event.target.value
                            )
                          }
                        >
                          <option value="Pendiente">
                            Pendiente
                          </option>

                          <option value="Asistió">
                            Asistió
                          </option>

                          <option value="No asistió">
                            No asistió
                          </option>
                        </select>
                      </td>

                      <td
                        data-label="Ponderado"
                      >
                        <strong className="teacher-attendance-percentage">
                          {Number(
                            estudiante.porcentaje_asistencia || 0
                          ).toFixed(1)}%
                        </strong>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {evento.puede_registrar_asistencia &&
          inscritos.length >
            0 && (
            <div className="teacher-save-bar">

              <div>

                <strong>
                  {resumen.pendientes >
                  0
                    ? `${resumen.pendientes} asistencia(s) pendiente(s)`
                    : "Todas las asistencias están definidas"}
                </strong>

                <span>
                  Puedes guardar nuevamente si necesitas
                  corregir un registro.
                </span>

              </div>

              <button
                type="button"
                className="teacher-primary-button"
                disabled={
                  guardando
                }
                onClick={
                  manejarGuardar
                }
              >
                <FaSave />

                {guardando
                  ? "Guardando..."
                  : "Guardar asistencia"}
              </button>

            </div>
          )}

      </section>

    </div>
  );
}

export default AsistenciaPage;
