import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  obtenerEventosDisponibles,
} from "../../services/inscripcionService";

import "./studentDashboard.css";

function DashboardEstudiante() {
  const navigate = useNavigate();

  const [
    eventos,
    setEventos,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  const obtenerUsuario = () => {
    try {
      const datos =
        localStorage.getItem(
          "usuario"
        ) ||
        localStorage.getItem(
          "user"
        );

      if (!datos) {
        return null;
      }

      return JSON.parse(datos);
    } catch (error) {
      return null;
    }
  };

  const usuario =
    obtenerUsuario();

  const nombreCompleto =
    usuario?.nombre ||
    "Estudiante";

  const primerNombre =
    nombreCompleto
      .trim()
      .split(" ")[0];

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
          "No fue posible cargar los próximos eventos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // =====================================================
  // PRÓXIMOS EVENTOS
  // =====================================================

  const proximosEventos =
    useMemo(() => {
      const hoy = new Date();

      hoy.setHours(
        0,
        0,
        0,
        0
      );

      return eventos
        .filter((evento) => {
          if (!evento.fecha) {
            return true;
          }

          const fechaEvento =
            new Date(
              `${String(
                evento.fecha
              ).substring(
                0,
                10
              )}T00:00:00`
            );

          return (
            fechaEvento >= hoy
          );
        })
        .sort((a, b) => {
          const fechaA =
            new Date(
              `${String(
                a.fecha
              ).substring(
                0,
                10
              )}T${a.hora || "00:00"}`
            );

          const fechaB =
            new Date(
              `${String(
                b.fecha
              ).substring(
                0,
                10
              )}T${b.hora || "00:00"}`
            );

          return (
            fechaA - fechaB
          );
        })
        .slice(0, 3);
    }, [eventos]);

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
  // ICONO DEL DEPORTE
  // =====================================================

  const obtenerIconoDeporte = (
    deporte
  ) => {
    const nombre =
      String(
        deporte || ""
      ).toLowerCase();

    if (
      nombre.includes(
        "fut"
      )
    ) {
      return "⚽";
    }

    if (
      nombre.includes(
        "baloncesto"
      ) ||
      nombre.includes(
        "basket"
      )
    ) {
      return "🏀";
    }

    if (
      nombre.includes(
        "vole"
      )
    ) {
      return "🏐";
    }

    if (
      nombre.includes(
        "atlet"
      )
    ) {
      return "🏃";
    }

    if (
      nombre.includes(
        "tenis"
      )
    ) {
      return "🎾";
    }

    return "🏅";
  };

  // =====================================================
  // IR A EVENTOS
  // =====================================================

  const verTodos = () => {
    navigate(
      "/estudiante/eventos"
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="student-dashboard">

      {/* =============================================== */}
      {/* SALUDO */}
      {/* =============================================== */}

      <section className="student-welcome">

        <h1>
          ¡Hola, {primerNombre}!{" "}
          <span
            className="student-wave"
          >
            👋
          </span>
        </h1>

        <p>
          Explora las actividades deportivas disponibles
          y participa en la comunidad SportU.
        </p>

      </section>

      {/* =============================================== */}
      {/* PRÓXIMOS EVENTOS */}
      {/* =============================================== */}

      <section className="student-events-panel">

        <div className="student-events-header">

          <div>

            <h2>
              Próximos eventos
            </h2>

            <span>
              Actividades deportivas disponibles
            </span>

          </div>

          <button
            type="button"
            className="student-view-all"
            onClick={
              verTodos
            }
          >
            Ver todos
          </button>

        </div>

        {/* ============================================= */}
        {/* CARGANDO */}
        {/* ============================================= */}

        {cargando && (

          <div className="student-dashboard-loading">

            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            />

            <span>
              Cargando próximos eventos...
            </span>

          </div>

        )}

        {/* ============================================= */}
        {/* ERROR */}
        {/* ============================================= */}

        {!cargando &&
          error && (

            <div className="alert alert-danger mb-0">

              {error}

            </div>

          )}

        {/* ============================================= */}
        {/* SIN EVENTOS */}
        {/* ============================================= */}

        {!cargando &&
          !error &&
          proximosEventos.length ===
            0 && (

            <div className="student-empty-events">

              <div className="student-empty-icon">
                🏅
              </div>

              <h3>
                No hay próximos eventos
              </h3>

              <p>
                Actualmente no existen actividades
                deportivas disponibles.
              </p>

            </div>

          )}

        {/* ============================================= */}
        {/* LISTA DE EVENTOS */}
        {/* ============================================= */}

        {!cargando &&
          !error &&
          proximosEventos.length >
            0 && (

            <div className="student-event-list">

              {proximosEventos.map(
                (evento) => {

                  const sinCupos =
                    Number(
                      evento.cupos_disponibles
                    ) <= 0;

                  return (

                    <article
                      className="student-event-item"
                      key={
                        evento.id_evento
                      }
                    >

                      {/* ICONO */}

                      <div className="student-sport-icon">

                        {obtenerIconoDeporte(
                          evento.deporte
                        )}

                      </div>

                      {/* INFORMACIÓN */}

                      <div className="student-event-info">

                        <h3>
                          {
                            evento.nombre
                          }
                        </h3>

                        <div className="student-event-details">

                          <span>
                            📅{" "}
                            {formatearFecha(
                              evento.fecha
                            )}
                          </span>

                          <span>
                            🕐{" "}
                            {formatearHora(
                              evento.hora
                            )}
                          </span>

                        </div>

                        <div className="student-event-location">

                          📍{" "}
                          {
                            evento.lugar ||
                            "Lugar por definir"
                          }

                        </div>

                      </div>

                      {/* CUPOS */}

                      <div className="student-event-capacity">

                        {evento.inscrito ? (

                          <span className="student-capacity-badge enrolled">
                            Inscrito
                          </span>

                        ) : sinCupos ? (

                          <span className="student-capacity-badge full">
                            Sin cupos
                          </span>

                        ) : (

                          <span className="student-capacity-badge available">
                            Cupos disponibles
                          </span>

                        )}

                        <strong>

                          {
                            evento.inscritos
                          }{" "}
                          /{" "}
                          {
                            evento.cupo_maximo
                          }

                        </strong>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

      </section>

      {/* =============================================== */}
      {/* ACCESOS RÁPIDOS */}
      {/* =============================================== */}

      <section className="student-quick-actions">

        <button
          type="button"
          className="student-quick-card"
          onClick={() =>
            navigate(
              "/estudiante/eventos"
            )
          }
        >

          <span className="student-quick-icon">
            🏆
          </span>

          <div>

            <strong>
              Eventos deportivos
            </strong>

            <small>
              Consulta todas las actividades
            </small>

          </div>

        </button>

        <button
          type="button"
          className="student-quick-card"
          onClick={() =>
            navigate(
              "/estudiante/inscripciones"
            )
          }
        >

          <span className="student-quick-icon">
            📋
          </span>

          <div>

            <strong>
              Mis inscripciones
            </strong>

            <small>
              Revisa tus eventos registrados
            </small>

          </div>

        </button>

      </section>

    </div>
  );
}

export default DashboardEstudiante;