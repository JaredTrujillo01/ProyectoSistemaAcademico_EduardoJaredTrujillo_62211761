import { useState } from "react";
import { login } from "../Services/authService";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import logo from "../assets/Logo.png";
import "../Styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLogin("");

    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      if (res.data.usuario.rol === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorLogin(
        error?.response?.data?.message
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo-box">
          <img src={logo} alt="EduPlanner" className="auth-logo-img" />
          <h2 className="logo">EduPlanner</h2>
        </div>

        <h3 className="auth-title">Bienvenido de nuevo</h3>
        <p className="auth-subtitle">
          Inicia sesión para que puedas organizar tu día
        </p>

        {errorLogin && (
          <div className="auth-message auth-message-error">
            <FiAlertCircle className="auth-message-icon" />
            <span>{errorLogin}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Ingresa tu email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="ejemplo@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorLogin) setErrorLogin("");
                }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Ingresa tu contraseña</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="******"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorLogin) setErrorLogin("");
                }}
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
            Iniciar Sesión
          </button>
        </form>

        <p className="switch">
          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;