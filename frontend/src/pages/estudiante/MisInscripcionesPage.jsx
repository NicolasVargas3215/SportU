import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  obtenerMisInscripciones,
} from "../../services/inscripcionService";

import "./studentPages.css";

function MisInscripcionesPage() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    inscripciones,
    setInscripciones,
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
  // CARGAR INSCRIPCIONES
  // =====================================================

  const cargarInscripciones =
    async () => {
      try {
        setCargando(true);
        setError("");

        const datos =
          await obtenerMisInscripciones();

        setInscripciones(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible consultar tus inscripciones."
        );
      } finally {
        setCargando(false);
      }
    };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarInscripciones();
  }, []);

  // =====================================================
  // NORMALIZAR ESTADO
  // =====================================================

  const normalizarEstado = (
    estado
  ) => {
    return String(
      estado || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim()
      .toLowerCase();
  };

  // =====================================================
  // RESUMEN
  // =====================================================

  const resumen = useMemo(() => {
    let pendientes = 0;
    let asistidos = 0;
    let noAsistidos = 0;

    inscripciones.forEach(
      (inscripcion) => {
        const estado =
          normalizarEstado(
            inscripcion.asistencia
          );

        if (
          estado === "asistio"
        ) {
          asistidos += 1;
        } else if (
          estado === "no asistio"
        ) {
          noAsistidos += 1;
        } else {
          pendientes += 1;
        }
      }
    );

    return {
      total:
        inscripciones.length,

      pendientes,

      asistidos,

      noAsistidos,
    };
  }, [inscripciones]);

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
  // FORMATEAR DURACIÓN
  // =====================================================

  const formatearDuracion = (
    duracion
  ) => {
    const numero =
      Number(duracion);

    if (
      Number.isNaN(numero)
    ) {
      return "0";
    }

    if (
      Number.isInteger(numero)
    ) {
      return numero;
    }

    return numero.toFixed(2);
  };

  // =====================================================
  // BADGE ASISTENCIA
  // =====================================================

  const obtenerEstadoAsistencia = (
    asistencia
  ) => {
    const estado =
      normalizarEstado(
        asistencia
      );

    if (
      estado === "asistio"
    ) {
      return (
        <span className="student-status attended">
          ✓ Asistió
        </span>
      );
    }

    if (
      estado === "no asistio"
    ) {
      return (
        <span className="student-status absent">
          ✕ No asistió
        </span>
      );
    }

    return (
      <span className="student-status pending">
        Pendiente
      </span>
    );
  };

  // =====================================================
  // ICONO DEPORTE
  // =====================================================

  const obtenerIconoDeporte = (
    deporte
  ) => {
    const nombre =
      String(
        deporte || ""
      ).toLowerCase();

    if (
      nombre.includes("fut")
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
      nombre.includes("vole")
    ) {
      return "🏐";
    }

    if (
      nombre.includes("atlet")
    ) {
      return "🏃";
    }

    if (
      nombre.includes("tenis")
    ) {
      return "🎾";
    }

    return "🏅";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="student-page">

      {/* =============================================== */}
      {/* ENCABEZADO */}
      {/* =============================================== */}

      <div className="student-page-header">

        <div>

          <h1>
            Mis inscripciones
          </h1>

          <p>
            Consulta las actividades deportivas
            en las que te encuentras registrado.
          </p>

        </div>

      </div>

      {/* =============================================== */}
      {/* ERROR */}
      {/* =============================================== */}

      {error && (

        <div className="alert alert-danger">
          {error}
        </div>

      )}

      {/* =============================================== */}
      {/* CARGANDO */}
      {/* =============================================== */}

      {cargando ? (

        <div className="student-loading-card">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <span>
            Consultando tus inscripciones...
          </span>

        </div>

      ) : (

        <>

          {/* =========================================== */}
          {/* RESUMEN */}
          {/* =========================================== */}

          <div className="student-registration-summary">

            <div className="student-summary-card">

              <div className="student-summary-icon">
                📋
              </div>

              <div>

                <small>
                  Inscripciones
                </small>

                <strong>
                  {resumen.total}
                </strong>

              </div>

            </div>

            <div className="student-summary-card">

              <div className="student-summary-icon pending">
                ⏳
              </div>

              <div>

                <small>
                  Pendientes
                </small>

                <strong>
                  {
                    resumen.pendientes
                  }
                </strong>

              </div>

            </div>

            <div className="student-summary-card">

              <div className="student-summary-icon attended">
                ✓
              </div>

              <div>

                <small>
                  Asistidas
                </small>

                <strong>
                  {
                    resumen.asistidos
                  }
                </strong>

              </div>

            </div>

            <div className="student-summary-card">

              <div className="student-summary-icon absent">
                ✕
              </div>

              <div>

                <small>
                  No asistidas
                </small>

                <strong>
                  {
                    resumen.noAsistidos
                  }
                </strong>

              </div>

            </div>

          </div>

          {/* =========================================== */}
          {/* SIN INSCRIPCIONES */}
          {/* =========================================== */}

          {inscripciones.length ===
          0 ? (

            <div className="student-empty-card">

              <div className="student-empty-symbol">
                📋
              </div>

              <h3>
                No tienes inscripciones
              </h3>

              <p>
                Cuando te inscribas en un evento
                deportivo aparecerá aquí.
              </p>

            </div>

          ) : (

            /* ========================================= */
            /* LISTADO */
            /* ========================================= */

            <div className="student-registration-list">

              {inscripciones.map(
                (
                  inscripcion
                ) => (

                  <article
                    className="student-registration-card"
                    key={
                      inscripcion.id_inscripcion
                    }
                  >

                    {/* ICONO */}

                    <div className="student-registration-sport">

                      {obtenerIconoDeporte(
                        inscripcion.deporte
                      )}

                    </div>

                    {/* EVENTO */}

                    <div className="student-registration-main">

                      <div className="student-registration-title">

                        <div>

                          <span className="student-registration-sport-name">

                            {
                              inscripcion.deporte
                            }

                          </span>

                          <h2>

                            {
                              inscripcion.evento
                            }

                          </h2>

                        </div>

                        {obtenerEstadoAsistencia(
                          inscripcion.asistencia
                        )}

                      </div>

                      {/* INFORMACIÓN */}

                      <div className="student-registration-details">

                        <div>

                          <span>
                            📅
                          </span>

                          <div>

                            <small>
                              Fecha
                            </small>

                            <strong>

                              {formatearFecha(
                                inscripcion.fecha
                              )}

                            </strong>

                          </div>

                        </div>

                        <div>

                          <span>
                            🕐
                          </span>

                          <div>

                            <small>
                              Hora
                            </small>

                            <strong>

                              {formatearHora(
                                inscripcion.hora
                              )}

                            </strong>

                          </div>

                        </div>

                        <div>

                          <span>
                            📍
                          </span>

                          <div>

                            <small>
                              Lugar
                            </small>

                            <strong>

                              {
                                inscripcion.lugar ||
                                "Por definir"
                              }

                            </strong>

                          </div>

                        </div>

                        <div>

                          <span>
                            👨‍🏫
                          </span>

                          <div>

                            <small>
                              Docente
                            </small>

                            <strong>

                              {
                                inscripcion.docente ||
                                "-"
                              }

                            </strong>

                          </div>

                        </div>

                        <div>

                          <span>
                            ⏱️
                          </span>

                          <div>

                            <small>
                              Duración
                            </small>

                            <strong>

                              {formatearDuracion(
                                inscripcion.duracion_horas
                              )}{" "}
                              hora(s)

                            </strong>

                          </div>

                        </div>

                      </div>

                      {/* PIE */}

                      <div className="student-registration-footer">

                        <span>
                          Inscripción realizada:
                        </span>

                        <strong>

                          {formatearFecha(
                            inscripcion.fecha_inscripcion
                          )}

                        </strong>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </>

      )}

    </div>
  );
}

export default MisInscripcionesPage;