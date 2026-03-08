import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")?.trim();

  if (token) {
    // Ensure headers object exists (some axios configs may omit it)
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;