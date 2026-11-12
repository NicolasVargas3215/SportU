const API_URL =
  `${import.meta.env.VITE_API_URL}/docente`;

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

    if (!respuesta.ok) {
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

export const obtenerResumenDocente =
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
      "No fue posible consultar el resumen."
    );
  };

// =====================================================
// ACTIVIDADES
// =====================================================

export const obtenerActividadesDocente =
  async () => {
    const respuesta =
      await fetch(
        `${API_URL}/actividades`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar tus actividades."
    );
  };

// =====================================================
// DETALLE
// =====================================================

export const obtenerActividadDocente =
  async (
    idEvento,
    idSesion
  ) => {
    const query = idSesion
      ? `?id_sesion=${encodeURIComponent(idSesion)}`
      : "";

    const respuesta =
      await fetch(
        `${API_URL}/actividades/${idEvento}${query}`,
        {
          headers:
            headersAuth(),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible consultar la actividad."
    );
  };

// =====================================================
// GUARDAR ASISTENCIA
// =====================================================

export const guardarAsistencia =
  async (
    idEvento,
    asistencias,
    idSesion
  ) => {
    const respuesta =
      await fetch(
        `${API_URL}/actividades/${idEvento}/asistencia`,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              "application/json",

            ...headersAuth(),
          },

          body:
            JSON.stringify({
              asistencias,
              id_sesion: idSesion,
            }),
        }
      );

    return procesarRespuesta(
      respuesta,
      "No fue posible guardar la asistencia."
    );
  };
