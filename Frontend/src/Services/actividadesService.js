import api from "../Api/Api";

export const obtenerActividades = (materiaId = "") => {
  const query = materiaId ? `?materiaId=${materiaId}` : "";
  return api.get(`/actividades${query}`);
};

export const crearActividad = (data) => {
  return api.post("/actividades/crear", data);
};

export const editarEstadoActividad = (id, estado) => {
  return api.post("/actividades/editar-estado", { id, estado });
};

export const editarActividad = (data) => {
  return api.post("/actividades/editar", data);
};

export const eliminarActividad = (id) => {
  return api.delete(`/actividades/eliminar/${id}`);
};

export const obtenerActividadesAdmin = () => {
  return api.get("/actividades/admin/listar");
};