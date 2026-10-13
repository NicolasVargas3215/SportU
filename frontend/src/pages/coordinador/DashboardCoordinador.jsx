import {
  FaCalendarAlt,
  FaClock,
  FaDumbbell,
  FaExchangeAlt,
  FaFutbol,
  FaUsers,
} from "react-icons/fa";

function DashboardCoordinador() {
  // =====================================================
  // USUARIO
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

  const primerNombre =
    usuario?.nombre
      ?.trim()
      ?.split(" ")[0] ||
    "Coordinador";

  // =====================================================
  // TARJETAS
  // =====================================================

  const estadisticas = [
    {
      titulo:
        "Deportes",
      valor:
        "8",
      detalle:
        "Activos",
      icono:
        <FaFutbol />,
      tipo:
        "blue",
    },

    {
      titulo:
        "Eventos",
      valor:
        "12",
      detalle:
        "Registrados",
      icono:
        <FaCalendarAlt />,
      tipo:
        "gold",
    },

    {
      titulo:
        "Inventario",
      valor:
        "35",
      detalle:
        "Implementos",
      icono:
        <FaDumbbell />,
      tipo:
        "blue-light",
    },

    {
      titulo:
        "Préstamos",
      valor:
        "5",
      detalle:
        "Pendientes",
      icono:
        <FaExchangeAlt />,
      tipo:
        "gold-light",
    },

    {
      titulo:
        "Estudiantes",
      valor:
        "256",
      detalle:
        "Registrados",
      icono:
        <FaUsers />,
      tipo:
        "blue",
    },

    {
      titulo:
        "Horas deportivas",
      valor:
        "1.248",
      detalle:
        "Acumuladas",
      icono:
        <FaClock />,
      tipo:
        "gold",
    },
  ];

  return (
    <div className="sportu-dashboard-page">

      {/* HEADER */}

      <div className="sportu-dashboard-header">

        <div>

          <span className="sportu-dashboard-eyebrow">
            Panel administrativo
          </span>

          <h1>
            ¡Hola, {primerNombre}!
          </h1>

          <p>
            Gestiona la actividad deportiva de
            Uniautónoma del Cauca desde un solo lugar.
          </p>

        </div>

        <div className="sportu-dashboard-badge">

          <span>
            SPORTU
          </span>

          <strong>
            Gestión deportiva
          </strong>

        </div>

      </div>

      {/* BANNER */}

      <section className="sportu-welcome-banner">

        <div className="sportu-welcome-decoration one" />
        <div className="sportu-welcome-decoration two" />

        <div className="sportu-welcome-content">

          <span>
            UNIAUTÓNOMA DEL CAUCA
          </span>

          <h2>
            Sistema de Registro de Eventos Deportivos
          </h2>

          <p>
            Administra deportes, eventos,
            inventario, préstamos y seguimiento
            de horas deportivas.
          </p>

        </div>

        <div className="sportu-welcome-mark">
          S
        </div>

      </section>

      {/* TÍTULO */}

      <div className="sportu-dashboard-section-heading">

        <div>

          <h2>
            Resumen general
          </h2>

          <p>
            Información principal del área deportiva.
          </p>

        </div>

      </div>

      {/* CARDS */}

      <div className="sportu-dashboard-grid">

        {estadisticas.map(
          (estadistica) => (

            <article
              key={
                estadistica.titulo
              }
              className={`dashboard-card dashboard-${estadistica.tipo}`}
            >

              <div className="dashboard-card-icon">
                {estadistica.icono}
              </div>

              <div className="dashboard-card-content">

                <span>
                  {estadistica.titulo}
                </span>

                <strong>
                  {estadistica.valor}
                </strong>

                <small>
                  {estadistica.detalle}
                </small>

              </div>

            </article>

          )
        )}

      </div>

    </div>
  );
}

export default DashboardCoordinador;