import {
  useEffect,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaCertificate,
  FaCheckCircle,
  FaClock,
  FaClipboardList,
  FaMapMarkerAlt,
  FaRunning,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import {
  obtenerResumenEstudiante,
} from "../../services/estudianteService";

// =====================================================
// HELPERS
// =====================================================

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
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

const formatearHoras =
  (
    valor
  ) => {
    const horas =
      Number(
        valor || 0
      );

    return `${horas
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      )} h`;
  };

// =====================================================
// COMPONENTE
// =====================================================

function DashboardEstudiante() {
  const [
    datos,
    setDatos,
  ] = useState({
    resumen: {
      total_inscripciones:
        0,

      eventos_proximos:
        0,

      asistencias_confirmadas:
        0,

      asistencias_pendientes:
        0,

      horas_acumuladas:
        0,

      porcentaje_asistencia:
        0,

      certificados_generados:
        0,
    },

    proximas_actividades:
      [],

    certificados_recientes:
      [],
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  let usuario =
    null;

  try {
    usuario =
      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      );
  } catch {
    usuario =
      null;
  }

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setCargando(
            true
          );

          setError("");

          const respuesta =
            await obtenerResumenEstudiante();

          setDatos({
            resumen:
              respuesta.resumen ||
              {},

            proximas_actividades:
              respuesta.proximas_actividades ||
              [],

            certificados_recientes:
              respuesta.certificados_recientes ||
              [],
          });
        } catch (err) {
          setError(
            err.message ||
              "No fue posible cargar tu información."
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargar();
  }, []);

  const {
    resumen,
    proximas_actividades,
    certificados_recientes,
  } = datos;

  return (
    <div className="student-page">

      <section className="student-hero">

        <div>

          <span className="student-eyebrow">
            PORTAL ESTUDIANTE
          </span>

          <h1>
            Hola,{" "}
            {usuario?.nombre
              ?.split(
                " "
              )[0] ||
              "Estudiante"}
          </h1>

          <p>
            Consulta los eventos deportivos de
            la universidad, administra tus
            inscripciones y revisa tus horas
            acumuladas.
          </p>

          <div className="student-hero-actions">

            <Link
              to="/estudiante/eventos"
              className="student-primary-button"
            >
              <FaCalendarAlt />

              Explorar eventos
            </Link>

            <Link
              to="/estudiante/inscripciones"
              className="student-secondary-button"
            >
              <FaClipboardList />

              Mis inscripciones
            </Link>

          </div>

        </div>

        <div className="student-hero-mark">

          <div className="student-hero-icon">
            <FaRunning />
          </div>

          <strong>
            SportU
          </strong>

          <span>
            Vive el deporte universitario
          </span>

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
            <FaClipboardList />
          </div>

          <div>
            <span>
              Inscripciones
            </span>

            <strong>
              {
                resumen.total_inscripciones ||
                0
              }
            </strong>

            <small>
              Actividades registradas
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon gold">
            <FaCalendarAlt />
          </div>

          <div>
            <span>
              Próximos eventos
            </span>

            <strong>
              {
                resumen.eventos_proximos ||
                0
              }
            </strong>

            <small>
              Actividades por realizar
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon green">
            <FaClock />
          </div>

          <div>
            <span>
              Horas acumuladas
            </span>

            <strong>
              {formatearHoras(
                resumen.horas_acumuladas
              )}
            </strong>

            <small>
              Por asistencia confirmada
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon purple">
            <FaCertificate />
          </div>

          <div>
            <span>
              Certificados
            </span>

            <strong>
              {
                resumen.certificados_generados ||
                0
              }
            </strong>

            <small>
              Generados en SportU
            </small>
          </div>

        </article>

      </section>

      <section className="student-progress-card">

        <div className="student-progress-info">

          <div>

            <span>
              PARTICIPACIÓN DEPORTIVA
            </span>

            <h2>
              Tu asistencia
            </h2>

            <p>
              Solo los eventos marcados como
              Asistió aportan horas deportivas.
            </p>

          </div>

          <strong>
            {
              resumen.porcentaje_asistencia ||
              0
            }
            %
          </strong>

        </div>

        <div className="student-progress-bar">

          <span
            style={{
              width: `${Math.min(
                Number(
                  resumen.porcentaje_asistencia ||
                    0
                ),
                100
              )}%`,
            }}
          />

        </div>

        <div className="student-progress-bottom">

          <span>
            <FaCheckCircle />

            {
              resumen.asistencias_confirmadas ||
              0
            }{" "}
            asistencia(s)
          </span>

          <span>
            {
              resumen.asistencias_pendientes ||
              0
            }{" "}
            pendiente(s)
          </span>

        </div>

      </section>

      <div className="student-dashboard-grid">

        <section className="student-card">

          <div className="student-section-heading">

            <div>

              <h2>
                Próximas actividades
              </h2>

              <p>
                Eventos en los que ya estás
                inscrito.
              </p>

            </div>

            <Link
              to="/estudiante/inscripciones"
            >
              Ver todas
            </Link>

          </div>

          {cargando ? (
            <div className="student-loading">
              Cargando actividades...
            </div>
          ) : proximas_actividades.length ===
            0 ? (
            <div className="student-empty">

              <FaCalendarAlt />

              <strong>
                Sin actividades próximas
              </strong>

              <span>
                Explora los eventos deportivos
                disponibles.
              </span>

              <Link
                to="/estudiante/eventos"
              >
                Ver eventos
              </Link>

            </div>
          ) : (
            <div className="student-upcoming-list">

              {proximas_actividades.map(
                (
                  actividad
                ) => (
                  <article
                    key={
                      actividad.id_inscripcion
                    }
                    className="student-upcoming-item"
                  >

                    <div className="student-upcoming-date">

                      <FaCalendarAlt />

                    </div>

                    <div className="student-upcoming-info">

                      <strong>
                        {
                          actividad.evento
                        }
                      </strong>

                      <span>
                        {
                          actividad.deporte
                        }
                      </span>

                      <small>
                        {formatearFechaHora(
                          actividad.fecha_inicio
                        )}
                      </small>

                      <small>
                        <FaMapMarkerAlt />

                        {
                          actividad.lugar
                        }
                      </small>

                    </div>

                    <span className="student-hours-mini">
                      {formatearHoras(
                        actividad.duracion_horas
                      )}
                    </span>

                  </article>
                )
              )}

            </div>
          )}

        </section>

        <section className="student-card">

          <div className="student-section-heading">

            <div>

              <h2>
                Certificados
              </h2>

              <p>
                Tus certificados más recientes.
              </p>

            </div>

            <Link
              to="/estudiante/perfil"
            >
              Mi perfil
            </Link>

          </div>

          {cargando ? (
            <div className="student-loading">
              Cargando certificados...
            </div>
          ) : certificados_recientes.length ===
            0 ? (
            <div className="student-empty">

              <FaCertificate />

              <strong>
                Sin certificados
              </strong>

              <span>
                Cuando el coordinador genere uno,
                aparecerá aquí.
              </span>

            </div>
          ) : (
            <div className="student-cert-list">

              {certificados_recientes.map(
                (
                  certificado
                ) => (
                  <article
                    key={
                      certificado.id_certificado
                    }
                    className="student-cert-item"
                  >

                    <div className="student-cert-icon">
                      <FaCertificate />
                    </div>

                    <div>

                      <strong>
                        Certificado #
                        {
                          certificado.id_certificado
                        }
                      </strong>

                      <span>
                        {formatearHoras(
                          certificado.horas_certificadas
                        )}
                      </span>

                      <small>
                        {formatearFechaHora(
                          certificado.fecha_generacion
                        )}
                      </small>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </div>
  );
}

export default DashboardEstudiante;