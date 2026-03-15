import api from "../Api/Api";

export const obtenerMaterias = (periodoId = "") => {
    const query = periodoId? `?periodoId=${periodoId}`: "";
    return api.get(`/materias${query}`);
};

export const crearMateria = (data) => {
    return api.post("/materias/crear", data);
};

export const editarMateria = (data) => {
  return api.post("/materias/editar", data);
};

export const eliminarMateria = (id) => {
  return api.delete(`/materias/eliminar/${id}`);
};

export const obtenerMateriasAdmin = () => {
  return api.get("/materias/admin/listar");
};