import {
  useEffect,
  useState,
} from "react";

import {
  FaCertificate,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaIdBadge,
  FaUser,
} from "react-icons/fa";

import {
  obtenerCertificadosEstudiante,
  obtenerPerfilEstudiante,
  obtenerResumenEstudiante,
} from "../../services/estudianteService";

// =====================================================
// HELPERS
// =====================================================

const formatearFecha =
  (
    fecha
  ) => {
    if (
      !fecha
    ) {
      return "—";
    }

    const objeto =
      new Date(
        String(
          fecha
        ).replace(
          " ",
          "T"
        )
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
        month: "long",
        year: "numeric",
      }
    );
  };

const formatearHoras =
  (
    valor
  ) =>
    `${Number(
      valor || 0
    )
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      )} h`;

// =====================================================
// COMPONENTE
// =====================================================

function PerfilEstudiantePage() {
  const [
    estudiante,
    setEstudiante,
  ] = useState(null);

  const [
    resumen,
    setResumen,
  ] = useState({});

  const [
    certificados,
    setCertificados,
  ] = useState([]);

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

          const [
            datosPerfil,
            datosResumen,
            datosCertificados,
          ] =
            await Promise.all([
              obtenerPerfilEstudiante(),
              obtenerResumenEstudiante(),
              obtenerCertificadosEstudiante(),
            ]);

          setEstudiante(
            datosPerfil.estudiante ||
              null
          );

          setResumen(
            datosResumen.resumen ||
              {}
          );

          setCertificados(
            datosCertificados.certificados ||
              []
          );
        } catch (err) {
          setError(
            err.message ||
              "No fue posible consultar tu perfil."
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargar();
  }, []);

  if (
    cargando
  ) {
    return (
      <div className="student-page">

        <div className="student-card student-loading">
          Cargando perfil...
        </div>

      </div>
    );
  }

  return (
    <div className="student-page">

      <section className="student-page-header">

        <div>

          <span className="student-eyebrow">
            CUENTA SPORTU
          </span>

          <h1>
            Mi perfil
          </h1>

          <p>
            Consulta tu información de usuario,
            actividad deportiva y certificados.
          </p>

        </div>

      </section>

      {error && (
        <div className="student-alert error">
          {error}
        </div>
      )}

      {estudiante && (
        <section className="student-profile-card">

          <div className="student-profile-banner">

            <div className="student-profile-avatar">
              {estudiante.nombre
                ?.charAt(
                  0
                )
                .toUpperCase()}
            </div>

            <div>

              <span>
                ESTUDIANTE
              </span>

              <h2>
                {
                  estudiante.nombre
                }
              </h2>

              <p>
                Universidad Autónoma del Cauca
              </p>

            </div>

          </div>

          <div className="student-profile-data">

            <div>

              <FaIdBadge />

              <div>
                <span>
                  ID de usuario
                </span>

                <strong>
                  #
                  {
                    estudiante.id_usuario
                  }
                </strong>
              </div>

            </div>

            <div>

              <FaEnvelope />

              <div>
                <span>
                  Correo
                </span>

                <strong>
                  {
                    estudiante.correo
                  }
                </strong>
              </div>

            </div>

            <div>

              <FaUser />

              <div>
                <span>
                  Rol
                </span>

                <strong>
                  Estudiante
                </strong>
              </div>

            </div>

            <div>

              <FaCheckCircle />

              <div>
                <span>
                  Estado
                </span>

                <strong
                  className={
                    estudiante.estado ===
                    "activo"
                      ? "profile-active"
                      : ""
                  }
                >
                  {
                    estudiante.estado
                  }
                </strong>
              </div>

            </div>

          </div>

        </section>
      )}

      <section className="student-summary-grid">

        <article className="student-summary-card">

          <div className="student-summary-icon blue">
            <FaClock />
          </div>

          <div>
            <span>
              Horas deportivas
            </span>

            <strong>
              {formatearHoras(
                resumen.horas_acumuladas
              )}
            </strong>

            <small>
              Acumuladas
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Asistencia
            </span>

            <strong>
              {
                resumen.porcentaje_asistencia ||
                0
              }
              %
            </strong>

            <small>
              Actividades evaluadas
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon gold">
            <FaIdBadge />
          </div>

          <div>
            <span>
              Inscripciones
            </span>

            <strong>
              {
                resumen.total_inscripciones ||
                0
              }
            </strong>

            <small>
              Eventos deportivos
            </small>
          </div>

        </article>

        <article className="student-summary-card">

          <div className="student-summary-icon purple">
            <FaCertificate />
          </div>

          <div>
            <span>
              Certificados
            </span>

            <strong>
              {
                certificados.length
              }
            </strong>

            <small>
              Generados
            </small>
          </div>

        </article>

      </section>

      <section className="student-card">

        <div className="student-section-heading">

          <div>

            <h2>
              Mis certificados
            </h2>

            <p>
              Certificados de horas deportivas
              generados por el coordinador.
            </p>

          </div>

        </div>

        {certificados.length ===
        0 ? (
          <div className="student-empty">

            <FaCertificate />

            <strong>
              Todavía no tienes certificados
            </strong>

            <span>
              Cuando se genere uno aparecerá en
              esta sección.
            </span>

          </div>
        ) : (
          <div className="student-certificates-grid">

            {certificados.map(
              (
                certificado
              ) => (
                <article
                  key={
                    certificado.id_certificado
                  }
                  className="student-certificate-card"
                >

                  <div className="student-certificate-top">

                    <div className="student-cert-icon large">
                      <FaCertificate />
                    </div>

                    <span>
                      #
                      {
                        certificado.id_certificado
                      }
                    </span>

                  </div>

                  <span>
                    CERTIFICADO DE HORAS
                  </span>

                  <h3>
                    {formatearHoras(
                      certificado.horas_certificadas
                    )}
                  </h3>

                  <p>
                    Horas deportivas certificadas
                  </p>

                  <div className="student-certificate-date">
                    Generado el{" "}
                    <strong>
                      {formatearFecha(
                        certificado.fecha_generacion
                      )}
                    </strong>
                  </div>

                </article>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default PerfilEstudiantePage;