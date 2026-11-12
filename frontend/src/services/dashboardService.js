const API_URL =
  `${import.meta.env.VITE_API_URL}/dashboard`;

// =====================================================
// TOKEN
// =====================================================

const obtenerToken =
  () =>
    localStorage.getItem(
      "token"
    );

// =====================================================
// DASHBOARD COORDINADOR
// =====================================================

export const obtenerDashboardCoordinador =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/coordinador`,
        {
          headers: {
            Authorization:
              `Bearer ${obtenerToken()}`,
          },
        }
      );

    let datos = {};

    try {
      datos =
        await respuesta.json();
    } catch {
      datos = {};
    }

    if (
      !respuesta.ok
    ) {
      throw new Error(
        datos.mensaje ||
          "No fue posible cargar el dashboard."
      );
    }

    return datos;
  };