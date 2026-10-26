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
  FaUserTie,
  FaUsers,
} from "react-icons/fa";

import {
  obtenerEventosDisponibles,
  registrarInscripcion,
} from "../../services/inscripcionService";

// =====================================================
// HELPERS
// =====================================================

const obtenerFechaInicio =
  (
    evento
  ) => {
    if (
      evento.fecha_inicio
    ) {
      return evento.fecha_inicio;
    }

    if (
      evento.fecha
    ) {
      return `${evento.fecha}T${
        evento.hora ||
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

function EventosDisponiblesPage() {
  const [
    eventos,
    setEventos,
  ] = useState([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    procesando,
    setProcesando,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exito,
    setExito,
  ] = useState("");

  const cargarEventos =
    async () => {
      try {
        setCargando(
          true
        );

        setError("");

        const datos =
          await obtenerEventosDisponibles();

        setEventos(
          datos.eventos ||
            []
        );
      } catch (err) {
        setError(
          err.message ||
            "No fue posible consultar los eventos."
        );
      } finally {
        setCargando(
          false
        );
      }
    };

  useEffect(() => {
    cargarEventos();
  }, []);

  const eventosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (
        !texto
      ) {
        return eventos;
      }

      return eventos.filter(
        (
          evento
        ) =>
          evento.nombre
            ?.toLowerCase()
            .includes(
              texto
            ) ||
          evento.deporte
            ?.toLowerCase()
            .includes(
              texto
            ) ||
          evento.docente
            ?.toLowerCase()
            .includes(
              texto
            ) ||
          evento.lugar
            ?.toLowerCase()
            .includes(
              texto
            )
      );
    }, [
      eventos,
      busqueda,
    ]);

  const inscribirme =
    async (
      evento
    ) => {
      const confirmar =
        window.confirm(
          `¿Deseas inscribirte en "${evento.nombre}"?`
        );

      if (
        !confirmar
      ) {
        return;
      }

      try {
        setProcesando(
          evento.id_evento
        );

        setError("");
        setExito("");

        const respuesta =
          await registrarInscripcion(
            evento.id_evento
          );

        setExito(
          respuesta.mensaje ||
            "Inscripción registrada correctamente."
        );

        await cargarEventos();
      } catch (err) {
        setError(
          err.message ||
            "No fue posible realizar la inscripción."
        );
      } finally {
        setProcesando(
          null
        );
      }
    };

  return (
    <div className="student-page">

      <section className="student-page-header">

        <div>

          <span className="student-eyebrow">
            PARTICIPACIÓN DEPORTIVA
          </span>

          <h1>
            Eventos deportivos
          </h1>

          <p>
            Consulta las actividades con
            inscripciones abiertas y participa en
            los eventos de la universidad.
          </p>

        </div>

      </section>

      {error && (
        <div className="student-alert error">
          {error}
        </div>
      )}

      {exito && (
        <div className="student-alert success">

          <FaCheckCircle />

          {exito}

        </div>
      )}

      <section className="student-toolbar">

        <div className="student-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar evento, deporte, docente o lugar..."
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

        <span>
          {
            eventosFiltrados.length
          }{" "}
          evento(s) disponible(s)
        </span>

      </section>

      {cargando ? (
        <div className="student-card student-loading">
          Cargando eventos deportivos...
        </div>
      ) : eventosFiltrados.length ===
        0 ? (
        <div className="student-card student-empty">

          <FaCalendarAlt />

          <strong>
            No hay eventos disponibles
          </strong>

          <span>
            Actualmente no existen actividades
            abiertas que coincidan con tu búsqueda.
          </span>

        </div>
      ) : (
        <section className="student-events-grid">

          {eventosFiltrados.map(
            (
              evento
            ) => {
              const inscrito =
                Boolean(
                  Number(
                    evento.inscrito
                  )
                ) ||
                evento.inscrito ===
                  true;

              const cupos =
                Number(
                  evento.cupos_disponibles ??
                    0
                );

              const sinCupos =
                cupos <= 0;

              return (
                <article
                  key={
                    evento.id_evento
                  }
                  className="student-event-card"
                >

                  <div className="student-event-top">

                    <span className="student-event-sport">
                      {
                        evento.deporte
                      }
                    </span>

                    {inscrito ? (
                      <span className="student-event-status registered">

                        <FaCheckCircle />

                        Inscrito
                      </span>
                    ) : sinCupos ? (
                      <span className="student-event-status full">
                        Sin cupos
                      </span>
                    ) : (
                      <span className="student-event-status available">
                        Disponible
                      </span>
                    )}

                  </div>

                  <h2>
                    {
                      evento.nombre
                    }
                  </h2>

                  <div className="student-event-details">

                    <div>

                      <FaCalendarAlt />

                      <span>
                        {formatearFechaHora(
                          obtenerFechaInicio(
                            evento
                          )
                        )}
                      </span>

                    </div>

                    <div>

                      <FaMapMarkerAlt />

                      <span>
                        {
                          evento.lugar
                        }
                      </span>

                    </div>

                    <div>

                      <FaUserTie />

                      <span>
                        {
                          evento.docente ||
                          "Docente por definir"
                        }
                      </span>

                    </div>

                    <div>

                      <FaClock />

                      <span>
                        {formatearHoras(
                          evento.duracion_horas
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="student-event-capacity">

                    <div>

                      <span>
                        Cupos disponibles
                      </span>

                      <strong>
                        {cupos}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Cupo máximo
                      </span>

                      <strong>
                        {
                          evento.cupo_maximo
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Inscritos
                      </span>

                      <strong>
                        {
                          evento.inscritos ||
                          0
                        }
                      </strong>

                    </div>

                  </div>

                  <button
                    type="button"
                    className={`student-register-button ${
                      inscrito
                        ? "registered"
                        : ""
                    }`}
                    disabled={
                      inscrito ||
                      sinCupos ||
                      procesando ===
                        evento.id_evento
                    }
                    onClick={() =>
                      inscribirme(
                        evento
                      )
                    }
                  >

                    {inscrito ? (
                      <>
                        <FaCheckCircle />

                        Ya estás inscrito
                      </>
                    ) : procesando ===
                      evento.id_evento ? (
                      "Inscribiendo..."
                    ) : sinCupos ? (
                      <>
                        <FaUsers />

                        Sin cupos
                      </>
                    ) : (
                      <>
                        <FaUsers />

                        Inscribirme
                      </>
                    )}

                  </button>

                </article>
              );
            }
          )}

        </section>
      )}

    </div>
  );
}

export default EventosDisponiblesPage;