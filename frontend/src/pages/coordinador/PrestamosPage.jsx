import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaCheckCircle,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaHistory,
  FaSearch,
  FaUndoAlt,
  FaUser,
} from "react-icons/fa";

import {
  obtenerPrestamos,
  obtenerOpcionesPrestamo,
  registrarPrestamo,
  registrarDevolucion,
} from "../../services/prestamoService";

import "./prestamosPage.css";

function PrestamosPage() {
  // =====================================================
  // DATOS
  // =====================================================

  const [
    prestamos,
    setPrestamos,
  ] = useState([]);

  const [
    equipos,
    setEquipos,
  ] = useState([]);

  const [
    usuarios,
    setUsuarios,
  ] = useState([]);

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [
    formulario,
    setFormulario,
  ] = useState({
    id_equipo: "",
    id_usuario: "",
    cantidad: 1,
  });

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
    devolviendo,
    setDevolviendo,
  ] = useState(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState("todos");

  const [
    fechaDesde,
    setFechaDesde,
  ] = useState("");

  const [
    fechaHasta,
    setFechaHasta,
  ] = useState("");

  // =====================================================
  // CARGAR INFORMACIÓN
  // =====================================================

  const cargarInformacion =
    async () => {
      try {
        setCargando(true);
        setError("");

        const [
          datosPrestamos,
          opciones,
        ] = await Promise.all([
          obtenerPrestamos(),
          obtenerOpcionesPrestamo(),
        ]);

        setPrestamos(
          Array.isArray(
            datosPrestamos
          )
            ? datosPrestamos
            : []
        );

        setEquipos(
          Array.isArray(
            opciones.equipos
          )
            ? opciones.equipos
            : []
        );

        setUsuarios(
          Array.isArray(
            opciones.usuarios
          )
            ? opciones.usuarios
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible cargar la información de préstamos."
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

        [name]:
          name === "cantidad"
            ? Number(value)
            : value,
      })
    );

    setMensaje("");
    setError("");
  };

  // =====================================================
  // USUARIO SELECCIONADO
  // =====================================================

  const usuarioSeleccionado =
    useMemo(() => {
      return usuarios.find(
        (usuario) =>
          String(
            usuario.id_usuario
          ) ===
          String(
            formulario.id_usuario
          )
      );
    }, [
      usuarios,
      formulario.id_usuario,
    ]);

  // =====================================================
  // IMPLEMENTO SELECCIONADO
  // =====================================================

  const equipoSeleccionado =
    useMemo(() => {
      return equipos.find(
        (equipo) =>
          String(
            equipo.id_equipo
          ) ===
          String(
            formulario.id_equipo
          )
      );
    }, [
      equipos,
      formulario.id_equipo,
    ]);

  // =====================================================
  // REGISTRAR PRÉSTAMO
  // =====================================================

  const manejarPrestamo =
    async (event) => {
      event.preventDefault();

      setMensaje("");
      setError("");

      if (
        !formulario.id_usuario
      ) {
        setError(
          "Selecciona un usuario."
        );

        return;
      }

      if (
        usuarioSeleccionado
          ?.tiene_prestamo_activo
      ) {
        setError(
          "Este usuario ya tiene un préstamo activo. Debe registrar la devolución antes de realizar otro préstamo."
        );

        return;
      }

      if (
        !formulario.id_equipo
      ) {
        setError(
          "Selecciona un implemento."
        );

        return;
      }

      const cantidad =
        Number(
          formulario.cantidad
        );

      if (
        !Number.isInteger(
          cantidad
        ) ||
        cantidad <= 0
      ) {
        setError(
          "La cantidad debe ser un número entero mayor que cero."
        );

        return;
      }

      if (
        equipoSeleccionado &&
        cantidad >
          Number(
            equipoSeleccionado.cantidad_disponible
          )
      ) {
        setError(
          `Solo existen ${equipoSeleccionado.cantidad_disponible} unidad(es) disponibles.`
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Registrar préstamo de ${cantidad} unidad(es) de "${equipoSeleccionado?.nombre}" a ${usuarioSeleccionado?.nombre}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setGuardando(true);

        const resultado =
          await registrarPrestamo({
            id_equipo:
              Number(
                formulario.id_equipo
              ),

            id_usuario:
              Number(
                formulario.id_usuario
              ),

            cantidad,
          });

        setMensaje(
          resultado.mensaje ||
            "Préstamo registrado correctamente."
        );

        setFormulario({
          id_equipo: "",
          id_usuario: "",
          cantidad: 1,
        });

        await cargarInformacion();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible registrar el préstamo."
        );
      } finally {
        setGuardando(false);
      }
    };

  // =====================================================
  // DEVOLUCIÓN
  // =====================================================

  const manejarDevolucion =
    async (prestamo) => {
      const confirmar =
        window.confirm(
          `¿Registrar la devolución de "${prestamo.equipo}" por parte de ${prestamo.usuario}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setDevolviendo(
          prestamo.id_prestamo
        );

        setMensaje("");
        setError("");

        const resultado =
          await registrarDevolucion(
            prestamo.id_prestamo
          );

        setMensaje(
          resultado.mensaje ||
            "Devolución registrada correctamente."
        );

        await cargarInformacion();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible registrar la devolución."
        );
      } finally {
        setDevolviendo(
          null
        );
      }
    };

  // =====================================================
  // FORMATEAR FECHA
  // =====================================================

  const formatearFecha = (
    valor
  ) => {
    if (!valor) {
      return "-";
    }

    const fecha =
      new Date(
        String(valor).replace(
          " ",
          "T"
        )
      );

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return valor;
    }

    return fecha.toLocaleString(
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

  // =====================================================
  // PRÉSTAMOS FILTRADOS
  // =====================================================

  const prestamosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return prestamos.filter(
        (prestamo) => {
          const estado =
            String(
              prestamo.estado ||
                ""
            ).toLowerCase();

          const coincideEstado =
            filtro === "todos" ||
            estado === filtro;

          const coincideBusqueda =
            !texto ||
            String(
              prestamo.usuario ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              prestamo.correo ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              prestamo.equipo ||
                ""
            )
              .toLowerCase()
              .includes(texto) ||
            String(
              prestamo.rol ||
                ""
            )
              .toLowerCase()
              .includes(texto);

          const fechaPrestamo = String(
            prestamo.fecha_prestamo || ""
          ).slice(0, 10);

          const coincideFechaDesde =
            !fechaDesde ||
            fechaPrestamo >= fechaDesde;

          const coincideFechaHasta =
            !fechaHasta ||
            fechaPrestamo <= fechaHasta;

          return (
            coincideEstado &&
            coincideBusqueda &&
            coincideFechaDesde &&
            coincideFechaHasta
          );
        }
      );
    }, [
      prestamos,
      busqueda,
      filtro,
      fechaDesde,
      fechaHasta,
    ]);

  // =====================================================
  // RESUMEN
  // =====================================================

  const resumen =
    useMemo(() => {
      const activos =
        prestamos.filter(
          (prestamo) =>
            String(
              prestamo.estado
            ).toLowerCase() ===
            "prestado"
        );

      const devueltos =
        prestamos.filter(
          (prestamo) =>
            String(
              prestamo.estado
            ).toLowerCase() ===
            "devuelto"
        );

      const unidadesActivas =
        activos.reduce(
          (
            acumulado,
            prestamo
          ) =>
            acumulado +
            (
              Number(
                prestamo.cantidad
              ) || 0
            ),
          0
        );

      return {
        total:
          prestamos.length,

        activos:
          activos.length,

        devueltos:
          devueltos.length,

        unidadesActivas,
      };
    }, [prestamos]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="loans-admin-page">

      {/* =============================================== */}
      {/* ENCABEZADO */}
      {/* =============================================== */}

      <div className="loans-header">

        <div>

          <span className="loans-section-label">
            Control de implementos
          </span>

          <h1>
            Préstamos y devoluciones
          </h1>

          <p>
            Administra la entrega y devolución
            de implementos deportivos.
          </p>

        </div>

      </div>

      {/* =============================================== */}
      {/* MENSAJES */}
      {/* =============================================== */}

      {mensaje && (
        <div className="loans-message success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="loans-message error">
          <FaExclamationTriangle />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* =============================================== */}
      {/* RESUMEN */}
      {/* =============================================== */}

      <div className="loans-summary-grid">

        <div className="loans-summary-card">

          <div className="loan-summary-icon blue">
            <FaHistory />
          </div>

          <div>
            <span>
              Total préstamos
            </span>

            <strong>
              {resumen.total}
            </strong>
          </div>

        </div>

        <div className="loans-summary-card">

          <div className="loan-summary-icon orange">
            <FaExchangeAlt />
          </div>

          <div>
            <span>
              Préstamos activos
            </span>

            <strong>
              {resumen.activos}
            </strong>
          </div>

        </div>

        <div className="loans-summary-card">

          <div className="loan-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Devueltos
            </span>

            <strong>
              {resumen.devueltos}
            </strong>
          </div>

        </div>

        <div className="loans-summary-card">

          <div className="loan-summary-icon cyan">
            <FaBoxOpen />
          </div>

          <div>
            <span>
              Unidades prestadas
            </span>

            <strong>
              {resumen.unidadesActivas}
            </strong>
          </div>

        </div>

      </div>

      {/* =============================================== */}
      {/* NUEVO PRÉSTAMO */}
      {/* =============================================== */}

      <section className="loan-form-card">

        <div className="loan-card-heading">

          <div className="loan-heading-icon">
            <FaExchangeAlt />
          </div>

          <div>

            <h2>
              Registrar nuevo préstamo
            </h2>

            <p>
              Un usuario solo puede tener
              un préstamo activo al mismo tiempo.
            </p>

          </div>

        </div>

        <form
          onSubmit={
            manejarPrestamo
          }
        >

          <div className="loan-form-grid">

            {/* USUARIO */}

            <div className="loan-field">

              <label htmlFor="id_usuario">
                <FaUser />
                Usuario
              </label>

              <select
                id="id_usuario"
                name="id_usuario"
                value={
                  formulario.id_usuario
                }
                onChange={
                  manejarCambio
                }
              >
                <option value="">
                  Seleccionar usuario
                </option>

                {usuarios.map(
                  (usuario) => (
                    <option
                      key={
                        usuario.id_usuario
                      }
                      value={
                        usuario.id_usuario
                      }
                      disabled={
                        usuario.tiene_prestamo_activo
                      }
                    >
                      {usuario.nombre}
                      {" — "}
                      {usuario.rol}
                      {usuario.tiene_prestamo_activo
                        ? " — Préstamo activo"
                        : ""}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* IMPLEMENTO */}

            <div className="loan-field">

              <label htmlFor="id_equipo">
                <FaBoxOpen />
                Implemento
              </label>

              <select
                id="id_equipo"
                name="id_equipo"
                value={
                  formulario.id_equipo
                }
                onChange={
                  manejarCambio
                }
              >
                <option value="">
                  Seleccionar implemento
                </option>

                {equipos.map(
                  (equipo) => (
                    <option
                      key={
                        equipo.id_equipo
                      }
                      value={
                        equipo.id_equipo
                      }
                    >
                      {equipo.nombre}
                      {" — "}
                      {equipo.cantidad_disponible}
                      {" disponible(s)"}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* CANTIDAD */}

            <div className="loan-field">

              <label htmlFor="cantidad">
                Cantidad
              </label>

              <input
                id="cantidad"
                name="cantidad"
                type="number"
                min="1"
                step="1"
                value={
                  formulario.cantidad
                }
                onChange={
                  manejarCambio
                }
              />

            </div>

            {/* BOTÓN */}

            <div className="loan-submit-container">

              <button
                type="submit"
                className="loan-submit-button"
                disabled={
                  guardando ||
                  usuarioSeleccionado
                    ?.tiene_prestamo_activo
                }
              >
                <FaExchangeAlt />

                {guardando
                  ? "Registrando..."
                  : "Registrar préstamo"}
              </button>

            </div>

          </div>

          {/* INFORMACIÓN USUARIO */}

          {usuarioSeleccionado
            ?.tiene_prestamo_activo && (

            <div className="loan-user-warning">

              <FaExclamationTriangle />

              <div>

                <strong>
                  Usuario no disponible
                </strong>

                <p>
                  {usuarioSeleccionado.nombre}
                  {" "}
                  ya tiene un préstamo activo
                  y debe realizar la devolución
                  antes de recibir otro implemento.
                </p>

              </div>

            </div>

          )}

          {/* DISPONIBILIDAD */}

          {equipoSeleccionado && (

            <div className="loan-equipment-info">

              <FaBoxOpen />

              <span>
                Disponibilidad actual:
              </span>

              <strong>
                {
                  equipoSeleccionado.cantidad_disponible
                }
                {" "}
                unidad(es)
              </strong>

            </div>

          )}

        </form>

      </section>

      {/* =============================================== */}
      {/* HISTORIAL */}
      {/* =============================================== */}

      <section className="loans-history-card">

        <div className="loans-toolbar">

          <div>

            <h2>
              Historial de préstamos
            </h2>

            <p>
              Consulta préstamos activos
              y devoluciones registradas.
            </p>

          </div>

          <div className="loans-toolbar-controls">

            <div className="loans-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Buscar usuario o implemento..."
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
              value={filtro}
              onChange={(
                event
              ) =>
                setFiltro(
                  event.target.value
                )
              }
              className="loans-filter"
            >
              <option value="todos">
                Todos
              </option>

              <option value="prestado">
                Activos
              </option>

              <option value="devuelto">
                Devueltos
              </option>

            </select>

            <label className="loans-date-filter">
              <span>Desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(event) =>
                  setFechaDesde(event.target.value)
                }
              />
            </label>

            <label className="loans-date-filter">
              <span>Hasta</span>
              <input
                type="date"
                min={fechaDesde || undefined}
                value={fechaHasta}
                onChange={(event) =>
                  setFechaHasta(event.target.value)
                }
              />
            </label>

            {(fechaDesde || fechaHasta) && (
              <button
                type="button"
                className="loans-clear-filter"
                onClick={() => {
                  setFechaDesde("");
                  setFechaHasta("");
                }}
              >
                Limpiar
              </button>
            )}

          </div>

        </div>

        {cargando ? (

          <div className="loans-loading">

            <div
              className="spinner-border text-primary"
              role="status"
            />

            <span>
              Cargando préstamos...
            </span>

          </div>

        ) : prestamosFiltrados.length ===
          0 ? (

          <div className="loans-empty">

            <FaHistory />

            <h3>
              No se encontraron préstamos
            </h3>

            <p>
              No existen registros
              que coincidan con los filtros.
            </p>

          </div>

        ) : (

          <div className="loans-table-wrapper">

            <table className="loans-table">

              <thead>

                <tr>
                  <th>
                    Usuario
                  </th>

                  <th>
                    Implemento
                  </th>

                  <th>
                    Cantidad
                  </th>

                  <th>
                    Préstamo
                  </th>

                  <th>
                    Devolución
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acción
                  </th>
                </tr>

              </thead>

              <tbody>

                {prestamosFiltrados.map(
                  (prestamo) => {
                    const activo =
                      String(
                        prestamo.estado
                      ).toLowerCase() ===
                      "prestado";

                    return (

                      <tr
                        key={
                          prestamo.id_prestamo
                        }
                      >

                        <td data-label="Usuario">

                          <div className="loan-user-cell">

                            <div className="loan-user-avatar">
                              {String(
                                prestamo.usuario ||
                                  "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  prestamo.usuario
                                }
                              </strong>

                              <span>
                                {
                                  prestamo.correo
                                }
                              </span>

                              <small>
                                {
                                  prestamo.rol
                                }
                              </small>

                            </div>

                          </div>

                        </td>

                        <td data-label="Implemento">

                          <strong className="loan-equipment-name">
                            {
                              prestamo.equipo
                            }
                          </strong>

                        </td>

                        <td data-label="Cantidad">

                          <span className="loan-quantity">
                            {
                              prestamo.cantidad
                            }
                          </span>

                        </td>

                        <td data-label="Préstamo">
                          {formatearFecha(
                            prestamo.fecha_prestamo
                          )}
                        </td>

                        <td data-label="Devolución">
                          {formatearFecha(
                            prestamo.fecha_devolucion
                          )}
                        </td>

                        <td data-label="Estado">

                          <span
                            className={
                              activo
                                ? "loan-status active"
                                : "loan-status returned"
                            }
                          >
                            {activo
                              ? "Prestado"
                              : "Devuelto"}
                          </span>

                        </td>

                        <td data-label="Acción">

                          {activo ? (

                            <button
                              type="button"
                              className="loan-return-button"
                              disabled={
                                devolviendo ===
                                prestamo.id_prestamo
                              }
                              onClick={() =>
                                manejarDevolucion(
                                  prestamo
                                )
                              }
                            >
                              <FaUndoAlt />

                              {devolviendo ===
                              prestamo.id_prestamo
                                ? "Procesando..."
                                : "Devolver"}
                            </button>

                          ) : (

                            <span className="loan-completed-text">
                              <FaCheckCircle />
                              Completado
                            </span>

                          )}

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}

export default PrestamosPage;
