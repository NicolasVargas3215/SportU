import {
  useEffect,
  useState,
} from "react";

import {
  obtenerEventosDisponibles,
  registrarInscripcion,
  obtenerMisInscripciones,
} from "../../services/inscripcionService";

function EstudiantePage() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    eventos,
    setEventos,
  ] = useState([]);

  const [
    inscripciones,
    setInscripciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    idEventoProcesando,
    setIdEventoProcesando,
  ] = useState(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // CARGAR INFORMACIÓN
  // =====================================================

  const cargarInformacion = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        eventosObtenidos,
        inscripcionesObtenidas,
      ] = await Promise.all([
        obtenerEventosDisponibles(),
        obtenerMisInscripciones(),
      ]);

      setEventos(
        Array.isArray(eventosObtenidos)
          ? eventosObtenidos
          : []
      );

      setInscripciones(
        Array.isArray(
          inscripcionesObtenidas
        )
          ? inscripcionesObtenidas
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar la información."
      );
    } finally {
      setCargando(false);
    }
  };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarInformacion();
  }, []);

  // =====================================================
  // INSCRIBIRSE EN UN EVENTO
  // =====================================================

  const manejarInscripcion = async (
    evento
  ) => {
    if (evento.inscrito) {
      return;
    }

    if (
      Number(
        evento.cupos_disponibles
      ) <= 0
    ) {
      setError(
        "Este evento ya no tiene cupos disponibles."
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Deseas inscribirte en "${evento.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setIdEventoProcesando(
        evento.id_evento
      );

      setMensaje("");
      setError("");

      const resultado =
        await registrarInscripcion(
          evento.id_evento
        );

      setMensaje(
        resultado.mensaje ||
          "Inscripción realizada correctamente."
      );

      await cargarInformacion();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible realizar la inscripción."
      );
    } finally {
      setIdEventoProcesando(
        null
      );
    }
  };

  // =====================================================
  // FORMATEAR FECHA
  // =====================================================

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return "-";
    }

    const texto =
      String(fecha).substring(
        0,
        10
      );

    const partes =
      texto.split("-");

    if (partes.length !== 3) {
      return texto;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // =====================================================
  // FORMATEAR HORAS
  // =====================================================

  const formatearDuracion = (
    duracion
  ) => {
    const numero =
      Number(duracion);

    if (
      Number.isNaN(numero)
    ) {
      return "0";
    }

    if (
      Number.isInteger(numero)
    ) {
      return numero;
    }

    return numero.toFixed(2);
  };

  // =====================================================
  // BADGE ASISTENCIA
  // =====================================================

  const obtenerBadgeAsistencia = (
    asistencia
  ) => {
    const estado =
      String(
        asistencia || ""
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .trim()
        .toLowerCase();

    if (
      estado === "asistio"
    ) {
      return (
        <span className="badge bg-success">
          Asistió
        </span>
      );
    }

    if (
      estado === "no asistio"
    ) {
      return (
        <span className="badge bg-danger">
          No asistió
        </span>
      );
    }

    return (
      <span className="badge bg-secondary">
        Pendiente
      </span>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="container-fluid py-4">

      {/* =============================================== */}
      {/* ENCABEZADO */}
      {/* =============================================== */}

      <div className="mb-4">

        <h2 className="mb-1">
          Eventos deportivos
        </h2>

        <p className="text-muted mb-0">
          Consulta las actividades deportivas disponibles
          e inscríbete en los eventos de tu interés.
        </p>

      </div>

      {/* =============================================== */}
      {/* MENSAJES */}
      {/* =============================================== */}

      {mensaje && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* =============================================== */}
      {/* CARGANDO */}
      {/* =============================================== */}

      {cargando ? (

        <div className="card shadow-sm">

          <div className="card-body text-center py-5">

            <div
              className="spinner-border text-primary mb-3"
              role="status"
            />

            <div>
              Cargando eventos...
            </div>

          </div>

        </div>

      ) : (

        <>

          {/* =========================================== */}
          {/* EVENTOS DISPONIBLES */}
          {/* =========================================== */}

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div>

              <h4 className="mb-1">
                Eventos disponibles
              </h4>

              <p className="text-muted mb-0">
                Actividades deportivas actualmente habilitadas.
              </p>

            </div>

            <span className="badge bg-primary fs-6">

              {eventos.length} evento
              {eventos.length === 1
                ? ""
                : "s"}

            </span>

          </div>

          {eventos.length === 0 ? (

            <div className="alert alert-info mb-5">
              No hay eventos deportivos disponibles actualmente.
            </div>

          ) : (

            <div className="row mb-5">

              {eventos.map(
                (evento) => {

                  const sinCupos =
                    Number(
                      evento.cupos_disponibles
                    ) <= 0;

                  const procesando =
                    idEventoProcesando ===
                    evento.id_evento;

                  return (
                    <div
                      className="col-xl-4 col-lg-6 mb-4"
                      key={
                        evento.id_evento
                      }
                    >

                      <div className="card shadow-sm h-100">

                        <div className="card-body d-flex flex-column">

                          {/* DEPORTE */}

                          <div className="mb-3">

                            <span className="badge bg-primary">

                              {
                                evento.deporte
                              }

                            </span>

                            {evento.inscrito && (

                              <span className="badge bg-success ms-2">
                                Inscrito
                              </span>

                            )}

                          </div>

                          {/* NOMBRE */}

                          <h4 className="card-title">

                            {
                              evento.nombre
                            }

                          </h4>

                          {/* INFORMACIÓN */}

                          <div className="mt-3">

                            <p className="mb-2">

                              <strong>
                                Docente:
                              </strong>{" "}

                              {
                                evento.docente
                              }

                            </p>

                            <p className="mb-2">

                              <strong>
                                Fecha:
                              </strong>{" "}

                              {formatearFecha(
                                evento.fecha
                              )}

                            </p>

                            <p className="mb-2">

                              <strong>
                                Hora:
                              </strong>{" "}

                              {
                                evento.hora ||
                                "-"
                              }

                            </p>

                            <p className="mb-2">

                              <strong>
                                Lugar:
                              </strong>{" "}

                              {
                                evento.lugar ||
                                "-"
                              }

                            </p>

                            <p className="mb-2">

                              <strong>
                                Duración:
                              </strong>{" "}

                              {formatearDuracion(
                                evento.duracion_horas
                              )}{" "}
                              hora(s)

                            </p>

                          </div>

                          {/* CUPOS */}

                          <div className="mt-3 mb-4">

                            <div className="d-flex justify-content-between">

                              <span>
                                Cupos disponibles
                              </span>

                              <strong
                                className={
                                  sinCupos
                                    ? "text-danger"
                                    : "text-success"
                                }
                              >

                                {
                                  evento.cupos_disponibles
                                }

                              </strong>

                            </div>

                            <small className="text-muted">

                              {evento.inscritos} de{" "}
                              {evento.cupo_maximo} cupos ocupados

                            </small>

                          </div>

                          {/* BOTÓN */}

                          <div className="mt-auto">

                            {evento.inscrito ? (

                              <button
                                type="button"
                                className="btn btn-success w-100"
                                disabled
                              >
                                Ya estás inscrito
                              </button>

                            ) : sinCupos ? (

                              <button
                                type="button"
                                className="btn btn-secondary w-100"
                                disabled
                              >
                                Sin cupos
                              </button>

                            ) : (

                              <button
                                type="button"
                                className="btn btn-warning w-100"
                                disabled={
                                  procesando
                                }
                                onClick={() =>
                                  manejarInscripcion(
                                    evento
                                  )
                                }
                              >

                                {procesando
                                  ? "Inscribiendo..."
                                  : "Inscribirme"}

                              </button>

                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

          {/* =========================================== */}
          {/* MIS INSCRIPCIONES */}
          {/* =========================================== */}

          <div className="mb-3">

            <h4 className="mb-1">
              Mis inscripciones
            </h4>

            <p className="text-muted mb-0">
              Consulta los eventos en los que estás inscrito
              y el estado de tu asistencia.
            </p>

          </div>

          <div className="card shadow-sm">

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th>
                        Evento
                      </th>

                      <th>
                        Deporte
                      </th>

                      <th>
                        Docente
                      </th>

                      <th>
                        Fecha
                      </th>

                      <th>
                        Hora
                      </th>

                      <th>
                        Lugar
                      </th>

                      <th>
                        Duración
                      </th>

                      <th>
                        Asistencia
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {inscripciones.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="8"
                          className="text-center py-4 text-muted"
                        >
                          Todavía no tienes inscripciones registradas.
                        </td>

                      </tr>

                    ) : (

                      inscripciones.map(
                        (
                          inscripcion
                        ) => (

                          <tr
                            key={
                              inscripcion.id_inscripcion
                            }
                          >

                            <td>

                              <strong>

                                {
                                  inscripcion.evento
                                }

                              </strong>

                            </td>

                            <td>

                              {
                                inscripcion.deporte
                              }

                            </td>

                            <td>

                              {
                                inscripcion.docente
                              }

                            </td>

                            <td>

                              {formatearFecha(
                                inscripcion.fecha
                              )}

                            </td>

                            <td>

                              {
                                inscripcion.hora ||
                                "-"
                              }

                            </td>

                            <td>

                              {
                                inscripcion.lugar ||
                                "-"
                              }

                            </td>

                            <td>

                              {formatearDuracion(
                                inscripcion.duracion_horas
                              )}{" "}
                              h

                            </td>

                            <td>

                              {obtenerBadgeAsistencia(
                                inscripcion.asistencia
                              )}

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
}

export default EstudiantePage;