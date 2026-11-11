import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import {
  obtenerActividadesDocente,
} from "../../services/docenteService";

const formatearFechaHora =
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
  (valor) =>
    `${Number(
      valor || 0
    )
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      )} h`;

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

function MisActividadesPage() {
  const [
    actividades,
    setActividades,
  ] = useState([]);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
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
            await obtenerActividadesDocente();

          setActividades(
            datos.eventos ||
              []
          );
        } catch (err) {
          setError(
            err.message ||
              "No fue posible consultar tus actividades."
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

      return actividades.filter(
        (actividad) => {
          const coincideTexto =
            !texto ||
            actividad.nombre
              ?.toLowerCase()
              .includes(
                texto
              ) ||
            actividad.deporte
              ?.toLowerCase()
              .includes(
                texto
              ) ||
            actividad.lugar
              ?.toLowerCase()
              .includes(
                texto
              );

          const coincideEstado =
            filtroEstado ===
              "todos" ||
            actividad.estado ===
              filtroEstado;

          return (
            coincideTexto &&
            coincideEstado
          );
        }
      );
    }, [
      actividades,
      busqueda,
      filtroEstado,
    ]);

  return (
    <div className="teacher-page">

      <section className="teacher-header">

        <div>

          <span className="teacher-eyebrow">
            DOCENTE DEPORTIVO
          </span>

          <h1>
            Mis actividades
          </h1>

          <p>
            Aquí aparecen únicamente los eventos
            deportivos que te han sido asignados.
          </p>

        </div>

      </section>

      {error && (
        <div className="teacher-alert error">
          {error}
        </div>
      )}

      <section className="teacher-toolbar">

        <div className="teacher-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar actividad, deporte o lugar..."
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
            filtroEstado
          }
          onChange={(
            event
          ) =>
            setFiltroEstado(
              event.target.value
            )
          }
        >
          <option value="todos">
            Todos los estados
          </option>

          <option value="borrador">
            Borrador
          </option>

          <option value="inscripciones_abiertas">
            Inscripciones abiertas
          </option>

          <option value="en_curso">
            En curso
          </option>

          <option value="finalizado">
            Finalizado
          </option>

          <option value="cancelado">
            Cancelado
          </option>
        </select>

      </section>

      {cargando ? (
        <div className="teacher-dashboard-card teacher-loading">
          Cargando actividades...
        </div>
      ) : filtradas.length ===
        0 ? (
        <div className="teacher-dashboard-card teacher-empty">

          <FaCalendarAlt />

          <strong>
            No se encontraron actividades
          </strong>

          <span>
            No hay eventos que coincidan con los filtros.
          </span>

        </div>
      ) : (
        <section className="teacher-activities-grid">

          {filtradas.map(
            (
              actividad
            ) => (
              <article
                key={
                  actividad.id_evento
                }
                className="teacher-activity-card"
              >

                <div className="teacher-activity-top">

                  <span
                    className={`teacher-state teacher-state-${actividad.estado}`}
                  >
                    {etiquetaEstado(
                      actividad.estado
                    )}
                  </span>

                  <span className="teacher-sport-label">
                    {
                      actividad.deporte
                    }
                  </span>

                </div>

                <h2>
                  {
                    actividad.nombre
                  }
                </h2>

                <div className="teacher-activity-data">

                  <div>

                    <FaCalendarAlt />

                    <span>
                      {formatearFechaHora(
                        actividad.fecha_inicio
                      )}
                    </span>

                  </div>

                  <div>

                    <FaMapMarkerAlt />

                    <span>
                      {
                        actividad.lugar
                      }
                    </span>

                  </div>

                  {Array.isArray(actividad.dias_semana) &&
                    actividad.dias_semana.length > 0 && (
                      <div>
                        <FaCalendarAlt />
                        <span>
                          {actividad.dias_semana.join(", ")} — {actividad.hora_inicio} a {actividad.hora_fin}
                        </span>
                      </div>
                    )}

                  <div>

                    <FaClock />

                    <span>
                      Sesión: {formatearHoras(
                        actividad.duracion_horas
                      )}
                    </span>

                  </div>

                  <div>

                    <FaClock />

                    <span>
                      Total: {formatearHoras(
                        actividad.duracion_total_horas
                      )}
                    </span>

                  </div>

                </div>

                <div className="teacher-attendance-summary">

                  <div>
                    <span>
                      Inscritos
                    </span>

                    <strong>
                      {
                        actividad.inscritos
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Asistieron
                    </span>

                    <strong className="success">
                      {
                        actividad.asistieron
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pendientes
                    </span>

                    <strong className="warning">
                      {
                        actividad.pendientes
                      }
                    </strong>
                  </div>

                </div>

                <div className="teacher-card-footer">

                  <span>
                    <FaUsers />

                    {
                      actividad.inscritos
                    }{" "}
                    participante(s)
                  </span>

                  <Link
                    to={`/docente/actividades/${actividad.id_evento}/asistencia`}
                    className="teacher-primary-button compact"
                  >
                    {actividad.puede_registrar_asistencia
                      ? "Registrar asistencia"
                      : "Ver inscritos"}
                  </Link>

                </div>

              </article>
            )
          )}

        </section>
      )}

    </div>
  );
}

export default MisActividadesPage;
