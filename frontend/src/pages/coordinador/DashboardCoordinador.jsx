import {
  useEffect,
  useState,
} from "react";

import {
  FaBasketballBall,
  FaBoxOpen,
  FaCalendarAlt,
  FaClock,
  FaExchangeAlt,
  FaUsers,
} from "react-icons/fa";

import {
  obtenerDashboardCoordinador,
} from "../../services/dashboardService";

// =====================================================
// HELPERS
// =====================================================

const formatearNumero =
  (
    valor
  ) => {
    const numero =
      Number(
        valor || 0
      );

    return numero.toLocaleString(
      "es-CO"
    );
  };

const formatearHoras =
  (
    valor
  ) => {
    const numero =
      Number(
        valor || 0
      );

    return numero
      .toFixed(2)
      .replace(
        /\.?0+$/,
        ""
      );
  };

// =====================================================
// COMPONENTE
// =====================================================

function DashboardCoordinador() {
  const [
    resumen,
    setResumen,
  ] = useState({
    deportes_activos:
      0,

    eventos_activos:
      0,

    unidades_inventario:
      0,

    prestamos_activos:
      0,

    estudiantes_activos:
      0,

    horas_totales:
      0,

    certificados_generados:
      0,

    asistencias_pendientes:
      0,
  });

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  let usuario =
    null;

  try {
    usuario =
      JSON.parse(
        localStorage.getItem(
          "usuario"
        )
      );
  } catch {
    usuario =
      null;
  }

  // =====================================================
  // CARGAR DASHBOARD
  // =====================================================

  useEffect(() => {
    const cargar =
      async () => {
        try {
          setCargando(
            true
          );

          setError("");

          const datos =
            await obtenerDashboardCoordinador();

          setResumen(
            datos.resumen ||
              {}
          );
        } catch (err) {
          setError(
            err.message ||
              "No fue posible cargar el panel."
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargar();
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>

      <div className="sportu-page-heading">

        <h2>
          ¡Hola,{" "}
          {usuario?.nombre
            ?.split(
              " "
            )[0] ||
            "Coordinador"}
          !
        </h2>

        <p>
          Panel de administración deportiva
        </p>

      </div>

      {error && (
        <div
          style={{
            marginBottom:
              "18px",

            padding:
              "12px 14px",

            border:
              "1px solid #efc9cd",

            borderRadius:
              "8px",

            background:
              "#fff1f2",

            color:
              "#b42335",

            fontSize:
              "12px",
          }}
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div
          style={{
            padding:
              "30px",

            color:
              "#718096",
          }}
        >
          Cargando información del sistema...
        </div>
      ) : (
        <div className="sportu-dashboard-grid">

          {/* DEPORTES */}

          <div className="dashboard-card card-blue">

            <FaBasketballBall />

            <div>

              <strong>
                {formatearNumero(
                  resumen.deportes_activos
                )}
              </strong>

              <span>
                Deportes
              </span>

            </div>

            <small>
              Activos
            </small>

          </div>

          {/* EVENTOS */}

          <div className="dashboard-card card-purple">

            <FaCalendarAlt />

            <div>

              <strong>
                {formatearNumero(
                  resumen.eventos_activos
                )}
              </strong>

              <span>
                Eventos
              </span>

            </div>

            <small>
              Activos
            </small>

          </div>

          {/* INVENTARIO */}

          <div className="dashboard-card card-green">

            <FaBoxOpen />

            <div>

              <strong>
                {formatearNumero(
                  resumen.unidades_inventario
                )}
              </strong>

              <span>
                Inventario
              </span>

            </div>

            <small>
              Unidades
            </small>

          </div>

          {/* PRÉSTAMOS */}

          <div className="dashboard-card card-orange">

            <FaExchangeAlt />

            <div>

              <strong>
                {formatearNumero(
                  resumen.prestamos_activos
                )}
              </strong>

              <span>
                Préstamos
              </span>

            </div>

            <small>
              Pendientes
            </small>

          </div>

          {/* ESTUDIANTES */}

          <div className="dashboard-card card-cyan">

            <FaUsers />

            <div>

              <strong>
                {formatearNumero(
                  resumen.estudiantes_activos
                )}
              </strong>

              <span>
                Estudiantes
              </span>

            </div>

            <small>
              Activos
            </small>

          </div>

          {/* HORAS */}

          <div className="dashboard-card card-red">

            <FaClock />

            <div>

              <strong>
                {formatearHoras(
                  resumen.horas_totales
                )}
              </strong>

              <span>
                Horas totales
              </span>

            </div>

            <small>
              Acumuladas
            </small>

          </div>

        </div>
      )}

    </div>
  );
}

export default DashboardCoordinador;