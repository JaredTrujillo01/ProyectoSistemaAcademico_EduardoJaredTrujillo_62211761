const mongoose = require('mongoose');

const url = 'mongodb://localhost:27017/SistemaAcademico';

mongoose.connect(url);

const database = mongoose.connection;
database.on('Error', console.error.bind(console, 'Error de conexión a la base de datos:'));
database.once('open', function callback() {
    console.log('Conexión Exitosa');
});