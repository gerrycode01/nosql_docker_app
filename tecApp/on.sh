#!/bin/bash

# Activar docker-compose
docker-compose up -d --no-deps --build app

# Esperar a que se active
sleep 5

# Copiar el script de replica set
#xclip -selection clipboard < mongo_init.js

# Ejecutar contenedor de mongo para pegar script de replica
#docker exec -it mongo01 bash -c mongosh
