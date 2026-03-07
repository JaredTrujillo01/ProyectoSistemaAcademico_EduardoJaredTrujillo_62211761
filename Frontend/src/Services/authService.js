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