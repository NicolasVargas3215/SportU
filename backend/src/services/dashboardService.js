const API_URL =
  "http://localhost:3000/api/dashboard";

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

    const datos =
      await respuesta.json();

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