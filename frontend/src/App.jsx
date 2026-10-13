import {
  Routes,
  Route,
} from "react-router-dom";

// =========================================
// PÁGINAS GENERALES
// =========================================

import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";

// =========================================
// ESTUDIANTE
// =========================================

import DashboardEstudiante from "./pages/estudiante/DashboardEstudiante";
import EventosDisponiblesPage from "./pages/estudiante/EventosDisponiblesPage";
import MisInscripcionesPage from "./pages/estudiante/MisInscripcionesPage";
import PerfilEstudiantePage from "./pages/estudiante/PerfilEstudiantePage";

// =========================================
// DOCENTE
// =========================================

import DocentePage from "./pages/docente/DocentePage";

// =========================================
// COORDINADOR
// =========================================

import DashboardCoordinador from "./pages/coordinador/DashboardCoordinador";
import DeportesPage from "./pages/coordinador/DeportesPage";
import EventosPage from "./pages/coordinador/EventosPage";
import EventoFormPage from "./pages/coordinador/EventoFormPage";
import InventarioPage from "./pages/coordinador/InventarioPage";
import PrestamosPage from "./pages/coordinador/PrestamosPage";
import HorasPage from "./pages/coordinador/HorasPage";

// =========================================
// LAYOUTS
// =========================================

import EstudianteLayout from "./components/layout/EstudianteLayout";
import CoordinadorLayout from "./components/layout/CoordinadorLayout";

// =========================================
// PROTECCIÓN DE RUTAS
// =========================================

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* =================================== */}
      {/* PANTALLA DE CARGA */}
      {/* =================================== */}

      <Route
        path="/"
        element={
          <LoadingPage />
        }
      />

      {/* =================================== */}
      {/* LOGIN */}
      {/* =================================== */}

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      {/* =================================== */}
      {/* ESTUDIANTE */}
      {/* =================================== */}

      <Route
        path="/estudiante"
        element={
          <ProtectedRoute
            rolesPermitidos={[
              "estudiante",
            ]}
          >
            <EstudianteLayout />
          </ProtectedRoute>
        }
      >

        {/* INICIO */}

        <Route
          index
          element={
            <DashboardEstudiante />
          }
        />

        {/* EVENTOS DISPONIBLES */}

        <Route
          path="eventos"
          element={
            <EventosDisponiblesPage />
          }
        />

        {/* MIS INSCRIPCIONES */}

        <Route
          path="inscripciones"
          element={
            <MisInscripcionesPage />
          }
        />

        {/* PERFIL */}

        <Route
          path="perfil"
          element={
            <PerfilEstudiantePage />
          }
        />

      </Route>

      {/* =================================== */}
      {/* DOCENTE */}
      {/* =================================== */}

      <Route
        path="/docente"
        element={
          <ProtectedRoute
            rolesPermitidos={[
              "docente",
            ]}
          >
            <DocentePage />
          </ProtectedRoute>
        }
      />

      {/* =================================== */}
      {/* COORDINADOR */}
      {/* =================================== */}

      <Route
        path="/coordinador"
        element={
          <ProtectedRoute
            rolesPermitidos={[
              "coordinador",
            ]}
          >
            <CoordinadorLayout />
          </ProtectedRoute>
        }
      >

        {/* DASHBOARD */}

        <Route
          index
          element={
            <DashboardCoordinador />
          }
        />

        {/* DEPORTES */}

        <Route
          path="deportes"
          element={
            <DeportesPage />
          }
        />

        {/* EVENTOS */}

        <Route
          path="eventos"
          element={
            <EventosPage />
          }
        />

        {/* CREAR EVENTO */}

        <Route
          path="eventos/nuevo"
          element={
            <EventoFormPage />
          }
        />

        {/* EDITAR EVENTO */}

        <Route
          path="eventos/editar/:id"
          element={
            <EventoFormPage />
          }
        />

        {/* INVENTARIO */}

        <Route
          path="inventario"
          element={
            <InventarioPage />
          }
        />

        {/* PRÉSTAMOS */}

        <Route
          path="prestamos"
          element={
            <PrestamosPage />
          }
        />

        {/* HORAS DEPORTIVAS */}

        <Route
          path="horas"
          element={
            <HorasPage />
          }
        />

      </Route>

    </Routes>
  );
}

export default App;