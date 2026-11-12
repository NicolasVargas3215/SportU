const API_URL =
  `${import.meta.env.VITE_API_URL}/inventario`;

// =====================================================
// TOKEN
// =====================================================

const obtenerToken = () => {
  return localStorage.getItem(
    "token"
  );
};

// =====================================================
// RESPUESTA
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
// OBTENER INVENTARIO
// =====================================================

export const obtenerInventario =
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
        "Error al consultar el inventario"
      );

    return Array.isArray(
      datos.equipos
    )
      ? datos.equipos
      : [];
  };

// =====================================================
// OPCIONES
// =====================================================

export const obtenerOpcionesInventario =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/opciones`,
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
        "Error al consultar las opciones del inventario"
      );

    return {
      deportes:
        Array.isArray(
          datos.deportes
        )
          ? datos.deportes
          : [],
    };
  };

// =====================================================
// CREAR
// =====================================================

export const crearImplemento =
  async (implemento) => {
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
              implemento
            ),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al registrar el implemento"
    );
  };

// =====================================================
// ACTUALIZAR
// =====================================================

export const actualizarImplemento =
  async (
    id,
    implemento
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
              implemento
            ),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al actualizar el implemento"
    );
  };

// =====================================================
// CAMBIAR ESTADO
// =====================================================

export const cambiarEstadoImplemento =
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
      "Error al cambiar el estado del implemento"
    );
  };

// =====================================================
// ELIMINAR
// =====================================================

export const eliminarImplemento =
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
      "Error al eliminar el implemento"
    );
  };