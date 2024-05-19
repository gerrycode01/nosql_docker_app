#!/bin/bash

# Apagar docker-compose
docker-compose down

# Esperar
sleep 5

# Eliminar imagen tecapp-app
docker image rm tecapp-app

