import {
  useEffect,
  useState,
} from "react";

import {
  obtenerEventosDisponibles,
  registrarInscripcion,
} from "../../services/inscripcionService";

import "./studentPages.css";

function EventosDisponiblesPage() {
  const [
    eventos,
    setEventos,
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
  // CARGAR EVENTOS
  // =====================================================

  const cargarEventos = async () => {
    try {
      setCargando(true);
      setError("");

      const datos =
        await obtenerEventosDisponibles();

      setEventos(
        Array.isArray(datos)
          ? datos
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar los eventos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // =====================================================
  // INSCRIBIRSE
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
        "Este evento no tiene cupos disponibles."
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

      await cargarEventos();
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

    const [
      anio,
      mes,
      dia,
    ] = texto.split("-");

    if (
      !anio ||
      !mes ||
      !dia
    ) {
      return texto;
    }

    const fechaLocal =
      new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
      );

    return fechaLocal.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMATEAR HORA
  // =====================================================

  const formatearHora = (
    hora
  ) => {
    if (!hora) {
      return "-";
    }

    return String(hora)
      .substring(0, 5);
  };

  // =====================================================
  // ICONO DEPORTE
  // =====================================================

  const obtenerIconoDeporte = (
    deporte
  ) => {
    const nombre =
      String(
        deporte || ""
      ).toLowerCase();

    if (
      nombre.includes("fut")
    ) {
      return "⚽";
    }

    if (
      nombre.includes("baloncesto") ||
      nombre.includes("basket")
    ) {
      return "🏀";
    }

    if (
      nombre.includes("vole")
    ) {
      return "🏐";
    }

    if (
      nombre.includes("atlet")
    ) {
      return "🏃";
    }

    if (
      nombre.includes("tenis")
    ) {
      return "🎾";
    }

    return "🏅";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="student-page">

      {/* ENCABEZADO */}

      <div className="student-page-header">

        <div>

          <h1>
            Eventos disponibles
          </h1>

          <p>
            Explora las actividades deportivas
            e inscríbete mientras existan cupos.
          </p>

        </div>

        {!cargando && (
          <div className="student-page-counter">

            {eventos.length}

            <span>
              evento
              {eventos.length === 1
                ? ""
                : "s"}
            </span>

          </div>
        )}

      </div>

      {/* MENSAJES */}

      {mensaje && (

        <div className="alert alert-success">
          {mensaje}
        </div>

      )}

      {error && (

        <div className="alert alert-danger">
          {error}
        </div>

      )}

      {/* CARGANDO */}

      {cargando ? (

        <div className="student-loading-card">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <span>
            Cargando eventos deportivos...
          </span>

        </div>

      ) : eventos.length === 0 ? (

        <div className="student-empty-card">

          <div className="student-empty-symbol">
            🏅
          </div>

          <h3>
            No hay eventos disponibles
          </h3>

          <p>
            Actualmente no existen actividades
            deportivas habilitadas.
          </p>

        </div>

      ) : (

        <div className="student-events-grid">

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

                <article
                  className="student-event-card"
                  key={
                    evento.id_evento
                  }
                >

                  {/* CABECERA */}

                  <div className="student-event-card-top">

                    <div className="student-event-big-icon">

                      {obtenerIconoDeporte(
                        evento.deporte
                      )}

                    </div>

                    <div className="student-event-badges">

                      <span className="student-sport-badge">

                        {
                          evento.deporte
                        }

                      </span>

                      {evento.inscrito && (

                        <span className="student-enrolled-badge">
                          Inscrito
                        </span>

                      )}

                    </div>

                  </div>

                  {/* NOMBRE */}

                  <h2>

                    {
                      evento.nombre
                    }

                  </h2>

                  {/* DATOS */}

                  <div className="student-event-data">

                    <div>

                      <span className="student-data-icon">
                        📅
                      </span>

                      <div>

                        <small>
                          Fecha
                        </small>

                        <strong>

                          {formatearFecha(
                            evento.fecha
                          )}

                        </strong>

                      </div>

                    </div>

                    <div>

                      <span className="student-data-icon">
                        🕐
                      </span>

                      <div>

                        <small>
                          Hora
                        </small>

                        <strong>

                          {formatearHora(
                            evento.hora
                          )}

                        </strong>

                      </div>

                    </div>

                    <div>

                      <span className="student-data-icon">
                        📍
                      </span>

                      <div>

                        <small>
                          Lugar
                        </small>

                        <strong>

                          {
                            evento.lugar ||
                            "Por definir"
                          }

                        </strong>

                      </div>

                    </div>

                    <div>

                      <span className="student-data-icon">
                        👨‍🏫
                      </span>

                      <div>

                        <small>
                          Docente
                        </small>

                        <strong>

                          {
                            evento.docente ||
                            "-"
                          }

                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* CUPOS */}

                  <div className="student-capacity-box">

                    <div>

                      <span>
                        Cupos disponibles
                      </span>

                      <strong
                        className={
                          sinCupos
                            ? "capacity-danger"
                            : "capacity-success"
                        }
                      >

                        {
                          evento.cupos_disponibles
                        }

                      </strong>

                    </div>

                    <div className="student-capacity-line">

                      <div
                        style={{
                          width:
                            evento.cupo_maximo > 0
                              ? `${Math.min(
                                  100,
                                  (
                                    Number(
                                      evento.inscritos
                                    ) /
                                    Number(
                                      evento.cupo_maximo
                                    )
                                  ) * 100
                                )}%`
                              : "0%",
                        }}
                      />

                    </div>

                    <small>

                      {
                        evento.inscritos
                      }{" "}
                      de{" "}
                      {
                        evento.cupo_maximo
                      }{" "}
                      cupos ocupados

                    </small>

                  </div>

                  {/* ACCIÓN */}

                  {evento.inscrito ? (

                    <button
                      type="button"
                      className="student-event-button enrolled"
                      disabled
                    >
                      ✓ Ya estás inscrito
                    </button>

                  ) : sinCupos ? (

                    <button
                      type="button"
                      className="student-event-button disabled"
                      disabled
                    >
                      Sin cupos disponibles
                    </button>

                  ) : (

                    <button
                      type="button"
                      className="student-event-button"
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

                </article>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default EventosDisponiblesPage;