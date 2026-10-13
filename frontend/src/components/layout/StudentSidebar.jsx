import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FaHome,
  FaCalendarAlt,
  FaClipboardList,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

function StudentSidebar() {
  const navigate =
    useNavigate();

  const cerrarSesion = () => {
    const confirmar =
      window.confirm(
        "¿Deseas cerrar sesión?"
      );

    if (!confirmar) {
      return;
    }

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "usuario"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };

  const obtenerClase = ({
    isActive,
  }) => {
    return isActive
      ? "student-nav-link active"
      : "student-nav-link";
  };

  return (
    <aside className="student-sidebar">

      <nav className="student-nav">

        {/* INICIO */}

        <NavLink
          to="/estudiante"
          end
          className={
            obtenerClase
          }
        >
          <FaHome />

          <span>
            Inicio
          </span>
        </NavLink>

        {/* EVENTOS */}

        <NavLink
          to="/estudiante/eventos"
          className={
            obtenerClase
          }
        >
          <FaCalendarAlt />

          <span>
            Eventos disponibles
          </span>
        </NavLink>

        {/* INSCRIPCIONES */}

        <NavLink
          to="/estudiante/inscripciones"
          className={
            obtenerClase
          }
        >
          <FaClipboardList />

          <span>
            Mis inscripciones
          </span>
        </NavLink>

        {/* PERFIL */}

        <NavLink
          to="/estudiante/perfil"
          className={
            obtenerClase
          }
        >
          <FaUser />

          <span>
            Mi perfil
          </span>
        </NavLink>

        {/* CERRAR SESIÓN */}

        <button
          type="button"
          className="student-nav-link student-logout"
          onClick={
            cerrarSesion
          }
        >
          <FaSignOutAlt />

          <span>
            Cerrar sesión
          </span>
        </button>

      </nav>

    </aside>
  );
}

export default StudentSidebar;