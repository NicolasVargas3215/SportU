import {
  useState,
} from "react";

import {
  FaBars,
  FaChevronDown,
} from "react-icons/fa";

function Topbar({
  onMenuToggle,
}) {
  const [
    logoError,
    setLogoError,
  ] = useState(false);

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  let usuario = null;

  try {
    const usuarioGuardado =
      localStorage.getItem(
        "usuario"
      );

    usuario =
      usuarioGuardado
        ? JSON.parse(
            usuarioGuardado
          )
        : null;
  } catch {
    usuario = null;
  }

  // =====================================================
  // INICIAL DEL USUARIO
  // =====================================================

  const obtenerInicial =
    () => {
      const nombre =
        usuario?.nombre?.trim();

      if (!nombre) {
        return "U";
      }

      return nombre
        .charAt(0)
        .toUpperCase();
    };

  // =====================================================
  // FORMATEAR ROL
  // =====================================================

  const formatearRol =
    () => {
      switch (
        usuario?.rol
      ) {
        case "coordinador":
          return "Coordinador";

        case "docente":
          return "Docente deportivo";

        case "estudiante":
          return "Estudiante";

        default:
          return "Usuario";
      }
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <header className="sportu-topbar">

      {/* IZQUIERDA */}

      <div className="sportu-topbar-left">

        <button
          type="button"
          className="sportu-mobile-menu-button"
          aria-label="Abrir menú"
          onClick={
            onMenuToggle
          }
        >
          <FaBars />
        </button>

        <div className="sportu-university">

          {/* LOGO */}

          <div className="sportu-university-logo">

            {!logoError ? (
              <img
                src="/logo-uniautonoma.jpg"
                alt="Uniautónoma del Cauca"
                onError={() =>
                  setLogoError(
                    true
                  )
                }
              />
            ) : (
              <div className="sportu-logo-fallback">
                UA
              </div>
            )}

          </div>

          {/* UNIVERSIDAD */}

          <div className="sportu-university-text">

            <strong>
              UNIAUTÓNOMA
            </strong>

            <span>
              DEL CAUCA
            </span>

          </div>

          <div className="sportu-topbar-divider" />

          {/* SPORTU */}

          <div className="sportu-system-name">

            <strong>
              SportU
            </strong>

            <span>
              Gestión deportiva
            </span>

          </div>

        </div>

      </div>

      {/* USUARIO */}

      <div className="sportu-user">

        <div className="sportu-avatar">
          {obtenerInicial()}
        </div>

        <div className="sportu-user-information">

          <strong>
            {usuario?.nombre ||
              "Usuario"}
          </strong>

          <span>
            {formatearRol()}
          </span>

        </div>

        <FaChevronDown
          className="sportu-user-chevron"
        />

      </div>

    </header>
  );
}

export default Topbar;