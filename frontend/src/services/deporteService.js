const API_URL =
  `${import.meta.env.VITE_API_URL}/deportes`;

// =====================================================
// TOKEN
// =====================================================

const obtenerToken = () => {
  return localStorage.getItem(
    "token"
  );
};

// =====================================================
// PROCESAR RESPUESTA
// =====================================================

const procesarRespuesta = async (
  respuesta,
  mensajePorDefecto
) => {
  let datos = {};

  try {
    datos =
      await respuesta.json();
  } catch {
    datos = {};
  }

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        mensajePorDefecto
    );
  }

  return datos;
};

// =====================================================
// OBTENER DEPORTES
// =====================================================

export const obtenerDeportes =
  async () => {
    const respuesta =
      await fetch(
        API_URL,
        {
          headers: {
            Authorization:
              `Bearer ${obtenerToken()}`,
          },
        }
      );

    const datos =
      await procesarRespuesta(
        respuesta,
        "Error al consultar los deportes"
      );

    return Array.isArray(
      datos.deportes
    )
      ? datos.deportes
      : [];
  };

// =====================================================
// CREAR DEPORTE
// =====================================================

export const crearDeporte =
  async (deporte) => {
    const respuesta =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${obtenerToken()}`,
          },

          body:
            JSON.stringify(
              deporte
            ),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al registrar el deporte"
    );
  };

// =====================================================
// ACTUALIZAR DEPORTE
// =====================================================

export const actualizarDeporte =
  async (
    id,
    deporte
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${obtenerToken()}`,
          },

          body:
            JSON.stringify(
              deporte
            ),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al actualizar el deporte"
    );
  };

// =====================================================
// CAMBIAR ESTADO
// =====================================================

export const cambiarEstadoDeporte =
  async (id) => {
    const respuesta =
      await fetch(
        `${API_URL}/${id}/estado`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${obtenerToken()}`,
          },
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al cambiar el estado del deporte"
    );
  };

// =====================================================
// ELIMINAR DEPORTE
// =====================================================

export const eliminarDeporte =
  async (id) => {
    const respuesta =
      await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${obtenerToken()}`,
          },
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al eliminar el deporte"
    );
  };