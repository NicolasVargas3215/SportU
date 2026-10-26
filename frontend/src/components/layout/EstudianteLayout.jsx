import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Topbar from "./Topbar";
import FooterBanner from "./FooterBanner";
import StudentSidebar from "./StudentSidebar";

import "../../styles/estudiante.css";

function EstudianteLayout() {
  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const location =
    useLocation();

  useEffect(() => {
    setMenuAbierto(
      false
    );
  }, [
    location.pathname,
  ]);

  useEffect(() => {
    if (
      menuAbierto
    ) {
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
            (
              actual
            ) =>
              !actual
          )
        }
      />

      <div className="sportu-body">

        <StudentSidebar
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

export default EstudianteLayout;