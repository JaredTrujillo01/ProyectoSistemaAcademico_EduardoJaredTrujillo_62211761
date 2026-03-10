import api from "../Api/Api";

export const obtenerDisponibilidad = () => {
  return api.get("/disponibilidad");
};

export const guardarDisponibilidad = (data) => {
  return api.post("/disponibilidad/guardar", data);
};