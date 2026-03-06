require('dotenv').config();
const dtb = require('./Config/DataBase');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/auth', require('./Routes/AuthRoutes'));
app.use('/api/periodos', require('./Routes/periodoRoutes'));
app.use('/api/materias', require('./Routes/materiaRoute'));
app.use('/api/actividades', require('./Routes/ActividadRoutes'));
app.use('/api/disponibilidad', require('./Routes/DisponibilidadRoutes'));
app.use('/api/plan', require('./Routes/PlanRoutes'));

app.listen(process.env.PORT, () => {
  console.log('Servidor iniciado en puerto ' + (process.env.PORT));
})