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