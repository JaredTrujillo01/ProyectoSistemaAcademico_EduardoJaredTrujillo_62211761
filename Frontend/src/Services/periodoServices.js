import api from "../Api/Api";

export const obtenerPeriodos = () => {
  return api.get("/periodos");
};

export const crearPeriodo = (data) => {
  return api.post("/periodos/crear", data);
};