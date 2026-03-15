import api from "../Api/Api";

export const obtenerPeriodos = () => {
  return api.get("/periodos");
};

export const crearPeriodo = (data) => {
  return api.post("/periodos/crear", data);
};

export const editarPeriodo = (id, data) => {
  return api.put(`/periodos/editar/${id}`, data);
};

export const eliminarPeriodo = (id) => {
  return api.delete(`/periodos/eliminar/${id}`);
};

export const obtenerPeriodosAdmin = () => {
  return api.get("/periodos/admin/listar");
};