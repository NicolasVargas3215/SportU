import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaCertificate,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaEye,
  FaExclamationTriangle,
  FaPrint,
  FaSearch,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";

import {
  eliminarCertificado,
  generarCertificado,
  obtenerCertificados,
  obtenerDetalleHorasEstudiante,
  obtenerEstudiantesHoras,
} from "../../services/horasService";

import "./horasPage.css";

// =====================================================
// HELPERS
// =====================================================

const convertirNumero =
  (valor) => {
    const numero =
      Number(valor);

    return Number.isFinite(
      numero
    )
      ? numero
      : 0;
  };

const formatearHoras =
  (valor) => {
    const horas =
      convertirNumero(
        valor
      );

    if (
      Number.isInteger(
        horas
      )
    ) {
      return `${horas} h`;
    }

    return `${horas
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      )} h`;
  };

const formatearFecha =
  (fecha) => {
    if (!fecha) {
      return "—";
    }

    const valor =
      String(fecha).replace(
        " ",
        "T"
      );

    const fechaObjeto =
      new Date(valor);

    if (
      Number.isNaN(
        fechaObjeto.getTime()
      )
    ) {
      return fecha;
    }

    return fechaObjeto
      .toLocaleDateString(
        "es-CO",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
  };

const formatearFechaHora =
  (fecha) => {
    if (!fecha) {
      return "—";
    }

    const valor =
      String(fecha).replace(
        " ",
        "T"
      );

    const fechaObjeto =
      new Date(valor);

    if (
      Number.isNaN(
        fechaObjeto.getTime()
      )
    ) {
      return fecha;
    }

    return fechaObjeto
      .toLocaleString(
        "es-CO",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
  };

// =====================================================
// CONTENIDO DEL CERTIFICADO
// =====================================================

function CertificadoContenido({
  certificado,
  id,
}) {
  if (!certificado) {
    return null;
  }

  return (
    <div
      id={id}
      className="hours-certificate-document"
    >

      <div className="hours-certificate-top">

        <div className="hours-certificate-logo">
          <img
            src="/logo-uniautonoma.jpg"
            alt="Uniautónoma del Cauca"
          />
        </div>

        <div className="hours-certificate-university">

          <span>
            UNIVERSIDAD AUTÓNOMA DEL CAUCA
          </span>

          <strong>
            SportU
          </strong>

          <small>
            Gestión deportiva
          </small>

        </div>

      </div>

      <div className="hours-certificate-gold-line" />

      <div className="hours-certificate-body">

        <span className="hours-certificate-label">
          CERTIFICADO
        </span>

        <h2>
          Horas deportivas
        </h2>

        <p className="hours-certificate-intro">
          El área de Deportes certifica que
        </p>

        <h3>
          {certificado.estudiante}
        </h3>

        <p className="hours-certificate-text">
          registra un total de
        </p>

        <div className="hours-certificate-hours">
          {formatearHoras(
            certificado.horas_certificadas
          )}
        </div>

        <p className="hours-certificate-text">
          de participación deportiva registradas
          en el sistema SportU.
        </p>

        <div className="hours-certificate-date">
          Generado el{" "}
          <strong>
            {formatearFechaHora(
              certificado.fecha_generacion
            )}
          </strong>
        </div>

      </div>

      <div className="hours-certificate-footer">

        <div>
          <strong>
            SportU
          </strong>

          <span>
            Sistema de Registro de Eventos Deportivos
          </span>
        </div>

        <div>
          <span>
            Certificado Nº
          </span>

          <strong>
            {certificado.id_certificado}
          </strong>
        </div>

      </div>

    </div>
  );
}

// =====================================================
// COMPONENTE
// =====================================================

function HorasPage() {
  const [
    pestana,
    setPestana,
  ] = useState(
    "horas"
  );

  const [
    estudiantes,
    setEstudiantes,
  ] = useState([]);

  const [
    certificados,
    setCertificados,
  ] = useState([]);

  const [
    detalle,
    setDetalle,
  ] = useState(null);

  const [
    estudianteSeleccionado,
    setEstudianteSeleccionado,
  ] = useState(null);

  const [
    certificadoVista,
    setCertificadoVista,
  ] = useState(null);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState(
    "todos"
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    descargandoPdf,
    setDescargandoPdf,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    exito,
    setExito,
  ] = useState("");

  const [
    porcentajeMinimo,
    setPorcentajeMinimo,
  ] = useState(85);

  // =====================================================
  // CARGAR INFORMACIÓN PRINCIPAL
  // =====================================================

  const cargarDatos =
    async () => {
      try {
        setCargando(true);
        setError("");

        const [
          datosHoras,
          datosCertificados,
        ] =
          await Promise.all([
            obtenerEstudiantesHoras(),
            obtenerCertificados(),
          ]);

        setEstudiantes(
          datosHoras.estudiantes ||
            []
        );

        setPorcentajeMinimo(
          Number(
            datosHoras.porcentaje_minimo
          ) || 85
        );

        setCertificados(
          datosCertificados.certificados ||
            []
        );
      } catch (err) {
        setError(
          err.message ||
            "No fue posible cargar la información."
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarDatos();
  }, []);

  // =====================================================
  // FILTRAR ESTUDIANTES
  // =====================================================

  const estudiantesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return estudiantes.filter(
        (estudiante) => {
          const coincideBusqueda =
            !texto ||
            estudiante.nombre
              ?.toLowerCase()
              .includes(
                texto
              ) ||
            estudiante.correo
              ?.toLowerCase()
              .includes(
                texto
              );

          let coincideFiltro =
            true;

          if (
            filtro ===
            "elegibles"
          ) {
            coincideFiltro =
              Boolean(
                estudiante.elegible_certificado
              );
          }

          if (
            filtro ===
            "no_elegibles"
          ) {
            coincideFiltro =
              !estudiante.elegible_certificado;
          }

          if (
            filtro ===
            "con_horas"
          ) {
            coincideFiltro =
              convertirNumero(
                estudiante.horas_acumuladas
              ) > 0;
          }

          return (
            coincideBusqueda &&
            coincideFiltro
          );
        }
      );
    }, [
      estudiantes,
      busqueda,
      filtro,
    ]);

  // =====================================================
  // RESUMEN GENERAL
  // =====================================================

  const resumenGeneral =
    useMemo(() => {
      const totalHoras =
        estudiantes.reduce(
          (
            acumulado,
            estudiante
          ) =>
            acumulado +
            convertirNumero(
              estudiante.horas_acumuladas
            ),
          0
        );

      const elegibles =
        estudiantes.filter(
          (estudiante) =>
            estudiante.elegible_certificado
        ).length;

      return {
        estudiantes:
          estudiantes.length,

        totalHoras,

        elegibles,

        certificados:
          certificados.length,
      };
    }, [
      estudiantes,
      certificados,
    ]);

  // =====================================================
  // VER ESTUDIANTE
  // =====================================================

  const verEstudiante =
    async (
      estudiante
    ) => {
      try {
        setError("");
        setExito("");

        setEstudianteSeleccionado(
          estudiante
        );

        setCargandoDetalle(
          true
        );

        const datos =
          await obtenerDetalleHorasEstudiante(
            estudiante.id_usuario
          );

        setDetalle(
          datos
        );
      } catch (err) {
        setError(
          err.message ||
            "No fue posible consultar al estudiante."
        );
      } finally {
        setCargandoDetalle(
          false
        );
      }
    };

  // =====================================================
  // CERRAR DETALLE
  // =====================================================

  const cerrarDetalle =
    () => {
      setDetalle(null);

      setEstudianteSeleccionado(
        null
      );
    };

  // =====================================================
  // GENERAR CERTIFICADO
  // =====================================================

  const manejarGenerarCertificado =
    async () => {
      if (
        !estudianteSeleccionado
      ) {
        return;
      }

      const confirmar =
        window.confirm(
          `¿Generar certificado de horas deportivas para ${estudianteSeleccionado.nombre}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setProcesando(true);
        setError("");
        setExito("");

        const resultado =
          await generarCertificado(
            estudianteSeleccionado.id_usuario
          );

        setExito(
          resultado.mensaje ||
            "Certificado generado correctamente."
        );

        setCertificadoVista(
          resultado.certificado
        );

        await cargarDatos();

        const datosActualizados =
          await obtenerDetalleHorasEstudiante(
            estudianteSeleccionado.id_usuario
          );

        setDetalle(
          datosActualizados
        );
      } catch (err) {
        setError(
          err.message ||
            "No fue posible generar el certificado."
        );
      } finally {
        setProcesando(false);
      }
    };

  // =====================================================
  // ELIMINAR CERTIFICADO
  // =====================================================

  const manejarEliminarCertificado =
    async (
      certificado
    ) => {
      const confirmar =
        window.confirm(
          `¿Eliminar el certificado Nº ${certificado.id_certificado} de ${certificado.estudiante}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setProcesando(true);
        setError("");
        setExito("");

        const resultado =
          await eliminarCertificado(
            certificado.id_certificado
          );

        setExito(
          resultado.mensaje ||
            "Certificado eliminado correctamente."
        );

        if (
          certificadoVista
            ?.id_certificado ===
          certificado.id_certificado
        ) {
          setCertificadoVista(
            null
          );
        }

        await cargarDatos();

        if (
          estudianteSeleccionado
        ) {
          const detalleActualizado =
            await obtenerDetalleHorasEstudiante(
              estudianteSeleccionado.id_usuario
            );

          setDetalle(
            detalleActualizado
          );
        }
      } catch (err) {
        setError(
          err.message ||
            "No fue posible eliminar el certificado."
        );
      } finally {
        setProcesando(false);
      }
    };

  // =====================================================
  // IMPRIMIR
  // =====================================================

  const imprimirCertificado =
    (certificado) => {
      setCertificadoVista(
        certificado
      );

      window.setTimeout(
        () => {
          window.print();
        },
        120
      );
    };

  const descargarCertificadoPdf =
    async (certificado) => {
      const elemento =
        document.getElementById(
          "certificate-pdf-source"
        );

      if (!elemento) {
        setError(
          "No fue posible preparar el certificado para descargarlo."
        );
        return;
      }

      try {
        setDescargandoPdf(true);
        setError("");

        const [{ jsPDF }, html2canvasModule] =
          await Promise.all([
            import("jspdf"),
            import("html2canvas"),
          ]);

        const html2canvas =
          html2canvasModule.default;

        const canvas = await html2canvas(
          elemento,
          {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          }
        );

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        const margen = 10;
        const anchoPagina =
          pdf.internal.pageSize.getWidth();
        const altoPagina =
          pdf.internal.pageSize.getHeight();
        const anchoDisponible =
          anchoPagina - margen * 2;
        const altoDisponible =
          altoPagina - margen * 2;
        const proporcion =
          canvas.width / canvas.height;
        const ancho = Math.min(
          anchoDisponible,
          altoDisponible * proporcion
        );
        const alto = ancho / proporcion;
        const x =
          (anchoPagina - ancho) / 2;
        const y =
          (altoPagina - alto) / 2;

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          x,
          y,
          ancho,
          alto,
          undefined,
          "FAST"
        );

        const nombre = String(
          certificado.estudiante ||
            "estudiante"
        )
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase();

        pdf.save(
          `certificado-horas-${nombre || "estudiante"}.pdf`
        );
      } catch (err) {
        setError(
          "No fue posible descargar el certificado en PDF."
        );
      } finally {
        setDescargandoPdf(false);
      }
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="hours-page">

      {/* HEADER */}

      <section className="hours-header">

        <div>

          <span className="hours-eyebrow">
            GESTIÓN DEPORTIVA
          </span>

          <h1>
            Horas y certificados
          </h1>

          <p>
            Consulta las horas deportivas acumuladas,
            revisa el porcentaje de asistencia y
            genera los certificados de los estudiantes.
          </p>

        </div>

        <div className="hours-rule-card">

          <FaTrophy />

          <div>
            <span>
              Requisito para certificado
            </span>

            <strong>
              {porcentajeMinimo}% de asistencia
            </strong>
          </div>

        </div>

      </section>

      {/* MENSAJES */}

      {error && (
        <div className="hours-message hours-message-error">

          <FaExclamationTriangle />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <FaTimes />
          </button>

        </div>
      )}

      {exito && (
        <div className="hours-message hours-message-success">

          <FaCheckCircle />

          <span>
            {exito}
          </span>

          <button
            type="button"
            onClick={() =>
              setExito("")
            }
          >
            <FaTimes />
          </button>

        </div>
      )}

      {/* RESUMEN */}

      <section className="hours-summary-grid">

        <article className="hours-summary-card">

          <div className="hours-summary-icon blue">
            <FaUsers />
          </div>

          <div>
            <span>
              Estudiantes
            </span>

            <strong>
              {resumenGeneral.estudiantes}
            </strong>

            <small>
              Activos registrados
            </small>
          </div>

        </article>

        <article className="hours-summary-card">

          <div className="hours-summary-icon gold">
            <FaClock />
          </div>

          <div>
            <span>
              Horas acumuladas
            </span>

            <strong>
              {formatearHoras(
                resumenGeneral.totalHoras
              )}
            </strong>

            <small>
              Asistencias confirmadas
            </small>
          </div>

        </article>

        <article className="hours-summary-card">

          <div className="hours-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Elegibles
            </span>

            <strong>
              {resumenGeneral.elegibles}
            </strong>

            <small>
              Cumplen el {porcentajeMinimo}%
            </small>
          </div>

        </article>

        <article className="hours-summary-card">

          <div className="hours-summary-icon purple">
            <FaCertificate />
          </div>

          <div>
            <span>
              Certificados
            </span>

            <strong>
              {resumenGeneral.certificados}
            </strong>

            <small>
              Generados en SportU
            </small>
          </div>

        </article>

      </section>

      {/* TABS */}

      <div className="hours-tabs">

        <button
          type="button"
          className={
            pestana === "horas"
              ? "active"
              : ""
          }
          onClick={() =>
            setPestana(
              "horas"
            )
          }
        >
          <FaClock />

          Horas deportivas
        </button>

        <button
          type="button"
          className={
            pestana ===
            "certificados"
              ? "active"
              : ""
          }
          onClick={() =>
            setPestana(
              "certificados"
            )
          }
        >
          <FaCertificate />

          Certificados generados

          <span className="hours-tab-counter">
            {certificados.length}
          </span>
        </button>

      </div>

      {/* ================================================= */}
      {/* HORAS */}
      {/* ================================================= */}

      {pestana ===
        "horas" && (
        <>
          <section className="hours-toolbar">

            <div className="hours-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Buscar estudiante por nombre o correo..."
                value={
                  busqueda
                }
                onChange={(
                  event
                ) =>
                  setBusqueda(
                    event
                      .target
                      .value
                  )
                }
              />

            </div>

            <select
              value={
                filtro
              }
              onChange={(
                event
              ) =>
                setFiltro(
                  event
                    .target
                    .value
                )
              }
            >
              <option value="todos">
                Todos los estudiantes
              </option>

              <option value="con_horas">
                Con horas acumuladas
              </option>

              <option value="elegibles">
                Elegibles para certificado
              </option>

              <option value="no_elegibles">
                No elegibles
              </option>
            </select>

          </section>

          <section className="hours-table-card">

            <div className="hours-table-heading">

              <div>

                <h2>
                  Estudiantes
                </h2>

                <p>
                  Selecciona un estudiante para
                  consultar el detalle de sus actividades.
                </p>

              </div>

              <span>
                {
                  estudiantesFiltrados.length
                } resultado(s)
              </span>

            </div>

            {cargando ? (
              <div className="hours-loading">
                Cargando información...
              </div>
            ) : estudiantesFiltrados.length ===
              0 ? (
              <div className="hours-empty">

                <FaUsers />

                <strong>
                  No se encontraron estudiantes
                </strong>

                <span>
                  Modifica la búsqueda o el filtro.
                </span>

              </div>
            ) : (
              <div className="hours-table-wrapper">

                <table className="hours-table">

                  <thead>
                    <tr>
                      <th>
                        Estudiante
                      </th>

                      <th>
                        Asistió
                      </th>

                      <th>
                        Horas
                      </th>

                      <th>
                        Asistencia
                      </th>

                      <th>
                        Certificados
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

                    {estudiantesFiltrados.map(
                      (
                        estudiante
                      ) => (
                        <tr
                          key={
                            estudiante.id_usuario
                          }
                        >

                          <td
                            data-label="Estudiante"
                          >
                            <div className="hours-student">

                              <div className="hours-student-avatar">
                                {estudiante.nombre
                                  ?.charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {
                                    estudiante.nombre
                                  }
                                </strong>

                                <span>
                                  {
                                    estudiante.correo
                                  }
                                </span>
                              </div>

                            </div>
                          </td>

                          <td
                            data-label="Asistió"
                          >
                            {
                              estudiante.eventos_asistidos
                            }{" "}
                            evento(s)
                          </td>

                          <td
                            data-label="Horas"
                          >
                            <strong className="hours-number">
                              {formatearHoras(
                                estudiante.horas_acumuladas
                              )}
                            </strong>
                          </td>

                          <td
                            data-label="Asistencia"
                          >
                            <div className="hours-percentage">

                              <strong>
                                {
                                  estudiante.porcentaje_asistencia
                                }
                                %
                              </strong>

                              <div>
                                <span
                                  style={{
                                    width: `${Math.min(
                                      estudiante.porcentaje_asistencia,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>

                            </div>
                          </td>

                          <td
                            data-label="Certificados"
                          >
                            {
                              estudiante.certificados_generados
                            }
                          </td>

                          <td
                            data-label="Estado"
                          >
                            <span
                              className={`hours-badge ${
                                estudiante.elegible_certificado
                                  ? "eligible"
                                  : "not-eligible"
                              }`}
                            >
                              {estudiante.elegible_certificado
                                ? "Elegible"
                                : "No elegible"}
                            </span>
                          </td>

                          <td
                            data-label="Acción"
                          >
                            <button
                              type="button"
                              className="hours-view-button"
                              onClick={() =>
                                verEstudiante(
                                  estudiante
                                )
                              }
                            >
                              <FaEye />

                              Ver horas
                            </button>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>
        </>
      )}

      {/* ================================================= */}
      {/* CERTIFICADOS */}
      {/* ================================================= */}

      {pestana ===
        "certificados" && (
        <section className="hours-table-card">

          <div className="hours-table-heading">

            <div>

              <h2>
                Certificados generados
              </h2>

              <p>
                Historial de certificados de horas
                deportivas generados en SportU.
              </p>

            </div>

            <span>
              {certificados.length} certificado(s)
            </span>

          </div>

          {cargando ? (
            <div className="hours-loading">
              Cargando certificados...
            </div>
          ) : certificados.length ===
            0 ? (
            <div className="hours-empty">

              <FaCertificate />

              <strong>
                No hay certificados generados
              </strong>

              <span>
                Los certificados aparecerán aquí
                cuando sean creados.
              </span>

            </div>
          ) : (
            <div className="hours-table-wrapper">

              <table className="hours-table">

                <thead>
                  <tr>
                    <th>
                      Nº
                    </th>

                    <th>
                      Estudiante
                    </th>

                    <th>
                      Horas certificadas
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {certificados.map(
                    (
                      certificado
                    ) => (
                      <tr
                        key={
                          certificado.id_certificado
                        }
                      >

                        <td
                          data-label="Nº"
                        >
                          <strong>
                            #
                            {
                              certificado.id_certificado
                            }
                          </strong>
                        </td>

                        <td
                          data-label="Estudiante"
                        >
                          <div className="hours-student">

                            <div className="hours-student-avatar certificate">
                              <FaCertificate />
                            </div>

                            <div>

                              <strong>
                                {
                                  certificado.estudiante
                                }
                              </strong>

                              <span>
                                {
                                  certificado.correo
                                }
                              </span>

                            </div>

                          </div>
                        </td>

                        <td
                          data-label="Horas"
                        >
                          <strong className="hours-number">
                            {formatearHoras(
                              certificado.horas_certificadas
                            )}
                          </strong>
                        </td>

                        <td
                          data-label="Fecha"
                        >
                          {formatearFechaHora(
                            certificado.fecha_generacion
                          )}
                        </td>

                        <td
                          data-label="Acciones"
                        >
                          <div className="hours-actions">

                            <button
                              type="button"
                              className="hours-icon-button view"
                              title="Ver certificado"
                              onClick={() =>
                                setCertificadoVista(
                                  certificado
                                )
                              }
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              className="hours-icon-button print"
                              title="Imprimir certificado"
                              onClick={() =>
                                imprimirCertificado(
                                  certificado
                                )
                              }
                            >
                              <FaPrint />
                            </button>

                            <button
                              type="button"
                              className="hours-icon-button download"
                              title="Descargar certificado en PDF"
                              onClick={() => {
                                setCertificadoVista(
                                  certificado
                                );
                                window.setTimeout(
                                  () => descargarCertificadoPdf(certificado),
                                  120
                                );
                              }}
                            >
                              <FaDownload />
                            </button>

                            <button
                              type="button"
                              className="hours-icon-button delete"
                              title="Eliminar certificado"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                manejarEliminarCertificado(
                                  certificado
                                )
                              }
                            >
                              <FaTrash />
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>
      )}

      {/* ================================================= */}
      {/* MODAL DETALLE ESTUDIANTE */}
      {/* ================================================= */}

      {estudianteSeleccionado && (
        <div
          className="hours-modal-overlay"
          onMouseDown={
            cerrarDetalle
          }
        >

          <section
            className="hours-modal hours-student-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="hours-modal-header">

              <div>

                <span>
                  DETALLE DEL ESTUDIANTE
                </span>

                <h2>
                  {
                    estudianteSeleccionado.nombre
                  }
                </h2>

                <p>
                  {
                    estudianteSeleccionado.correo
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={
                  cerrarDetalle
                }
              >
                <FaTimes />
              </button>

            </div>

            {cargandoDetalle ||
            !detalle ? (
              <div className="hours-loading modal">
                Consultando actividades...
              </div>
            ) : (
              <>

                <div className="hours-detail-summary">

                  <div>
                    <span>
                      Horas obtenidas
                    </span>

                    <strong>
                      {formatearHoras(
                        detalle.resumen.horas_acumuladas
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Horas evaluadas
                    </span>

                    <strong>
                      {formatearHoras(
                        detalle.resumen.horas_evaluadas
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Asistencia
                    </span>

                    <strong>
                      {
                        detalle.resumen.porcentaje_asistencia
                      }
                      %
                    </strong>
                  </div>

                  <div>
                    <span>
                      Eventos asistidos
                    </span>

                    <strong>
                      {
                        detalle.resumen.eventos_asistidos
                      }
                    </strong>
                  </div>

                </div>

                <div
                  className={`hours-eligibility ${
                    detalle.resumen.elegible_certificado
                      ? "eligible"
                      : "not-eligible"
                  }`}
                >

                  {detalle.resumen.elegible_certificado ? (
                    <FaCheckCircle />
                  ) : (
                    <FaExclamationTriangle />
                  )}

                  <div>

                    <strong>
                      {detalle.resumen.elegible_certificado
                        ? "Estudiante habilitado para certificado"
                        : "Estudiante todavía no habilitado"}
                    </strong>

                    <span>
                      Se requiere mínimo{" "}
                      {
                        porcentajeMinimo
                      }
                      % de asistencia y al menos una
                      actividad asistida.
                    </span>

                  </div>

                </div>

                <div className="hours-detail-title">

                  <div>

                    <FaCalendarAlt />

                    <div>
                      <strong>
                        Actividades deportivas
                      </strong>

                      <span>
                        Historial de inscripciones y asistencia
                      </span>
                    </div>

                  </div>

                </div>

                {detalle.actividades.length ===
                0 ? (
                  <div className="hours-empty compact">

                    <FaCalendarAlt />

                    <strong>
                      Sin actividades
                    </strong>

                    <span>
                      Este estudiante todavía no registra actividades.
                    </span>

                  </div>
                ) : (
                  <div className="hours-detail-table-wrapper">

                    <table className="hours-detail-table">

                      <thead>
                        <tr>
                          <th>
                            Evento
                          </th>

                          <th>
                            Fecha
                          </th>

                          <th>
                            Duración
                          </th>

                          <th>
                            Asistencia
                          </th>

                          <th>
                            Horas
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {detalle.actividades.map(
                          (
                            actividad
                          ) => (
                            <tr
                              key={
                                actividad.id_inscripcion
                              }
                            >

                              <td>
                                <strong>
                                  {
                                    actividad.evento
                                  }
                                </strong>

                                <span>
                                  {
                                    actividad.deporte ||
                                    "Actividad deportiva"
                                  }
                                </span>
                              </td>

                              <td>
                                {formatearFecha(
                                  actividad.fecha_inicio
                                )}
                              </td>

                              <td>
                                {formatearHoras(
                                  actividad.duracion_horas
                                )}
                              </td>

                              <td>
                                <span
                                  className={`hours-attendance ${
                                    actividad.asistencia ===
                                    "Asistió"
                                      ? "attended"
                                      : actividad.asistencia ===
                                        "No asistió"
                                      ? "absent"
                                      : "pending"
                                  }`}
                                >
                                  {
                                    actividad.asistencia
                                  }
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {formatearHoras(
                                    actividad.horas_obtenidas
                                  )}
                                </strong>
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

                <div className="hours-modal-footer">

                  <button
                    type="button"
                    className="hours-secondary-button"
                    onClick={
                      cerrarDetalle
                    }
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    className="hours-certificate-button"
                    disabled={
                      procesando ||
                      !detalle.resumen.elegible_certificado
                    }
                    onClick={
                      manejarGenerarCertificado
                    }
                  >
                    <FaCertificate />

                    {procesando
                      ? "Generando..."
                      : "Generar certificado"}
                  </button>

                </div>

              </>
            )}

          </section>

        </div>
      )}

      {/* ================================================= */}
      {/* MODAL CERTIFICADO */}
      {/* ================================================= */}

      {certificadoVista && (
        <div
          className="hours-modal-overlay"
          onMouseDown={() =>
            setCertificadoVista(
              null
            )
          }
        >

          <section
            className="hours-modal hours-certificate-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="hours-modal-header">

              <div>

                <span>
                  CERTIFICADO GENERADO
                </span>

                <h2>
                  Vista previa
                </h2>

                <p>
                  Certificado Nº{" "}
                  {
                    certificadoVista.id_certificado
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setCertificadoVista(
                    null
                  )
                }
              >
                <FaTimes />
              </button>

            </div>

            <CertificadoContenido
              id="certificate-pdf-source"
              certificado={
                certificadoVista
              }
            />

            <div className="hours-modal-footer">

              <button
                type="button"
                className="hours-secondary-button"
                onClick={() =>
                  setCertificadoVista(
                    null
                  )
                }
              >
                Cerrar
              </button>

              <button
                type="button"
                className="hours-certificate-button"
                disabled={descargandoPdf}
                onClick={() =>
                  descargarCertificadoPdf(
                    certificadoVista
                  )
                }
              >
                <FaDownload />

                {descargandoPdf
                  ? "Preparando PDF..."
                  : "Descargar PDF"}
              </button>

              <button
                type="button"
                className="hours-certificate-button print"
                onClick={() =>
                  imprimirCertificado(
                    certificadoVista
                  )
                }
              >
                <FaPrint />

                Imprimir
              </button>

            </div>

          </section>

        </div>
      )}

      {/* ================================================= */}
      {/* ZONA EXCLUSIVA DE IMPRESIÓN */}
      {/* ================================================= */}

      {certificadoVista && (
        <div className="hours-certificate-print">

          <CertificadoContenido
            certificado={
              certificadoVista
            }
          />

        </div>
      )}

    </div>
  );
}

export default HorasPage;
