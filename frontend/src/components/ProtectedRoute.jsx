import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, rolesPermitidos }) {
  const token = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("usuario");

  // Si no existe sesión, regresar al login
  if (!token || !usuarioGuardado) {
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(usuarioGuardado);

  // Si el rol no está autorizado
  if (
    rolesPermitidos &&
    !rolesPermitidos.includes(usuario.rol)
  ) {
    if (usuario.rol === "estudiante") {
      return <Navigate to="/estudiante" replace />;
    }

    if (usuario.rol === "docente") {
      return <Navigate to="/docente" replace />;
    }

    if (usuario.rol === "coordinador") {
      return <Navigate to="/coordinador" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;