import {
  FaCalendarAlt,
  FaHome,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

function DocenteSidebar({
  abierto,
  onClose,
}) {
  const navigate =
    useNavigate();

  const opciones = [
    {
      nombre:
        "Inicio",

      ruta:
        "/docente",

      icono:
        <FaHome />,

      end: true,
    },

    {
      nombre:
        "Mis actividades",

      ruta:
        "/docente/actividades",

      icono:
        <FaCalendarAlt />,
    },
  ];

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

  return (
    <aside
      className={`sportu-sidebar docente-sidebar ${
        abierto
          ? "open"
          : ""
      }`}
    >

      <div className="sportu-sidebar-mobile-header">

        <div>

          <strong>
            SportU
          </strong>

          <span>
            Docente deportivo
          </span>

        </div>

        <button
          type="button"
          onClick={
            onClose
          }
        >
          <FaTimes />
        </button>

      </div>

      <div className="sportu-sidebar-brand">

        <div className="sportu-sidebar-brand-icon">
          D
        </div>

        <div>

          <strong>
            SportU
          </strong>

          <span>
            Docente deportivo
          </span>

        </div>

      </div>

      <div className="sportu-sidebar-label">
        Seguimiento
      </div>

      <nav className="sportu-menu">

        {opciones.map(
          (
            opcion
          ) => (
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
                {
                  opcion.icono
                }
              </span>

              <span className="sportu-menu-text">
                {
                  opcion.nombre
                }
              </span>

            </NavLink>
          )
        )}

      </nav>

      <div className="sportu-sidebar-bottom">

        <div className="sportu-sidebar-help">

          <span>
            Rol actual
          </span>

          <strong>
            Docente deportivo
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

export default DocenteSidebar;