const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

export const iniciarSesion = async (correo, contrasena) => {
  const respuesta = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo,
      contrasena,
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al iniciar sesión");
  }

  return datos;
};

export const iniciarSesionConGoogle = async (credential) => {
  const respuesta = await fetch(`${API_URL}/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al iniciar sesión con Google");
  }

  return datos;
};
