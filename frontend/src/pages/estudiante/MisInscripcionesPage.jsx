import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaTimesCircle,
  FaUserTie,
} from "react-icons/fa";

import {
  obtenerMisInscripciones,
} from "../../services/inscripcionService";

// =====================================================
// HELPERS
// =====================================================

const obtenerFechaInicio =
  (
    inscripcion
  ) => {
    if (
      inscripcion.fecha_inicio
    ) {
      return inscripcion.fecha_inicio;
    }

    if (
      inscripcion.fecha
    ) {
      return `${inscripcion.fecha}T${
        inscripcion.hora ||
        "00:00"
      }`;
    }

    return null;
  };

const formatearFechaHora =
  (
    fecha
  ) => {
    if (
      !fecha
    ) {
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

const formatearHoras =
  (
    valor
  ) =>
    `${Number(
      valor || 0
    )
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      )} h`;

// =====================================================
// COMPONENTE
// =====================================================

function MisInscripcionesPage() {
  const [
    inscripciones,
    setInscripciones,
  ] = useState([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState(
    "todos"
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setCargando(
            true
          );

          setError("");

          const datos =
            await obtenerMisInscripciones();

          setInscripciones(
            datos.inscripciones ||
              []
          );
        } catch (err) {
          setError(
            err.message ||
              "No fue posible consultar tus inscripciones."
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargar();
  }, []);

  const filtradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return inscripciones.filter(
        (
          inscripcion
        ) => {
          const coincideTexto =
            !texto ||
            inscripcion.evento
              ?.toLowerCase()
              .includes(
                texto
              ) ||
            inscripcion.deporte
              ?.toLowerCase()
              .includes(
                texto
              ) ||
            inscripcion.docente
              ?.toLowerCase()
              .includes(
                texto
              );

          const coincideFiltro =
            filtro ===
              "todos" ||
            inscripcion.asistencia ===
              filtro;

          return (
            coincideTexto &&
            coincideFiltro
          );
        }
      );
    }, [
      inscripciones,
      busqueda,
      filtro,
    ]);

  const resumen =
    useMemo(() => {
      return inscripciones.reduce(
        (
          acumulado,
          item
        ) => {
          acumulado.total +=
            1;

          if (
            item.asistencia ===
            "Asistió"
          ) {
            acumulado.asistio +=
              1;

            acumulado.horas +=
              Number(
                item.duracion_horas ||
                  0
              );
          }

          if (
            item.asistencia ===
            "No asistió"
          ) {
            acumulado.noAsistio +=
              1;
          }

          if (
            item.asistencia ===
            "Pendiente"
          ) {
            acumulado.pendiente +=
              1;
          }

          return acumulado;
        },
        {
          total: 0,
          asistio: 0,
          noAsistio: 0,
          pendiente: 0,
          horas: 0,
        }
      );
    }, [
      inscripciones,
    ]);

  return (
    <div className="student-page">

      <section className="student-page-header">

        <div>

          <span className="student-eyebrow">
            MI PARTICIPACIÓN
          </span>

          <h1>
            Mis inscripciones
          </h1>

          <p>
            Consulta los eventos en los que estás
            registrado y revisa el estado de tu
            asistencia.
          </p>

        </div>

      </section>

      {error && (
        <div className="student-alert error">
          {error}
        </div>
      )}

      <section className="student-summary-grid">

        <article className="student-summary-card">

          <div className="student-summary-icon blue">
            <FaCalendarAlt />
          </div>

          <div>
            <span>
              Inscripciones
            </span>

            <strong>
              {
                resumen.total
              }
            </strong>

            <small>
              Total registrado
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Asistencias
            </span>

            <strong>
              {
                resumen.asistio
              }
            </strong>

            <small>
              Confirmadas
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon warning">
            <FaClock />
          </div>

          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {
                resumen.pendiente
              }
            </strong>

            <small>
              Sin evaluar
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon gold">
            <FaClock />
          </div>

          <div>
            <span>
              Horas obtenidas
            </span>

            <strong>
              {formatearHoras(
                resumen.horas
              )}
            </strong>

            <small>
              Eventos asistidos
            </small>
          </div>

        </article>

      </section>

      <section className="student-toolbar registrations">

        <div className="student-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar evento, deporte o docente..."
            value={
              busqueda
            }
            onChange={(
              event
            ) =>
              setBusqueda(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={
            filtro
          }
          onChange={(
            event
          ) =>
            setFiltro(
              event.target.value
            )
          }
        >
          <option value="todos">
            Todos los estados
          </option>

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

      </section>

      {cargando ? (
        <div className="student-card student-loading">
          Cargando inscripciones...
        </div>
      ) : filtradas.length ===
        0 ? (
        <div className="student-card student-empty">

          <FaCalendarAlt />

          <strong>
            No hay inscripciones
          </strong>

          <span>
            No existen registros que coincidan con
            tu búsqueda.
          </span>

        </div>
      ) : (
        <section className="student-registrations-list">

          {filtradas.map(
            (
              inscripcion
            ) => {
              const horasObtenidas =
                inscripcion.asistencia ===
                "Asistió"
                  ? Number(
                      inscripcion.duracion_horas ||
                        0
                    )
                  : 0;

              return (
                <article
                  key={
                    inscripcion.id_inscripcion
                  }
                  className="student-registration-card"
                >

                  <div className="student-registration-main">

                    <div className="student-registration-icon">

                      {inscripcion.asistencia ===
                      "Asistió" ? (
                        <FaCheckCircle />
                      ) : inscripcion.asistencia ===
                        "No asistió" ? (
                        <FaTimesCircle />
                      ) : (
                        <FaClock />
                      )}

                    </div>

                    <div>

                      <span className="student-event-sport">
                        {
                          inscripcion.deporte
                        }
                      </span>

                      <h2>
                        {
                          inscripcion.evento
                        }
                      </h2>

                      <div className="student-registration-meta">

                        <span>
                          <FaCalendarAlt />

                          {formatearFechaHora(
                            obtenerFechaInicio(
                              inscripcion
                            )
                          )}
                        </span>

                        <span>
                          <FaMapMarkerAlt />

                          {
                            inscripcion.lugar
                          }
                        </span>

                        <span>
                          <FaUserTie />

                          {
                            inscripcion.docente ||
                            "Docente por definir"
                          }
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="student-registration-status">

                    <span
                      className={`student-attendance ${
                        inscripcion.asistencia ===
                        "Asistió"
                          ? "attended"
                          : inscripcion.asistencia ===
                            "No asistió"
                          ? "absent"
                          : "pending"
                      }`}
                    >
                      {
                        inscripcion.asistencia
                      }
                    </span>

                    <div>

                      <span>
                        Horas obtenidas
                      </span>

                      <strong>
                        {formatearHoras(
                          horasObtenidas
                        )}
                      </strong>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </section>
      )}

    </div>
  );
}

export default MisInscripcionesPage;