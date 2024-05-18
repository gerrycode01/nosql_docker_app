//rutasmaterias.js
const express = require('express');
const neo4j = require("neo4j-driver");
var router = express.Router();
const cache = require("./cache");


var driver = neo4j.driver(
   'neo4j://neo4j01',
   neo4j.auth.basic('neo4j', 'neo4j')
);


// Q1. Crear materias con sus atributos y la etiqueta Materia
router.route('/materia')
   .all(cache)
   .post(async (req, res) => {
       const session = driver.session();
       await session.run('CREATE (n:Materia {nombre:$nombre, clave:$clave, grupo:$grupo, aula:$aula, horario:$horario}) RETURN n',
           {
               nombre: req.body.nombre,
               clave: req.body.clave,
               grupo: req.body.grupo,
               aula: req.body.aula,
               horario: req.body.horario
           })
           .then(result => {
               materia = result.records.map(record => {
                   return record.get('n').properties;
               })
               res.json({ Materia: materia });
           })
           .catch(error => {
               console.log(error);
           })
           .then(() => session.close())
   });


// Q2. Consultar todos los alumnos inscritos en determinada materia
router.route('/materia/:clave')
   .all(cache)
   .get(async (req, res) => {
 const session = driver.session();
       await session.run('MATCH (a1:Alumno)-[:INSCRITO_EN]->(m1:Materia{clave:$clave}) RETURN a1', {
           clave: req.params.clave
       })
           .then(result => {
               alumnos = result.records.map(record => {
                   return record.get('a1').properties;
               })
               res.json({ Alumnos: alumnos });
           })
           .catch(error => {
               console.log(error);
           })
           .then(() => session.close())
   });


module.exports = router;
