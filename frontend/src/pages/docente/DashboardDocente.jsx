import {
  useEffect,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaHourglassHalf,
  FaUsers,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import {
  obtenerActividadesDocente,
  obtenerResumenDocente,
} from "../../services/docenteService";

const formatearFecha =
  (fecha) => {
    if (!fecha) {
      return "—";
    }

    const valor =
      String(
        fecha
      ).replace(
        " ",
        "T"
      );

    const objeto =
      new Date(
        valor
      );

    if (
      Number.isNaN(
        objeto.getTime()
      )
    ) {
      return fecha;
    }

    return objeto.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

const etiquetaEstado =
  (estado) => {
    const etiquetas = {
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
      etiquetas[
        estado
      ] ||
      estado
    );
  };

function DashboardDocente() {
  const [
    resumen,
    setResumen,
  ] = useState({
    total_eventos: 0,
    eventos_abiertos: 0,
    eventos_en_curso: 0,
    eventos_finalizados: 0,
    total_inscripciones: 0,
    asistencias_pendientes: 0,
    asistencias_confirmadas: 0,
  });

  const [
    actividades,
    setActividades,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  let usuario = null;

  try {
    usuario =
      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      );
  } catch {
    usuario = null;
  }

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setCargando(
            true
          );

          setError("");

          const [
            datosResumen,
            datosActividades,
          ] =
            await Promise.all([
              obtenerResumenDocente(),
              obtenerActividadesDocente(),
            ]);

          setResumen(
            datosResumen.resumen ||
              {}
          );

          setActividades(
            (
              datosActividades.eventos ||
              []
            ).slice(
              0,
              5
            )
          );
        } catch (err) {
          setError(
            err.message ||
              "No fue posible cargar el panel."
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargar();
  }, []);

  return (
    <div className="teacher-page">

      <section className="teacher-header">

        <div>

          <span className="teacher-eyebrow">
            PANEL DOCENTE
          </span>

          <h1>
            Hola,{" "}
            {usuario?.nombre
              ?.split(
                " "
              )[0] ||
              "Docente"}
          </h1>

          <p>
            Consulta tus actividades asignadas,
            revisa los participantes y registra
            la asistencia.
          </p>

        </div>

        <Link
          to="/docente/actividades"
          className="teacher-primary-button"
        >
          <FaCalendarAlt />

          Ver mis actividades
        </Link>

      </section>

      {error && (
        <div className="teacher-alert error">
          {error}
        </div>
      )}

      <section className="teacher-summary-grid">

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon blue">
            <FaCalendarAlt />
          </div>

          <div>
            <span>
              Mis actividades
            </span>

            <strong>
              {
                resumen.total_eventos
              }
            </strong>

            <small>
              Eventos asignados
            </small>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon gold">
            <FaUsers />
          </div>

          <div>
            <span>
              Participaciones
            </span>

            <strong>
              {
                resumen.total_inscripciones
              }
            </strong>

            <small>
              Inscripciones registradas
            </small>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon warning">
            <FaHourglassHalf />
          </div>

          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {
                resumen.asistencias_pendientes
              }
            </strong>

            <small>
              Asistencias por definir
            </small>
          </div>

        </article>

        <article className="teacher-summary-card">

          <div className="teacher-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Asistencias
            </span>

            <strong>
              {
                resumen.asistencias_confirmadas
              }
            </strong>

            <small>
              Confirmadas
            </small>
          </div>

        </article>

      </section>

      <section className="teacher-dashboard-card">

        <div className="teacher-section-heading">

          <div>

            <h2>
              Actividades recientes
            </h2>

            <p>
              Últimos eventos asignados a tu usuario.
            </p>

          </div>

          <Link
            to="/docente/actividades"
          >
            Ver todas
          </Link>

        </div>

        {cargando ? (
          <div className="teacher-loading">
            Cargando actividades...
          </div>
        ) : actividades.length ===
          0 ? (
          <div className="teacher-empty">

            <FaClipboardCheck />

            <strong>
              No tienes actividades asignadas
            </strong>

            <span>
              Cuando el coordinador te asigne un
              evento aparecerá aquí.
            </span>

          </div>
        ) : (
          <div className="teacher-recent-list">

            {actividades.map(
              (
                evento
              ) => (
                <article
                  key={
                    evento.id_evento
                  }
                  className="teacher-recent-event"
                >

                  <div className="teacher-recent-date">

                    <FaCalendarAlt />

                    <span>
                      {formatearFecha(
                        evento.fecha_inicio
                      )}
                    </span>

                  </div>

                  <div className="teacher-recent-info">

                    <strong>
                      {
                        evento.nombre
                      }
                    </strong>

                    <span>
                      {
                        evento.deporte
                      }{" "}
                      ·{" "}
                      {
                        evento.lugar
                      }
                    </span>

                  </div>

                  <span
                    className={`teacher-state teacher-state-${evento.estado}`}
                  >
                    {etiquetaEstado(
                      evento.estado
                    )}
                  </span>

                  <div className="teacher-recent-participants">
                    <FaUsers />

                    {
                      evento.inscritos
                    }
                  </div>

                  <Link
                    to={`/docente/actividades/${evento.id_evento}/asistencia`}
                    className="teacher-small-button"
                  >
                    Ver
                  </Link>

                </article>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default DashboardDocente;