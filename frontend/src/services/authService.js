const API_URL = "http://localhost:3000/api/auth";

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