import api from "../Api/Api";

export const obtenerMaterias = (periodoId = "") => {
    const query = periodoId? `?periodoId=${periodoId}`: "";
    return api.get(`/materias${query}`);
};

export const crearMateria = (data) => {
    return api.post("/materias/crear", data);
};