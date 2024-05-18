//server.js
const express = require('express');
const app = express();
const neo4j = require("neo4j-driver");
const bodyParser = require('body-parser');
const PORT = 3000;


const rutaPruebaMateria = require('./rutas/rutasalumnos');
const rutaPruebaAlumno = require('./rutas/rutasmaterias');
//middlewares
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use('/api', rutaPruebaMateria, rutaPruebaAlumno);
app.listen(PORT, () => { console.log('Server en http://localhost:' + PORT) });
