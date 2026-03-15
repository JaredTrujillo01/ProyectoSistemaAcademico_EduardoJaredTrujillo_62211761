import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiUsers,
  FiLogOut
} from "react-icons/fi";
import logo from "../assets/logo.png";
import "../Styles/layout.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
  const rol = usuario?.rol || "estudiante";

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const menuEstudiante = [
    { path: "/dashboard", label: "Inicio", icon: <FiHome /> },
    { path: "/periodos", label: "Periodos", icon: <FiCalendar /> },
    { path: "/materias", label: "Materias", icon: <FiBookOpen /> },
    { path: "/actividades", label: "Actividades", icon: <FiCheckCircle /> },
    { path: "/disponibilidad", label: "Disponibilidad", icon: <FiClock /> },
    { path: "/plan-estudio", label: "Plan de Estudio", icon: <FiClipboard /> }
  ];

  const menuAdmin = [
    { path: "/admin/dashboard", label: "Inicio", icon: <FiHome /> },
    { path: "/admin/usuarios", label: "Usuarios", icon: <FiUsers /> },
    { path: "/admin/periodos", label: "Periodos", icon: <FiCalendar /> },
    { path: "/admin/materias", label: "Materias", icon: <FiBookOpen /> },
    { path: "/admin/actividades", label: "Actividades", icon: <FiCheckCircle /> }
  ];

  const menuItems = rol === "admin" ? menuAdmin : menuEstudiante;

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <img src={logo} alt="EduPlanner" />
          <div>
            <h2>EduPlanner</h2>
            <p>
              {rol === "admin"
                ? "Panel administrativo"
                : "Organiza tu camino al éxito"}
            </p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname === item.path
                  ? "menu-item active"
                  : "menu-item"
              }
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <button className="logout-btn" onClick={cerrarSesion}>
        <FiLogOut />
        <span>Cerrar Sesion</span>
      </button>
    </aside>
  );
}

export default Sidebar;
