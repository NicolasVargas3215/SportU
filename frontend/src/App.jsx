import {
  Route,
  Routes,
} from "react-router-dom";

// =====================================================
// GENERALES
// =====================================================

import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";

// =====================================================
// COORDINADOR
// =====================================================

import CoordinadorLayout from "./components/layout/CoordinadorLayout";

import DashboardCoordinador from "./pages/coordinador/DashboardCoordinador";
import DeportesPage from "./pages/coordinador/DeportesPage";
import EventosPage from "./pages/coordinador/EventosPage";
import EventoFormPage from "./pages/coordinador/EventoFormPage";
import InventarioPage from "./pages/coordinador/InventarioPage";
import PrestamosPage from "./pages/coordinador/PrestamosPage";
import HorasPage from "./pages/coordinador/HorasPage";
import SeguimientoEventoPage from "./pages/coordinador/SeguimientoEventoPage";

// =====================================================
// ESTUDIANTE
// =====================================================

import EstudianteLayout from "./components/layout/EstudianteLayout";

import DashboardEstudiante from "./pages/estudiante/DashboardEstudiante";
import EventosDisponiblesPage from "./pages/estudiante/EventosDisponiblesPage";
import MisInscripcionesPage from "./pages/estudiante/MisInscripcionesPage";
import PerfilEstudiantePage from "./pages/estudiante/PerfilEstudiantePage";

// =====================================================
// DOCENTE
// =====================================================

import DocenteLayout from "./components/layout/DocenteLayout";

import DashboardDocente from "./pages/docente/DashboardDocente";
import MisActividadesPage from "./pages/docente/MisActividadesPage";
import AsistenciaPage from "./pages/docente/AsistenciaPage";

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <Routes>

      {/* =============================================== */}
      {/* CARGA */}
      {/* =============================================== */}

      <Route
        path="/"
        element={
          <LoadingPage />
        }
      />

      {/* =============================================== */}
      {/* LOGIN */}
      {/* =============================================== */}

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      {/* =============================================== */}
      {/* ESTUDIANTE */}
      {/* =============================================== */}

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

        <Route
          index
          element={
            <DashboardEstudiante />
          }
        />

        <Route
          path="eventos"
          element={
            <EventosDisponiblesPage />
          }
        />

        <Route
          path="inscripciones"
          element={
            <MisInscripcionesPage />
          }
        />

        <Route
          path="perfil"
          element={
            <PerfilEstudiantePage />
          }
        />

      </Route>

      {/* =============================================== */}
      {/* DOCENTE */}
      {/* =============================================== */}

      <Route
        path="/docente"
        element={
          <ProtectedRoute
            rolesPermitidos={[
              "docente",
            ]}
          >
            <DocenteLayout />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={
            <DashboardDocente />
          }
        />

        <Route
          path="actividades"
          element={
            <MisActividadesPage />
          }
        />

        <Route
          path="actividades/:id/asistencia"
          element={
            <AsistenciaPage />
          }
        />

      </Route>

      {/* =============================================== */}
      {/* COORDINADOR */}
      {/* =============================================== */}

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

        <Route
          index
          element={
            <DashboardCoordinador />
          }
        />

        <Route
          path="deportes"
          element={
            <DeportesPage />
          }
        />

        <Route
          path="eventos"
          element={
            <EventosPage />
          }
        />

        <Route
          path="eventos/nuevo"
          element={
            <EventoFormPage />
          }
        />

        <Route
          path="eventos/editar/:id"
          element={
            <EventoFormPage />
          }
        />

        <Route
          path="eventos/:id/seguimiento"
          element={
            <SeguimientoEventoPage />
          }
        />

        <Route
          path="inventario"
          element={
            <InventarioPage />
          }
        />

        <Route
          path="prestamos"
          element={
            <PrestamosPage />
          }
        />

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
