import { Outlet } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import "./estudianteLayout.css";

function EstudianteLayout() {
  const obtenerUsuario = () => {
    try {
      const datos =
        localStorage.getItem("usuario") ||
        localStorage.getItem("user");

      if (!datos) {
        return null;
      }

      return JSON.parse(datos);
    } catch (error) {
      return null;
    }
  };

  const usuario = obtenerUsuario();

  const nombre =
    usuario?.nombre ||
    "Estudiante";

  return (
    <div className="student-app">
      {/* ========================================= */}
      {/* BARRA SUPERIOR */}
      {/* ========================================= */}

      <header className="student-header">
        <div className="student-brand">
          <div className="student-brand-logo">
            U
          </div>

          <div>
            <div className="student-brand-title">
              Uniautónoma
            </div>

            <div className="student-brand-subtitle">
              DEL CAUCA
            </div>
          </div>
        </div>

        <div className="student-user">
          <div className="student-avatar">
            {nombre
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="student-user-info">
            <strong>
              {nombre}
            </strong>

            <span>
              Estudiante
            </span>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* CUERPO PRINCIPAL */}
      {/* ========================================= */}

      <div className="student-body">
        <StudentSidebar />

        <main className="student-content">
          <Outlet />
        </main>
      </div>

      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

      <footer className="student-footer">
        <strong>
          SOMOS COMUNIDAD
        </strong>

        <span>
          Vive el deporte, vive Uniautónoma
        </span>
      </footer>
    </div>
  );
}

export default EstudianteLayout;