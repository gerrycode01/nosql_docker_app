//rutasalumnos.js
const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./cache");


var driver = neo4j.driver(
   'neo4j://neo4j01',
   neo4j.auth.basic('neo4j', 'neo4j')
);


// Q3. Crear alumnos con sus atributos y la etiqueta Alumno.
//     Cuando un alumno es creado debe vincularse con una materia  mediante el enlace INSCRITO_EN
router.route('/alumno')
   .all(cache)
   .post(async (req, res) => {
       const q3 = 'MATCH (m:Materia{clave:$clave}) MERGE (n:Alumno{nombre:$nombre, apellido1:$apellido1, nctrl:$nctrl, carrera:$carrera}) MERGE (n)-[:INSCRITO_EN]->(m) RETURN n';
       const session = driver.session();
       await session.run(q3, {
           clave: req.body.clave,
           nombre: req.body.nombre,
           apellido1: req.body.apellido1,
           nctrl: req.body.nctrl,
           carrera: req.body.carrera
       })
           .then(result => {
               alumno = result.records.map(record => {
                   return record.get('n').properties;
               })
               res.json({ Alumno: alumno });
           })
           .catch(error => {
               console.log(error);
           })
           .then(() => session.close())
   });


// Q4. Consultar todas las materias en las que está inscrito un determinado alumno


router.route('/alumno/:nctrl')
   .get(async (req, res) => {
       const Q4 = 'MATCH (n:Alumno{nctrl:$nctrl})-[INSCRITO_EN]-> (m:Materia) RETURN m';
       const session = driver.session();
       await session.run(Q4, {
           nctrl: req.params.nctrl,
       })
           .then(result => {
               materia = result.records.map(record => {
                   return record.get('m').properties;
               })
               res.json({ Materia: materia });
           })
           .catch(error => {
               console.log(error);
           })
           .then(() => session.close())


   });


module.exports = router;
