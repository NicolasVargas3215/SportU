const API_URL =
  `${import.meta.env.VITE_API_URL}/horas`;

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
// PROCESAR RESPUESTA
// =====================================================

const procesarRespuesta =
  async (
    respuesta,
    mensajePredeterminado
  ) => {
    const datos =
      await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje ||
          mensajePredeterminado
      );
    }

    return datos;
  };

// =====================================================
// ESTUDIANTES
// =====================================================

export const obtenerEstudiantesHoras =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/estudiantes`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al consultar las horas deportivas."
    );
  };

// =====================================================
// DETALLE
// =====================================================

export const obtenerDetalleHorasEstudiante =
  async (
    idEstudiante
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/estudiantes/${idEstudiante}`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al consultar el detalle de horas."
    );
  };

// =====================================================
// CERTIFICADOS
// =====================================================

export const obtenerCertificados =
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
      "Error al consultar los certificados."
    );
  };

// =====================================================
// GENERAR CERTIFICADO
// =====================================================

export const generarCertificado =
  async (
    idEstudiante
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/estudiantes/${idEstudiante}/certificados`,
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
      "Error al generar el certificado."
    );
  };

// =====================================================
// ELIMINAR CERTIFICADO
// =====================================================

export const eliminarCertificado =
  async (
    idCertificado
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/certificados/${idCertificado}`,
        {
          method:
            "DELETE",

          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "Error al eliminar el certificado."
    );
  };