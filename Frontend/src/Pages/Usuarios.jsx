import { useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiPlus
} from "react-icons/fi";
import {
  obtenerUsuarios,
  editarUsuarioAdmin,
  registerAdmin
} from "../Services/authService";
import CustomAlert from "../Components/alert";
import "../Styles/admin.css";

function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("estudiante");

  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [nombreEditar, setNombreEditar] = useState("");
  const [apellidoEditar, setApellidoEditar] = useState("");
  const [emailEditar, setEmailEditar] = useState("");

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

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await obtenerUsuarios();
      setUsuarios(res.data || []);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error al cargar usuarios", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const limpiarFormularioCrear = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setPassword("");
    setRol("estudiante");
  };

  const cerrarModalCrear = () => {
    limpiarFormularioCrear();
    setMostrarModalCrear(false);
  };

  const cerrarModalEditar = () => {
    setUsuarioEditandoId(null);
    setNombreEditar("");
    setApellidoEditar("");
    setEmailEditar("");
    setMostrarModalEditar(false);
  };

  const abrirEditarUsuario = (usuario) => {
    setUsuarioEditandoId(usuario._id);
    setNombreEditar(usuario.nombre || "");
    setApellidoEditar(usuario.apellido || "");
    setEmailEditar(usuario.email || "");
    setMostrarModalEditar(true);
    setMenuAbierto(null);
  };

  const resumen = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.activo).length;
    const inactivos = usuarios.filter((u) => !u.activo).length;
    const admins = usuarios.filter((u) => u.rol === "admin").length;
    const estudiantes = usuarios.filter((u) => u.rol === "estudiante").length;

    return { total, activos, inactivos, admins, estudiantes };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    let lista = [...usuarios];

    if (busqueda.trim()) {
      const texto = busqueda.toLowerCase();
      lista = lista.filter((u) => {
        const nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
        const correo = (u.email || "").toLowerCase();
        return nombreCompleto.includes(texto) || correo.includes(texto);
      });
    }

    if (filtroRol !== "todos") {
      lista = lista.filter((u) => u.rol === filtroRol);
    }

    if (filtroEstado !== "todos") {
      const esActivo = filtroEstado === "activos";
      lista = lista.filter((u) => Boolean(u.activo) === esActivo);
    }

    return lista.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const cambiarEstado = async (usuario) => {
    try {
      await editarUsuarioAdmin(usuario._id, {
        activo: !usuario.activo
      });

      mostrarAlerta(
        usuario.activo
          ? "Usuario inactivado correctamente"
          : "Usuario activado correctamente",
        "success"
      );

      setMenuAbierto(null);
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo actualizar el estado",
        "error"
      );
    }
  };

  const cambiarRol = async (usuario, nuevoRol) => {
    try {
      await editarUsuarioAdmin(usuario._id, {
        rol: nuevoRol
      });

      mostrarAlerta("Rol actualizado correctamente", "success");
      setMenuAbierto(null);
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo actualizar el rol",
        "error"
      );
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);

      await registerAdmin({
        nombre,
        apellido,
        email,
        password,
        rol
      });

      mostrarAlerta("Usuario creado correctamente", "success");
      cerrarModalCrear();
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo crear el usuario",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarUsuario = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);

      await editarUsuarioAdmin(usuarioEditandoId, {
        nombre: nombreEditar,
        apellido: apellidoEditar,
        email: emailEditar
      });

      mostrarAlerta("Usuario actualizado correctamente", "success");
      cerrarModalEditar();
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      mostrarAlerta(
        error?.response?.data?.message || "No se pudo editar el usuario",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (cargando) {
    return <div className="admin-dashboard-page">Cargando usuarios...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <CustomAlert
        visible={alertaVisible}
        message={alertaMensaje}
        type={alertaTipo}
        onClose={() => setAlertaVisible(false)}
      />

      <div className="admin-dashboard-header admin-header-row">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra cuentas, roles y estado de acceso del sistema.</p>
        </div>

        <button
          className="btn-admin-primary"
          onClick={() => setMostrarModalCrear(true)}
        >
          <FiPlus />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUsers />
          </div>
          <div>
            <small>Total usuarios</small>
            <h3>{resumen.total}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUserCheck />
          </div>
          <div>
            <small>Activos</small>
            <h3>{resumen.activos}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUserX />
          </div>
          <div>
            <small>Inactivos</small>
            <h3>{resumen.inactivos}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiShield />
          </div>
          <div>
            <small>Administradores</small>
            <h3>{resumen.admins}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FiUsers />
          </div>
          <div>
            <small>Estudiantes</small>
            <h3>{resumen.estudiantes}</h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card">
        <div className="admin-filtros-bar">
          <input
            type="text"
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="admin-filtros-right">
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="estudiante">Estudiantes</option>
            </select>

            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="usuarios-admin-table">
          <div className="usuarios-admin-table-header">
            <div>Usuario</div>
            <div>Correo</div>
            <div>Rol</div>
            <div>Estado</div>
            <div>Registro</div>
            <div>Acciones</div>
          </div>

          {usuariosFiltrados.length > 0 ? (
            usuariosFiltrados.map((usuario) => (
              <div className="usuarios-admin-row" key={usuario._id}>
                <div className="usuario-cell usuario-main">
                  <div className="usuario-avatar">
                    {(usuario.nombre?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h4>{usuario.nombre} {usuario.apellido}</h4>
                  </div>
                </div>

                <div className="usuario-cell usuario-email">{usuario.email}</div>

                <div className="usuario-cell">
                  <span className={`usuario-badge rol-${usuario.rol}`}>
                    {usuario.rol}
                  </span>
                </div>

                <div className="usuario-cell">
                  <span className={`usuario-badge ${usuario.activo ? "estado-activo" : "estado-inactivo"}`}>
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="usuario-cell">{formatearFecha(usuario.fechaRegistro)}</div>

                <div className="usuario-cell usuario-actions-menu">
                  <button
                    className="menu-acciones-btn admin-menu-btn"
                    onClick={() =>
                      setMenuAbierto(menuAbierto === usuario._id ? null : usuario._id)
                    }
                  >
                    ⋯
                  </button>

                  {menuAbierto === usuario._id && (
                    <div className="menu-acciones admin-menu-acciones">
                      <button onClick={() => abrirEditarUsuario(usuario)}>
                        Editar usuario
                      </button>

                      <button onClick={() => cambiarEstado(usuario)}>
                        {usuario.activo ? "Inactivar cuenta" : "Activar cuenta"}
                      </button>

                      <button
                        onClick={() =>
                          cambiarRol(
                            usuario,
                            usuario.rol === "admin" ? "estudiante" : "admin"
                          )
                        }
                      >
                        {usuario.rol === "admin" ? "Hacer estudiante" : "Hacer admin"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="usuarios-admin-empty">
              No se encontraron usuarios con los filtros aplicados.
            </div>
          )}
        </div>
      </div>

      {mostrarModalCrear && (
        <div className="modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <div>
                <h2>Nuevo usuario</h2>
                <p>Crea una nueva cuenta y asigna su rol dentro del sistema.</p>
              </div>
            </div>

            <form className="admin-modal-form" onSubmit={handleCrearUsuario}>
              <div className="admin-modal-grid">
                <div>
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label>Correo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="admin-modal-grid">
                <div>
                  <label>Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Rol</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-admin-cancel"
                  onClick={cerrarModalCrear}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-admin-save"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && (
        <div className="modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <div>
                <h2>Editar usuario</h2>
                <p>Actualiza el nombre, apellido y correo del usuario.</p>
              </div>
            </div>

            <form className="admin-modal-form" onSubmit={handleEditarUsuario}>
              <div className="admin-modal-grid">
                <div>
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={nombreEditar}
                    onChange={(e) => setNombreEditar(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Apellido</label>
                  <input
                    type="text"
                    value={apellidoEditar}
                    onChange={(e) => setApellidoEditar(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label>Correo</label>
                <input
                  type="email"
                  value={emailEditar}
                  onChange={(e) => setEmailEditar(e.target.value)}
                  required
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-admin-cancel"
                  onClick={cerrarModalEditar}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-admin-save"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosAdmin;
