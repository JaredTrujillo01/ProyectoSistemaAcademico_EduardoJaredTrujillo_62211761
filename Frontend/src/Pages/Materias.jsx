import { useLocation } from "react-router-dom";
import "../Styles/layout.css";

function Navbar() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  const obtenerTitulo = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Inicio";
      case "/periodos":
        return "Gestión de Períodos";
      case "/materias":
        return "Gestión de Materias";
      case "/actividades":
        return "Gestión de Actividades";
      case "/disponibilidad":
        return "Gestión de Disponibilidad";
      case "/plan-estudio":
        return "Plan de Estudio";
      default:
        return "Inicio";
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-breadcrumb">
        <span>EduPlanner</span>
        <span className="breadcrumb-separator">›</span>
        <strong>{obtenerTitulo()}</strong>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-user-info">
            <strong>{usuario?.nombre} {usuario?.apellido}</strong>
            <p>{usuario?.rol}</p>
          </div>

          <div className="user-avatar">
            {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;