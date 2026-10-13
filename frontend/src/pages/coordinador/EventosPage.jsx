import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaMapMarkerAlt,
  FaPlus,
  FaRunning,
  FaSearch,
  FaTrashAlt,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";

import "./eventosPage.css";

const API_URL =
  "http://localhost:3000/api/eventos";

// =====================================================
// ESTADOS
// =====================================================

const ESTADOS = {
  borrador: {
    label: "Borrador",
    className: "draft",
  },

  inscripciones_abiertas: {
    label:
      "Inscripciones abiertas",
    className: "open",
  },

  en_curso: {
    label: "En curso",
    className: "progress",
  },

  finalizado: {
    label: "Finalizado",
    className: "finished",
  },

  cancelado: {
    label: "Cancelado",
    className: "cancelled",
  },
};

function EventosPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    eventos,
    setEventos,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(null);

  const [
    eliminando,
    setEliminando,
  ] = useState(null);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const obtenerToken = () =>
    localStorage.getItem(
      "token"
    );

  // =====================================================
  // RESPUESTA
  // =====================================================

  const procesarRespuesta =
    async (
      respuesta,
      mensajePorDefecto
    ) => {
      let datos = {};

      try {
        datos =
          await respuesta.json();
      } catch {
        datos = {};
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            mensajePorDefecto
        );
      }

      return datos;
    };

  // =====================================================
  // CARGAR EVENTOS
  // =====================================================

  const cargarEventos =
    async () => {
      try {
        setCargando(true);

        const respuesta =
          await fetch(
            API_URL,
            {
              headers: {
                Authorization:
                  `Bearer ${obtenerToken()}`,
              },
            }
          );

        const datos =
          await procesarRespuesta(
            respuesta,
            "Error al consultar eventos"
          );

        setEventos(
          Array.isArray(
            datos.eventos
          )
            ? datos.eventos
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

  // =====================================================
  // INICIAL
  // =====================================================

  useEffect(() => {
    cargarEventos();
  }, []);

  // =====================================================
  // MENSAJE EXTERNO
  // =====================================================

  useEffect(() => {
    if (
      location.state?.mensaje
    ) {
      setMensaje(
        location.state.mensaje
      );

      navigate(
        location.pathname,
        {
          replace: true,
          state: {},
        }
      );
    }
  }, []);

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const cambiarEstado =
    async (
      evento,
      nuevoEstado
    ) => {
      if (
        evento.estado ===
        nuevoEstado
      ) {
        return;
      }

      const estado =
        ESTADOS[
          nuevoEstado
        ];

      const confirmar =
        window.confirm(
          `¿Deseas cambiar "${evento.nombre}" a "${estado?.label}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setActualizando(
          evento.id_evento
        );

        setMensaje("");
        setError("");

        const respuesta =
          await fetch(
            `${API_URL}/${evento.id_evento}/estado`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${obtenerToken()}`,
              },

              body:
                JSON.stringify({
                  estado:
                    nuevoEstado,
                }),
            }
          );

        const datos =
          await procesarRespuesta(
            respuesta,
            "No fue posible cambiar el estado"
          );

        setMensaje(
          datos.mensaje ||
            "Estado actualizado correctamente."
        );

        await cargarEventos();
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setActualizando(
          null
        );
      }
    };

  // =====================================================
  // ELIMINAR EVENTO
  // =====================================================

  const eliminarEvento =
    async (evento) => {
      setMensaje("");
      setError("");

      const inscritos =
        Number(
          evento.inscritos
        ) || 0;

      const asistencias =
        Number(
          evento.asistencias_registradas
        ) || 0;

      // =================================================
      // SI YA EXISTE HISTORIAL DE ASISTENCIA
      // =================================================

      if (
        asistencias > 0
      ) {
        setError(
          `No se puede eliminar "${evento.nombre}" porque tiene asistencia registrada. Debes conservarlo como parte del historial deportivo. Si ya no se realizará, cambia su estado a "Cancelado".`
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      // =================================================
      // CONFIRMACIÓN
      // =================================================

      let textoConfirmacion =
        `¿Seguro que deseas eliminar el evento "${evento.nombre}"?\n\nEsta acción no se puede deshacer.`;

      if (
        inscritos > 0
      ) {
        textoConfirmacion =
          `El evento "${evento.nombre}" tiene ${inscritos} inscripción(es) pendiente(s).\n\nAl eliminar el evento también se eliminarán esas inscripciones.\n\n¿Deseas continuar?`;
      }

      const confirmar =
        window.confirm(
          textoConfirmacion
        );

      if (!confirmar) {
        return;
      }

      // =================================================
      // ELIMINAR
      // =================================================

      try {
        setEliminando(
          evento.id_evento
        );

        const respuesta =
          await fetch(
            `${API_URL}/${evento.id_evento}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${obtenerToken()}`,
              },
            }
          );

        const datos =
          await procesarRespuesta(
            respuesta,
            "No fue posible eliminar el evento"
          );

        setMensaje(
          datos.mensaje ||
            "Evento eliminado correctamente."
        );

        await cargarEventos();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible eliminar el evento."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setEliminando(
          null
        );
      }
    };

  // =====================================================
  // FECHA
  // =====================================================

  const formatearFecha = (
    valor
  ) => {
    if (!valor) {
      return "-";
    }

    const fecha =
      new Date(valor);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return valor;
    }

    return fecha.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // HORA
  // =====================================================

  const formatearHora = (
    valor
  ) => {
    if (!valor) {
      return "-";
    }

    const fecha =
      new Date(valor);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return "-";
    }

    return fecha.toLocaleTimeString(
      "es-CO",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // DURACIÓN
  // =====================================================

  const formatearDuracion = (
    valor
  ) => {
    const duracion =
      Number(valor);

    if (
      !Number.isFinite(
        duracion
      )
    ) {
      return "0 h";
    }

    const horas =
      Math.floor(
        duracion
      );

    const minutos =
      Math.round(
        (
          duracion -
          horas
        ) * 60
      );

    if (
      horas > 0 &&
      minutos > 0
    ) {
      return `${horas} h ${minutos} min`;
    }

    if (horas > 0) {
      return `${horas} h`;
    }

    return `${minutos} min`;
  };

  // =====================================================
  // FILTRAR
  // =====================================================

  const eventosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return eventos.filter(
        (evento) => {
          const coincideEstado =
            filtroEstado ===
              "todos" ||
            evento.estado ===
              filtroEstado;

          const coincideBusqueda =
            !texto ||
            String(
              evento.nombre ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              evento.deporte ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              evento.docente ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              evento.lugar ||
                ""
            )
              .toLowerCase()
              .includes(texto);

          return (
            coincideEstado &&
            coincideBusqueda
          );
        }
      );
    }, [
      eventos,
      busqueda,
      filtroEstado,
    ]);

  // =====================================================
  // RESUMEN
  // =====================================================

  const resumen =
    useMemo(() => ({
      total:
        eventos.length,

      abiertos:
        eventos.filter(
          (evento) =>
            evento.estado ===
            "inscripciones_abiertas"
        ).length,

      curso:
        eventos.filter(
          (evento) =>
            evento.estado ===
            "en_curso"
        ).length,

      finalizados:
        eventos.filter(
          (evento) =>
            evento.estado ===
            "finalizado"
        ).length,
    }), [eventos]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="events-admin-page">

      {/* HEADER */}

      <div className="events-admin-header">

        <div>

          <span className="events-section-label">
            Gestión deportiva
          </span>

          <h1>
            Eventos deportivos
          </h1>

          <p>
            Administra la programación,
            responsables, cupos y estados
            de las actividades deportivas.
          </p>

        </div>

        <button
          type="button"
          className="events-new-button"
          onClick={() =>
            navigate(
              "/coordinador/eventos/nuevo"
            )
          }
        >
          <FaPlus />
          Nuevo evento
        </button>

      </div>

      {/* MENSAJES */}

      {mensaje && (
        <div className="events-message success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="events-message error">
          {error}
        </div>
      )}

      {/* RESUMEN */}

      <div className="events-summary-grid">

        <div className="events-summary-card">
          <div className="summary-icon blue">
            <FaCalendarAlt />
          </div>

          <div>
            <span>Total eventos</span>
            <strong>
              {resumen.total}
            </strong>
          </div>
        </div>

        <div className="events-summary-card">
          <div className="summary-icon cyan">
            <FaUsers />
          </div>

          <div>
            <span>
              Inscripciones abiertas
            </span>

            <strong>
              {resumen.abiertos}
            </strong>
          </div>
        </div>

        <div className="events-summary-card">
          <div className="summary-icon orange">
            <FaRunning />
          </div>

          <div>
            <span>
              En curso
            </span>

            <strong>
              {resumen.curso}
            </strong>
          </div>
        </div>

        <div className="events-summary-card">
          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>
              Finalizados
            </span>

            <strong>
              {resumen.finalizados}
            </strong>
          </div>
        </div>

      </div>

      {/* BUSCADOR */}

      <div className="events-toolbar">

        <div className="events-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar evento, deporte, docente o lugar..."
            value={busqueda}
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />

        </div>

        <select
          className="events-state-filter"
          value={filtroEstado}
          onChange={(event) =>
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

      </div>

      {/* TABLA */}

      <div className="events-table-card">

        {cargando ? (

          <div className="events-loading">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <span>
              Cargando eventos...
            </span>

          </div>

        ) : eventosFiltrados.length ===
          0 ? (

          <div className="events-empty">

            <FaCalendarAlt />

            <h3>
              No se encontraron eventos
            </h3>

            <p>
              Cambia los filtros o crea un nuevo evento.
            </p>

          </div>

        ) : (

          <div className="events-table-responsive">

            <table className="events-professional-table">

              <thead>

                <tr>
                  <th>Evento</th>
                  <th>Programación</th>
                  <th>Lugar</th>
                  <th>Docente</th>
                  <th>Duración</th>
                  <th>Cupos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {eventosFiltrados.map(
                  (evento) => {
                    const estado =
                      ESTADOS[
                        evento.estado
                      ] || {
                        label:
                          evento.estado,
                        className:
                          "draft",
                      };

                    const inscritos =
                      Number(
                        evento.inscritos
                      ) || 0;

                    const cupo =
                      Number(
                        evento.cupo_maximo
                      ) || 0;

                    const disponibles =
                      Math.max(
                        cupo -
                          inscritos,
                        0
                      );

                    const asistencias =
                      Number(
                        evento.asistencias_registradas
                      ) || 0;

                    const estaActualizando =
                      actualizando ===
                      evento.id_evento;

                    const estaEliminando =
                      eliminando ===
                      evento.id_evento;

                    return (

                      <tr
                        key={
                          evento.id_evento
                        }
                      >

                        {/* EVENTO */}

                        <td data-label="Evento">

                          <div className="event-name-cell">

                            <div className="event-sport-icon">
                              <FaRunning />
                            </div>

                            <div>
                              <strong>
                                {evento.nombre}
                              </strong>

                              <span>
                                {evento.deporte}
                              </span>
                            </div>

                          </div>

                        </td>

                        {/* PROGRAMACIÓN */}

                        <td data-label="Programación">

                          <div className="event-schedule-cell">

                            <div>
                              <FaCalendarAlt />

                              <span>
                                {formatearFecha(
                                  evento.fecha_inicio
                                )}
                              </span>
                            </div>

                            <div>
                              <FaClock />

                              <span>
                                {formatearHora(
                                  evento.fecha_inicio
                                )}
                                {" – "}
                                {formatearHora(
                                  evento.fecha_fin
                                )}
                              </span>
                            </div>

                          </div>

                        </td>

                        {/* LUGAR */}

                        <td data-label="Lugar">

                          <div className="event-simple-cell">

                            <FaMapMarkerAlt />

                            <span>
                              {evento.lugar}
                            </span>

                          </div>

                        </td>

                        {/* DOCENTE */}

                        <td data-label="Docente">

                          <div className="event-simple-cell">

                            <FaUserTie />

                            <span>
                              {evento.docente}
                            </span>

                          </div>

                        </td>

                        {/* DURACIÓN */}

                        <td data-label="Duración">

                          <strong className="event-duration-text">

                            {formatearDuracion(
                              evento.duracion_horas
                            )}

                          </strong>

                        </td>

                        {/* CUPOS */}

                        <td data-label="Cupos">

                          <div className="event-capacity-cell">

                            <strong>
                              {disponibles}
                              {" / "}
                              {cupo}
                            </strong>

                            <span>
                              disponibles
                            </span>

                            <div className="event-capacity-track">

                              <div
                                style={{
                                  width:
                                    cupo > 0
                                      ? `${Math.min(
                                          100,
                                          (
                                            inscritos /
                                            cupo
                                          ) *
                                            100
                                        )}%`
                                      : "0%",
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        {/* ESTADO */}

                        <td data-label="Estado">

                          <span
                            className={`event-status-badge ${estado.className}`}
                          >
                            {estado.label}
                          </span>

                        </td>

                        {/* ACCIONES */}

                        <td data-label="Acciones">

                          <div className="event-actions-cell">

                            {/* EDITAR */}

                            <button
                              type="button"
                              className="event-edit-action"
                              title="Editar evento"
                              disabled={
                                estaEliminando
                              }
                              onClick={() =>
                                navigate(
                                  `/coordinador/eventos/editar/${evento.id_evento}`
                                )
                              }
                            >
                              <FaEdit />
                            </button>

                            {/* ELIMINAR */}

                            <button
                              type="button"
                              className={`event-delete-action ${
                                asistencias >
                                0
                                  ? "protected"
                                  : ""
                              }`}
                              title={
                                asistencias > 0
                                  ? "Este evento tiene asistencia registrada"
                                  : inscritos > 0
                                  ? "Eliminar evento e inscripciones pendientes"
                                  : "Eliminar evento"
                              }
                              disabled={
                                estaEliminando
                              }
                              onClick={() =>
                                eliminarEvento(
                                  evento
                                )
                              }
                            >
                              <FaTrashAlt />
                            </button>

                            {/* ESTADO */}

                            <select
                              className="event-change-state"
                              value={
                                evento.estado
                              }
                              disabled={
                                estaActualizando ||
                                estaEliminando
                              }
                              onChange={(event) =>
                                cambiarEstado(
                                  evento,
                                  event.target.value
                                )
                              }
                            >

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

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default EventosPage;