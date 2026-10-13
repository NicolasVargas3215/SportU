const API_URL =
  "http://localhost:3000/api/horas";

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
// PROCESAR RESPUESTAS
// =====================================================

const procesarRespuesta = async (
  respuesta,
  mensajePorDefecto
) => {
  const datos =
    await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        mensajePorDefecto
    );
  }

  return datos;
};

// =====================================================
// OBTENER ESTUDIANTES
// =====================================================

export const obtenerEstudiantes =
  async () => {
    const respuesta = await fetch(
      `${API_URL}/estudiantes`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    const datos =
      await procesarRespuesta(
        respuesta,
        "Error al consultar los estudiantes"
      );

    return datos.estudiantes;
  };

// =====================================================
// OBTENER HORAS DEL ESTUDIANTE
// =====================================================

export const obtenerHorasEstudiante =
  async (idEstudiante) => {
    const respuesta = await fetch(
      `${API_URL}/${idEstudiante}`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta,
      "Error al consultar las horas deportivas"
    );
  };

// =====================================================
// OBTENER CERTIFICADOS
// =====================================================

export const obtenerCertificadosEstudiante =
  async (idEstudiante) => {
    const respuesta = await fetch(
      `${API_URL}/${idEstudiante}/certificados`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    const datos =
      await procesarRespuesta(
        respuesta,
        "Error al consultar los certificados"
      );

    return datos.certificados;
  };

// =====================================================
// GENERAR CERTIFICADO
// =====================================================

export const generarCertificado =
  async (idEstudiante) => {
    const respuesta = await fetch(
      `${API_URL}/${idEstudiante}/certificados`,
      {
        method: "POST",
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta,
      "Error al generar el certificado"
    );
  };

// =====================================================
// ELIMINAR CERTIFICADO
// =====================================================

export const eliminarCertificado =
  async (
    idEstudiante,
    idCertificado
  ) => {
    const respuesta = await fetch(
      `${API_URL}/${idEstudiante}/certificados/${idCertificado}`,
      {
        method: "DELETE",
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta,
      "Error al eliminar el certificado"
    );
  };