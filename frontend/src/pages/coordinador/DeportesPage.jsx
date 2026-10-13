import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBasketballBall,
  FaBiking,
  FaDumbbell,
  FaEdit,
  FaFutbol,
  FaMedal,
  FaPlus,
  FaPowerOff,
  FaRunning,
  FaSearch,
  FaSwimmer,
  FaTableTennis,
  FaTimes,
  FaTrashAlt,
  FaVolleyballBall,
} from "react-icons/fa";

import {
  MdSportsHandball,
} from "react-icons/md";

import {
  obtenerDeportes,
  crearDeporte,
  actualizarDeporte,
  cambiarEstadoDeporte,
  eliminarDeporte,
} from "../../services/deporteService";

import "./deportesPage.css";

// =====================================================
// NORMALIZAR TEXTO
// =====================================================

const normalizarTexto = (
  texto
) => {
  return String(texto || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
};

// =====================================================
// ICONO SEGÚN EL DEPORTE
// =====================================================

const IconoDeporte = ({
  nombre,
}) => {
  const deporte =
    normalizarTexto(
      nombre
    );

  if (
    deporte.includes(
      "fut"
    )
  ) {
    return <FaFutbol />;
  }

  if (
    deporte.includes(
      "baloncesto"
    ) ||
    deporte.includes(
      "basket"
    )
  ) {
    return (
      <FaBasketballBall />
    );
  }

  if (
    deporte.includes(
      "vole"
    )
  ) {
    return (
      <FaVolleyballBall />
    );
  }

  if (
    deporte.includes(
      "balon mano"
    ) ||
    deporte.includes(
      "balonmano"
    ) ||
    deporte.includes(
      "handball"
    )
  ) {
    return (
      <MdSportsHandball />
    );
  }

  if (
    deporte.includes(
      "atlet"
    ) ||
    deporte.includes(
      "running"
    )
  ) {
    return <FaRunning />;
  }

  if (
    deporte.includes(
      "natacion"
    ) ||
    deporte.includes(
      "nado"
    )
  ) {
    return <FaSwimmer />;
  }

  if (
    deporte.includes(
      "cicl"
    )
  ) {
    return <FaBiking />;
  }

  if (
    deporte.includes(
      "tenis"
    )
  ) {
    return (
      <FaTableTennis />
    );
  }

  if (
    deporte.includes(
      "gimnas"
    ) ||
    deporte.includes(
      "fitness"
    ) ||
    deporte.includes(
      "pesas"
    )
  ) {
    return <FaDumbbell />;
  }

  return <FaMedal />;
};

function DeportesPage() {
  // =====================================================
  // DATOS
  // =====================================================

  const [
    deportes,
    setDeportes,
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
    actualizandoEstado,
    setActualizandoEstado,
  ] = useState(null);

  const [
    eliminando,
    setEliminando,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("todos");

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    deporteEditando,
    setDeporteEditando,
  ] = useState(null);

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  // =====================================================
  // CARGAR DEPORTES
  // =====================================================

  const cargarDeportes =
    async () => {
      try {
        setCargando(true);
        setError("");

        const datos =
          await obtenerDeportes();

        setDeportes(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible cargar los deportes."
        );
      } finally {
        setCargando(false);
      }
    };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarDeportes();
  }, []);

  // =====================================================
  // ABRIR NUEVO
  // =====================================================

  const abrirFormularioNuevo =
    () => {
      setDeporteEditando(
        null
      );

      setNombre("");
      setDescripcion("");

      setError("");
      setMensajeExito("");

      setMostrarFormulario(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =====================================================
  // ABRIR EDICIÓN
  // =====================================================

  const abrirFormularioEditar =
    (deporte) => {
      setDeporteEditando(
        deporte
      );

      setNombre(
        deporte.nombre ||
          ""
      );

      setDescripcion(
        deporte.descripcion ||
          ""
      );

      setError("");
      setMensajeExito("");

      setMostrarFormulario(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =====================================================
  // CERRAR FORMULARIO
  // =====================================================

  const cerrarFormulario =
    () => {
      setMostrarFormulario(
        false
      );

      setDeporteEditando(
        null
      );

      setNombre("");
      setDescripcion("");
    };

  // =====================================================
  // GUARDAR
  // =====================================================

  const manejarFormulario =
    async (event) => {
      event.preventDefault();

      const nombreLimpio =
        nombre.trim();

      const descripcionLimpia =
        descripcion.trim();

      if (!nombreLimpio) {
        setError(
          "El nombre del deporte es obligatorio."
        );

        return;
      }

      try {
        setGuardando(true);

        setError("");
        setMensajeExito("");

        const datosFormulario = {
          nombre:
            nombreLimpio,

          descripcion:
            descripcionLimpia,
        };

        if (
          deporteEditando
        ) {
          const resultado =
            await actualizarDeporte(
              deporteEditando.id_deporte,
              datosFormulario
            );

          setMensajeExito(
            resultado.mensaje ||
              "Deporte actualizado correctamente."
          );
        } else {
          const resultado =
            await crearDeporte(
              datosFormulario
            );

          setMensajeExito(
            resultado.mensaje ||
              "Deporte registrado correctamente."
          );
        }

        cerrarFormulario();

        await cargarDeportes();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible guardar el deporte."
        );
      } finally {
        setGuardando(false);
      }
    };

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const manejarCambioEstado =
    async (deporte) => {
      const accion =
        deporte.estado ===
        "activo"
          ? "desactivar"
          : "activar";

      const confirmar =
        window.confirm(
          `¿Deseas ${accion} el deporte "${deporte.nombre}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setActualizandoEstado(
          deporte.id_deporte
        );

        setError("");
        setMensajeExito("");

        const resultado =
          await cambiarEstadoDeporte(
            deporte.id_deporte
          );

        setMensajeExito(
          resultado.mensaje ||
            "Estado actualizado correctamente."
        );

        await cargarDeportes();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible cambiar el estado."
        );
      } finally {
        setActualizandoEstado(
          null
        );
      }
    };

  // =====================================================
  // ELIMINAR
  // =====================================================

  const manejarEliminarDeporte =
    async (deporte) => {
      setError("");
      setMensajeExito("");

      const eventosAsociados =
        Number(
          deporte.eventos_asociados
        ) || 0;

      // =================================================
      // VALIDACIÓN VISUAL
      // =================================================

      if (
        eventosAsociados > 0
      ) {
        setError(
          `No se puede eliminar "${deporte.nombre}" porque tiene ${eventosAsociados} evento(s) asociado(s). Puedes desactivarlo para evitar que se utilice en nuevos eventos.`
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

      const confirmar =
        window.confirm(
          `¿Seguro que deseas eliminar el deporte "${deporte.nombre}"?\n\nEsta acción no se puede deshacer.`
        );

      if (!confirmar) {
        return;
      }

      try {
        setEliminando(
          deporte.id_deporte
        );

        const resultado =
          await eliminarDeporte(
            deporte.id_deporte
          );

        setMensajeExito(
          resultado.mensaje ||
            "Deporte eliminado correctamente."
        );

        await cargarDeportes();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible eliminar el deporte."
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
  // FILTRAR
  // =====================================================

  const deportesFiltrados =
    useMemo(() => {
      const texto =
        normalizarTexto(
          busqueda
        );

      return deportes.filter(
        (deporte) => {
          const coincideEstado =
            filtroEstado ===
              "todos" ||
            deporte.estado ===
              filtroEstado;

          const coincideBusqueda =
            !texto ||
            normalizarTexto(
              deporte.nombre
            ).includes(texto) ||
            normalizarTexto(
              deporte.descripcion
            ).includes(texto);

          return (
            coincideEstado &&
            coincideBusqueda
          );
        }
      );
    }, [
      deportes,
      busqueda,
      filtroEstado,
    ]);

  // =====================================================
  // RESUMEN
  // =====================================================

  const resumen =
    useMemo(() => {
      const activos =
        deportes.filter(
          (deporte) =>
            deporte.estado ===
            "activo"
        ).length;

      const inactivos =
        deportes.filter(
          (deporte) =>
            deporte.estado ===
            "inactivo"
        ).length;

      return {
        total:
          deportes.length,

        activos,

        inactivos,
      };
    }, [deportes]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="sports-admin-page">

      {/* =============================================== */}
      {/* ENCABEZADO */}
      {/* =============================================== */}

      <div className="sports-admin-header">

        <div>

          <span className="sports-section-label">
            Gestión deportiva
          </span>

          <h1>
            Deportes
          </h1>

          <p>
            Administra las disciplinas deportivas
            disponibles dentro de SportU.
          </p>

        </div>

        <button
          type="button"
          className="sports-new-button"
          onClick={
            abrirFormularioNuevo
          }
        >
          <FaPlus />

          <span>
            Nuevo deporte
          </span>

        </button>

      </div>

      {/* =============================================== */}
      {/* MENSAJES */}
      {/* =============================================== */}

      {mensajeExito && (

        <div className="sports-message success">
          {mensajeExito}
        </div>

      )}

      {error && (

        <div className="sports-message error">
          {error}
        </div>

      )}

      {/* =============================================== */}
      {/* RESUMEN */}
      {/* =============================================== */}

      <div className="sports-summary-grid">

        <div className="sports-summary-card">

          <div className="sports-summary-icon total">
            <FaMedal />
          </div>

          <div>

            <span>
              Deportes registrados
            </span>

            <strong>
              {resumen.total}
            </strong>

          </div>

        </div>

        <div className="sports-summary-card">

          <div className="sports-summary-icon active">
            <FaRunning />
          </div>

          <div>

            <span>
              Deportes activos
            </span>

            <strong>
              {resumen.activos}
            </strong>

          </div>

        </div>

        <div className="sports-summary-card">

          <div className="sports-summary-icon inactive">
            <FaPowerOff />
          </div>

          <div>

            <span>
              Deportes inactivos
            </span>

            <strong>
              {resumen.inactivos}
            </strong>

          </div>

        </div>

      </div>

      {/* =============================================== */}
      {/* FORMULARIO */}
      {/* =============================================== */}

      {mostrarFormulario && (

        <section className="sports-form-card">

          <div className="sports-form-header">

            <div className="sports-form-heading">

              <div className="sports-form-main-icon">

                {nombre ? (

                  <IconoDeporte
                    nombre={nombre}
                  />

                ) : (

                  <FaMedal />

                )}

              </div>

              <div>

                <h2>
                  {deporteEditando
                    ? "Editar deporte"
                    : "Nuevo deporte"}
                </h2>

                <p>
                  {deporteEditando
                    ? "Actualiza la información de la disciplina deportiva."
                    : "Registra una nueva disciplina deportiva en SportU."}
                </p>

              </div>

            </div>

            <button
              type="button"
              className="sports-close-button"
              onClick={
                cerrarFormulario
              }
              title="Cerrar"
            >
              <FaTimes />
            </button>

          </div>

          <form
            onSubmit={
              manejarFormulario
            }
          >

            <div className="sports-form-grid">

              <div className="sports-field">

                <label htmlFor="nombre-deporte">
                  Nombre del deporte
                  <span>*</span>
                </label>

                <input
                  id="nombre-deporte"
                  type="text"
                  placeholder="Ej. Natación"
                  value={nombre}
                  onChange={(event) =>
                    setNombre(
                      event.target.value
                    )
                  }
                  maxLength="100"
                  autoFocus
                />

              </div>

              <div className="sports-field">

                <label htmlFor="descripcion-deporte">
                  Descripción
                </label>

                <textarea
                  id="descripcion-deporte"
                  rows="4"
                  placeholder="Describe brevemente la disciplina deportiva..."
                  value={
                    descripcion
                  }
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value
                    )
                  }
                  maxLength="500"
                />

                <small>
                  {descripcion.length}
                  {" / "}
                  500 caracteres
                </small>

              </div>

            </div>

            <div className="sports-form-actions">

              <button
                type="button"
                className="sports-cancel-button"
                onClick={
                  cerrarFormulario
                }
                disabled={
                  guardando
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="sports-save-button"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : deporteEditando
                  ? "Guardar cambios"
                  : "Guardar deporte"}
              </button>

            </div>

          </form>

        </section>

      )}

      {/* =============================================== */}
      {/* BUSCADOR */}
      {/* =============================================== */}

      <div className="sports-toolbar">

        <div className="sports-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar deporte..."
            value={
              busqueda
            }
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
          />

        </div>

        <select
          className="sports-state-filter"
          value={
            filtroEstado
          }
          onChange={(event) =>
            setFiltroEstado(
              event.target.value
            )
          }
        >
          <option value="todos">
            Todos los estados
          </option>

          <option value="activo">
            Activos
          </option>

          <option value="inactivo">
            Inactivos
          </option>

        </select>

      </div>

      {/* =============================================== */}
      {/* CONTENIDO */}
      {/* =============================================== */}

      {cargando ? (

        <div className="sports-loading">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <span>
            Cargando deportes...
          </span>

        </div>

      ) : deportesFiltrados.length ===
        0 ? (

        <div className="sports-empty">

          <FaMedal />

          <h3>
            No se encontraron deportes
          </h3>

          <p>
            Cambia los filtros o registra
            una nueva disciplina deportiva.
          </p>

        </div>

      ) : (

        <div className="sports-grid">

          {deportesFiltrados.map(
            (deporte) => {
              const activo =
                deporte.estado ===
                "activo";

              const cambiandoEstado =
                actualizandoEstado ===
                deporte.id_deporte;

              const estaEliminando =
                eliminando ===
                deporte.id_deporte;

              const eventosAsociados =
                Number(
                  deporte.eventos_asociados
                ) || 0;

              return (

                <article
                  className={`sport-card ${
                    activo
                      ? ""
                      : "inactive"
                  }`}
                  key={
                    deporte.id_deporte
                  }
                >

                  {/* ================================= */}
                  {/* CABECERA CARD */}
                  {/* ================================= */}

                  <div className="sport-card-top">

                    <div className="sport-icon-container">

                      <IconoDeporte
                        nombre={
                          deporte.nombre
                        }
                      />

                    </div>

                    <span
                      className={
                        activo
                          ? "sport-status active"
                          : "sport-status inactive"
                      }
                    >
                      {activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                  </div>

                  {/* ================================= */}
                  {/* INFORMACIÓN */}
                  {/* ================================= */}

                  <div className="sport-card-content">

                    <h2>
                      {
                        deporte.nombre
                      }
                    </h2>

                    <p>
                      {deporte.descripcion ||
                        "Sin descripción registrada."}
                    </p>

                    <div className="sport-events-info">

                      <span>
                        Eventos asociados
                      </span>

                      <strong>
                        {eventosAsociados}
                      </strong>

                    </div>

                  </div>

                  {/* ================================= */}
                  {/* ACCIONES */}
                  {/* ================================= */}

                  <div className="sport-card-actions">

                    <button
                      type="button"
                      className="sport-edit-button"
                      disabled={
                        estaEliminando
                      }
                      onClick={() =>
                        abrirFormularioEditar(
                          deporte
                        )
                      }
                    >
                      <FaEdit />

                      <span>
                        Editar
                      </span>

                    </button>

                    <button
                      type="button"
                      className={`sport-state-button ${
                        activo
                          ? "deactivate"
                          : "activate"
                      }`}
                      disabled={
                        cambiandoEstado ||
                        estaEliminando
                      }
                      onClick={() =>
                        manejarCambioEstado(
                          deporte
                        )
                      }
                    >
                      <FaPowerOff />

                      <span>
                        {cambiandoEstado
                          ? "Procesando..."
                          : activo
                          ? "Desactivar"
                          : "Activar"}
                      </span>

                    </button>

                    <button
                      type="button"
                      className={`sport-delete-button ${
                        eventosAsociados > 0
                          ? "protected"
                          : ""
                      }`}
                      disabled={
                        estaEliminando
                      }
                      title={
                        eventosAsociados > 0
                          ? "Este deporte tiene eventos asociados"
                          : "Eliminar deporte"
                      }
                      onClick={() =>
                        manejarEliminarDeporte(
                          deporte
                        )
                      }
                    >
                      <FaTrashAlt />

                      <span>
                        {estaEliminando
                          ? "Eliminando..."
                          : "Eliminar"}
                      </span>

                    </button>

                  </div>

                </article>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default DeportesPage;