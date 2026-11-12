const API_URL =
  `${import.meta.env.VITE_API_URL}/eventos`;

const obtenerToken = () =>
  localStorage.getItem("token");

const headersAuth = () => ({
  Authorization: `Bearer ${obtenerToken()}`,
});

export const obtenerEventos = async () => {
  const respuesta = await fetch(API_URL, {
    headers: headersAuth(),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Error al consultar los eventos"
    );
  }

  return datos.eventos;
};

export const obtenerEventoPorId = async (id) => {
  const respuesta = await fetch(
    `${API_URL}/${id}`,
    {
      headers: headersAuth(),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Error al consultar el evento"
    );
  }

  return datos.evento;
};

export const obtenerOpcionesEvento = async () => {
  const respuesta = await fetch(
    `${API_URL}/opciones`,
    {
      headers: headersAuth(),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Error al cargar las opciones"
    );
  }

  return datos;
};

export const crearEvento = async (evento) => {
  const respuesta = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      ...headersAuth(),
    },

    body: JSON.stringify(evento),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Error al registrar el evento"
    );
  }

  return datos;
};

export const actualizarEvento = async (
  id,
  evento
) => {
  const respuesta = await fetch(
    `${API_URL}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        ...headersAuth(),
      },

      body: JSON.stringify(evento),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Error al actualizar el evento"
    );
  }

  return datos;
};

export const cambiarEstadoEvento = async (id) => {
  const respuesta = await fetch(
    `${API_URL}/${id}/estado`,
    {
      method: "PATCH",
      headers: headersAuth(),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        "Error al cambiar el estado del evento"
    );
  }

  return datos;
};