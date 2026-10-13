import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBox,
  FaBoxes,
  FaCheckCircle,
  FaDumbbell,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaPowerOff,
  FaSearch,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";

import {
  obtenerInventario,
  obtenerOpcionesInventario,
  crearImplemento,
  actualizarImplemento,
  cambiarEstadoImplemento,
  eliminarImplemento,
} from "../../services/inventarioService";

import "./inventarioPage.css";

function InventarioPage() {
  // =====================================================
  // DATOS
  // =====================================================

  const [
    equipos,
    setEquipos,
  ] = useState([]);

  const [
    deportes,
    setDeportes,
  ] = useState([]);

  // =====================================================
  // INTERFAZ
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
    mensaje,
    setMensaje,
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
    implementoEditando,
    setImplementoEditando,
  ] = useState(null);

  const [
    formulario,
    setFormulario,
  ] = useState({
    nombre: "",
    id_deporte: "",
    cantidad_total: "",
  });

  // =====================================================
  // CARGAR
  // =====================================================

  const cargarInformacion =
    async () => {
      try {
        setCargando(true);
        setError("");

        const [
          inventario,
          opciones,
        ] = await Promise.all([
          obtenerInventario(),
          obtenerOpcionesInventario(),
        ]);

        setEquipos(
          Array.isArray(
            inventario
          )
            ? inventario
            : []
        );

        setDeportes(
          Array.isArray(
            opciones.deportes
          )
            ? opciones.deportes
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible cargar el inventario."
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarInformacion();
  }, []);

  // =====================================================
  // NUEVO
  // =====================================================

  const abrirNuevo =
    () => {
      setImplementoEditando(
        null
      );

      setFormulario({
        nombre: "",
        id_deporte: "",
        cantidad_total: "",
      });

      setMensaje("");
      setError("");

      setMostrarFormulario(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =====================================================
  // EDITAR
  // =====================================================

  const abrirEditar =
    (equipo) => {
      setImplementoEditando(
        equipo
      );

      setFormulario({
        nombre:
          equipo.nombre || "",

        id_deporte:
          equipo.id_deporte
            ? String(
                equipo.id_deporte
              )
            : "",

        cantidad_total:
          String(
            equipo.cantidad_total ??
              ""
          ),
      });

      setMensaje("");
      setError("");

      setMostrarFormulario(
        true
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =====================================================
  // CERRAR
  // =====================================================

  const cerrarFormulario =
    () => {
      setMostrarFormulario(
        false
      );

      setImplementoEditando(
        null
      );

      setFormulario({
        nombre: "",
        id_deporte: "",
        cantidad_total: "",
      });
    };

  // =====================================================
  // CAMBIO FORMULARIO
  // =====================================================

  const manejarCambio =
    (event) => {
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

  // =====================================================
  // PRESTADO AL EDITAR
  // =====================================================

  const cantidadPrestadaEditando =
    useMemo(() => {
      if (
        !implementoEditando
      ) {
        return 0;
      }

      return (
        Number(
          implementoEditando.cantidad_prestada
        ) || 0
      );
    }, [
      implementoEditando,
    ]);

  // =====================================================
  // DISPONIBILIDAD PROYECTADA
  // =====================================================

  const disponibilidadProyectada =
    useMemo(() => {
      const total =
        Number(
          formulario.cantidad_total
        );

      if (
        !Number.isInteger(
          total
        ) ||
        total < 0
      ) {
        return null;
      }

      return Math.max(
        total -
          cantidadPrestadaEditando,
        0
      );
    }, [
      formulario.cantidad_total,
      cantidadPrestadaEditando,
    ]);

  // =====================================================
  // GUARDAR
  // =====================================================

  const manejarSubmit =
    async (event) => {
      event.preventDefault();

      const nombre =
        formulario.nombre.trim();

      const cantidadTotal =
        Number(
          formulario.cantidad_total
        );

      if (!nombre) {
        setError(
          "El nombre del implemento es obligatorio."
        );

        return;
      }

      if (
        !Number.isInteger(
          cantidadTotal
        ) ||
        cantidadTotal < 0
      ) {
        setError(
          "La cantidad total debe ser un número entero igual o mayor que cero."
        );

        return;
      }

      if (
        cantidadTotal <
        cantidadPrestadaEditando
      ) {
        setError(
          `No puedes establecer ${cantidadTotal} unidades porque actualmente existen ${cantidadPrestadaEditando} unidad(es) prestada(s).`
        );

        return;
      }

      try {
        setGuardando(true);

        setMensaje("");
        setError("");

        const payload = {
          nombre,

          id_deporte:
            formulario.id_deporte
              ? Number(
                  formulario.id_deporte
                )
              : null,

          cantidad_total:
            cantidadTotal,
        };

        let resultado;

        if (
          implementoEditando
        ) {
          resultado =
            await actualizarImplemento(
              implementoEditando.id_equipo,
              payload
            );
        } else {
          resultado =
            await crearImplemento(
              payload
            );
        }

        setMensaje(
          resultado.mensaje ||
            (
              implementoEditando
                ? "Implemento actualizado correctamente."
                : "Implemento registrado correctamente."
            )
        );

        cerrarFormulario();

        await cargarInformacion();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible guardar el implemento."
        );
      } finally {
        setGuardando(false);
      }
    };

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const manejarEstado =
    async (equipo) => {
      const accion =
        equipo.estado ===
        "activo"
          ? "desactivar"
          : "activar";

      const confirmar =
        window.confirm(
          `¿Deseas ${accion} "${equipo.nombre}"?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setActualizandoEstado(
          equipo.id_equipo
        );

        setError("");
        setMensaje("");

        const resultado =
          await cambiarEstadoImplemento(
            equipo.id_equipo
          );

        setMensaje(
          resultado.mensaje ||
            "Estado actualizado correctamente."
        );

        await cargarInformacion();
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

  const manejarEliminar =
    async (equipo) => {
      setMensaje("");
      setError("");

      const prestamos =
        Number(
          equipo.prestamos_asociados
        ) || 0;

      // =================================================
      // PROTEGER HISTORIAL
      // =================================================

      if (
        prestamos > 0
      ) {
        setError(
          `No se puede eliminar "${equipo.nombre}" porque tiene ${prestamos} préstamo(s) asociado(s). Puedes desactivarlo para conservar el historial.`
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
          `¿Seguro que deseas eliminar el implemento "${equipo.nombre}"?\n\nEsta acción no se puede deshacer.`
        );

      if (!confirmar) {
        return;
      }

      try {
        setEliminando(
          equipo.id_equipo
        );

        const resultado =
          await eliminarImplemento(
            equipo.id_equipo
          );

        setMensaje(
          resultado.mensaje ||
            "Implemento eliminado correctamente."
        );

        await cargarInformacion();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible eliminar el implemento."
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

  const equiposFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return equipos.filter(
        (equipo) => {
          const coincideEstado =
            filtroEstado ===
              "todos" ||
            equipo.estado ===
              filtroEstado;

          const coincideBusqueda =
            !texto ||
            String(
              equipo.nombre ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              equipo.deporte ||
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
      equipos,
      busqueda,
      filtroEstado,
    ]);

  // =====================================================
  // RESUMEN
  // =====================================================

  const resumen =
    useMemo(() => {
      return {
        implementos:
          equipos.length,

        unidades:
          equipos.reduce(
            (
              total,
              equipo
            ) =>
              total +
              (
                Number(
                  equipo.cantidad_total
                ) || 0
              ),
            0
          ),

        disponibles:
          equipos.reduce(
            (
              total,
              equipo
            ) =>
              total +
              (
                Number(
                  equipo.cantidad_disponible
                ) || 0
              ),
            0
          ),

        prestadas:
          equipos.reduce(
            (
              total,
              equipo
            ) =>
              total +
              (
                Number(
                  equipo.cantidad_prestada
                ) || 0
              ),
            0
          ),
      };
    }, [equipos]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="inventory-admin-page">

      {/* HEADER */}

      <div className="inventory-header">

        <div>

          <span className="inventory-section-label">
            Recursos deportivos
          </span>

          <h1>
            Inventario deportivo
          </h1>

          <p>
            Controla implementos, existencias,
            disponibilidad y estado de los recursos deportivos.
          </p>

        </div>

        <button
          type="button"
          className="inventory-new-button"
          onClick={
            abrirNuevo
          }
        >
          <FaPlus />
          Nuevo implemento
        </button>

      </div>

      {/* MENSAJES */}

      {mensaje && (

        <div className="inventory-message success">
          <FaCheckCircle />

          <span>
            {mensaje}
          </span>
        </div>

      )}

      {error && (

        <div className="inventory-message error">
          <FaExclamationTriangle />

          <span>
            {error}
          </span>
        </div>

      )}

      {/* RESUMEN */}

      <div className="inventory-summary-grid">

        <div className="inventory-summary-card">

          <div className="inventory-summary-icon blue">
            <FaDumbbell />
          </div>

          <div>
            <span>
              Implementos
            </span>

            <strong>
              {resumen.implementos}
            </strong>
          </div>

        </div>

        <div className="inventory-summary-card">

          <div className="inventory-summary-icon navy">
            <FaBoxes />
          </div>

          <div>
            <span>
              Unidades totales
            </span>

            <strong>
              {resumen.unidades}
            </strong>
          </div>

        </div>

        <div className="inventory-summary-card">

          <div className="inventory-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Disponibles
            </span>

            <strong>
              {resumen.disponibles}
            </strong>
          </div>

        </div>

        <div className="inventory-summary-card">

          <div className="inventory-summary-icon orange">
            <FaBox />
          </div>

          <div>
            <span>
              Prestadas
            </span>

            <strong>
              {resumen.prestadas}
            </strong>
          </div>

        </div>

      </div>

      {/* FORMULARIO */}

      {mostrarFormulario && (

        <section className="inventory-form-card">

          <div className="inventory-form-header">

            <div>

              <h2>
                {implementoEditando
                  ? "Editar implemento"
                  : "Nuevo implemento"}
              </h2>

              <p>
                {implementoEditando
                  ? "Actualiza la información y existencias del implemento."
                  : "Registra un nuevo recurso deportivo en el inventario."}
              </p>

            </div>

            <button
              type="button"
              className="inventory-close-button"
              onClick={
                cerrarFormulario
              }
            >
              <FaTimes />
            </button>

          </div>

          <form
            onSubmit={
              manejarSubmit
            }
          >

            <div className="inventory-form-grid">

              <div className="inventory-field">

                <label htmlFor="inventory-name">
                  Nombre del implemento
                  <span>*</span>
                </label>

                <input
                  id="inventory-name"
                  name="nombre"
                  type="text"
                  placeholder="Ej. Balones de fútbol"
                  value={
                    formulario.nombre
                  }
                  onChange={
                    manejarCambio
                  }
                  maxLength="150"
                />

              </div>

              <div className="inventory-field">

                <label htmlFor="inventory-sport">
                  Deporte relacionado
                </label>

                <select
                  id="inventory-sport"
                  name="id_deporte"
                  value={
                    formulario.id_deporte
                  }
                  onChange={
                    manejarCambio
                  }
                >
                  <option value="">
                    Sin deporte específico
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
                        {deporte.nombre}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="inventory-field">

                <label htmlFor="inventory-total">
                  Cantidad total
                  <span>*</span>
                </label>

                <input
                  id="inventory-total"
                  name="cantidad_total"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formulario.cantidad_total
                  }
                  onChange={
                    manejarCambio
                  }
                />

              </div>

            </div>

            {implementoEditando && (

              <div className="inventory-stock-preview">

                <div>
                  <span>
                    Actualmente prestadas
                  </span>

                  <strong>
                    {cantidadPrestadaEditando}
                  </strong>
                </div>

                <div>
                  <span>
                    Disponibles después del cambio
                  </span>

                  <strong>
                    {disponibilidadProyectada ??
                      "-"}
                  </strong>
                </div>

              </div>

            )}

            <div className="inventory-form-actions">

              <button
                type="button"
                className="inventory-cancel-button"
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
                className="inventory-save-button"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : implementoEditando
                  ? "Guardar cambios"
                  : "Registrar implemento"}
              </button>

            </div>

          </form>

        </section>

      )}

      {/* FILTROS */}

      <div className="inventory-toolbar">

        <div className="inventory-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Buscar implemento o deporte..."
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
          className="inventory-filter"
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

      {/* TABLA */}

      <div className="inventory-table-card">

        {cargando ? (

          <div className="inventory-loading">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <span>
              Cargando inventario...
            </span>

          </div>

        ) : equiposFiltrados.length ===
          0 ? (

          <div className="inventory-empty">

            <FaBoxes />

            <h3>
              No se encontraron implementos
            </h3>

            <p>
              Registra un nuevo recurso
              o modifica los filtros.
            </p>

          </div>

        ) : (

          <div className="inventory-table-wrapper">

            <table className="inventory-table">

              <thead>

                <tr>
                  <th>
                    Implemento
                  </th>

                  <th>
                    Deporte
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Disponible
                  </th>

                  <th>
                    Prestado
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>

              </thead>

              <tbody>

                {equiposFiltrados.map(
                  (equipo) => {
                    const activo =
                      equipo.estado ===
                      "activo";

                    const cambiando =
                      actualizandoEstado ===
                      equipo.id_equipo;

                    const estaEliminando =
                      eliminando ===
                      equipo.id_equipo;

                    const prestamosAsociados =
                      Number(
                        equipo.prestamos_asociados
                      ) || 0;

                    const total =
                      Number(
                        equipo.cantidad_total
                      ) || 0;

                    const disponible =
                      Number(
                        equipo.cantidad_disponible
                      ) || 0;

                    const prestado =
                      Number(
                        equipo.cantidad_prestada
                      ) || 0;

                    const porcentajeDisponible =
                      total > 0
                        ? Math.min(
                            100,
                            (
                              disponible /
                              total
                            ) * 100
                          )
                        : 0;

                    return (

                      <tr
                        key={
                          equipo.id_equipo
                        }
                      >

                        <td data-label="Implemento">

                          <div className="inventory-item-cell">

                            <div className="inventory-item-icon">
                              <FaDumbbell />
                            </div>

                            <div className="inventory-item-info">

                              <strong>
                                {equipo.nombre}
                              </strong>

                              {prestamosAsociados > 0 && (

                                <small>
                                  {prestamosAsociados}
                                  {" préstamo(s) en historial"}
                                </small>

                              )}

                            </div>

                          </div>

                        </td>

                        <td data-label="Deporte">

                          <span className="inventory-sport-name">
                            {equipo.deporte ||
                              "General"}
                          </span>

                        </td>

                        <td data-label="Total">

                          <strong className="inventory-number">
                            {total}
                          </strong>

                        </td>

                        <td data-label="Disponible">

                          <div className="inventory-availability">

                            <strong>
                              {disponible}
                            </strong>

                            <div className="inventory-stock-track">

                              <div
                                style={{
                                  width:
                                    `${porcentajeDisponible}%`,
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        <td data-label="Prestado">

                          <span
                            className={`inventory-loaned ${
                              prestado > 0
                                ? "has-loans"
                                : ""
                            }`}
                          >
                            {prestado}
                          </span>

                        </td>

                        <td data-label="Estado">

                          <span
                            className={
                              activo
                                ? "inventory-status active"
                                : "inventory-status inactive"
                            }
                          >
                            {activo
                              ? "Activo"
                              : "Inactivo"}
                          </span>

                        </td>

                        <td data-label="Acciones">

                          <div className="inventory-actions">

                            <button
                              type="button"
                              className="inventory-edit-button"
                              disabled={
                                estaEliminando
                              }
                              onClick={() =>
                                abrirEditar(
                                  equipo
                                )
                              }
                            >
                              <FaEdit />
                              Editar
                            </button>

                            <button
                              type="button"
                              className={
                                activo
                                  ? "inventory-state-button deactivate"
                                  : "inventory-state-button activate"
                              }
                              disabled={
                                cambiando ||
                                estaEliminando
                              }
                              onClick={() =>
                                manejarEstado(
                                  equipo
                                )
                              }
                            >
                              <FaPowerOff />

                              {cambiando
                                ? "Procesando..."
                                : activo
                                ? "Desactivar"
                                : "Activar"}
                            </button>

                            <button
                              type="button"
                              className={`inventory-delete-button ${
                                prestamosAsociados > 0
                                  ? "protected"
                                  : ""
                              }`}
                              disabled={
                                estaEliminando
                              }
                              title={
                                prestamosAsociados > 0
                                  ? "Tiene historial de préstamos"
                                  : "Eliminar implemento"
                              }
                              onClick={() =>
                                manejarEliminar(
                                  equipo
                                )
                              }
                            >
                              <FaTrashAlt />

                              {estaEliminando
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>

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

export default InventarioPage;