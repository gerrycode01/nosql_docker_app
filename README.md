## Paso 1. Configuración del proyecto y dependencias 
### 1. Estructura del proyecto
#### Carpetas
tecApp/	
	src/
		controllers/
			alumnos.js
			materias.js
		models/
			alumno.js
			materia.js
		routes/
			alumnos.js
			materias.js
		middleware/
			logger.js
		config/
			db.js
		server.js
	Dockerfile
	.dockerignore
	docker-compose.yml
	.env

#### Cogido para crear estructura del proyecto
```bash
#!/bin/bash
mkdir tecApp/
cd tecApp/
mkdir src/
mkdir src/controllers/
touch src/controllers/alumnos.js
touch src/controllers/materias.js

mkdir src/models/
touch src/models/alumno.js
touch src/models/materia.js

mkdir src/routes/
touch src/routes/alumnos.js
touch src/routes/materias.js

mkdir src/middleware/
touch src/middleware/logger.js

mkdir src/config/
touch src/config/db.js

touch src/server.js

touch Dockerfile
touch .dockerignore
touch docker-compose.yml
touch .env
```

### 2. Inicializar proyecto de node.js
Abrir terminal
```bash
npm init -y 
```

### 3. Instalar dependencias
```bash
npm install express mongoose redis dotenv cors morgan body-parser
```

### 4. Opcional Modificar pakage.json
De:
```json
"scripts": {
	"test": "echo \"Error: no test specified\" && exit 1"
}
```
a:
```json
"scripts": {
	"start": "node src/server.js"
}
```
Si no quiero hacer esto puedo dejar que el `Dockerfile` que se presenta a continuación lo realice
## Paso 2. Configurar MongoDB y Redis con Docker
### Dockerfile
En nuestro archivo `Dockerfile` escribimos lo siguiente
```dockerfile
# Usar la imagen oficial de Node.js como base
FROM node:16

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm install

# Copiar el resto de los archivos del proyecto al directorio de trabajo
COPY . .

# Exponer el puerto en el que la aplicación va a correr
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]

```

### Docker-compose
En el archivo `docker-compose.yml` escribimos lo siguiente
```docker-compose
version: '3.8'

services:
  app:
    container_name: tecapp
    image: gespinosa01/tecapp-app
    ports:
      - "3000:3000"
    depends_on:
      - mongo01
      - mongo02
      - mongo03
      - mongo04
      - redis01
    environment:
      - MONGO_URI=mongodb://mongo01:27017,mongo02:27018,mongo03:27019,mongo04:27020/tec?replicaSet=rs0&serverSelectionTimeoutMS=60000
      - REDIS_HOST=redis01
      - REDIS_PORT=6379
      - PORT=3000
    networks:
      - red01

  mongo01:
    container_name: mongo01
    image: mongo:latest
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    networks:
      - red01

  mongo02:
    container_name: mongo02
    image: mongo:latest
    command: sh -c "sleep 30 && mongod --replSet rs0 --bind_ip_all"
    ports:
      - "27018:27017"
    networks:
      - red01

  mongo03:
    container_name: mongo03
    image: mongo:latest
    command: sh -c "sleep 30 && mongod --replSet rs0 --bind_ip_all"
    ports:
      - "27019:27017"
    networks:
      - red01

  mongo04:
    container_name: mongo04
    image: mongo:latest
    command: sh -c "sleep 30 && mongod --replSet rs0 --bind_ip_all"
    ports:
      - "27020:27017"
    networks:
      - red01

  redis01:
    container_name: redis01
    image: redis:latest
    ports:
      - "6379:6379"
    depends_on:
      - mongo01
      - mongo02
      - mongo03
      - mongo04
    networks:
      - red01

networks:
  red01:
    driver: bridge

```

Procedemos a ingresar al contenedor `mongo01` 
```sh
docker exec -it mongo01 bash -c mongosh
```

y pegamos el siguiente comando para levantar el replicaSet
```js
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo01:27017", priority: 2 },
    { _id: 1, host: "mongo02:27017", priority: 1 },
    { _id: 2, host: "mongo03:27017", priority: 1 },
    { _id: 3, host: "mongo04:27017", priority: 1 }
  ]
});
```

Salimos del contenedor y reiniciamos el app
```sh
docker restart tecapp
```
## Paso 3. Codigos y procedimientos
### server.js
En el archivo `server.js`
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./middleware/logger');
const { mongoose, redisClient } = require('./config/db');

const app = express();

// Middleware personalizado para registrar solicitudes en Redis
app.use(logger);

// Middleware para parsear solicitudes JSON
app.use(express.json());

// Middleware para permitir solicitudes de recursos cruzados
app.use(cors());

// Middleware para registrar solicitudes HTTP
app.use(morgan('dev'));

const alumnosRoutes = require('./routes/alumnos');
const materiasRoutes = require('./routes/materias');
const aulasRoutes = require('./routes/aulas');
const docentesRoutes = require('./routes/docentes');
const gruposRoutes = require('./routes/grupos');

app.use('/api/alumnos', alumnosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/grupos', gruposRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

### db.js
En el archivo `db.js`
```js
const mongoose = require("mongoose"); // Módulo para interactuar con MongoDB
const redis = require("redis"); // Módulo para interactuar con Redis

console.log("URI de MongoDB:", process.env.MONGO_URI);
console.log("Host de Redis:", process.env.REDIS_HOST);
console.log("Puerto de Redis:", process.env.REDIS_PORT);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Conectado a MongoDB"); // Mensaje de éxito en la conexión
  })
  .catch((error) => {
    console.error("Error al conectar a MongoDB:", error); // Mensaje de error en la conexión
  });

// Configuración de Redis
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient.on("error", (err) => {
  console.error("Error en la conexión a Redis:", err); // Mensaje de error en la conexión a Redis
});
redisClient
  .connect()
  .then(() => {
    console.log("Conectado a Redis");
  })
  .catch((err) => {
    console.error("No se pudo conectar a Redis:", err);
  });

// Exportamos las instancias de mongoose y redisClient para usarlas en otras partes de
// la aplicación
module.exports = { mongoose, redisClient };
```

### logger.js
En la carpeta middleware, modificamos `logger.js` para que haga un seguimiento de las solicitudes get y post desde la app a la base de datos
```js
const { redisClient } = require('../config/db');

module.exports = (req, res, next) => {
  res.on('finish', () => {
    console.log(`Log: Processing ${req.method} ${req.originalUrl}`);  // Log de diagnóstico

    if (!redisClient.isOpen) {
      console.error('Redis client -->> No conectado.');
      return;
    }

    const key = `${req.method}:${Date.now()}:${req.originalUrl}`;
    const logEntry = JSON.stringify({
      time: new Date(),
      req: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body
      },
      res: {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      }
    });

    redisClient.set(key, logEntry, 'EX', 60 * 60 * 24, (err) => {
      if (err) {
        console.error('Error al salvar en Redis:', err);
      } else {
        console.log(`Log saved: ${key}`);  // Confirmación de que el log fue guardado
      }
    });
  });

  next();
};
```

### Modelos
#### alumnos.js
```js
const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  curp: { type: String, required: true, unique: true },
  nc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materiasC: [{
    id: String,  // Utilizando un identificador personalizado
    cal: Number
  }],
  materiasA: [{ id: String }],  // Utilizando un identificador personalizado
  materiasP: [{ id: String }]  // Utilizando un identificador personalizado
}, { timestamps: true });

module.exports = mongoose.model('Alumno', alumnoSchema);
```

#### aula.js
```js
const mongoose = require('mongoose');

const aulaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  edificio: String,
  grupos: [{ id: String }],
  descripcion: String
}, { timestamps: true });

module.exports = mongoose.model('Aula', aulaSchema);
```

#### docente.js
```js
const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  rfc: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  tecnologico: String,
  materias: [{ id: String }]
}, { timestamps: true });

module.exports = mongoose.model('Docente', docenteSchema);
```

#### grupo.js
```js
const mongoose = require('mongoose');

const grupoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  materia: { id: String },
  docente: { rfc: String },
  alumnos: [{ curp: String }],
  aula: { id: String },
  horario: String
}, { timestamps: true });

module.exports = mongoose.model('Grupo', grupoSchema);
```

#### materia.js
```js
const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: String,
  carrera: String,
  descripcion: String,
  planestudios: String
}, { timestamps: true });

module.exports = mongoose.model('Materia', materiaSchema);
```

### Controladores
#### alumnos.js
```js
// En src/controllers/alumnos.js
const Alumno = require('../models/alumno');
const Materia = require('../models/materia');
const Grupo = require('../models/grupo');

// Obtener todos los alumnos
exports.getAllAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.status(200).json(alumnos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un alumno por CURP
exports.getAlumnoByCURP = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ curp: req.params.curp });
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json(alumno);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo alumno
exports.createAlumno = async (req, res) => {
  const alumno = new Alumno(req.body);
  try {
    const savedAlumno = await alumno.save();
    res.status(201).json(savedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar un alumno por CURP
exports.updateAlumno = async (req, res) => {
  try {
    const updatedAlumno = await Alumno.findOneAndUpdate({ curp: req.params.curp }, req.body, { new: true });
    if (updatedAlumno == null) {
      return res.status(404).json({ message: "No se encontró el alumno" });
    }
    res.status(200).json(updatedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un alumno por CURP
exports.deleteAlumno = async (req, res) => {
  try {
    const deletedAlumno = await Alumno.findOneAndDelete({ curp: req.params.curp });
    if (!deletedAlumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json({ message: 'Alumno eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMateriasCursadas = async (req, res) => {
  try {
    const alumnoConMaterias = await Alumno.aggregate([
      // Filtrar para obtener el alumno específico
      { $match: { curp: req.params.curp } },
      // Agregar información sobre las materias
      {
        $lookup: {
          from: Materia.collection.name,
          localField: 'materiasC.id',
          foreignField: 'id',
          as: 'materiasCursadas'
        }
      },
      {
        $project: {
          curp: 1,
          nc: 1,
          nombre: 1,
          carrera: 1,
          tecnologico: 1,
          materiasCursadas: 1
        }
      }
    ]);

    if (alumnoConMaterias.length === 0) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    res.status(200).json(alumnoConMaterias[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las materias cursadas del alumno: " + error.message });
  }
};

// Listar las calificaciones de un alumno en todas sus materias cursadas
exports.getCalificacionesAlumno = async (req, res) => {
  try {
    const { curp } = req.params;

    // Encuentra el alumno y realiza una búsqueda para las materias
    const alumno = await Alumno.findOne({ curp: curp });
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    // Extrayendo los IDs de materias cursadas
    const materiasIds = alumno.materiasC.map(m => m.id);

    // Obteniendo la información de las materias con esos IDs
    const materias = await Materia.find({ id: { $in: materiasIds } });

    // Construyendo la respuesta con las calificaciones
    const materiasConCalificaciones = alumno.materiasC.map(mc => {
      const materiaInfo = materias.find(m => m.id === mc.id);
      return {
        materia: materiaInfo,
        calificacion: mc.cal
      };
    });

    res.status(200).json({
      alumno: {
        curp: alumno.curp,
        nombre: alumno.nombre,
        carrera: alumno.carrera,
        materiasCursadas: materiasConCalificaciones
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las calificaciones del alumno: " + error.message });
  }
};

// Listar los alumnos que han obtenido una calificación superior a 90 en una materia específica
exports.getAlumnosCalificacionAlta = async (req, res) => {
  const materiaId = req.params.materiaId;

  try {
    // Encuentra la materia específica por su ID
    const materia = await Materia.findOne({ id: materiaId });
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }

    // Encuentra los alumnos con calificaciones superiores a 90 en esa materia
    const alumnos = await Alumno.find({
      materiasC: {
        $elemMatch: { id: materiaId, cal: { $gt: 90 } }
      }
    }, {
      curp: 1,
      nc: 1,
      nombre: 1,
      carrera: 1,
      tecnologico: 1,
      'materiasC.$': 1  // Proyecta solo el elemento coincidente en materiasC
    });

    res.status(200).json({
      materia: materia,
      alumnos: alumnos.map(alumno => ({
        curp: alumno.curp,
        nc: alumno.nc,
        nombre: alumno.nombre,
        carrera: alumno.carrera,
        tecnologico: alumno.tecnologico,
        calificacion: alumno.materiasC[0].cal  // Asumiendo que siempre habrá un elemento coincidente
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los datos: " + error.message });
  }
};


// Listar las materias que cursa un alumno específico, incluyendo horarios
exports.getMateriasAlumnoConHorario = async (req, res) => {
  try {
    const curp = req.params.curp;
    const alumno = await Alumno.findOne({ curp: curp }).select('-materiasC -materiasP');
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    // Obtener los grupos en los que el alumno está inscrito
    const grupos = await Grupo.find({ 'alumnos.curp': curp });
    const materiasIds = grupos.map(grupo => grupo.materia.id);

    // Obtener detalles de materias y combinar con horarios de los grupos
    const materias = await Materia.find({ id: { $in: materiasIds } });
    const materiasConHorarios = materias.map(materia => {
      const grupo = grupos.find(gr => gr.materia.id === materia.id);
      return {
        id: materia.id,
        nombre: materia.nombre,
        carrera: materia.carrera,
        descripcion: materia.descripcion,
        planestudios: materia.planestudios,
        horario: grupo ? grupo.horario : 'No especificado'
      };
    });

    res.status(200).json({
      alumno: {
        curp: alumno.curp,
        nc: alumno.nc,
        nombre: alumno.nombre,
        carrera: alumno.carrera,
        tecnologico: alumno.tecnologico
      },
      materias: materiasConHorarios
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las materias del alumno: " + error.message });
  }
};

// Listar las materias pendientes de cursar para un alumno específico
exports.getMateriasPendientes = async (req, res) => {
  try {
    const curp = req.params.curp;
    // Obtener el alumno excluyendo materiasC y materiasA
    const alumno = await Alumno.findOne({ curp: curp }).select('curp nc nombre carrera tecnologico materiasP');
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    // Obtener los IDs de las materias pendientes
    const materiasIds = alumno.materiasP.map(materia => materia.id);

    // Obtener los detalles completos de las materias pendientes
    const materias = await Materia.find({ id: { $in: materiasIds } });

    res.status(200).json({
      alumno: {
        curp: alumno.curp,
        nc: alumno.nc,
        nombre: alumno.nombre,
        carrera: alumno.carrera,
        tecnologico: alumno.tecnologico
      },
      materiasPendientes: materias
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las materias pendientes: " + error.message });
  }
};
```

#### aulas.js
```js
// En src/controllers/alumnos.js
const Alumno = require('../models/alumno');
const Materia = require('../models/materia');
const Grupo = require('../models/grupo');

// Obtener todos los alumnos
exports.getAllAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.status(200).json(alumnos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un alumno por CURP
exports.getAlumnoByCURP = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ curp: req.params.curp });
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json(alumno);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo alumno
exports.createAlumno = async (req, res) => {
  const alumno = new Alumno(req.body);
  try {
    const savedAlumno = await alumno.save();
    res.status(201).json(savedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar un alumno por CURP
exports.updateAlumno = async (req, res) => {
  try {
    const updatedAlumno = await Alumno.findOneAndUpdate({ curp: req.params.curp }, req.body, { new: true });
    if (updatedAlumno == null) {
      return res.status(404).json({ message: "No se encontró el alumno" });
    }
    res.status(200).json(updatedAlumno);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un alumno por CURP
exports.deleteAlumno = async (req, res) => {
  try {
    const deletedAlumno = await Alumno.findOneAndDelete({ curp: req.params.curp });
    if (!deletedAlumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.status(200).json({ message: 'Alumno eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### docentes.js
```js
const Docente = require('../models/docente');
const Materia = require('../models/materia');
const Grupo = require('../models/grupo');
const Alumno = require('../models/alumno');

// Obtener todos los docentes
exports.getAllDocentes = async (req, res) => {
    try {
        const docentes = await Docente.find();
        res.status(200).json(docentes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un docente por RFC
exports.getDocenteByRFC = async (req, res) => {
    try {
        const docente = await Docente.findOne({ rfc: req.params.rfc });
        if (!docente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.status(200).json(docente);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear un nuevo docente
exports.createDocente = async (req, res) => {
    const docente = new Docente(req.body);
    try {
        const savedDocente = await docente.save();
        res.status(201).json(savedDocente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar un docente por RFC
exports.updateDocente = async (req, res) => {
    try {
        const updatedDocente = await Docente.findOneAndUpdate({ rfc: req.params.rfc }, req.body, { new: true });
        res.status(200).json(updatedDocente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un docente por RFC
exports.deleteDocente = async (req, res) => {
    try {
        const deletedDocente = await Docente.findOneAndDelete({ rfc: req.params.rfc });
        if (!deletedDocente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }
        res.status(200).json({ message: 'Docente eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar detalles de una materia y los docentes que la imparten
exports.getMateriaConDocentes = async (req, res) => {
    const materiaId = req.params.materiaId;

    try {
        // Primero, encontrar la materia específica por su ID
        const materia = await Materia.findOne({ id: materiaId });
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }

        // Segundo, encontrar todos los docentes que imparten esa materia
        const docentes = await Docente.find({ 'materias.id': materiaId })
            .select('-materias');  // Excluyendo el campo 'materias'

        // Construir el resultado combinando los datos de la materia con los docentes
        const resultado = {
            materia: materia,
            docentes: docentes.map(doc => ({
                rfc: doc.rfc,
                nombre: doc.nombre,
                carrera: doc.carrera,
                tecnologico: doc.tecnologico
                // puedes agregar más campos según necesites
            }))
        };

        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los datos: ' + error.message });
    }
};

// Ajustando la consulta para evitar la mezcla de inclusión y exclusión
exports.getMateriasDocenteConAlumnos = async (req, res) => {
    try {
        const rfc = req.params.rfc;
        // Buscar el docente específico por RFC
        const docente = await Docente.findOne({ rfc });
        if (!docente) {
            return res.status(404).json({ message: 'Docente no encontrado' });
        }

        // Buscar los grupos que este docente imparte
        const grupos = await Grupo.find({ 'docente.rfc': rfc });

        // Recuperar detalles para cada grupo
        const resultados = await Promise.all(grupos.map(async grupo => {
            const materia = await Materia.findOne({ id: grupo.materia.id });
            const alumnos = await Alumno.find({ 'curp': { $in: grupo.alumnos.map(al => al.curp) } })
                                        .select('curp nc nombre carrera tecnologico -_id');  // Solo incluir los campos necesarios
            return {
                materia: materia,
                alumnos: alumnos,
                horario: grupo.horario
            };
        }));

        res.status(200).json({
            docente: {
                rfc: docente.rfc,
                nombre: docente.nombre,
                carrera: docente.carrera,
                tecnologico: docente.tecnologico
            },
            materiasImpartidas: resultados
        });
    } catch (error) {
        res.status(500).json({ message: "Error al procesar la solicitud: " + error.message });
    }
};
```

#### grupos.js
```js
const Grupo = require('../models/grupo');
const Alumno = require('../models/alumno');
const Materia = require('../models/materia');
const Docente = require('../models/docente');
const Aula = require('../models/aula');

// Obtener todos los grupos
exports.getAllGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.find().populate('materia docente alumnos aula');
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un grupo por ID
exports.getGrupoById = async (req, res) => {
    try {
        const grupo = await Grupo.findOne({ id: req.params.id }).populate('materia docente alumnos aula');
        if (!grupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }
        res.status(200).json(grupo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear un nuevo grupo
exports.createGrupo = async (req, res) => {
    const grupo = new Grupo(req.body);
    try {
        const savedGrupo = await grupo.save();
        res.status(201).json(savedGrupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar un grupo por ID
exports.updateGrupo = async (req, res) => {
    try {
        const updatedGrupo = await Grupo.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).populate('materia docente alumnos aula');
        res.status(200).json(updatedGrupo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar un grupo por ID
exports.deleteGrupo = async (req, res) => {
    try {
        const deletedGrupo = await Grupo.findOneAndDelete({ id: req.params.id });
        if (!deletedGrupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }
        res.status(200).json({ message: 'Grupo eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAlumnosPorMateriaGrupo = async (req, res) => {
    try {
        // Supongamos que `materiaId` y `grupoId` son pasados como parte del request
        const { materiaId, grupoId } = req.params;

        // Encuentra el grupo que coincide con el grupoId y materiaId
        const grupo = await Grupo.findOne({ id: grupoId, 'materia.id': materiaId });

        if (!grupo) {
            return res.status(404).json({ message: 'Grupo con la materia especificada no encontrado' });
        }

        // Ahora, obtener detalles de los alumnos
        const alumnosCurp = grupo.alumnos.map(est => est.curp); // Asume que alumnos es una lista de objetos con curp
        const alumnos = await Alumno.find({ 'curp': { $in: alumnosCurp } }).select('-materiasC -materiasA -materiasP');

        res.status(200).json({
            grupo: grupoId,
            materia: materiaId,
            alumnos: alumnos
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar grupos por materia específica
exports.getGruposPorMateria = async (req, res) => {
    const materiaId = req.params.materiaId;

    try {
        // Encuentra la materia específica por su ID
        const materia = await Materia.findOne({ id: materiaId });
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }

        // Encuentra todos los grupos asociados a esa materia
        const grupos = await Grupo.find({ 'materia.id': materiaId }).lean();

        for (let grupo of grupos) {
            // Detalles del docente
            grupo.docente = await Docente.findOne({ rfc: grupo.docente.rfc }).select('-materias');
            
            // Detalles de los alumnos
            const curps = grupo.alumnos.map(al => al.curp);
            grupo.alumnos = await Alumno.find({ curp: { $in: curps } }).select('-materiasC -materiasA -materiasP');

            // Detalles del aula
            grupo.aula = await Aula.findOne({ id: grupo.aula.id }).select('id edificio descripcion');
        }

        res.status(200).json({
            materia: materia,
            grupos: grupos
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los grupos: " + error.message });
    }
};
```

#### materias.js
```js
const Materia = require('../models/materia');

// Obtener todas las materias
exports.getAllMaterias = async (req, res) => {
    try {
        const materias = await Materia.find();
        res.status(200).json(materias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una materia por ID
exports.getMateriaById = async (req, res) => {
    try {
        const materia = await Materia.findOne({ id: req.params.id });
        if (!materia) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        res.status(200).json(materia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear una nueva materia
exports.createMateria = async (req, res) => {
    const materia = new Materia(req.body);
    try {
        const savedMateria = await materia.save();
        res.status(201).json(savedMateria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Actualizar una materia por ID
exports.updateMateria = async (req, res) => {
    try {
        const updatedMateria = await Materia.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.status(200).json(updatedMateria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar una materia por ID
exports.deleteMateria = async (req, res) => {
    try {
        const deletedMateria = await Materia.findOneAndDelete({ id: req.params.id });
        if (!deletedMateria) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }
        res.status(200).json({ message: 'Materia eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

### Rutas
#### alumnos.js
```js
const express = require('express');
const router = express.Router();
const {
    getAllAlumnos,
    getAlumnoByCURP,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    getMateriasCursadas,
    getCalificacionesAlumno,
    getAlumnosCalificacionAlta,
    getMateriasAlumnoConHorario,
    getMateriasPendientes
} = require('../controllers/alumnos');

// Ruta para obtener todos los alumnos
router.get('/', getAllAlumnos);

// Ruta para obtener un alumno específico por CURP
router.get('/:curp', getAlumnoByCURP);

// Ruta para crear un nuevo alumno
router.post('/', createAlumno);

// Ruta para actualizar un alumno por CURP
router.put('/:curp', updateAlumno);

// Ruta para eliminar un alumno por CURP
router.delete('/:curp', deleteAlumno);

// Ruta para obtener las materias cursadas por un alumno mediante su CURP
router.get('/:curp/materias-cursadas', getMateriasCursadas);

// Ruta para obtener las calificaciones de un alumno
router.get('/:curp/calificaciones', getCalificacionesAlumno);

// Ruta para obtener alumnos por materia con calificaciones superiores a 90
router.get('/calificaciones-altas/:materiaId', getAlumnosCalificacionAlta);

// Ruta para obtener las materias con horarios de un alumno específico
router.get('/:curp/materias-con-horario', getMateriasAlumnoConHorario);

// Ruta para obtener las materias pendientes de un alumno
router.get('/:curp/materias-pendientes', getMateriasPendientes);

module.exports = router;
```

#### aulas.js
```js
const express = require('express');
const router = express.Router();
const {
    getAllAulas,
    getAulaById,
    createAula,
    updateAula,
    deleteAula
} = require('../controllers/aulas');

// Ruta para obtener todas las aulas
router.get('/', getAllAulas);

// Ruta para obtener una aula específica por ID
router.get('/:id', getAulaById);

// Ruta para crear una nueva aula
router.post('/', createAula);

// Ruta para actualizar una aula por ID
router.put('/:id', updateAula);

// Ruta para eliminar una aula por ID
router.delete('/:id', deleteAula);

module.exports = router;
```

#### docentes.js
```js
const express = require('express');
const router = express.Router();
const {
    getAllDocentes,
    getDocenteByRFC,
    createDocente,
    updateDocente,
    deleteDocente,
    getMateriaConDocentes,
    getMateriasDocenteConAlumnos
} = require('../controllers/docentes');

// Ruta para obtener todos los docentes
router.get('/', getAllDocentes);

// Ruta para obtener un docente específico por RFC
router.get('/:rfc', getDocenteByRFC);

// Ruta para crear un nuevo docente
router.post('/', createDocente);

// Ruta para actualizar un docente por RFC
router.put('/:rfc', updateDocente);

// Ruta para eliminar un docente por RFC
router.delete('/:rfc', deleteDocente);

// Ruta para obtener una materia con sus docentes
router.get('/:materiaId/detalles', getMateriaConDocentes);

// Ruta para obtener las materias que imparte un docente con los alumnos inscritos
router.get('/:rfc/materias-con-alumnos', getMateriasDocenteConAlumnos);

module.exports = router;
```

#### grupos.js
```js
const express = require('express');
const router = express.Router();
const {
    getAllGrupos,
    getGrupoById,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    getAlumnosPorMateriaGrupo,
    getGruposPorMateria
} = require('../controllers/grupos');

// Ruta para obtener todos los grupos
router.get('/', getAllGrupos);

// Ruta para obtener un grupo específico por ID
router.get('/:id', getGrupoById);

// Ruta para crear un nuevo grupo
router.post('/', createGrupo);

// Ruta para actualizar un grupo por ID
router.put('/:id', updateGrupo);

// Ruta para eliminar un grupo por ID
router.delete('/:id', deleteGrupo);

// Ruta para obtener alumnos por materia y grupo
router.get('/:grupoId/:materiaId/alumnos', getAlumnosPorMateriaGrupo);

// Ruta para obtener grupos por materia
router.get('/por-materia/:materiaId', getGruposPorMateria);

module.exports = router;
```

#### materias.js
```js
const express = require('express');
const router = express.Router();
const {
    getAllMaterias,
    getMateriaById,
    createMateria,
    updateMateria,
    deleteMateria
} = require('../controllers/materias');

// Ruta para obtener todas las materias
router.get('/', getAllMaterias);

// Ruta para obtener una materia específica por ID
router.get('/:id', getMateriaById);

// Ruta para crear una nueva materia
router.post('/', createMateria);

// Ruta para actualizar una materia por ID
router.put('/:id', updateMateria);

// Ruta para eliminar una materia por ID
router.delete('/:id', deleteMateria);

module.exports = router;
```

## TABLA DE ENDPOINTS
### CRUD BÁSICO DE LAS 5 ENTIDADES

| Método | URL                | Params/Body                                                                                                                                                                                                                                                                                                                                                | Descripción                                                     |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| GET    | /api/alumnos       | None                                                                                                                                                                                                                                                                                                                                                       | Obtiene una lista de todos los alumnos                          |
| POST   | /api/alumnos       | `{"curp":"HAGZ954961XYI5","nc":"21400103","nombre":"EspinosaRosasGerardo","carrera":"ISC","tecnologico":"InstitutoTecnologicodeTepic","materiasC":[{"id":"MAT11","cal":100},{"id":"MAT12","cal":100},{"id":"MAT13","cal":100}],"materiasA":[{"id":"MAT21"},{"id":"MAT22"},{"id":"MAT23"}],"materiasP":[{"id":"MAT31"},{"id":"MAT32"},{"id":"MAT33"}]}<br>` | Crea un nuevo alumno                                            |
| GET    | /api/alumnos/:curp | curp en la URL                                                                                                                                                                                                                                                                                                                                             | Obtiene la información de un alumno específico                  |
| PUT    | /api/alumnos/:curp | curp en la URL                                                                                                                                                                                                                                                                                                                                             | Actualiza la información de un alumno específico                |
| DELETE | /api/alumnos/:curp | curp en la URL                                                                                                                                                                                                                                                                                                                                             | Elimina un alumno específico y da de baja de todas las materias |
| GET    | /api/materias      | None                                                                                                                                                                                                                                                                                                                                                       | Obtiene una lista de todas las materias                         |
| POST   | /api/materias      | `{"id": "MAT11","nombre": "Calculo diferencial","carrera": "ISC","descripcion": "Introducción al estudio de límites y derivadas aplicadas.","planestudios": "Especialidad en Desarrollo Web"}`                                                                                                                                                             | Crea una nueva materia                                          |
| GET    | /api/materias/:id  | id en la URL                                                                                                                                                                                                                                                                                                                                               | Obtiene la información de una materia específica                |
| PUT    | /api/materias/:id  | id en la URL                                                                                                                                                                                                                                                                                                                                               | Actualiza la información de una materia específica              |
| DELETE | /api/materias/:id  | id en la URL                                                                                                                                                                                                                                                                                                                                               | Elimina una materia específica                                  |
| GET    | /api/aulas         | None                                                                                                                                                                                                                                                                                                                                                       | Obtiene una lista de todas las aulas                            |
| POST   | /api/aulas         | `{"id": "AUL01","edificio": "Delfín","grupos": [{"id": "GR01"},{"id": "GR11"}],"descripcion": "Aula equipada con tecnología de punta para el aprendizaje interactivo."}`                                                                                                                                                                                   | Crea una nueva aula                                             |
| GET    | /api/aulas/:id     | id en la URL                                                                                                                                                                                                                                                                                                                                               | Obtiene la información de una aula específica                   |
| PUT    | /api/aulas/:id     | id en la URL                                                                                                                                                                                                                                                                                                                                               | Actualiza la información de una aula específica                 |
| DELETE | /api/aulas/:id     | id en la URL                                                                                                                                                                                                                                                                                                                                               | Elimina una aula específica                                     |
| GET    | /api/docentes      | None                                                                                                                                                                                                                                                                                                                                                       | Obtiene una lista de todos los docentes                         |
| POST   | /api/docentes      | `{"rfc": "KTWU426678CGG","nombre": "Adrián Velázquez Mora","carrera": "ISC","tecnologico": "Instituto Tecnologico de Tepic","materias": []}`                                                                                                                                                                                                               | Crea un nuevo docente                                           |
| GET    | /api/docentes/:rfc | rfc en la URL                                                                                                                                                                                                                                                                                                                                              | Obtiene la información de un docente especifico                 |
| PUT    | /api/docentes/:rfc | rfc en la URL                                                                                                                                                                                                                                                                                                                                              | Actualiza la información de un docente especifico               |
| DELETE | /api/docentes/:id  | rfc en la URL                                                                                                                                                                                                                                                                                                                                              | Elimina un docente especifico                                   |
| GET    | /api/grupos        | None                                                                                                                                                                                                                                                                                                                                                       | Obtiene una lista de todos los grupos                           |
| POST   | /api/grupos        | `{"id": "GR01","materia": { "id": "MAT11"}, "docente": {"rfc": "KTWU426678CGG"},"alumnos": [],"aula": {"id": "AUL01"},"horario": "7:00 AM - 8:00 AM"}`                                                                                                                                                                                                     | Crea un nuevo grupo                                             |
| GET    | /api/grupos/:id    | id en la URL                                                                                                                                                                                                                                                                                                                                               | Obtiene la información de un grupo especifico                   |
| PUT    | /api/grupos/:id    | id en la URL                                                                                                                                                                                                                                                                                                                                               | Actualiza la información de un grupo especifico                 |
| DELETE | /api/grupos/:id    | id en la URL                                                                                                                                                                                                                                                                                                                                               | Elimina un grupo especifico                                     |

### ENDPOINTS DE LOS QUERYS
| GET | /api/alumnos/:curp/materias-cursadas         | curp en la URL                        | Listar las materias que un alumno ha cursado                                                                         |
| --- | -------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET | /api/grupos/:grupoId/:materiaId/alumnos      | id de grupo e id de materia en la URL | Listar los alumnos que están cursando una materia específica de un grupo específico                                  |
| GET | /api/alumnos/:curp/calificaciones            | curp en la URL                        | Listar las calificaciones de un alumno en todas sus materias cursadas                                                |
| GET | /api/docentes/:materiaId/detalles            | id de materia en la URL               | Listar los docentes que imparten una materia específica.                                                             |
| GET | /api/alumnos/calificaciones-altas/:materiaId | id de la materia en la URL            | Listar los alumnos que han obtenido una calificación superior a 90 en una materia específica.                        |
| GET | /api/grupos/por-materia/:materiaId           | id de la materia en la URL            | Listar los grupos que correspondan a una materia específica.                                                         |
| GET | /api/alumnos/:curp/materias-con-horario      | curp del alumno en la URL             | Listar las materias que cursa un alumno en específico (horario).                                                     |
| GET | /api/alumnos/:curp/materias-pendientes       | curp del alumno en la URL             | Listar las materias que faltan por cursar a un alumno en específico                                                  |
| GET | /api/docentes/:rfc/materias-con-alumnos      | rfc del docente en la URL             | Listar las materias que imparte un docente en específico, junto con los alumnos que cursan cada una de las materias. |



## ESCENARIO DE DATOS
### Alumnos
```json
[
    {
        "curp": "IJEO944560KBZ3",
        "nc": "21400100",
        "nombre": "Bañuelos Garcia José Rodolfo",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [],
        "materiasA": [
            {
                "id": "MAT11"
            },
            {
                "id": "MAT12"
            },
            {
                "id": "MAT13"
            }
        ],
        "materiasP": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            },
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            },
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "DYHJ529625BIG3",
        "nc": "21400101",
        "nombre": "Casas Jiménez Pedro",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [],
        "materiasA": [
            {
                "id": "MAT11"
            },
            {
                "id": "MAT12"
            },
            {
                "id": "MAT13"
            }
        ],
        "materiasP": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            },
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            },
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "PDSD416184KGO4",
        "nc": "21400102",
        "nombre": "Chalita Luna Abdul Osmar",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [],
        "materiasA": [
            {
                "id": "MAT11"
            },
            {
                "id": "MAT12"
            },
            {
                "id": "MAT13"
            }
        ],
        "materiasP": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            },
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            },
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "HAGZ954961XYI5",
        "nc": "21400103",
        "nombre": "Espinosa Rosas Gerardo",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 100
            },
            {
                "id": "MAT12",
                "cal": 100
            },
            {
                "id": "MAT13",
                "cal": 100
            }
        ],
        "materiasA": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            }
        ],
        "materiasP": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ]
    },
    {
        "curp": "JTHY992331TPM5",
        "nc": "21400104",
        "nombre": "Estrella Rodríguez Nancy Anahí",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 100
            },
            {
                "id": "MAT13",
                "cal": 75
            }
        ],
        "materiasA": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            }
        ],
        "materiasP": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ]
    },
    {
        "curp": "TGOU165800CYS8",
        "nc": "21400105",
        "nombre": "Flores Montelongo Noé Fernando",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 80
            },
            {
                "id": "MAT12",
                "cal": 85
            },
            {
                "id": "MAT13",
                "cal": 90
            }
        ],
        "materiasA": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            }
        ],
        "materiasP": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ]
    },
    {
        "curp": "JACW370066DLZ3",
        "nc": "21400106",
        "nombre": "González Cruz José Angel",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 85
            },
            {
                "id": "MAT12",
                "cal": 90
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 90
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 70
            }
        ],
        "materiasA": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ],
        "materiasP": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "GQBH684962KJE9",
        "nc": "21400107",
        "nombre": "Juárez Díaz Diana Gabriela",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 85
            },
            {
                "id": "MAT12",
                "cal": 95
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 90
            },
            {
                "id": "MAT22",
                "cal": 100
            },
            {
                "id": "MAT23",
                "cal": 100
            }
        ],
        "materiasA": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ],
        "materiasP": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "ATWG460782LFL2",
        "nc": "21400108",
        "nombre": "Luquin González Tzihualtentzin",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 70
            },
            {
                "id": "MAT12",
                "cal": 75
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 80
            },
            {
                "id": "MAT22",
                "cal": 70
            },
            {
                "id": "MAT23",
                "cal": 80
            }
        ],
        "materiasA": [
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            }
        ],
        "materiasP": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "AZLR282893EVV0",
        "nc": "21400109",
        "nombre": "López Burgara Marco Antonio",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 70
            },
            {
                "id": "MAT12",
                "cal": 80
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 80
            },
            {
                "id": "MAT23",
                "cal": 80
            },
            {
                "id": "MAT31",
                "cal": 85
            },
            {
                "id": "MAT32",
                "cal": 85
            },
            {
                "id": "MAT33",
                "cal": 100
            }
        ],
        "materiasA": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            }
        ],
        "materiasP": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "IQBG109690ZSL4",
        "nc": "21400110",
        "nombre": "Marmolejo Uribe Karla Esmeralda",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 100
            },
            {
                "id": "MAT12",
                "cal": 100
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 100
            },
            {
                "id": "MAT23",
                "cal": 100
            },
            {
                "id": "MAT31",
                "cal": 85
            },
            {
                "id": "MAT32",
                "cal": 100
            },
            {
                "id": "MAT33",
                "cal": 100
            }
        ],
        "materiasA": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            }
        ],
        "materiasP": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "HLYN050170LPD6",
        "nc": "21400111",
        "nombre": "Martínez Guzmán Gadyel Josue",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 100
            },
            {
                "id": "MAT13",
                "cal": 100
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 95
            },
            {
                "id": "MAT31",
                "cal": 100
            },
            {
                "id": "MAT32",
                "cal": 90
            },
            {
                "id": "MAT33",
                "cal": 100
            }
        ],
        "materiasA": [
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            }
        ],
        "materiasP": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "AABR522830WYU7",
        "nc": "21400112",
        "nombre": "Medina Macias Cesar Antonio",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 90
            },
            {
                "id": "MAT13",
                "cal": 90
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 95
            },
            {
                "id": "MAT31",
                "cal": 95
            },
            {
                "id": "MAT32",
                "cal": 90
            },
            {
                "id": "MAT33",
                "cal": 100
            },
            {
                "id": "MAT41",
                "cal": 90
            },
            {
                "id": "MAT42",
                "cal": 100
            },
            {
                "id": "MAT43",
                "cal": 90
            }
        ],
        "materiasA": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ],
        "materiasP": []
    },
    {
        "curp": "OBFM085953JRM6",
        "nc": "21400113",
        "nombre": "Medina Parra Cynthia Guadalupe",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 90
            },
            {
                "id": "MAT13",
                "cal": 90
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 95
            },
            {
                "id": "MAT31",
                "cal": 95
            },
            {
                "id": "MAT32",
                "cal": 90
            },
            {
                "id": "MAT33",
                "cal": 100
            },
            {
                "id": "MAT41",
                "cal": 90
            },
            {
                "id": "MAT42",
                "cal": 100
            },
            {
                "id": "MAT43",
                "cal": 90
            }
        ],
        "materiasA": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ],
        "materiasP": []
    },
    {
        "curp": "ASQG331912CJF8",
        "nc": "21400114",
        "nombre": "Sanchez Tovar Jesus Alfredo",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 90
            },
            {
                "id": "MAT13",
                "cal": 90
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 95
            },
            {
                "id": "MAT31",
                "cal": 95
            },
            {
                "id": "MAT32",
                "cal": 90
            },
            {
                "id": "MAT33",
                "cal": 100
            },
            {
                "id": "MAT41",
                "cal": 90
            },
            {
                "id": "MAT42",
                "cal": 100
            },
            {
                "id": "MAT43",
                "cal": 90
            }
        ],
        "materiasA": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ],
        "materiasP": []
    },
    {
        "curp": "KPCM153478MJN8",
        "nc": "21400115",
        "nombre": "Sandoval Bernal Axel",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [
            {
                "id": "MAT11",
                "cal": 90
            },
            {
                "id": "MAT12",
                "cal": 90
            },
            {
                "id": "MAT13",
                "cal": 90
            },
            {
                "id": "MAT21",
                "cal": 95
            },
            {
                "id": "MAT22",
                "cal": 95
            },
            {
                "id": "MAT23",
                "cal": 95
            },
            {
                "id": "MAT31",
                "cal": 95
            },
            {
                "id": "MAT32",
                "cal": 90
            },
            {
                "id": "MAT33",
                "cal": 100
            },
            {
                "id": "MAT41",
                "cal": 90
            },
            {
                "id": "MAT42",
                "cal": 100
            },
            {
                "id": "MAT43",
                "cal": 90
            }
        ],
        "materiasA": [
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ],
        "materiasP": []
    },
    {
        "curp": "VDTJ065185KTJ6",
        "nc": "21400116",
        "nombre": "Vazquez Mendez Jose Manuel",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [],
        "materiasA": [
            {
                "id": "MAT11"
            },
            {
                "id": "MAT12"
            },
            {
                "id": "MAT13"
            }
        ],
        "materiasP": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            },
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            },
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    },
    {
        "curp": "KEOV819423ROQ8",
        "nc": "21400117",
        "nombre": "Vizcarra Villavicencio Angel Gabriel",
        "carrera": "ISC",
        "tecnologico": "Instituto Tecnologico de Tepic",
        "materiasC": [],
        "materiasA": [
            {
                "id": "MAT11"
            },
            {
                "id": "MAT12"
            },
            {
                "id": "MAT13"
            }
        ],
        "materiasP": [
            {
                "id": "MAT21"
            },
            {
                "id": "MAT22"
            },
            {
                "id": "MAT23"
            },
            {
                "id": "MAT31"
            },
            {
                "id": "MAT32"
            },
            {
                "id": "MAT33"
            },
            {
                "id": "MAT41"
            },
            {
                "id": "MAT42"
            },
            {
                "id": "MAT43"
            },
            {
                "id": "MAT51"
            },
            {
                "id": "MAT52"
            },
            {
                "id": "MAT53"
            }
        ]
    }
]
```

### Aulas
```json
[
    {
        "id": "AUL01",
        "edificio": "Delfín",
        "grupos": [
            {
                "id": "GR01"
            },
            {
                "id": "GR11"
            }
        ],
        "descripcion": "Aula equipada con tecnología de punta para el aprendizaje interactivo."
    },
    {
        "id": "AUL02",
        "edificio": "Pulpo",
        "grupos": [
            {
                "id": "GR02"
            },
            {
                "id": "GR12"
            }
        ],
        "descripcion": "Espacio amplio con iluminación natural, ideal para conferencias y talleres."
    },
    {
        "id": "AUL03",
        "edificio": "Tiburón",
        "grupos": [
            {
                "id": "GR03"
            },
            {
                "id": "GR13"
            }
        ],
        "descripcion": "Aula con pizarrón inteligente y acceso a recursos digitales."
    },
    {
        "id": "AUL04",
        "edificio": "Bacalao",
        "grupos": [
            {
                "id": "GR04"
            },
            {
                "id": "GR14"
            }
        ],
        "descripcion": "Ambiente climatizado con asientos ergonómicos para la comodidad de los alumnos."
    },
    {
        "id": "AUL05",
        "edificio": "Estrella de Mar",
        "grupos": [
            {
                "id": "GR05"
            },
            {
                "id": "GR15"
            }
        ],
        "descripcion": "Salón dedicado a la enseñanza de las ciencias marinas con decoración temática."
    },
    {
        "id": "AUL06",
        "edificio": "Caballito de Mar",
        "grupos": [
            {
                "id": "GR06"
            }
        ],
        "descripcion": "Aula multimedia con equipo de sonido y proyección de alta definición."
    },
    {
        "id": "AUL07",
        "edificio": "Medusa",
        "grupos": [
            {
                "id": "GR07"
            }
        ],
        "descripcion": "Espacio versátil diseñado para fomentar la creatividad y el trabajo en equipo."
    },
    {
        "id": "AUL08",
        "edificio": "Anguila",
        "grupos": [
            {
                "id": "GR08"
            }
        ],
        "descripcion": "Aula con biblioteca integrada y acceso a publicaciones científicas."
    },
    {
        "id": "AUL09",
        "edificio": "Ballena",
        "grupos": [
            {
                "id": "GR09"
            }
        ],
        "descripcion": "Sala de informática con estaciones de trabajo individuales y software especializado."
    },
    {
        "id": "AUL10",
        "edificio": "Manta Raya",
        "grupos": [
            {
                "id": "GR10"
            }
        ],
        "descripcion": "Laboratorio equipado para la práctica de experimentos y proyectos de investigación."
    }
]
```

### Docentes
```json
[
  {
      "rfc": "KTWU426678CGG",
      "nombre": "Adrián Velázquez Mora",
      "carrera": "ISC",
      "tecnologico": "Instituto Tecnologico de Tepic",
      "materias": [
          {
              "id": "MAT11"
          },
          {
              "id": "MAT12"
          },
          {
              "id": "MAT13"
          }
      ]
  },
  {
      "rfc": "PZVP126857API",
      "nombre": "Claudia Herrera Ponce",
      "carrera": "ISC",
      "tecnologico": "Instituto Tecnologico de Tepic",
      "materias": [
          {
              "id": "MAT21"
          },
          {
              "id": "MAT22"
          },
          {
              "id": "MAT23"
          }
      ]
  },
  {
      "rfc": "FKEC903733WLU",
      "nombre": "Raúl Navarro Lemus",
      "carrera": "ISC",
      "tecnologico": "Instituto Tecnologico de Tepic",
      "materias": [
          {
              "id": "MAT31"
          },
          {
              "id": "MAT32"
          },
          {
              "id": "MAT33"
          }
      ]
  },
  {
      "rfc": "UWVF547988HXI",
      "nombre": "Mónica Galván Castañeda",
      "carrera": "ISC",
      "tecnologico": "Instituto Tecnologico de Tepic",
      "materias": [
          {
              "id": "MAT41"
          },
          {
              "id": "MAT42"
          },
          {
              "id": "MAT43"
          }
      ]
  },
  {
      "rfc": "BALN156049ZKO",
      "nombre": "Jorge Salinas Pérez",
      "carrera": "ISC",
      "tecnologico": "Instituto Tecnologico de Tepic",
      "materias": [
          {
              "id": "MAT51"
          },
          {
              "id": "MAT52"
          },
          {
              "id": "MAT53"
          }
      ]
  }
]
```

### Grupos
```json
[
    {
        "id": "GR01",
        "materia": {
            "id": "MAT11"
        },
        "docente": {
            "rfc": "KTWU426678CGG"
        },
        "alumnos": [
            {
                "curp": "IJEO944560KBZ3"
            },
            {
                "curp": "DYHJ529625BIG3"
            },
            {
                "curp": "PDSD416184KGO4"
            },
            {
                "curp": "VDTJ065185KTJ6"
            },
            {
                "curp": "KEOV819423ROQ8"
            }
        ],
        "aula": {
            "id": "AUL01"
        },
        "horario": "7:00 AM - 8:00 AM"
    },
    {
        "id": "GR02",
        "materia": {
            "id": "MAT12"
        },
        "docente": {
            "rfc": "KTWU426678CGG"
        },
        "alumnos": [
            {
                "curp": "IJEO944560KBZ3"
            },
            {
                "curp": "DYHJ529625BIG3"
            },
            {
                "curp": "PDSD416184KGO4"
            },
            {
                "curp": "VDTJ065185KTJ6"
            },
            {
                "curp": "KEOV819423ROQ8"
            }
        ],
        "aula": {
            "id": "AUL02"
        },
        "horario": "8:00 AM - 9:00 AM"
    },
    {
        "id": "GR03",
        "materia": {
            "id": "MAT13"
        },
        "docente": {
            "rfc": "KTWU426678CGG"
        },
        "alumnos": [
            {
                "curp": "IJEO944560KBZ3"
            },
            {
                "curp": "DYHJ529625BIG3"
            },
            {
                "curp": "PDSD416184KGO4"
            },
            {
                "curp": "VDTJ065185KTJ6"
            },
            {
                "curp": "KEOV819423ROQ8"
            }
        ],
        "aula": {
            "id": "AUL03"
        },
        "horario": "9:00 AM - 10:00 AM"
    },
    {
        "id": "GR04",
        "materia": {
            "id": "MAT21"
        },
        "docente": {
            "rfc": "PZVP126857API"
        },
        "alumnos": [
            {
                "curp": "HAGZ954961XYI5"
            },
            {
                "curp": "JTHY992331TPM5"
            },
            {
                "curp": "TGOU165800CYS8"
            }
        ],
        "aula": {
            "id": "AUL04"
        },
        "horario": "7:00 AM - 8:00 AM"
    },
    {
        "id": "GR05",
        "materia": {
            "id": "MAT22"
        },
        "docente": {
            "rfc": "PZVP126857API"
        },
        "alumnos": [
            {
                "curp": "HAGZ954961XYI5"
            },
            {
                "curp": "JTHY992331TPM5"
            },
            {
                "curp": "TGOU165800CYS8"
            }
        ],
        "aula": {
            "id": "AUL05"
        },
        "horario": "8:00 AM - 9:00 AM"
    },
    {
        "id": "GR06",
        "materia": {
            "id": "MAT23"
        },
        "docente": {
            "rfc": "PZVP126857API"
        },
        "alumnos": [
            {
                "curp": "HAGZ954961XYI5"
            },
            {
                "curp": "JTHY992331TPM5"
            },
            {
                "curp": "TGOU165800CYS8"
            }
        ],
        "aula": {
            "id": "AUL06"
        },
        "horario": "9:00 AM - 10:00 AM"
    },
    {
        "id": "GR07",
        "materia": {
            "id": "MAT31"
        },
        "docente": {
            "rfc": "FKEC903733WLU"
        },
        "alumnos": [
            {
                "curp": "JACW370066DLZ3"
            },
            {
                "curp": "GQBH684962KJE9"
            },
            {
                "curp": "ATWG460782LFL2"
            }
        ],
        "aula": {
            "id": "AUL07"
        },
        "horario": "7:00 AM - 8:00 AM"
    },
    {
        "id": "GR08",
        "materia": {
            "id": "MAT32"
        },
        "docente": {
            "rfc": "FKEC903733WLU"
        },
        "alumnos": [
            {
                "curp": "JACW370066DLZ3"
            },
            {
                "curp": "GQBH684962KJE9"
            },
            {
                "curp": "ATWG460782LFL2"
            }
        ],
        "aula": {
            "id": "AUL08"
        },
        "horario": "8:00 AM - 9:00 AM"
    },
    {
        "id": "GR09",
        "materia": {
            "id": "MAT33"
        },
        "docente": {
            "rfc": "FKEC903733WLU"
        },
        "alumnos": [
            {
                "curp": "JACW370066DLZ3"
            },
            {
                "curp": "GQBH684962KJE9"
            },
            {
                "curp": "ATWG460782LFL2"
            }
        ],
        "aula": {
            "id": "AUL09"
        },
        "horario": "9:00 AM - 10:00 AM"
    },
    {
        "id": "GR10",
        "materia": {
            "id": "MAT41"
        },
        "docente": {
            "rfc": "UWVF547988HXI"
        },
        "alumnos": [
            {
                "curp": "AZLR282893EVV0"
            },
            {
                "curp": "IQBG109690ZSL4"
            },
            {
                "curp": "HLYN050170LPD6"
            }
        ],
        "aula": {
            "id": "AUL10"
        },
        "horario": "7:00 AM - 8:00 AM"
    },
    {
        "id": "GR11",
        "materia": {
            "id": "MAT42"
        },
        "docente": {
            "rfc": "UWVF547988HXI"
        },
        "alumnos": [
            {
                "curp": "AZLR282893EVV0"
            },
            {
                "curp": "IQBG109690ZSL4"
            },
            {
                "curp": "HLYN050170LPD6"
            }
        ],
        "aula": {
            "id": "AUL01"
        },
        "horario": "8:00 AM - 9:00 AM"
    },
    {
        "id": "GR12",
        "materia": {
            "id": "MAT43"
        },
        "docente": {
            "rfc": "UWVF547988HXI"
        },
        "alumnos": [
            {
                "curp": "AZLR282893EVV0"
            },
            {
                "curp": "IQBG109690ZSL4"
            },
            {
                "curp": "HLYN050170LPD6"
            }
        ],
        "aula": {
            "id": "AUL02"
        },
        "horario": "9:00 AM - 10:00 AM"
    },
    {
        "id": "GR13",
        "materia": {
            "id": "MAT51"
        },
        "docente": {
            "rfc": "BALN156049ZKO"
        },
        "alumnos": [
            {
                "curp": "AABR522830WYU7"
            },
            {
                "curp": "OBFM085953JRM6"
            },
            {
                "curp": "ASQG331912CJF8"
            }
        ],
        "aula": {
            "id": "AUL03"
        },
        "horario": "7:00 AM - 8:00 AM"
    },
    {
        "id": "GR14",
        "materia": {
            "id": "MAT52"
        },
        "docente": {
            "rfc": "BALN156049ZKO"
        },
        "alumnos": [
            {
                "curp": "AABR522830WYU7"
            },
            {
                "curp": "OBFM085953JRM6"
            },
            {
                "curp": "ASQG331912CJF8"
            }
        ],
        "aula": {
            "id": "AUL04"
        },
        "horario": "8:00 AM - 9:00 AM"
    },
    {
        "id": "GR15",
        "materia": {
            "id": "MAT53"
        },
        "docente": {
            "rfc": "BALN156049ZKO"
        },
        "alumnos": [
            {
                "curp": "AABR522830WYU7"
            },
            {
                "curp": "OBFM085953JRM6"
            },
            {
                "curp": "ASQG331912CJF8"
            },
            {
                "curp": "KPCM153478MJN8"
            }
        ],
        "aula": {
            "id": "AUL05"
        },
        "horario": "9:00 AM - 10:00 AM"
    }
]
```

### Materias
```json
[
  {
      "id": "MAT11",
      "nombre": "Calculo diferencial",
      "carrera": "ISC",
      "descripcion": "Introducción al estudio de límites y derivadas aplicadas.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT12",
      "nombre": "Fundamentos de programacion",
      "carrera": "ISC",
      "descripcion": "Principios básicos de la programación y algoritmos.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT13",
      "nombre": "Taller de etica",
      "carrera": "ISC",
      "descripcion": "Exploración de principios éticos en el contexto profesional y personal.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT21",
      "nombre": "Calculo integral",
      "carrera": "ISC",
      "descripcion": "Continuación del estudio del cálculo con integración y sus aplicaciones.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT22",
      "nombre": "Programacion orientada a objetos",
      "carrera": "ISC",
      "descripcion": "Conceptos de la POO: clases, objetos, herencia y polimorfismo.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT23",
      "nombre": "Contabilidad financiera",
      "carrera": "ISC",
      "descripcion": "Fundamentos de la contabilidad y gestión financiera en empresas.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT31",
      "nombre": "Calculo vectorial",
      "carrera": "ISC",
      "descripcion": "Estudio de campos vectoriales, gradiente y aplicaciones.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT32",
      "nombre": "Estructura de datos",
      "carrera": "ISC",
      "descripcion": "Organización, manejo y almacenamiento eficiente de datos.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT33",
      "nombre": "Cultura empresarial",
      "carrera": "ISC",
      "descripcion": "Desarrollo de habilidades gerenciales y cultura organizacional.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT41",
      "nombre": "Ecuaciones diferenciales",
      "carrera": "ISC",
      "descripcion": "Solución de ecuaciones diferenciales y sus aplicaciones en ingeniería.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT42",
      "nombre": "Metodos numericos",
      "carrera": "ISC",
      "descripcion": "Técnicas numéricas para la resolución de problemas matemáticos.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT43",
      "nombre": "Topicos avanzados de programacion",
      "carrera": "ISC",
      "descripcion": "Avances en lenguajes de programación y técnicas de desarrollo.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT51",
      "nombre": "Graficacion",
      "carrera": "ISC",
      "descripcion": "Técnicas de representación gráfica y visualización de datos.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT52",
      "nombre": "Fundamentos de telecomunicaciones",
      "carrera": "ISC",
      "descripcion": "Principios y tecnologías subyacentes en las telecomunicaciones.",
      "planestudios": "Especialidad en Desarrollo Web"
  },
  {
      "id": "MAT53",
      "nombre": "Sistemas operativos",
      "carrera": "ISC",
      "descripcion": "Estudio de los sistemas operativos y su arquitectura.",
      "planestudios": "Especialidad en Desarrollo Web"
  }
]
```
## JSON POSTMAN
### Alumnos
```json
{
	"info": {
		"_postman_id": "2fe15765-693a-40dd-8795-4705d3ba5d5b",
		"name": "Alumnos",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "Bañuelos Garcia José Rodolfo",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"IJEO944560KBZ3\",\n    \"nc\": \"21400100\",\n    \"nombre\": \"Bañuelos Garcia José Rodolfo\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        },\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        },\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Casas Jiménez Pedro",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"DYHJ529625BIG3\",\n    \"nc\": \"21400101\",\n    \"nombre\": \"Casas Jiménez Pedro\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        },\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        },\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Chalita Luna Abdul Osmar",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"PDSD416184KGO4\",\n    \"nc\": \"21400102\",\n    \"nombre\": \"Chalita Luna Abdul Osmar\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        },\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        },\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Espinosa Rosas Gerardo",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"HAGZ954961XYI5\",\n    \"nc\": \"21400103\",\n    \"nombre\": \"Espinosa Rosas Gerardo\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Estrella Rodríguez Nancy Anahí",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"JTHY992331TPM5\",\n    \"nc\": \"21400104\",\n    \"nombre\": \"Estrella Rodríguez Nancy Anahí\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 75\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Flores Montelongo Noé Fernando",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"TGOU165800CYS8\",\n    \"nc\": \"21400105\",\n    \"nombre\": \"Flores Montelongo Noé Fernando\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 80\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 90\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "González Cruz José Angel",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"JACW370066DLZ3\",\n    \"nc\": \"21400106\",\n    \"nombre\": \"González Cruz José Angel\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 70\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Juárez Díaz Diana Gabriela",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"GQBH684962KJE9\",\n    \"nc\": \"21400107\",\n    \"nombre\": \"Juárez Díaz Diana Gabriela\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 100\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Luquin González Tzihualtentzin",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"ATWG460782LFL2\",\n    \"nc\": \"21400108\",\n    \"nombre\": \"Luquin González Tzihualtentzin\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 70\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 75\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 80\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 70\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 80\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "López Burgara Marco Antonio",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"AZLR282893EVV0\",\n    \"nc\": \"21400109\",\n    \"nombre\": \"López Burgara Marco Antonio\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 70\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 80\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 80\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 80\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Marmolejo Uribe Karla Esmeralda",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"IQBG109690ZSL4\",\n    \"nc\": \"21400110\",\n    \"nombre\": \"Marmolejo Uribe Karla Esmeralda\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 85\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Martínez Guzmán Gadyel Josue",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"HLYN050170LPD6\",\n    \"nc\": \"21400111\",\n    \"nombre\": \"Martínez Guzmán Gadyel Josue\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Medina Macias Cesar Antonio",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"AABR522830WYU7\",\n    \"nc\": \"21400112\",\n    \"nombre\": \"Medina Macias Cesar Antonio\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT41\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT42\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT43\",\n            \"cal\": 90\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ],\n    \"materiasP\": []\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Medina Parra Cynthia Guadalupe",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"OBFM085953JRM6\",\n    \"nc\": \"21400113\",\n    \"nombre\": \"Medina Parra Cynthia Guadalupe\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT41\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT42\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT43\",\n            \"cal\": 90\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ],\n    \"materiasP\": []\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Sanchez Tovar Jesus Alfredo",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"ASQG331912CJF8\",\n    \"nc\": \"21400114\",\n    \"nombre\": \"Sanchez Tovar Jesus Alfredo\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT41\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT42\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT43\",\n            \"cal\": 90\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ],\n    \"materiasP\": []\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Sandoval Bernal Axel",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"KPCM153478MJN8\",\n    \"nc\": \"21400115\",\n    \"nombre\": \"Sandoval Bernal Axel\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT11\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT21\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT22\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT23\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT31\",\n            \"cal\": 95\n        },\n        {\n            \"id\": \"MAT32\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT33\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT41\",\n            \"cal\": 90\n        },\n        {\n            \"id\": \"MAT42\",\n            \"cal\": 100\n        },\n        {\n            \"id\": \"MAT43\",\n            \"cal\": 90\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ],\n    \"materiasP\": []\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Vazquez Mendez Jose Manuel",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"VDTJ065185KTJ6\",\n    \"nc\": \"21400116\",\n    \"nombre\": \"Vazquez Mendez Jose Manuel\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        },\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        },\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "Vizcarra Villavicencio Angel Gabriel",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"curp\": \"KEOV819423ROQ8\",\n    \"nc\": \"21400117\",\n    \"nombre\": \"Vizcarra Villavicencio Angel Gabriel\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materiasC\": [],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ],\n    \"materiasP\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        },\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        },\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        },\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "deleteAlumno",
			"request": {
				"method": "DELETE",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/IJEO944560KBZ3",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"IJEO944560KBZ3"
					]
				}
			},
			"response": []
		},
		{
			"name": "updateAlumno",
			"request": {
				"method": "PUT",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"nombre\": \"Bañuelos Garcia José Rodolfo\",\n    \"carrera\": \"ING EN SISTEMAS\",\n    \"materiasC\": [\n        {\n            \"id\": \"MAT12\",\n            \"cal\": 99\n        },\n        {\n            \"id\": \"MAT13\",\n            \"cal\": 95\n        }\n    ],\n    \"materiasA\": [\n        {\n            \"id\": \"MAT11\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos/IJEO944560KBZ3",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"IJEO944560KBZ3"
					]
				}
			},
			"response": []
		},
		{
			"name": "showAlumnos",
			"protocolProfileBehavior": {
				"disableBodyPruning": true
			},
			"request": {
				"method": "GET",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos"
					]
				}
			},
			"response": []
		}
	]
}
```
### Aulas
```json
{
	"info": {
		"_postman_id": "b17bf510-20f4-4b9a-8b17-56dc183a183a",
		"name": "Aulas",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "AUL01",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL01\",\n    \"edificio\": \"Delfín\",\n    \"grupos\": [\n        {\n            \"id\": \"GR01\"\n        },\n        {\n            \"id\": \"GR11\"\n        }\n    ],\n    \"descripcion\": \"Aula equipada con tecnología de punta para el aprendizaje interactivo.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL02",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL02\",\n    \"edificio\": \"Pulpo\",\n    \"grupos\": [\n        {\n            \"id\": \"GR02\"\n        },\n        {\n            \"id\": \"GR12\"\n        }\n    ],\n    \"descripcion\": \"Espacio amplio con iluminación natural, ideal para conferencias y talleres.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL03",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL03\",\n    \"edificio\": \"Tiburón\",\n    \"grupos\": [\n        {\n            \"id\": \"GR03\"\n        },\n        {\n            \"id\": \"GR13\"\n        }\n    ],\n    \"descripcion\": \"Aula con pizarrón inteligente y acceso a recursos digitales.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL04",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL04\",\n    \"edificio\": \"Bacalao\",\n    \"grupos\": [\n        {\n            \"id\": \"GR04\"\n        },\n        {\n            \"id\": \"GR14\"\n        }\n    ],\n    \"descripcion\": \"Ambiente climatizado con asientos ergonómicos para la comodidad de los alumnos.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL05",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL05\",\n    \"edificio\": \"Estrella de Mar\",\n    \"grupos\": [\n        {\n            \"id\": \"GR05\"\n        },\n        {\n            \"id\": \"GR15\"\n        }\n    ],\n    \"descripcion\": \"Salón dedicado a la enseñanza de las ciencias marinas con decoración temática.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL06",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL06\",\n    \"edificio\": \"Caballito de Mar\",\n    \"grupos\": [\n        {\n            \"id\": \"GR06\"\n        }\n    ],\n    \"descripcion\": \"Aula multimedia con equipo de sonido y proyección de alta definición.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL07",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL07\",\n    \"edificio\": \"Medusa\",\n    \"grupos\": [\n        {\n            \"id\": \"GR07\"\n        }\n    ],\n    \"descripcion\": \"Espacio versátil diseñado para fomentar la creatividad y el trabajo en equipo.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL08",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL08\",\n    \"edificio\": \"Anguila\",\n    \"grupos\": [\n        {\n            \"id\": \"GR08\"\n        }\n    ],\n    \"descripcion\": \"Aula con biblioteca integrada y acceso a publicaciones científicas.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL09",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL09\",\n    \"edificio\": \"Ballena\",\n    \"grupos\": [\n        {\n            \"id\": \"GR09\"\n        }\n    ],\n    \"descripcion\": \"Sala de informática con estaciones de trabajo individuales y software especializado.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "AUL10",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL10\",\n    \"edificio\": \"Manta Raya\",\n    \"grupos\": [\n        {\n            \"id\": \"GR10\"\n        }\n    ],\n    \"descripcion\": \"Laboratorio equipado para la práctica de experimentos y proyectos de investigación.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		},
		{
			"name": "delAula",
			"request": {
				"method": "DELETE",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL10\",\n    \"edificio\": \"Manta Raya\",\n    \"grupos\": [\n        {\n            \"id\": \"GR10\"\n        }\n    ],\n    \"descripcion\": \"Laboratorio equipado para la práctica de experimentos y proyectos de investigación.\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas/AUL10",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas",
						"AUL10"
					]
				}
			},
			"response": []
		},
		{
			"name": "updateAula",
			"request": {
				"method": "PUT",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"AUL09\",\n    \"edificio\": \"Orca\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/aulas/AUL09",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas",
						"AUL09"
					]
				}
			},
			"response": []
		},
		{
			"name": "showAulas",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/aulas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"aulas"
					]
				}
			},
			"response": []
		}
	]
}
```
### Docentes
```json
{
	"info": {
		"_postman_id": "55fe2521-f182-48c1-84ac-c1e82ee92c0f",
		"name": "Docentes",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "Adrián Velázquez Mora",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"KTWU426678CGG\",\n    \"nombre\": \"Adrián Velázquez Mora\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materias\": [\n        {\n            \"id\": \"MAT11\"\n        },\n        {\n            \"id\": \"MAT12\"\n        },\n        {\n            \"id\": \"MAT13\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		},
		{
			"name": "Claudia Herrera Ponce",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"PZVP126857API\",\n    \"nombre\": \"Claudia Herrera Ponce\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materias\": [\n        {\n            \"id\": \"MAT21\"\n        },\n        {\n            \"id\": \"MAT22\"\n        },\n        {\n            \"id\": \"MAT23\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		},
		{
			"name": "Raúl Navarro Lemus",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"FKEC903733WLU\",\n    \"nombre\": \"Raúl Navarro Lemus\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materias\": [\n        {\n            \"id\": \"MAT31\"\n        },\n        {\n            \"id\": \"MAT32\"\n        },\n        {\n            \"id\": \"MAT33\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		},
		{
			"name": "Mónica Galván Castañeda",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"UWVF547988HXI\",\n    \"nombre\": \"Mónica Galván Castañeda\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materias\": [\n        {\n            \"id\": \"MAT41\"\n        },\n        {\n            \"id\": \"MAT42\"\n        },\n        {\n            \"id\": \"MAT43\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		},
		{
			"name": "Jorge Salinas Pérez",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"BALN156049ZKO\",\n    \"nombre\": \"Jorge Salinas Pérez\",\n    \"carrera\": \"ISC\",\n    \"tecnologico\": \"Instituto Tecnologico de Tepic\",\n    \"materias\": [\n        {\n            \"id\": \"MAT51\"\n        },\n        {\n            \"id\": \"MAT52\"\n        },\n        {\n            \"id\": \"MAT53\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		},
		{
			"name": "updateDocente",
			"request": {
				"method": "PUT",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"rfc\": \"BALN156049ZKO\",\n    \"nombre\": \"Jorge Salinas Pérez Prado\",\n    \"carrera\": \"SISTEMAS\",\n    \"materias\": [\n        {\n            \"id\": \"MAT51\"\n        }\n    ]\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes/BALN156049ZKO",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes",
						"BALN156049ZKO"
					]
				}
			},
			"response": []
		},
		{
			"name": "delDocente",
			"request": {
				"method": "DELETE",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/docentes/UWVF547988HXI",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes",
						"UWVF547988HXI"
					]
				}
			},
			"response": []
		},
		{
			"name": "showDocentes",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/docentes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes"
					]
				}
			},
			"response": []
		}
	]
}
```

### Grupos
```json
{
	"info": {
		"_postman_id": "decef52c-4778-499b-901f-1a6832fadee2",
		"name": "Grupos",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "GR01",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR01\",\n    \"materia\": {\n        \"id\": \"MAT11\"\n    },\n    \"docente\": {\n        \"rfc\": \"KTWU426678CGG\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"IJEO944560KBZ3\"\n        },\n        {\n            \"curp\": \"DYHJ529625BIG3\"\n        },\n        {\n            \"curp\": \"PDSD416184KGO4\"\n        },\n        {\n            \"curp\": \"VDTJ065185KTJ6\"\n        },\n        {\n            \"curp\": \"KEOV819423ROQ8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL01\"\n    },\n    \"horario\": \"7:00 AM - 8:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR02",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR02\",\n    \"materia\": {\n        \"id\": \"MAT12\"\n    },\n    \"docente\": {\n        \"rfc\": \"KTWU426678CGG\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"IJEO944560KBZ3\"\n        },\n        {\n            \"curp\": \"DYHJ529625BIG3\"\n        },\n        {\n            \"curp\": \"PDSD416184KGO4\"\n        },\n        {\n            \"curp\": \"VDTJ065185KTJ6\"\n        },\n        {\n            \"curp\": \"KEOV819423ROQ8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL02\"\n    },\n    \"horario\": \"8:00 AM - 9:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR03",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR03\",\n    \"materia\": {\n        \"id\": \"MAT13\"\n    },\n    \"docente\": {\n        \"rfc\": \"KTWU426678CGG\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"IJEO944560KBZ3\"\n        },\n        {\n            \"curp\": \"DYHJ529625BIG3\"\n        },\n        {\n            \"curp\": \"PDSD416184KGO4\"\n        },\n        {\n            \"curp\": \"VDTJ065185KTJ6\"\n        },\n        {\n            \"curp\": \"KEOV819423ROQ8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL03\"\n    },\n    \"horario\": \"9:00 AM - 10:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR04",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR04\",\n    \"materia\": {\n        \"id\": \"MAT21\"\n    },\n    \"docente\": {\n        \"rfc\": \"PZVP126857API\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"HAGZ954961XYI5\"\n        },\n        {\n            \"curp\": \"JTHY992331TPM5\"\n        },\n        {\n            \"curp\": \"TGOU165800CYS8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL04\"\n    },\n    \"horario\": \"7:00 AM - 8:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR05",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR05\",\n    \"materia\": {\n        \"id\": \"MAT22\"\n    },\n    \"docente\": {\n        \"rfc\": \"PZVP126857API\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"HAGZ954961XYI5\"\n        },\n        {\n            \"curp\": \"JTHY992331TPM5\"\n        },\n        {\n            \"curp\": \"TGOU165800CYS8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL05\"\n    },\n    \"horario\": \"8:00 AM - 9:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR06",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR06\",\n    \"materia\": {\n        \"id\": \"MAT23\"\n    },\n    \"docente\": {\n        \"rfc\": \"PZVP126857API\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"HAGZ954961XYI5\"\n        },\n        {\n            \"curp\": \"JTHY992331TPM5\"\n        },\n        {\n            \"curp\": \"TGOU165800CYS8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL06\"\n    },\n    \"horario\": \"9:00 AM - 10:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR07",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR07\",\n    \"materia\": {\n        \"id\": \"MAT31\"\n    },\n    \"docente\": {\n        \"rfc\": \"FKEC903733WLU\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"JACW370066DLZ3\"\n        },\n        {\n            \"curp\": \"GQBH684962KJE9\"\n        },\n        {\n            \"curp\": \"ATWG460782LFL2\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL07\"\n    },\n    \"horario\": \"7:00 AM - 8:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR08",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR08\",\n    \"materia\": {\n        \"id\": \"MAT32\"\n    },\n    \"docente\": {\n        \"rfc\": \"FKEC903733WLU\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"JACW370066DLZ3\"\n        },\n        {\n            \"curp\": \"GQBH684962KJE9\"\n        },\n        {\n            \"curp\": \"ATWG460782LFL2\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL08\"\n    },\n    \"horario\": \"8:00 AM - 9:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR09",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR09\",\n    \"materia\": {\n        \"id\": \"MAT33\"\n    },\n    \"docente\": {\n        \"rfc\": \"FKEC903733WLU\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"JACW370066DLZ3\"\n        },\n        {\n            \"curp\": \"GQBH684962KJE9\"\n        },\n        {\n            \"curp\": \"ATWG460782LFL2\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL09\"\n    },\n    \"horario\": \"9:00 AM - 10:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR10",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR10\",\n    \"materia\": {\n        \"id\": \"MAT41\"\n    },\n    \"docente\": {\n        \"rfc\": \"UWVF547988HXI\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AZLR282893EVV0\"\n        },\n        {\n            \"curp\": \"IQBG109690ZSL4\"\n        },\n        {\n            \"curp\": \"HLYN050170LPD6\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL10\"\n    },\n    \"horario\": \"7:00 AM - 8:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR11",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR11\",\n    \"materia\": {\n        \"id\": \"MAT42\"\n    },\n    \"docente\": {\n        \"rfc\": \"UWVF547988HXI\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AZLR282893EVV0\"\n        },\n        {\n            \"curp\": \"IQBG109690ZSL4\"\n        },\n        {\n            \"curp\": \"HLYN050170LPD6\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL01\"\n    },\n    \"horario\": \"8:00 AM - 9:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR12",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR12\",\n    \"materia\": {\n        \"id\": \"MAT43\"\n    },\n    \"docente\": {\n        \"rfc\": \"UWVF547988HXI\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AZLR282893EVV0\"\n        },\n        {\n            \"curp\": \"IQBG109690ZSL4\"\n        },\n        {\n            \"curp\": \"HLYN050170LPD6\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL02\"\n    },\n    \"horario\": \"9:00 AM - 10:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR13",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR13\",\n    \"materia\": {\n        \"id\": \"MAT51\"\n    },\n    \"docente\": {\n        \"rfc\": \"BALN156049ZKO\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AABR522830WYU7\"\n        },\n        {\n            \"curp\": \"OBFM085953JRM6\"\n        },\n        {\n            \"curp\": \"ASQG331912CJF8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL03\"\n    },\n    \"horario\": \"7:00 AM - 8:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR14",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR14\",\n    \"materia\": {\n        \"id\": \"MAT52\"\n    },\n    \"docente\": {\n        \"rfc\": \"BALN156049ZKO\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AABR522830WYU7\"\n        },\n        {\n            \"curp\": \"OBFM085953JRM6\"\n        },\n        {\n            \"curp\": \"ASQG331912CJF8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL04\"\n    },\n    \"horario\": \"8:00 AM - 9:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "GR15",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"GR15\",\n    \"materia\": {\n        \"id\": \"MAT53\"\n    },\n    \"docente\": {\n        \"rfc\": \"BALN156049ZKO\"\n    },\n    \"alumnos\": [\n        {\n            \"curp\": \"AABR522830WYU7\"\n        },\n        {\n            \"curp\": \"OBFM085953JRM6\"\n        },\n        {\n            \"curp\": \"ASQG331912CJF8\"\n        },\n        {\n            \"curp\": \"KPCM153478MJN8\"\n        }\n    ],\n    \"aula\": {\n        \"id\": \"AUL05\"\n    },\n    \"horario\": \"9:00 AM - 10:00 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "showGrupos",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/grupos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos"
					]
				}
			},
			"response": []
		},
		{
			"name": "deleteGrupo",
			"request": {
				"method": "DELETE",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/grupos/GR15",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos",
						"GR15"
					]
				}
			},
			"response": []
		},
		{
			"name": "updateGrupo",
			"request": {
				"method": "PUT",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"horario\": \"8:10 AM - 8:50 AM\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/grupos/GR14",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos",
						"GR14"
					]
				}
			},
			"response": []
		}
	]
}
```

### Materias
```json
{
	"info": {
		"_postman_id": "d4b1164d-0016-4673-afa8-e2037cdb5885",
		"name": "Materias",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "mat11",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT11\",\n    \"nombre\": \"Calculo diferencial\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Introducción al estudio de límites y derivadas aplicadas.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat12",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT12\",\n    \"nombre\": \"Fundamentos de programacion\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Principios básicos de la programación y algoritmos.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat13",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT13\",\n    \"nombre\": \"Taller de etica\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Exploración de principios éticos en el contexto profesional y personal.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat21",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT21\",\n    \"nombre\": \"Calculo integral\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Continuación del estudio del cálculo con integración y sus aplicaciones.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat22",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT22\",\n    \"nombre\": \"Programacion orientada a objetos\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Conceptos de la POO: clases, objetos, herencia y polimorfismo.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat23",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT23\",\n    \"nombre\": \"Contabilidad financiera\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Fundamentos de la contabilidad y gestión financiera en empresas.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat31",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT31\",\n    \"nombre\": \"Calculo vectorial\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Estudio de campos vectoriales, gradiente y aplicaciones.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat32",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT32\",\n    \"nombre\": \"Estructura de datos\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Organización, manejo y almacenamiento eficiente de datos.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat33",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT33\",\n    \"nombre\": \"Cultura empresarial\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Desarrollo de habilidades gerenciales y cultura organizacional.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat41",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT41\",\n    \"nombre\": \"Ecuaciones diferenciales\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Solución de ecuaciones diferenciales y sus aplicaciones en ingeniería.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat42",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT42\",\n    \"nombre\": \"Metodos numericos\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Técnicas numéricas para la resolución de problemas matemáticos.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat43",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT43\",\n    \"nombre\": \"Topicos avanzados de programacion\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Avances en lenguajes de programación y técnicas de desarrollo.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat51",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT51\",\n    \"nombre\": \"Graficacion\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Técnicas de representación gráfica y visualización de datos.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat52",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT52\",\n    \"nombre\": \"Fundamentos de telecomunicaciones\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Principios y tecnologías subyacentes en las telecomunicaciones.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "mat53",
			"request": {
				"method": "POST",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"id\": \"MAT53\",\n    \"nombre\": \"Sistemas operativos\",\n    \"carrera\": \"ISC\",\n    \"descripcion\": \"Estudio de los sistemas operativos y su arquitectura.\",\n    \"planestudios\": \"Especialidad en Desarrollo Web\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		},
		{
			"name": "updateMateria",
			"request": {
				"method": "PUT",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"nombre\": \"Sistemas operativos 2\",\n    \"descripcion\": \"Estudio de los sistemas operativos y su arquitectura. mas Docker\"\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias/MAT53",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias",
						"MAT53"
					]
				}
			},
			"response": []
		},
		{
			"name": "deleteMateria",
			"request": {
				"method": "DELETE",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias/MAT52",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias",
						"MAT52"
					]
				}
			},
			"response": []
		},
		{
			"name": "getMaterias",
			"protocolProfileBehavior": {
				"disableBodyPruning": true
			},
			"request": {
				"method": "GET",
				"header": [],
				"body": {
					"mode": "raw",
					"raw": "",
					"options": {
						"raw": {
							"language": "text"
						}
					}
				},
				"url": {
					"raw": "http://localhost:3000/api/materias",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"materias"
					]
				}
			},
			"response": []
		}
	]
}
```

### Querys
```json
{
	"info": {
		"_postman_id": "25670e21-bbb3-4e69-acee-b5ea640e9a79",
		"name": "Q's",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "34808060"
	},
	"item": [
		{
			"name": "1",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/HAGZ954961XYI5/materias-cursadas",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"HAGZ954961XYI5",
						"materias-cursadas"
					]
				}
			},
			"response": []
		},
		{
			"name": "2",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/grupos/GR01/MAT11/alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos",
						"GR01",
						"MAT11",
						"alumnos"
					]
				}
			},
			"response": []
		},
		{
			"name": "3",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/TGOU165800CYS8/calificaciones",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"TGOU165800CYS8",
						"calificaciones"
					]
				}
			},
			"response": []
		},
		{
			"name": "4",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/docentes/MAT12/detalles",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes",
						"MAT12",
						"detalles"
					]
				}
			},
			"response": []
		},
		{
			"name": "5",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/calificaciones-altas/MAT11",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"calificaciones-altas",
						"MAT11"
					]
				}
			},
			"response": []
		},
		{
			"name": "6",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/grupos/por-materia/MAT11",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"grupos",
						"por-materia",
						"MAT11"
					]
				}
			},
			"response": []
		},
		{
			"name": "7",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/HAGZ954961XYI5/materias-con-horario",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"HAGZ954961XYI5",
						"materias-con-horario"
					]
				}
			},
			"response": []
		},
		{
			"name": "8",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/alumnos/HAGZ954961XYI5/materias-pendientes",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"alumnos",
						"HAGZ954961XYI5",
						"materias-pendientes"
					]
				}
			},
			"response": []
		},
		{
			"name": "9",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "http://localhost:3000/api/docentes/PZVP126857API/materias-con-alumnos",
					"protocol": "http",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"api",
						"docentes",
						"PZVP126857API",
						"materias-con-alumnos"
					]
				}
			},
			"response": []
		}
	]
}
```