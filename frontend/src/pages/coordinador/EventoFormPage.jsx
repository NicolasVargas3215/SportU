import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaRunning,
  FaSave,
  FaUserTie,
  FaUsers,
  FaInfoCircle,
} from "react-icons/fa";

import "./eventoFormPage.css";

const API_URL =
  `${import.meta.env.VITE_API_URL}/eventos`;

const ESTADOS = [
  {
    value: "borrador",
    label: "Borrador",
    descripcion:
      "El evento todavía no está disponible para los estudiantes.",
  },
  {
    value:
      "inscripciones_abiertas",
    label:
      "Inscripciones abiertas",
    descripcion:
      "Los estudiantes pueden consultar e inscribirse en el evento.",
  },
  {
    value: "en_curso",
    label: "En curso",
    descripcion:
      "El evento se está desarrollando actualmente.",
  },
  {
    value: "finalizado",
    label: "Finalizado",
    descripcion:
      "El evento terminó y ya no admite inscripciones.",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    descripcion:
      "El evento fue cancelado.",
  },
];

const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

function EventoFormPage() {
  const navigate =
    useNavigate();

  const {
    id,
  } = useParams();

  const esEdicion =
    Boolean(id);

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [
    formulario,
    setFormulario,
  ] = useState({
    nombre: "",
    id_deporte: "",
    id_docente: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    dias_semana: [],
    lugar: "",
    cupo_maximo: "",
    estado: "borrador",
  });

  // =====================================================
  // OPCIONES
  // =====================================================

  const [
    deportes,
    setDeportes,
  ] = useState([]);

  const [
    docentes,
    setDocentes,
  ] = useState([]);

  // =====================================================
  // ESTADOS DE INTERFAZ
  // =====================================================

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

  // =====================================================
  // TOKEN
  // =====================================================

  const obtenerToken = () =>
    localStorage.getItem(
      "token"
    );

  // =====================================================
  // PETICIÓN
  // =====================================================

  const realizarPeticion =
    async (
      url,
      opciones = {}
    ) => {
      const respuesta =
        await fetch(url, {
          ...opciones,

          headers: {
            Authorization:
              `Bearer ${obtenerToken()}`,

            ...(opciones.body
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}),

            ...opciones.headers,
          },
        });

      let datos = {};

      try {
        datos =
          await respuesta.json();
      } catch (errorJson) {
        datos = {};
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            "Ocurrió un error al procesar la solicitud."
        );
      }

      return datos;
    };

  // =====================================================
  // CARGAR OPCIONES
  // =====================================================

  const cargarOpciones =
    async () => {
      const datos =
        await realizarPeticion(
          `${API_URL}/opciones`
        );

      setDeportes(
        Array.isArray(
          datos.deportes
        )
          ? datos.deportes
          : []
      );

      setDocentes(
        Array.isArray(
          datos.docentes
        )
          ? datos.docentes
          : []
      );
    };

  // =====================================================
  // CARGAR EVENTO
  // =====================================================

  const cargarEvento =
    async () => {
      if (!esEdicion) {
        return;
      }

      const datos =
        await realizarPeticion(
          `${API_URL}/${id}`
        );

      const evento =
        datos.evento;

      setFormulario({
        nombre:
          evento.nombre || "",

        id_deporte:
          String(
            evento.id_deporte ||
              ""
          ),

        id_docente:
          String(
            evento.id_docente ||
              ""
          ),

        fecha_inicio:
          evento.fecha_inicio
            ? String(evento.fecha_inicio).slice(0, 10)
            : "",

        fecha_fin:
          evento.fecha_fin
            ? String(evento.fecha_fin).slice(0, 10)
            : "",

        hora_inicio:
          evento.hora_inicio
            ? String(evento.hora_inicio).slice(0, 5)
            : "",

        hora_fin:
          evento.hora_fin
            ? String(evento.hora_fin).slice(0, 5)
            : "",

        dias_semana:
          Array.isArray(evento.dias_semana)
            ? evento.dias_semana
            : typeof evento.dias_semana === "string" &&
                evento.dias_semana.length > 0
              ? evento.dias_semana.split(",")
              : [],

        lugar:
          evento.lugar || "",

        cupo_maximo:
          String(
            evento.cupo_maximo ||
              ""
          ),

        estado:
          evento.estado ||
          "borrador",
      });
    };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setCargando(true);
          setError("");

          await cargarOpciones();

          if (esEdicion) {
            await cargarEvento();
          }
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

    cargar();
  }, [id]);

  // =====================================================
  // CAMBIOS DEL FORMULARIO
  // =====================================================

  const manejarCambio = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );

    setError("");
  };

  const alternarDia = (dia) => {
    setFormulario((anterior) => ({
      ...anterior,
      dias_semana: anterior.dias_semana.includes(dia)
        ? anterior.dias_semana.filter((item) => item !== dia)
        : [...anterior.dias_semana, dia],
    }));
    setError("");
  };

  // =====================================================
  // DURACIÓN AUTOMÁTICA
  // =====================================================

  const duracionHoras =
    useMemo(() => {
      if (formulario.hora_inicio && formulario.hora_fin) {
        const [horaInicio, minutoInicio] = formulario.hora_inicio
          .split(":")
          .map(Number);
        const [horaFin, minutoFin] = formulario.hora_fin
          .split(":")
          .map(Number);

        const diferenciaMinutos =
          horaFin * 60 + minutoFin - (horaInicio * 60 + minutoInicio);

        return diferenciaMinutos > 0
          ? Number((diferenciaMinutos / 60).toFixed(2))
          : 0;
      }

      if (!formulario.fecha_inicio || !formulario.fecha_fin) {
        return 0;
      }

      const inicio = new Date(formulario.fecha_inicio);
      const fin = new Date(formulario.fecha_fin);
      const diferencia = fin.getTime() - inicio.getTime();

      if (
        Number.isNaN(
          diferencia
        ) ||
        diferencia <= 0
      ) {
        return 0;
      }

      return Number(
        (
          diferencia /
          3600000
        ).toFixed(2)
      );
    }, [
      formulario.fecha_inicio,
      formulario.fecha_fin,
      formulario.hora_inicio,
      formulario.hora_fin,
    ]);

  // =====================================================
  // FORMATEAR DURACIÓN
  // =====================================================

  const textoDuracion =
    useMemo(() => {
      if (
        duracionHoras <= 0
      ) {
        return "Sin calcular";
      }

      const horas =
        Math.floor(
          duracionHoras
        );

      const minutos =
        Math.round(
          (
            duracionHoras -
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
        return `${horas} hora${
          horas === 1
            ? ""
            : "s"
        }`;
      }

      return `${minutos} minutos`;
    }, [duracionHoras]);

  // =====================================================
  // ESTADO ACTUAL
  // =====================================================

  const estadoSeleccionado =
    ESTADOS.find(
      (estado) =>
        estado.value ===
        formulario.estado
    );

  // =====================================================
  // VALIDAR
  // =====================================================

  const validarFormulario =
    () => {
      if (
        !formulario.nombre.trim()
      ) {
        return "Ingresa el nombre del evento.";
      }

      if (
        !formulario.id_deporte
      ) {
        return "Selecciona un deporte.";
      }

      if (
        !formulario.id_docente
      ) {
        return "Selecciona un docente responsable.";
      }

      if (
        !formulario.fecha_inicio
      ) {
        return "Selecciona la fecha de inicio.";
      }

      if (
        !formulario.fecha_fin
      ) {
        return "Selecciona la fecha de finalización.";
      }

      if (formulario.dias_semana.length === 0) {
        return "Selecciona al menos un día programado.";
      }

      if (!formulario.hora_inicio || !formulario.hora_fin) {
        return "Selecciona la hora de inicio y la hora de finalización.";
      }

      if (formulario.hora_inicio >= formulario.hora_fin) {
        return "La hora de finalización debe ser posterior a la hora de inicio.";
      }

      if (duracionHoras <= 0) {
        return "La hora de finalización debe ser posterior a la hora de inicio.";
      }

      if (duracionHoras > 99.99) {
        return "La duración de cada sesión no puede superar 99.99 horas.";
      }

      if (
        !formulario.lugar.trim()
      ) {
        return "Ingresa el lugar del evento.";
      }

      const cupo =
        Number(
          formulario.cupo_maximo
        );

      if (
        !Number.isInteger(
          cupo
        ) ||
        cupo <= 0
      ) {
        return "El cupo máximo debe ser un número entero mayor que cero.";
      }

      return null;
    };

  // =====================================================
  // GUARDAR
  // =====================================================

  const manejarSubmit =
    async (event) => {
      event.preventDefault();

      const errorValidacion =
        validarFormulario();

      if (
        errorValidacion
      ) {
        setError(
          errorValidacion
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setGuardando(true);
        setError("");

        const payload = {
          nombre:
            formulario.nombre.trim(),

          id_deporte:
            Number(
              formulario.id_deporte
            ),

          id_docente:
            Number(
              formulario.id_docente
            ),

          fecha_inicio:
            formulario.fecha_inicio,

          fecha_fin:
            formulario.fecha_fin,

          hora_inicio:
            formulario.hora_inicio,

          hora_fin:
            formulario.hora_fin,

          dias_semana:
            formulario.dias_semana,

          lugar:
            formulario.lugar.trim(),

          cupo_maximo:
            Number(
              formulario.cupo_maximo
            ),

          estado:
            formulario.estado,
        };

        if (esEdicion) {
          await realizarPeticion(
            `${API_URL}/${id}`,
            {
              method: "PUT",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );
        } else {
          await realizarPeticion(
            API_URL,
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );
        }

        navigate(
          "/coordinador/eventos",
          {
            state: {
              mensaje: esEdicion
                ? "Evento actualizado correctamente."
                : "Evento creado correctamente.",
            },
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible guardar el evento."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setGuardando(false);
      }
    };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <div className="event-form-loading">
        <div
          className="spinner-border text-primary"
          role="status"
        />

        <span>
          Cargando información del evento...
        </span>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="professional-event-form">

      {/* =============================================== */}
      {/* HEADER */}
      {/* =============================================== */}

      <div className="event-form-header">

        <div className="event-header-left">

          <button
            type="button"
            className="event-back-button"
            onClick={() =>
              navigate(
                "/coordinador/eventos"
              )
            }
          >
            <FaArrowLeft />
          </button>

          <div>

            <div className="event-header-label">
              Gestión de eventos
            </div>

            <h1>
              {esEdicion
                ? "Editar evento"
                : "Nuevo evento"}
            </h1>

            <p>
              {esEdicion
                ? "Actualiza la programación y configuración del evento deportivo."
                : "Programa una nueva actividad deportiva para la comunidad universitaria."}
            </p>

          </div>

        </div>

        <div
          className={`event-mode-badge ${
            esEdicion
              ? "edit"
              : "new"
          }`}
        >
          {esEdicion
            ? "Edición"
            : "Nuevo"}
        </div>

      </div>

      {/* =============================================== */}
      {/* ERROR */}
      {/* =============================================== */}

      {error && (
        <div className="event-form-alert">
          <FaInfoCircle />

          <span>
            {error}
          </span>
        </div>
      )}

      <form
        onSubmit={
          manejarSubmit
        }
      >

        <div className="event-form-layout">

          {/* =========================================== */}
          {/* COLUMNA PRINCIPAL */}
          {/* =========================================== */}

          <div className="event-form-main">

            {/* INFORMACIÓN GENERAL */}

            <section className="event-professional-card">

              <div className="event-card-heading">

                <div className="event-heading-icon">
                  <FaCalendarAlt />
                </div>

                <div>
                  <h2>
                    Información general
                  </h2>

                  <p>
                    Define los datos principales del evento.
                  </p>
                </div>

              </div>

              <div className="event-fields-grid">

                {/* NOMBRE */}

                <div className="event-field full">

                  <label htmlFor="nombre">
                    Nombre del evento
                    <span>*</span>
                  </label>

                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={
                      formulario.nombre
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Torneo universitario de fútbol"
                    maxLength="150"
                  />

                </div>

                {/* DEPORTE */}

                <div className="event-field">

                  <label htmlFor="id_deporte">
                    <FaRunning />
                    Deporte
                    <span>*</span>
                  </label>

                  <select
                    id="id_deporte"
                    name="id_deporte"
                    value={
                      formulario.id_deporte
                    }
                    onChange={
                      manejarCambio
                    }
                  >
                    <option value="">
                      Seleccionar deporte
                    </option>

                    {deportes.map(
                      (deporte) => (
                        <option
                          key={
                            deporte.id_deporte
                          }
                          value={
                            deporte.id_deporte
                          }
                        >
                          {
                            deporte.nombre
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* DOCENTE */}

                <div className="event-field">

                  <label htmlFor="id_docente">
                    <FaUserTie />
                    Docente responsable
                    <span>*</span>
                  </label>

                  <select
                    id="id_docente"
                    name="id_docente"
                    value={
                      formulario.id_docente
                    }
                    onChange={
                      manejarCambio
                    }
                  >
                    <option value="">
                      Seleccionar docente
                    </option>

                    {docentes.map(
                      (docente) => (
                        <option
                          key={
                            docente.id_usuario
                          }
                          value={
                            docente.id_usuario
                          }
                        >
                          {
                            docente.nombre
                          }
                          {docente.correo
                            ? ` — ${docente.correo}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* LUGAR */}

                <div className="event-field">

                  <label htmlFor="lugar">
                    <FaMapMarkerAlt />
                    Lugar
                    <span>*</span>
                  </label>

                  <input
                    id="lugar"
                    name="lugar"
                    type="text"
                    value={
                      formulario.lugar
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="Ej. Cancha principal"
                    maxLength="150"
                  />

                </div>

                {/* CUPO */}

                <div className="event-field">

                  <label htmlFor="cupo_maximo">
                    <FaUsers />
                    Cupo máximo
                    <span>*</span>
                  </label>

                  <input
                    id="cupo_maximo"
                    name="cupo_maximo"
                    type="number"
                    value={
                      formulario.cupo_maximo
                    }
                    onChange={
                      manejarCambio
                    }
                    placeholder="30"
                    min="1"
                    step="1"
                  />

                </div>

              </div>

            </section>

            {/* PROGRAMACIÓN */}

            <section className="event-professional-card">

              <div className="event-card-heading">

                <div className="event-heading-icon schedule">
                  <FaClock />
                </div>

                <div>
                  <h2>
                    Programación
                  </h2>

                  <p>
                    Define cuándo inicia y cuándo termina la actividad.
                  </p>
                </div>

              </div>

              <div className="event-schedule-grid">

                {/* INICIO */}

                <div className="event-field">

                  <label htmlFor="fecha_inicio">
                    Fecha de inicio
                    <span>*</span>
                  </label>

                  <input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    value={
                      formulario.fecha_inicio
                    }
                    onChange={
                      manejarCambio
                    }
                  />

                </div>

                {/* FINAL */}

                <div className="event-field">

                  <label htmlFor="fecha_fin">
                    Fecha de finalización
                    <span>*</span>
                  </label>

                  <input
                    id="fecha_fin"
                    name="fecha_fin"
                    type="date"
                    min={
                      formulario.fecha_inicio ||
                      undefined
                    }
                    value={
                      formulario.fecha_fin
                    }
                    onChange={
                      manejarCambio
                    }
                  />

                </div>

              </div>

              <div className="event-weekly-schedule">
                <div className="event-field full">
                  <label>
                    Días programados
                    <span>*</span>
                  </label>

                  <div className="event-weekdays-grid">
                    {DIAS_SEMANA.map((dia) => (
                      <label
                        key={dia.value}
                        className={`event-weekday-option ${
                          formulario.dias_semana.includes(dia.value)
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formulario.dias_semana.includes(
                            dia.value
                          )}
                          onChange={() => alternarDia(dia.value)}
                        />
                        <span>{dia.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="event-schedule-grid event-schedule-hours">
                  <div className="event-field">
                    <label htmlFor="hora_inicio">
                      Hora de inicio
                      <span>*</span>
                    </label>
                    <input
                      id="hora_inicio"
                      name="hora_inicio"
                      type="time"
                      value={formulario.hora_inicio}
                      onChange={manejarCambio}
                    />
                  </div>

                  <div className="event-field">
                    <label htmlFor="hora_fin">
                      Hora de finalización
                      <span>*</span>
                    </label>
                    <input
                      id="hora_fin"
                      name="hora_fin"
                      type="time"
                      min={formulario.hora_inicio || undefined}
                      value={formulario.hora_fin}
                      onChange={manejarCambio}
                    />
                  </div>
                </div>
              </div>

              {/* DURACIÓN */}

              <div
                className={`event-duration-box ${
                  duracionHoras > 0
                    ? "valid"
                    : ""
                }`}
              >

                <div className="event-duration-icon">
                  <FaClock />
                </div>

                <div>

                  <small>
                    Duración calculada
                  </small>

                  <strong>
                    {textoDuracion}
                  </strong>

                  <span>
                    El sistema calcula automáticamente
                    las horas deportivas del evento.
                  </span>

                </div>

              </div>

            </section>

            {/* ESTADO */}

            <section className="event-professional-card">

              <div className="event-card-heading">

                <div className="event-heading-icon status">
                  <FaInfoCircle />
                </div>

                <div>
                  <h2>
                    Estado del evento
                  </h2>

                  <p>
                    Define en qué etapa se encuentra la actividad.
                  </p>
                </div>

              </div>

              <div className="event-state-options">

                {ESTADOS.map(
                  (estado) => (

                    <label
                      key={
                        estado.value
                      }
                      className={`event-state-option ${estado.value} ${
                        formulario.estado ===
                        estado.value
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="estado"
                        value={
                          estado.value
                        }
                        checked={
                          formulario.estado ===
                          estado.value
                        }
                        onChange={
                          manejarCambio
                        }
                      />

                      <div className="event-state-radio" />

                      <div className="event-state-content">

                        <strong>
                          {
                            estado.label
                          }
                        </strong>

                        <span>
                          {
                            estado.descripcion
                          }
                        </span>

                      </div>

                    </label>

                  )
                )}

              </div>

            </section>

          </div>

          {/* =========================================== */}
          {/* RESUMEN */}
          {/* =========================================== */}

          <aside className="event-form-summary">

            <div className="event-summary-card">

              <div className="event-summary-header">

                <span>
                  Resumen
                </span>

                <FaCalendarAlt />

              </div>

              <div className="event-summary-name">

                {formulario.nombre.trim() ||
                  "Nuevo evento deportivo"}

              </div>

              <div className="event-summary-row">

                <span>
                  Estado
                </span>

                <strong
                  className={`summary-status ${formulario.estado}`}
                >
                  {estadoSeleccionado?.label ||
                    "-"}
                </strong>

              </div>

              <div className="event-summary-row">
                <span>Programación</span>
                <strong>
                  {formulario.dias_semana.length > 0
                    ? `${formulario.dias_semana
                        .map(
                          (dia) =>
                            DIAS_SEMANA.find(
                              (item) => item.value === dia
                            )?.label || dia
                        )
                        .join(", ")} ${formulario.hora_inicio || ""}-${
                        formulario.hora_fin || ""
                      }`
                    : "-"}
                </strong>
              </div>

              <div className="event-summary-row">

                <span>
                  Duración
                </span>

                <strong>
                  {textoDuracion}
                </strong>

              </div>

              <div className="event-summary-row">

                <span>
                  Cupo
                </span>

                <strong>
                  {formulario.cupo_maximo
                    ? `${formulario.cupo_maximo} personas`
                    : "-"}
                </strong>

              </div>

              <div className="event-summary-row">

                <span>
                  Lugar
                </span>

                <strong>
                  {formulario.lugar.trim() ||
                    "-"}
                </strong>

              </div>

              <div className="event-summary-note">
                <FaInfoCircle />

                <p>
                  Solo los eventos con
                  <strong>
                    {" "}
                    inscripciones abiertas{" "}
                  </strong>
                  estarán disponibles para los estudiantes.
                </p>
              </div>

            </div>

          </aside>

        </div>

        {/* ============================================= */}
        {/* ACCIONES */}
        {/* ============================================= */}

        <div className="event-form-actions">

          <button
            type="button"
            className="event-cancel-button"
            disabled={
              guardando
            }
            onClick={() =>
              navigate(
                "/coordinador/eventos"
              )
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="event-save-button"
            disabled={
              guardando
            }
          >
            <FaSave />

            {guardando
              ? "Guardando..."
              : esEdicion
              ? "Guardar cambios"
              : "Crear evento"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default EventoFormPage;
