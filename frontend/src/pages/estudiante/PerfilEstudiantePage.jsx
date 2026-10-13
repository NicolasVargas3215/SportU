import {
  useEffect,
  useState,
} from "react";

import "./studentPages.css";

function PerfilEstudiantePage() {
  const [
    usuario,
    setUsuario,
  ] = useState(null);

  // =====================================================
  // DECODIFICAR TOKEN
  // =====================================================

  const decodificarToken = (
    token
  ) => {
    try {
      if (!token) {
        return null;
      }

      const partes =
        token.split(".");

      if (
        partes.length !== 3
      ) {
        return null;
      }

      const payload =
        partes[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

      const decoded =
        decodeURIComponent(
          window
            .atob(payload)
            .split("")
            .map((caracter) => {
              return (
                "%" +
                (
                  "00" +
                  caracter
                    .charCodeAt(0)
                    .toString(16)
                ).slice(-2)
              );
            })
            .join("")
        );

      return JSON.parse(
        decoded
      );
    } catch (error) {
      console.error(
        "No fue posible decodificar el token:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  const obtenerUsuario = () => {
    try {
      const usuarioGuardado =
        localStorage.getItem(
          "usuario"
        ) ||
        localStorage.getItem(
          "user"
        );

      if (usuarioGuardado) {
        return JSON.parse(
          usuarioGuardado
        );
      }

      const token =
        localStorage.getItem(
          "token"
        );

      return decodificarToken(
        token
      );
    } catch (error) {
      console.error(
        "Error al consultar datos del usuario:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    const datos =
      obtenerUsuario();

    setUsuario(datos);
  }, []);

  // =====================================================
  // OBTENER INICIALES
  // =====================================================

  const obtenerIniciales = (
    nombre
  ) => {
    if (!nombre) {
      return "E";
    }

    const partes =
      nombre
        .trim()
        .split(" ")
        .filter(Boolean);

    if (
      partes.length === 1
    ) {
      return partes[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      partes[0]
        .charAt(0)
        .toUpperCase() +
      partes[1]
        .charAt(0)
        .toUpperCase()
    );
  };

  // =====================================================
  // CAPITALIZAR
  // =====================================================

  const capitalizar = (
    texto
  ) => {
    if (!texto) {
      return "-";
    }

    const valor =
      String(texto);

    return (
      valor
        .charAt(0)
        .toUpperCase() +
      valor
        .slice(1)
        .toLowerCase()
    );
  };

  // =====================================================
  // DATOS
  // =====================================================

  const nombre =
    usuario?.nombre ||
    "Estudiante";

  const correo =
    usuario?.correo ||
    usuario?.email ||
    "No disponible";

  const rol =
    usuario?.rol ||
    "estudiante";

  const estado =
    usuario?.estado ||
    "activo";

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
            Mi perfil
          </h1>

          <p>
            Consulta la información asociada
            a tu cuenta en SportU.
          </p>

        </div>

      </div>

      {/* =============================================== */}
      {/* PERFIL */}
      {/* =============================================== */}

      <div className="student-profile-card">

        {/* CABECERA */}

        <div className="student-profile-header">

          <div className="student-profile-avatar">

            {obtenerIniciales(
              nombre
            )}

          </div>

          <div className="student-profile-main-info">

            <h2>
              {nombre}
            </h2>

            <p>
              {correo}
            </p>

            <span className="student-profile-role">
              {capitalizar(
                rol
              )}
            </span>

          </div>

        </div>

        {/* INFORMACIÓN */}

        <div className="student-profile-section">

          <div className="student-profile-section-title">

            <div className="student-profile-section-icon">
              👤
            </div>

            <div>

              <h3>
                Información personal
              </h3>

              <p>
                Datos de identificación de tu cuenta.
              </p>

            </div>

          </div>

          <div className="student-profile-grid">

            {/* NOMBRE */}

            <div className="student-profile-field">

              <small>
                Nombre completo
              </small>

              <strong>
                {nombre}
              </strong>

            </div>

            {/* CORREO */}

            <div className="student-profile-field">

              <small>
                Correo institucional
              </small>

              <strong>
                {correo}
              </strong>

            </div>

            {/* ROL */}

            <div className="student-profile-field">

              <small>
                Rol
              </small>

              <strong>
                {capitalizar(
                  rol
                )}
              </strong>

            </div>

            {/* ESTADO */}

            <div className="student-profile-field">

              <small>
                Estado de la cuenta
              </small>

              <div>

                <span
                  className={
                    String(
                      estado
                    ).toLowerCase() ===
                    "activo"
                      ? "student-account-status active"
                      : "student-account-status inactive"
                  }
                >
                  {capitalizar(
                    estado
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* INFORMACIÓN DEPORTIVA */}

        <div className="student-profile-section">

          <div className="student-profile-section-title">

            <div className="student-profile-section-icon sport">
              🏅
            </div>

            <div>

              <h3>
                SportU
              </h3>

              <p>
                Tu cuenta permite participar
                en las actividades deportivas
                disponibles.
              </p>

            </div>

          </div>

          <div className="student-profile-message">

            <div className="student-profile-message-icon">
              ℹ️
            </div>

            <div>

              <strong>
                Cuenta de estudiante
              </strong>

              <p>
                Desde SportU puedes consultar eventos,
                realizar inscripciones y revisar el
                estado de tu participación en las
                actividades deportivas.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default PerfilEstudiantePage;