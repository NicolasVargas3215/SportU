const API_URL =
  "http://localhost:3000/api/estudiante";

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
// RESPUESTAS
// =====================================================

const procesarRespuesta =
  async (
    respuesta,
    mensajePredeterminado
  ) => {
    const datos =
      await respuesta.json();

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
// RESUMEN
// =====================================================

export const obtenerResumenEstudiante =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/resumen`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar tu resumen."
    );
  };

// =====================================================
// PERFIL
// =====================================================

export const obtenerPerfilEstudiante =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/perfil`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar tu perfil."
    );
  };

// =====================================================
// CERTIFICADOS
// =====================================================

export const obtenerCertificadosEstudiante =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/certificados`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar tus certificados."
    );
  };