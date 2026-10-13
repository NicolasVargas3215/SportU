const API_URL =
  "http://localhost:3000/api/inscripciones";

// =====================================================
// TOKEN
// =====================================================

const obtenerToken = () => {
  return localStorage.getItem("token");
};

// =====================================================
// HEADERS
// =====================================================

const obtenerHeaders = () => {
  return {
    Authorization: `Bearer ${obtenerToken()}`,
  };
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
    datos = await respuesta.json();
  } catch (error) {
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
// OBTENER EVENTOS DISPONIBLES
// =====================================================

export const obtenerEventosDisponibles =
  async () => {
    const respuesta = await fetch(
      `${API_URL}/eventos`,
      {
        method: "GET",
        headers: obtenerHeaders(),
      }
    );

    const datos =
      await procesarRespuesta(
        respuesta,
        "Error al consultar los eventos disponibles"
      );

    return Array.isArray(
      datos.eventos
    )
      ? datos.eventos
      : [];
  };

// =====================================================
// REGISTRAR INSCRIPCIÓN
// =====================================================

export const registrarInscripcion =
  async (idEvento) => {
    const respuesta = await fetch(
      `${API_URL}/eventos/${idEvento}`,
      {
        method: "POST",
        headers: obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta,
      "Error al realizar la inscripción"
    );
  };

// =====================================================
// OBTENER MIS INSCRIPCIONES
// =====================================================

export const obtenerMisInscripciones =
  async () => {
    const respuesta = await fetch(
      `${API_URL}/mis-inscripciones`,
      {
        method: "GET",
        headers: obtenerHeaders(),
      }
    );

    const datos =
      await procesarRespuesta(
        respuesta,
        "Error al consultar tus inscripciones"
      );

    return Array.isArray(
      datos.inscripciones
    )
      ? datos.inscripciones
      : [];
  };