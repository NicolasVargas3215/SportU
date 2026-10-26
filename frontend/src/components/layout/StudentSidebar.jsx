import {
  FaCalendarAlt,
  FaClipboardList,
  FaHome,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

function StudentSidebar({
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
        "/estudiante",

      icono:
        <FaHome />,

      end: true,
    },

    {
      nombre:
        "Eventos deportivos",

      ruta:
        "/estudiante/eventos",

      icono:
        <FaCalendarAlt />,
    },

    {
      nombre:
        "Mis inscripciones",

      ruta:
        "/estudiante/inscripciones",

      icono:
        <FaClipboardList />,
    },

    {
      nombre:
        "Mi perfil",

      ruta:
        "/estudiante/perfil",

      icono:
        <FaUser />,
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
      className={`sportu-sidebar student-sidebar ${
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
            Estudiante
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
          E
        </div>

        <div>

          <strong>
            SportU
          </strong>

          <span>
            Portal estudiante
          </span>

        </div>

      </div>

      <div className="sportu-sidebar-label">
        Participación
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
            Estudiante
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

export default StudentSidebar;