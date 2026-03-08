import "../Styles/dashboard.css";

function Dashboard() {
const usuario = JSON.parse(localStorage.getItem("usuario"));
  return (
    <div className="dashboard-page">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>¡Hola, {usuario?.nombre} {usuario?.apellido}!</h1>
          <p>Aquí está el resumen de tu mes académico.</p>
        </div>
        <div className="calendar-card">
          <div className="calendar-header">
            <h3>ENERO 2026</h3>
            <button>Hoy</button>
          </div>
          <div className="calendar-placeholder">
            Calendario que aun no esta JAJAJAJ
          </div>
        </div>
      </div>
      <div className="dashboard-side">
        <div className="smart-card">
          <h3>Planificación Inteligente</h3>
          <p>
            Genera automáticamente un horario de estudio optimizado
            basado en tus materias y disponibilidad.
          </p>
          <button>Generar Plan de Estudio</button>
        </div>
        <div className="next-tasks-card">
          <div className="next-tasks-header">
            <h3>Próximas actividades</h3>
            <span>Ver todo</span>
          </div>

          <div className="task-item">
            <strong>Prueba</strong>
            <p>Diseño de Interfaces - 2:35 PM</p>
          </div>
          <div className="task-item">
            <strong>prueba2 </strong>
            <p>Redes de Computadoras - 09:00 AM</p>
          </div>
          <div className="task-item">
            <strong>prueba 3</strong>
            <p>Matemáticas Discretas - 14:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;