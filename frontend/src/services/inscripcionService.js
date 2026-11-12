const API_URL =
  `${import.meta.env.VITE_API_URL}/inscripciones`;

// =====================================================
// TOKEN
// =====================================================

const obtenerToken =
  () =>
    localStorage.getItem(
      "token"
    );

const headersAuth =
  () => ({
    Authorization:
      `Bearer ${obtenerToken()}`,
  });

// =====================================================
// RESPUESTA
// =====================================================

const procesarRespuesta =
  async (
    respuesta,
    mensajePredeterminado
  ) => {
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
          mensajePredeterminado
      );
    }

    return datos;
  };

// =====================================================
// EVENTOS DISPONIBLES
// =====================================================

export const obtenerEventosDisponibles =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/eventos`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar los eventos disponibles."
    );
  };

// =====================================================
// INSCRIBIRSE
// =====================================================

export const registrarInscripcion =
  async (
    idEvento
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/eventos/${idEvento}`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...headersAuth(),
          },
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible registrar la inscripción."
    );
  };

// =====================================================
// MIS INSCRIPCIONES
// =====================================================

export const obtenerMisInscripciones =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/mis-inscripciones`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar tus inscripciones."
    );
  };