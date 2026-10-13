import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FooterBanner from "./FooterBanner";

function CoordinadorLayout() {
  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const location =
    useLocation();

  // =====================================================
  // CERRAR SIDEBAR AL CAMBIAR DE RUTA EN MÓVIL
  // =====================================================

  useEffect(() => {
    setMenuAbierto(false);
  }, [
    location.pathname,
  ]);

  // =====================================================
  // BLOQUEAR SCROLL CUANDO EL MENÚ MÓVIL ESTÁ ABIERTO
  // =====================================================

  useEffect(() => {
    if (menuAbierto) {
      document.body.classList.add(
        "sportu-menu-open"
      );
    } else {
      document.body.classList.remove(
        "sportu-menu-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "sportu-menu-open"
      );
    };
  }, [
    menuAbierto,
  ]);

  return (
    <div className="sportu-app">

      <Topbar
        onMenuToggle={() =>
          setMenuAbierto(
            (anterior) =>
              !anterior
          )
        }
      />

      <div className="sportu-body">

        <Sidebar
          abierto={
            menuAbierto
          }
          onClose={() =>
            setMenuAbierto(
              false
            )
          }
        />

        {menuAbierto && (
          <button
            type="button"
            className="sportu-sidebar-overlay"
            aria-label="Cerrar menú"
            onClick={() =>
              setMenuAbierto(
                false
              )
            }
          />
        )}

        <main className="sportu-main">

          <div className="sportu-content">
            <Outlet />
          </div>

        </main>

      </div>

      <FooterBanner />

    </div>
  );
}

export default CoordinadorLayout;