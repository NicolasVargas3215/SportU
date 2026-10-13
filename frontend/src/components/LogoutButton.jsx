import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <button
      className="btn btn-danger"
      onClick={cerrarSesion}
    >
      Cerrar sesión
    </button>
  );
}

export default LogoutButton;