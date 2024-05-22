const API_URL = 'http://localhost:3000/api/alumnos/HAGZ954961XYI5/materias-con-horario';

const app = document.querySelector('#app');

// Función para crear el HTML del alumno
function crearHTMLAlumno(alumno) {
  return `
    <div>
      <h2>${alumno.nombre}</h2>
      <p>CURP: ${alumno.curp}</p>
      <p>Número de control: ${alumno.nc}</p>
      <p>Carrera: ${alumno.carrera}</p>
      <p>Instituto Tecnológico: ${alumno.tecnologico}</p>
    </div>
  `;
}

// Función para crear el HTML de las materias
function crearHTMLMaterias(materias) {
  const items = materias.map(materia => `
    <li>
      <h3>${materia.nombre}</h3>
      <p>ID: ${materia.id}</p>
      <p>Carrera: ${materia.carrera}</p>
      <p>Descripción: ${materia.descripcion}</p>
      <p>Plan de estudios: ${materia.planestudios}</p>
      <p>Horario: ${materia.horario}</p>
    </li>
  `).join('');
  return `<ul>${items}</ul>`;
}

// Función para renderizar el contenido en el HTML
function renderizarDatos(alumno, materias) {
  const htmlAlumno = crearHTMLAlumno(alumno);
  const htmlMaterias = crearHTMLMaterias(materias);
  app.innerHTML = `<div>${htmlAlumno}${htmlMaterias}</div>`;
}

// Realizamos la petición a la API
fetch(API_URL)
  .then(response => response.json())
  .then(data => {
    const { alumno, materias } = data;
    renderizarDatos(alumno, materias);
  })
  .catch(error => console.error('Error al cargar los datos:', error));
