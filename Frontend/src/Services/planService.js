import api from "../Api/Api";

export const generarPlan = (periodoId) => {
    return api.post("/plan/generar", {periodoId});
}

export const obtenerPlan = (periodoId) => {
  return api.get(`/plan/periodo/${periodoId}`);
};