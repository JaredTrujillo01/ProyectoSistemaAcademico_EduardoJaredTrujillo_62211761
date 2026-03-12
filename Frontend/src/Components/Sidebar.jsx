import { Link, useLocation, useNavigate } from "react-router-dom";
import {FiHome, FiCalendar, FiBookOpen, FiCheckCircle, FiClock, FiClipboard, FiLogOut } from "react-icons/fi";
import logo from "../assets/Logo.png";
import "../Styles/layout.css";

function Sidebar(){
    const location = useLocation();
    const navigate = useNavigate();
    const cerrarSesion = () => {
        localStorage.removeItem("token");
        navigate("/");
    };
    const menuItems = [
        {path: "/dashboard", label: "Inicio", icon: <FiHome/>},
        {path: "/periodos", label: "Periodos", icon: <FiCalendar/>},
        {path: "/materias", label: "Materias", icon: <FiBookOpen/>},
        {path: "/actividades", label: "Actividades", icon: <FiCheckCircle/>},
        {path: "/disponibilidad", label: "Disponibilidad", icon: <FiClock/>},
        {path: "/plan-estudio", label: "Plan de Estudio", icon: <FiClipboard/>}
    ];
    return (
        <aside className="sidebar">
            <div>
                <div className="sidebar-logo">
                    <img src={logo} alt="EduPlanner"/>
                <div>
                    <h2>EduPlanner</h2>
                    <p>Organiza tu camino al exito</p>
                </div>
                </div>
                <nav className="sidebar-menu">
                    {menuItems.map((item)=> (
                        <Link
                        key={item.path}
                        to={item.path}
                        className={location.pathname == item.path? "menu-item active" : "menu-item"}
                        >
                            <span className="menu-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
            <button className="logout-btn" onClick={cerrarSesion}>
                <FiLogOut/>
                <span>Cerrar Sesion</span>
            </button>
        </aside>
    )
}

export default Sidebar;