import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./loadingPage.css";

function LoadingPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(0);

  const etapas = [
    ["Iniciando SportU", "Preparando tu experiencia"],
    ["Cargando módulos deportivos", "Eventos, deportes e inscripciones"],
    ["Sincronizando asistencia", "Horas y certificados deportivos"],
    ["Todo listo", "Accediendo a la plataforma deportiva"],
  ];

  useEffect(() => {
    const temporizador = setTimeout(() => {
      navigate("/login");
    }, 5000);

    const intervalo = setInterval(() => {
      setEtapa((actual) => Math.min(actual + 1, etapas.length - 1));
    }, 1250);

    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);
    };
  }, [navigate, etapas.length]);

  return (
    <main className="loading-screen">
      <div className="loading-orbit loading-orbit-one" />
      <div className="loading-orbit loading-orbit-two" />

      <section className="loading-layout" aria-live="polite">
        <div className="loading-showcase">
          <div className="loading-brand-row">
            <img
              className="loading-logo"
              src="/logo-uniautonoma.jpg"
              alt="Universidad Autónoma del Cauca"
            />

            <div className="loading-divider" />

            <div className="loading-brand">
              <strong>SportU</strong>
              <span>Gestión deportiva</span>
            </div>
          </div>

          <div className="loading-showcase-copy">
            <span className="loading-kicker">UNIVERSIDAD AUTÓNOMA DEL CAUCA</span>
            <h1>El deporte que nos conecta.</h1>
            <p>
              Gestiona eventos, registra asistencias y reconoce la participación
              deportiva de toda la comunidad universitaria.
            </p>
          </div>

          <div className="loading-features">
            <span><b>01</b> Eventos deportivos</span>
            <span><b>02</b> Asistencia</span>
            <span><b>03</b> Certificados</span>
          </div>
        </div>

        <div className="loading-card">
          <div className="loading-icon" aria-hidden="true">
            <span>S</span>
          </div>

          <div className="loading-card-heading">
            <span>PLATAFORMA DEPORTIVA</span>
            <h2>SPORTU</h2>
          </div>

          <p className="loading-subtitle">
            Sistema de Registro de Eventos Deportivos
          </p>

          <div className="loading-status">
            <span className="loading-spinner" />
            <div>
              <strong>{etapas[etapa][0]}</strong>
              <span>{etapas[etapa][1]}</span>
            </div>
          </div>

          <div className="loading-steps" aria-label="Progreso de carga">
            {etapas.map((_, indice) => (
              <span
                key={indice}
                className={indice <= etapa ? "active" : ""}
              />
            ))}
          </div>

          <div className="loading-progress" aria-hidden="true">
            <span />
          </div>

          <small>Un espacio para vivir el deporte universitario</small>
        </div>
      </section>
    </main>
  );
}

export default LoadingPage;
