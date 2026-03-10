import { useState } from "react";
import { register } from "../Services/authService";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import CustomAlert from "../Components/alert";
import logo from "../assets/logo.png";
import "../Styles/auth.css";

function Register() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [alertaVisible, setAlertaVisible] = useState(false);
  const [alertaMensaje, setAlertaMensaje] = useState("");
  const [alertaTipo, setAlertaTipo] = useState("success");

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlertaMensaje(mensaje);
    setAlertaTipo(tipo);
    setAlertaVisible(true);

    setTimeout(() => {
      setAlertaVisible(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(nombre, apellido, email, password);
      mostrarAlerta("Usuario registrado correctamente", "success");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      mostrarAlerta(
        error?.response?.data?.message || "Error al registrar usuario",
        "error"
      );
    }
  };

  return (
    <div className="auth-container">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <div className="auth-card">
        <div className="auth-logo-box">
          <img src={logo} alt="EduPlanner" className="auth-logo-img" />
          <h2 className="logo">EduPlanner</h2>
        </div>

        <h3 className="auth-title">Crear cuenta</h3>
        <p className="auth-subtitle">
          Regístrate para comenzar a organizar tu estudio
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Nombre</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Apellido</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Ingresa tu apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="ejemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn">
            Registrarse
          </button>
        </form>

        <p className="switch">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;