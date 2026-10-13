import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FaCalendarAlt,
  FaClock,
  FaDumbbell,
  FaExchangeAlt,
  FaFutbol,
  FaHome,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

function Sidebar({
  abierto,
  onClose,
}) {
  const navigate =
    useNavigate();

  // =====================================================
  // MENÚ
  // =====================================================

  const opciones = [
    {
      nombre: "Inicio",
      ruta: "/coordinador",
      icono: <FaHome />,
      end: true,
    },

    {
      nombre: "Deportes",
      ruta: "/coordinador/deportes",
      icono: <FaFutbol />,
    },

    {
      nombre: "Eventos",
      ruta: "/coordinador/eventos",
      icono: <FaCalendarAlt />,
    },

    {
      nombre: "Inventario",
      ruta: "/coordinador/inventario",
      icono: <FaDumbbell />,
    },

    {
      nombre: "Préstamos",
      ruta: "/coordinador/prestamos",
      icono: <FaExchangeAlt />,
    },

    {
      nombre:
        "Horas deportivas",
      ruta:
        "/coordinador/horas",
      icono: <FaClock />,
    },
  ];

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const cerrarSesion =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "usuario"
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <aside
      className={`sportu-sidebar ${
        abierto
          ? "open"
          : ""
      }`}
    >

      {/* MOBILE HEADER */}

      <div className="sportu-sidebar-mobile-header">

        <div>

          <strong>
            SportU
          </strong>

          <span>
            Gestión deportiva
          </span>

        </div>

        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={
            onClose
          }
        >
          <FaTimes />
        </button>

      </div>

      {/* IDENTIDAD DEL MÓDULO */}

      <div className="sportu-sidebar-brand">

        <div className="sportu-sidebar-brand-icon">
          S
        </div>

        <div>

          <strong>
            SportU
          </strong>

          <span>
            Sistema deportivo
          </span>

        </div>

      </div>

      {/* SEPARADOR */}

      <div className="sportu-sidebar-label">
        Administración
      </div>

      {/* NAVEGACIÓN */}

      <nav className="sportu-menu">

        {opciones.map(
          (opcion) => (

            <NavLink
              key={
                opcion.ruta
              }
              to={
                opcion.ruta
              }
              end={
                opcion.end
              }
              className={({
                isActive,
              }) =>
                `sportu-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span className="sportu-menu-icon">
                {opcion.icono}
              </span>

              <span className="sportu-menu-text">
                {opcion.nombre}
              </span>

            </NavLink>

          )
        )}

      </nav>

      {/* PARTE INFERIOR */}

      <div className="sportu-sidebar-bottom">

        <div className="sportu-sidebar-help">

          <span>
            Plataforma institucional
          </span>

          <strong>
            Uniautónoma del Cauca
          </strong>

        </div>

        <button
          type="button"
          className="sportu-menu-item sportu-logout"
          onClick={
            cerrarSesion
          }
        >

          <span className="sportu-menu-icon">
            <FaSignOutAlt />
          </span>

          <span className="sportu-menu-text">
            Cerrar sesión
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;