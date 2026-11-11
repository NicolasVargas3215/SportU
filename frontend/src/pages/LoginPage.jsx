import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FaArrowRight,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMedal,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

import {
  iniciarSesionConGoogle,
  iniciarSesion,
} from "../services/authService";

import "./loginPage.css";

function LoginPage() {
  const navigate =
    useNavigate();

  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    correo,
    setCorreo,
  ] = useState("");

  const [
    contrasena,
    setContrasena,
  ] = useState("");

  const [
    mostrarContrasena,
    setMostrarContrasena,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    logoError,
    setLogoError,
  ] = useState(false);

  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleConfigurado = Boolean(
    googleClientId && !googleClientId.startsWith("tu-client-id")
  );

  const guardarSesionYContinuar = (respuesta) => {
    localStorage.setItem("token", respuesta.token);
    localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));

    switch (respuesta.usuario.rol) {
      case "estudiante":
        navigate("/estudiante", { replace: true });
        break;
      case "docente":
        navigate("/docente", { replace: true });
        break;
      case "coordinador":
        navigate("/coordinador", { replace: true });
        break;
      default:
        setMensaje("El usuario no tiene un rol válido dentro de SportU.");
    }
  };

  useEffect(() => {
    if (!googleConfigurado || !googleButtonRef.current || !window.google?.accounts?.id) {
      return undefined;
    }

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (respuestaGoogle) => {
        try {
          setMensaje("");
          setCargando(true);
          const respuesta = await iniciarSesionConGoogle(respuestaGoogle.credential);
          guardarSesionYContinuar(respuesta);
        } catch (error) {
          setMensaje(error.message || "No fue posible iniciar sesión con Google.");
        } finally {
          setCargando(false);
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 398,
      logo_alignment: "left",
    });

    return undefined;
  }, [googleClientId, googleConfigurado]);

  // =====================================================
  // LOGIN
  // =====================================================

  const manejarLogin =
    async (event) => {
      event.preventDefault();

      setMensaje("");

      const correoLimpio =
        correo
          .trim()
          .toLowerCase();

      if (
        !correoLimpio ||
        !contrasena
      ) {
        setMensaje(
          "Ingresa tu correo institucional y contraseña."
        );

        return;
      }

      try {
        setCargando(true);

        const respuesta =
          await iniciarSesion(
            correoLimpio,
            contrasena
          );

        guardarSesionYContinuar(respuesta);
      } catch (error) {
        setMensaje(
          error.message ||
            "No fue posible iniciar sesión."
        );
      } finally {
        setCargando(false);
      }
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="sportu-login-page">

      {/* ================================================= */}
      {/* PANEL IZQUIERDO */}
      {/* ================================================= */}

      <section className="sportu-login-brand-panel">

        {/* DECORACIONES */}

        <div className="login-decoration-circle login-circle-one" />

        <div className="login-decoration-circle login-circle-two" />

        <div className="login-decoration-line login-line-one" />

        <div className="login-decoration-line login-line-two" />

        {/* UNIVERSIDAD */}

        <div className="login-university-brand">

          <div className="login-university-logo">

            {!logoError ? (
              <img
                src="/logo-uniautonoma.jpg"
                alt="Uniautónoma del Cauca"
                onError={() =>
                  setLogoError(
                    true
                  )
                }
              />
            ) : (
              <div className="login-logo-fallback">
                UA
              </div>
            )}

          </div>

          <div className="login-university-name">

            <strong>
              UNIAUTÓNOMA
            </strong>

            <span>
              DEL CAUCA
            </span>

          </div>

        </div>

        {/* CONTENIDO */}

        <div className="login-brand-content">

          <span className="login-brand-eyebrow">
            Plataforma institucional
          </span>

          <h1>
            Gestión de 
            <br />

            <span>
              Eventos deportivos.
            </span>
          </h1>

          <p>
            SportU centraliza la gestión de
            deportes, eventos, participantes,
            inventario, préstamos y horas
            deportivas de la comunidad
            universitaria.
          </p>

          {/* CARACTERÍSTICAS */}

          <div className="login-features">

            <div className="login-feature">

              <div className="login-feature-icon">
                <FaCalendarAlt />
              </div>

              <div>

                <strong>
                  Eventos deportivos
                </strong>

                <span>
                  Programación y participación
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                <FaUsers />
              </div>

              <div>

                <strong>
                  Comunidad universitaria
                </strong>

                <span>
                  Estudiantes, docentes y coordinación
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="login-feature-icon">
                <FaMedal />
              </div>

              <div>

                <strong>
                  Seguimiento deportivo
                </strong>

                <span>
                  Asistencias, horas y certificados
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* FOOTER IZQUIERDO */}

        <div className="login-brand-footer">

          <div className="login-brand-footer-line" />

          <span>
            Universidad Autónoma del Cauca
          </span>

        </div>

      </section>

      {/* ================================================= */}
      {/* PANEL DERECHO */}
      {/* ================================================= */}

      <section className="sportu-login-form-panel">

        {/* MARCA MOBILE */}

        <div className="login-mobile-brand">

          <div className="login-mobile-mark">
            S
          </div>

          <div>

            <strong>
              SportU
            </strong>

            <span>
              Uniautónoma del Cauca
            </span>

          </div>

        </div>

        {/* CARD */}

        <div className="sportu-login-card">

          {/* SPORTU */}

          <div className="login-sportu-brand">

            <div className="login-sportu-icon">
              S
            </div>

            <div>

              <strong>
                SportU
              </strong>

              <span>
                Sistema de Registro de Eventos Deportivos
              </span>

            </div>

          </div>

          {/* TÍTULO */}

          <div className="login-card-heading">

            <span>
              BIENVENIDO
            </span>

            <h2>
              Inicia sesión
            </h2>

            <p>
              Ingresa con las credenciales
              institucionales asignadas.
            </p>

          </div>

          {/* FORMULARIO */}

          <form
            className="login-form"
            onSubmit={
              manejarLogin
            }
          >

            {/* CORREO */}

            <div className="login-field">

              <label htmlFor="login-email">
                Correo institucional
              </label>

              <div className="login-input-container">

                <span className="login-input-prefix">
                  @
                </span>

                <input
                  id="login-email"
                  type="email"
                  placeholder="usuario@uniautonoma.edu.co"
                  value={
                    correo
                  }
                  onChange={(event) => {
                    setCorreo(
                      event.target.value
                    );

                    setMensaje("");
                  }}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* CONTRASEÑA */}

            <div className="login-field">

              <div className="login-label-row">

                <label htmlFor="login-password">
                  Contraseña
                </label>

                <span className="login-secure-label">

                  <FaLock />

                  Acceso seguro

                </span>

              </div>

              <div className="login-input-container">

                <span className="login-input-prefix">
                  <FaLock />
                </span>

                <input
                  id="login-password"
                  type={
                    mostrarContrasena
                      ? "text"
                      : "password"
                  }
                  placeholder="Ingresa tu contraseña"
                  value={
                    contrasena
                  }
                  onChange={(event) => {
                    setContrasena(
                      event.target.value
                    );

                    setMensaje("");
                  }}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  onClick={() =>
                    setMostrarContrasena(
                      (anterior) =>
                        !anterior
                    )
                  }
                >

                  {mostrarContrasena ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}

                </button>

              </div>

            </div>

            {/* ERROR */}

            {mensaje && (
              <div
                className="login-error-message"
                role="alert"
              >

                <div className="login-error-icon">
                  !
                </div>

                <span>
                  {mensaje}
                </span>

              </div>
            )}

            {/* BOTÓN */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={
                cargando
              }
            >

              {cargando ? (
                <>
                  <span className="login-spinner" />

                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión

                  <FaArrowRight />
                </>
              )}

            </button>

          </form>

          <div className="login-divider" aria-hidden="true">
            <span>o continúa con</span>
          </div>

          {googleConfigurado ? (
            <div className="login-google-button" ref={googleButtonRef} />
          ) : (
            <div className="login-google-unavailable">
              El acceso con Google quedará disponible cuando se configure la cuenta institucional.
            </div>
          )}

          {/* SEGURIDAD */}

          <div className="login-security-message">

            <FaShieldAlt />

            <div>

              <strong>
                Acceso institucional protegido
              </strong>

              <span>
                Solo usuarios autorizados pueden
                ingresar a SportU.
              </span>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="login-page-footer">

          <span>
            SportU
          </span>

          <span className="login-footer-dot">
            •
          </span>

          <span>
            Uniautónoma del Cauca
          </span>

        </div>

      </section>

    </main>
  );
}

export default LoginPage;
