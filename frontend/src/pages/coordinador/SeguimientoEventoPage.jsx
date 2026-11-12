import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaCalendarAlt, FaDownload, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import "./seguimientoEventoPage.css";

const API_URL = "http://localhost:3000/api/eventos";

const formatearEstado = (estado) => ({
  programada: "Programada",
  realizada: "Realizada",
  cancelada: "Cancelada",
}[estado] || estado || "—");

const formatearFecha = (fecha) => {
  if (!fecha) return "—";
  const valor = new Date(String(fecha).replace(" ", "T"));
  return Number.isNaN(valor.getTime())
    ? fecha
    : valor.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
};

function SeguimientoEventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [idSesion, setIdSesion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const respuesta = await fetch(`${API_URL}/${id}/seguimiento`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const respuestaDatos = await respuesta.json();
        if (!respuesta.ok) throw new Error(respuestaDatos.mensaje || "No fue posible cargar el seguimiento.");
        setDatos(respuestaDatos);
        setIdSesion(String(respuestaDatos.sesiones?.[0]?.id_sesion || ""));
      } catch (err) {
        setError(err.message || "No fue posible cargar el seguimiento.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const resumen = useMemo(() => {
    const estudiantes = datos?.estudiantes || [];
    return estudiantes.reduce((total, estudiante) => ({
      inscritos: total.inscritos + 1,
      asistencias: total.asistencias + Number(estudiante.asistencias || 0),
      noAsistencias: total.noAsistencias + Number(estudiante.no_asistencias || 0),
      pendientes: total.pendientes + Number(estudiante.pendientes || 0),
    }), { inscritos: 0, asistencias: 0, noAsistencias: 0, pendientes: 0 });
  }, [datos]);

  const obtenerEstadoSesion = (idInscripcion) => {
    const registro = (datos?.asistencias || []).find(
      (item) => String(item.id_inscripcion) === String(idInscripcion)
        && String(item.id_sesion) === String(idSesion)
    );
    return registro?.estado || "Pendiente";
  };

  const descargarListado = async () => {
    const XLSX = await import("xlsx");
    const filas = (datos?.estudiantes || []).map((estudiante) => ({
      Estudiante: estudiante.estudiante,
      Correo: estudiante.correo,
      "Sesiones programadas": Number(estudiante.sesiones_programadas || 0),
      "Sesiones evaluadas": Number(estudiante.sesiones_evaluadas || 0),
      Asistencias: Number(estudiante.asistencias || 0),
      "No asistencias": Number(estudiante.no_asistencias || 0),
      Pendientes: Number(estudiante.pendientes || 0),
      "Ponderado de asistencia": `${Number(estudiante.porcentaje_asistencia || 0).toFixed(1)}%`,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [
      { wch: 28 }, { wch: 34 }, { wch: 20 }, { wch: 18 },
      { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 25 },
    ];
    hoja["!autofilter"] = { ref: hoja["!ref"] };
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Seguimiento");
    XLSX.writeFile(libro, `seguimiento-${String(datos?.evento?.nombre || "evento").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.xlsx`);
  };

  if (cargando) return <div className="seguimiento-loading">Cargando seguimiento del evento...</div>;
  if (error) return <div className="seguimiento-error">{error}</div>;

  const evento = datos?.evento || {};

  return (
    <div className="seguimiento-page">
      <button type="button" className="seguimiento-back" onClick={() => navigate("/coordinador/eventos")}>
        <FaArrowLeft /> Volver a eventos
      </button>

      <div className="seguimiento-header">
        <div>
          <span className="seguimiento-eyebrow">SEGUIMIENTO INFORMATIVO</span>
          <h1>{evento.nombre}</h1>
          <p>{evento.deporte} · Docente: {evento.docente || "Sin asignar"}</p>
        </div>
        <button type="button" className="seguimiento-download" onClick={descargarListado}>
          <FaDownload /> Descargar listado
        </button>
      </div>

      <section className="seguimiento-event-card">
        <span><FaCalendarAlt /> {formatearFecha(evento.fecha_inicio)}</span>
        <span><FaMapMarkerAlt /> {evento.lugar || "Sin lugar"}</span>
        <span><FaUsers /> {datos?.sesiones?.length || 0} sesiones programadas</span>
      </section>

      <section className="seguimiento-summary-grid">
        <article><span>Inscritos</span><strong>{resumen.inscritos}</strong></article>
        <article><span>Asistencias registradas</span><strong>{resumen.asistencias}</strong></article>
        <article><span>No asistencias</span><strong>{resumen.noAsistencias}</strong></article>
        <article><span>Pendientes</span><strong>{resumen.pendientes}</strong></article>
      </section>

      <section className="seguimiento-card">
        <div className="seguimiento-card-heading">
          <div>
            <h2>Control de participantes</h2>
            <p>Consulta la asistencia y el ponderado sin modificar registros.</p>
          </div>
          <select value={idSesion} onChange={(event) => setIdSesion(event.target.value)} disabled={!datos?.sesiones?.length}>
            {!datos?.sesiones?.length && <option value="">Sin sesiones</option>}
            {(datos?.sesiones || []).map((sesion) => (
              <option key={sesion.id_sesion} value={sesion.id_sesion}>
                {sesion.fecha_sesion} — {sesion.hora_inicio} a {sesion.hora_fin}
              </option>
            ))}
          </select>
        </div>

        <div className="seguimiento-table-wrapper">
          <table className="seguimiento-table">
            <thead>
              <tr>
                <th>Estudiante</th><th>Correo</th><th>Sesiones</th><th>Asistió</th>
                <th>No asistió</th><th>Sesión seleccionada</th><th>Ponderado</th>
              </tr>
            </thead>
            <tbody>
              {(datos?.estudiantes || []).map((estudiante) => (
                <tr key={estudiante.id_inscripcion}>
                  <td><strong>{estudiante.estudiante}</strong></td>
                  <td>{estudiante.correo}</td>
                  <td>{estudiante.sesiones_evaluadas}/{estudiante.sesiones_programadas}</td>
                  <td>{estudiante.asistencias}</td>
                  <td>{estudiante.no_asistencias}</td>
                  <td><span className={`seguimiento-status ${obtenerEstadoSesion(estudiante.id_inscripcion).toLowerCase().replaceAll(" ", "-")}`}>
                    {obtenerEstadoSesion(estudiante.id_inscripcion)}
                  </span></td>
                  <td><strong>{Number(estudiante.porcentaje_asistencia || 0).toFixed(1)}%</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(datos?.estudiantes || []).length && <div className="seguimiento-empty">Este evento todavía no tiene estudiantes inscritos.</div>}
        </div>
      </section>
    </div>
  );
}

export default SeguimientoEventoPage;
