import api from "../Api/Api";

export const login = (email, password) => {
    return api.post("/auth/login", {email, password});
};

export const register = (nombre, apellido, email, password) => {
    return api.post("/auth/register", {
        nombre,
        apellido,
        email,
        password
    });
};

export const registerAdmin = (data) => {
  return api.post("/auth/admin/register", data);
};

export const obtenerUsuarios = () => {
  return api.get("/auth/listar");
};

export const editarUsuarioAdmin = (id, data) => {
  return api.put(`/auth/editar/${id}`, data);
};