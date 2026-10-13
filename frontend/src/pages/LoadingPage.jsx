import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoadingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const temporizador = setTimeout(() => {
      navigate("/login");
    }, 2000);

    return () => clearTimeout(temporizador);
  }, [navigate]);

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
      <h1 className="fw-bold mb-2">SPORTU</h1>

      <h5 className="text-secondary mb-4">
        Sistema de Registro de Eventos Deportivos
      </h5>

      <div
        className="spinner-border text-primary"
        role="status"
      >
        <span className="visually-hidden">
          Cargando...
        </span>
      </div>

      <p className="mt-3 text-secondary">
        Cargando...
      </p>
    </div>
  );
}

export default LoadingPage;