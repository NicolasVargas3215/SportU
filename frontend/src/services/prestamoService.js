const API_URL =
  `${import.meta.env.VITE_API_URL}/prestamos`;

const obtenerToken = () => {
  return localStorage.getItem("token");
};

const obtenerHeaders = () => {
  return {
    Authorization: `Bearer ${obtenerToken()}`,
  };
};

const procesarRespuesta = async (
  respuesta,
  mensajePorDefecto
) => {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || mensajePorDefecto
    );
  }

  return datos;
};

// Consultar préstamos
export const obtenerPrestamos = async () => {
  const respuesta = await fetch(API_URL, {
    headers: obtenerHeaders(),
  });

  const datos = await procesarRespuesta(
    respuesta,
    "Error al consultar los préstamos"
  );

  return datos.prestamos;
};

// Consultar implementos y estudiantes
export const obtenerOpcionesPrestamo =
  async () => {
    const respuesta = await fetch(
      `${API_URL}/opciones`,
      {
        headers: obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta,
      "Error al consultar las opciones"
    );
  };

// Registrar préstamo
export const registrarPrestamo = async (
  prestamo
) => {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...obtenerHeaders(),
    },
    body: JSON.stringify(prestamo),
  });

  return procesarRespuesta(
    respuesta,
    "Error al registrar el préstamo"
  );
};

// Registrar devolución
export const registrarDevolucion = async (
  idPrestamo
) => {
  const respuesta = await fetch(
    `${API_URL}/${idPrestamo}/devolucion`,
    {
      method: "PATCH",
      headers: obtenerHeaders(),
    }
  );

  return procesarRespuesta(
    respuesta,
    "Error al registrar la devolución"
  );
};