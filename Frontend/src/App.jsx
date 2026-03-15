import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import Periodos from "./Pages/Periodos";
import Materias from "./Pages/Materias";
import Actividades from "./Pages/Actividades";
import Disponibilidad from "./Pages/Disponibilidad";
import PlanEstudio from "./Pages/PlanEstudio";
import AdminDashboard from "./Pages/adminDash";
import AdminUsuarios from "./Pages/Usuarios";
import AdminPeriodos from "./Pages/Aperiodos";
import AdminMaterias from "./Pages/Amaterias";
import AdminActividades from "./Pages/Aactividades";
import ProtectedRoute from "./Components/ProtectedRoute";
import MainLayout from "./Layouts/MainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>}/>
        <Route path="/periodos" element={<ProtectedRoute><MainLayout><Periodos /></MainLayout></ProtectedRoute>}/>
        <Route path="/materias" element={<ProtectedRoute><MainLayout><Materias /></MainLayout></ProtectedRoute>}/>
        <Route path="/actividades" element={<ProtectedRoute><MainLayout><Actividades /></MainLayout></ProtectedRoute>}/>
        <Route path="/disponibilidad" element={<ProtectedRoute><MainLayout><Disponibilidad /></MainLayout></ProtectedRoute>}/>
        <Route path="/plan-estudio" element={<ProtectedRoute><MainLayout><PlanEstudio /></MainLayout></ProtectedRoute>}/>
        <Route path="/admin/dashboard" element={<ProtectedRoute><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>}/>
        <Route path="/admin/usuarios" element={<ProtectedRoute><MainLayout><AdminUsuarios /></MainLayout></ProtectedRoute>}/>
        <Route path="/admin/periodos" element={<ProtectedRoute><MainLayout><AdminPeriodos/></MainLayout></ProtectedRoute>}/>
        <Route path="/admin/materias" element={<ProtectedRoute><MainLayout><AdminMaterias/></MainLayout></ProtectedRoute>}/>
        <Route path="/admin/actividades" element={<ProtectedRoute><MainLayout><AdminActividades/></MainLayout></ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;