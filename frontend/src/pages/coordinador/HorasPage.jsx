import {
  useEffect,
  useState,
} from "react";

import {
  obtenerEstudiantes,
  obtenerHorasEstudiante,
  obtenerCertificadosEstudiante,
  generarCertificado,
  eliminarCertificado,
} from "../../services/horasService";

function HorasPage() {
  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    estudiantes,
    setEstudiantes,
  ] = useState([]);

  const [
    idEstudiante,
    setIdEstudiante,
  ] = useState("");

  const [
    estudiante,
    setEstudiante,
  ] = useState(null);

  const [
    actividades,
    setActividades,
  ] = useState([]);

  const [
    certificados,
    setCertificados,
  ] = useState([]);

  const [
    certificadoSeleccionado,
    setCertificadoSeleccionado,
  ] = useState(null);

  const [
    totalHoras,
    setTotalHoras,
  ] = useState(0);

  const [
    horasEvaluadas,
    setHorasEvaluadas,
  ] = useState(0);

  const [
    porcentajeAsistencia,
    setPorcentajeAsistencia,
  ] = useState(0);

  const [
    porcentajeMinimo,
    setPorcentajeMinimo,
  ] = useState(85);

  const [
    puedeGenerarCertificado,
    setPuedeGenerarCertificado,
  ] = useState(false);

  const [
    cargandoEstudiantes,
    setCargandoEstudiantes,
  ] = useState(true);

  const [
    cargandoInformacion,
    setCargandoInformacion,
  ] = useState(false);

  const [
    generando,
    setGenerando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // =====================================================
  // CARGAR ESTUDIANTES
  // =====================================================

  const cargarEstudiantes = async () => {
    try {
      setCargandoEstudiantes(true);
      setError("");

      const datos =
        await obtenerEstudiantes();

      setEstudiantes(
        Array.isArray(datos)
          ? datos
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar los estudiantes"
      );
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  // =====================================================
  // LIMPIAR INFORMACIÓN
  // =====================================================

  const limpiarInformacion = () => {
    setEstudiante(null);

    setActividades([]);

    setCertificados([]);

    setCertificadoSeleccionado(
      null
    );

    setTotalHoras(0);

    setHorasEvaluadas(0);

    setPorcentajeAsistencia(0);

    setPorcentajeMinimo(85);

    setPuedeGenerarCertificado(
      false
    );

    setMensaje("");

    setError("");
  };

  // =====================================================
  // CAMBIO DE ESTUDIANTE
  // =====================================================

  const manejarCambioEstudiante = (
    event
  ) => {
    const value =
      event.target.value;

    setIdEstudiante(value);

    limpiarInformacion();
  };

  // =====================================================
  // BUSCAR ESTUDIANTE
  // =====================================================

  const buscarEstudiante = async () => {
    if (!idEstudiante) {
      setError(
        "Debes seleccionar un estudiante."
      );

      return;
    }

    try {
      setCargandoInformacion(true);

      setError("");

      setMensaje("");

      const [
        datosHoras,
        datosCertificados,
      ] = await Promise.all([
        obtenerHorasEstudiante(
          idEstudiante
        ),

        obtenerCertificadosEstudiante(
          idEstudiante
        ),
      ]);

      setEstudiante(
        datosHoras.estudiante ||
          null
      );

      setActividades(
        Array.isArray(
          datosHoras.actividades
        )
          ? datosHoras.actividades
          : []
      );

      setTotalHoras(
        Number(
          datosHoras.total_horas
        ) || 0
      );

      setHorasEvaluadas(
        Number(
          datosHoras.horas_evaluadas
        ) || 0
      );

      setPorcentajeAsistencia(
        Number(
          datosHoras.porcentaje_asistencia
        ) || 0
      );

      setPorcentajeMinimo(
        Number(
          datosHoras.porcentaje_minimo
        ) || 85
      );

      setPuedeGenerarCertificado(
        Boolean(
          datosHoras.puede_generar_certificado
        )
      );

      setCertificados(
        Array.isArray(
          datosCertificados
        )
          ? datosCertificados
          : []
      );

      setCertificadoSeleccionado(
        null
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible consultar la información del estudiante"
      );

      setEstudiante(null);

      setActividades([]);

      setCertificados([]);

      setCertificadoSeleccionado(
        null
      );

      setTotalHoras(0);

      setHorasEvaluadas(0);

      setPorcentajeAsistencia(0);

      setPuedeGenerarCertificado(
        false
      );
    } finally {
      setCargandoInformacion(false);
    }
  };

  // =====================================================
  // GENERAR CERTIFICADO
  // =====================================================

  const manejarGenerarCertificado =
    async () => {
      if (!idEstudiante) {
        setError(
          "Debes seleccionar un estudiante."
        );

        return;
      }

      if (totalHoras <= 0) {
        setError(
          "El estudiante no tiene horas deportivas asistidas."
        );

        return;
      }

      if (
        porcentajeAsistencia <
        porcentajeMinimo
      ) {
        setError(
          `El estudiante tiene ${formatearPorcentaje(
            porcentajeAsistencia
          )}% de asistencia y debe cumplir como mínimo con el ${porcentajeMinimo}%.`
        );

        return;
      }

      if (
        !puedeGenerarCertificado
      ) {
        setError(
          "El estudiante no cumple los requisitos para generar el certificado."
        );

        return;
      }

      const confirmar =
        window.confirm(
          `¿Deseas generar un certificado por ${formatearHoras(
            totalHoras
          )} hora(s) deportivas?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setGenerando(true);

        setError("");

        setMensaje("");

        const resultado =
          await generarCertificado(
            idEstudiante
          );

        setMensaje(
          "Certificado generado correctamente."
        );

        if (
          resultado?.certificado
        ) {
          setCertificadoSeleccionado(
            resultado.certificado
          );
        }

        const certificadosActualizados =
          await obtenerCertificadosEstudiante(
            idEstudiante
          );

        setCertificados(
          Array.isArray(
            certificadosActualizados
          )
            ? certificadosActualizados
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible generar el certificado"
        );
      } finally {
        setGenerando(false);
      }
    };

  // =====================================================
  // VER CERTIFICADO
  // =====================================================

  const verCertificado = (
    certificado
  ) => {
    setCertificadoSeleccionado(
      certificado
    );

    setError("");

    setMensaje("");
  };

  // =====================================================
  // CERRAR CERTIFICADO
  // =====================================================

  const cerrarCertificado = () => {
    setCertificadoSeleccionado(
      null
    );
  };

  // =====================================================
  // ELIMINAR CERTIFICADO
  // =====================================================

  const manejarEliminarCertificado =
    async (idCertificado) => {
      const confirmar =
        window.confirm(
          "¿Seguro que deseas eliminar este certificado? Esta acción no se puede deshacer."
        );

      if (!confirmar) {
        return;
      }

      try {
        setError("");

        setMensaje("");

        await eliminarCertificado(
          idEstudiante,
          idCertificado
        );

        setMensaje(
          "Certificado eliminado correctamente."
        );

        if (
          certificadoSeleccionado?.id_certificado ===
          idCertificado
        ) {
          setCertificadoSeleccionado(
            null
          );
        }

        const certificadosActualizados =
          await obtenerCertificadosEstudiante(
            idEstudiante
          );

        setCertificados(
          Array.isArray(
            certificadosActualizados
          )
            ? certificadosActualizados
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No fue posible eliminar el certificado"
        );
      }
    };

  // =====================================================
  // FORMATEAR FECHA
  // =====================================================

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return "-";
    }

    const fechaTexto =
      String(fecha).substring(
        0,
        10
      );

    const partes =
      fechaTexto.split("-");

    if (partes.length !== 3) {
      return fechaTexto;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // =====================================================
  // FORMATEAR HORAS
  // =====================================================

  const formatearHoras = (
    horas
  ) => {
    const numero =
      Number(horas);

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
  // FORMATEAR PORCENTAJE
  // =====================================================

  const formatearPorcentaje = (
    porcentaje
  ) => {
    const numero =
      Number(porcentaje);

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

  const obtenerBadgeAsistencia = (
    asistencia
  ) => {
    const estado =
      String(
        asistencia || ""
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase();

    if (
      estado.includes(
        "no asist"
      )
    ) {
      return (
        <span className="badge bg-danger">
          No asistió
        </span>
      );
    }

    if (
      estado.includes(
        "asisti"
      )
    ) {
      return (
        <span className="badge bg-success">
          Asistió
        </span>
      );
    }

    return (
      <span className="badge bg-secondary">
        Pendiente
      </span>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="container-fluid py-4">

      {/* ENCABEZADO */}

      <div className="mb-4">

        <h2 className="mb-1">
          Horas deportivas
        </h2>

        <p className="text-muted mb-0">
          Consulta las horas acumuladas,
          porcentaje de asistencia y
          certificados de los estudiantes.
        </p>

      </div>

      {/* MENSAJES */}

      {mensaje && (
        <div
          className="alert alert-success"
          role="alert"
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* SELECCIONAR ESTUDIANTE */}

      <div className="card shadow-sm mb-4">

        <div className="card-body">

          <h5 className="card-title mb-3">
            Consultar estudiante
          </h5>

          <div className="row align-items-end">

            <div className="col-md-9">

              <label
                htmlFor="estudiante"
                className="form-label"
              >
                Estudiante
              </label>

              <select
                id="estudiante"
                className="form-select"
                value={
                  idEstudiante
                }
                onChange={
                  manejarCambioEstudiante
                }
                disabled={
                  cargandoEstudiantes
                }
              >

                <option value="">
                  {cargandoEstudiantes
                    ? "Cargando estudiantes..."
                    : "Seleccionar estudiante"}
                </option>

                {estudiantes.map(
                  (item) => (
                    <option
                      key={
                        item.id_usuario
                      }
                      value={
                        item.id_usuario
                      }
                    >
                      {item.nombre}
                      {" - "}
                      {item.correo}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="col-md-3 mt-3 mt-md-0">

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={
                  buscarEstudiante
                }
                disabled={
                  !idEstudiante ||
                  cargandoInformacion
                }
              >
                {cargandoInformacion
                  ? "Consultando..."
                  : "Buscar"}
              </button>

            </div>

          </div>

        </div>

      </div>

      {estudiante && (
        <>

          {/* RESUMEN */}

          <div className="row mb-4">

            <div className="col-lg-6 mb-3 mb-lg-0">

              <div className="card shadow-sm h-100">

                <div className="card-body">

                  <small className="text-muted">
                    Estudiante
                  </small>

                  <h4 className="mb-1">
                    {
                      estudiante.nombre
                    }
                  </h4>

                  <p className="text-muted mb-0">
                    {
                      estudiante.correo
                    }
                  </p>

                </div>

              </div>

            </div>

            <div className="col-lg-3 col-md-6 mb-3 mb-md-0">

              <div className="card shadow-sm h-100">

                <div className="card-body text-center">

                  <small className="text-muted">
                    Horas asistidas
                  </small>

                  <h2 className="mt-2 mb-0">
                    {formatearHoras(
                      totalHoras
                    )}
                  </h2>

                  <span className="text-muted">
                    de{" "}
                    {formatearHoras(
                      horasEvaluadas
                    )}{" "}
                    evaluadas
                  </span>

                </div>

              </div>

            </div>

            <div className="col-lg-3 col-md-6">

              <div className="card shadow-sm h-100">

                <div className="card-body text-center">

                  <small className="text-muted">
                    Asistencia
                  </small>

                  <h2 className="mt-2 mb-1">
                    {formatearPorcentaje(
                      porcentajeAsistencia
                    )}
                    %
                  </h2>

                  {puedeGenerarCertificado ? (
                    <span className="badge bg-success">
                      Cumple requisito
                    </span>
                  ) : (
                    <span className="badge bg-danger">
                      Mínimo{" "}
                      {porcentajeMinimo}%
                    </span>
                  )}

                </div>

              </div>

            </div>

          </div>

          {/* ACTIVIDADES */}

          <div className="card shadow-sm mb-4">

            <div className="card-header bg-white">

              <h5 className="mb-0">
                Actividades deportivas
              </h5>

            </div>

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

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
                        Horas obtenidas
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {actividades.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="text-center py-4 text-muted"
                        >
                          El estudiante no
                          tiene actividades
                          registradas.
                        </td>

                      </tr>

                    ) : (

                      actividades.map(
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

                              {actividad.lugar && (
                                <>
                                  <br />

                                  <small className="text-muted">
                                    {
                                      actividad.lugar
                                    }
                                  </small>
                                </>
                              )}

                            </td>

                            <td>
                              {formatearFecha(
                                actividad.fecha
                              )}
                            </td>

                            <td>
                              {formatearHoras(
                                actividad.duracion_horas
                              )}
                              {" h"}
                            </td>

                            <td>
                              {obtenerBadgeAsistencia(
                                actividad.asistencia
                              )}
                            </td>

                            <td>

                              <strong>
                                {formatearHoras(
                                  actividad.horas_obtenidas
                                )}
                              </strong>

                              {" h"}

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

          {/* CERTIFICADOS */}

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div>

              <h4 className="mb-1">
                Certificados
              </h4>

              <p className="text-muted mb-0">
                Se requiere mínimo{" "}
                {porcentajeMinimo}% de
                asistencia y más de 0 horas.
              </p>

            </div>

            <button
              type="button"
              className="btn btn-warning"
              onClick={
                manejarGenerarCertificado
              }
              disabled={
                generando ||
                !puedeGenerarCertificado
              }
            >
              {generando
                ? "Generando..."
                : "Generar certificado"}
            </button>

          </div>

          {!puedeGenerarCertificado && (
            <div className="alert alert-warning">

              {totalHoras <= 0
                ? "El estudiante todavía no tiene horas deportivas asistidas y no puede generar un certificado."
                : `El estudiante tiene ${formatearPorcentaje(
                    porcentajeAsistencia
                  )}% de asistencia. Se requiere mínimo ${porcentajeMinimo}%.`}

            </div>
          )}

          {/* TABLA CERTIFICADOS */}

          <div className="card shadow-sm mb-4">

            <div className="card-body p-0">

              <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">

                    <tr>

                      <th>
                        #
                      </th>

                      <th>
                        Estudiante
                      </th>

                      <th>
                        Horas certificadas
                      </th>

                      <th>
                        Fecha de generación
                      </th>

                      <th>
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {certificados.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="text-center py-4 text-muted"
                        >
                          No existen
                          certificados
                          generados.
                        </td>

                      </tr>

                    ) : (

                      certificados.map(
                        (
                          certificado
                        ) => (

                          <tr
                            key={
                              certificado.id_certificado
                            }
                          >

                            <td>
                              {
                                certificado.id_certificado
                              }
                            </td>

                            <td>

                              <div>
                                {
                                  certificado.estudiante
                                }
                              </div>

                              <small className="text-muted">
                                {
                                  certificado.correo
                                }
                              </small>

                            </td>

                            <td>

                              {formatearHoras(
                                certificado.horas_certificadas
                              )}
                              {" h"}

                            </td>

                            <td>
                              {formatearFecha(
                                certificado.fecha_generacion
                              )}
                            </td>

                            <td>

                              <div className="d-flex gap-2">

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() =>
                                    verCertificado(
                                      certificado
                                    )
                                  }
                                >
                                  Ver
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    manejarEliminarCertificado(
                                      certificado.id_certificado
                                    )
                                  }
                                >
                                  Eliminar
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </>
      )}

      {/* VISTA DEL CERTIFICADO */}

      {certificadoSeleccionado && (

        <div className="card shadow-lg border-0 mb-4">

          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">

            <span>
              Vista del certificado
            </span>

            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={
                cerrarCertificado
              }
            >
              Cerrar
            </button>

          </div>

          <div className="card-body p-4 p-md-5">

            <div
              className="border rounded p-4 p-md-5 text-center"
              style={{
                maxWidth: "900px",
                margin: "0 auto",
                minHeight: "480px",
              }}
            >

              <div className="mb-4">

                <h2 className="fw-bold mb-1">
                  SPORTU
                </h2>

                <p className="text-muted mb-0">
                  Sistema de Registro de Eventos Deportivos
                </p>

              </div>

              <hr />

              <div className="my-5">

                <h3 className="fw-bold">
                  CERTIFICADO DE HORAS DEPORTIVAS
                </h3>

              </div>

              <p className="fs-5">
                Se certifica que:
              </p>

              <h2 className="fw-bold mb-3">

                {
                  certificadoSeleccionado.estudiante
                }

              </h2>

              {certificadoSeleccionado.correo && (

                <p className="text-muted mb-4">

                  {
                    certificadoSeleccionado.correo
                  }

                </p>

              )}

              <p className="fs-5">
                ha acumulado un total de
              </p>

              <div className="my-4">

                <span className="display-4 fw-bold">

                  {formatearHoras(
                    certificadoSeleccionado.horas_certificadas
                  )}

                </span>

                <span className="fs-3 ms-2">
                  horas
                </span>

              </div>

              <p className="fs-5">
                de participación en
                actividades deportivas
                registradas en SportU.
              </p>

              <div className="mt-5">

                <p className="mb-1 text-muted">
                  Fecha de generación
                </p>

                <strong>

                  {formatearFecha(
                    certificadoSeleccionado.fecha_generacion
                  )}

                </strong>

              </div>

              <div className="mt-4">

                <small className="text-muted">

                  Certificado No.{" "}
                  {
                    certificadoSeleccionado.id_certificado
                  }

                </small>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default HorasPage;