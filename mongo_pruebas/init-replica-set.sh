#!/bin/bash
set -e

# Esperar a que todos los nodos estén listos
echo "Esperando a que los nodos MongoDB estén disponibles..."
until mongo --host mongo01 --port 27017 --eval "print('esperando a mongo01...')" &>/dev/null; do
  sleep 1
done

until mongo --host mongo02 --port 27018 --eval "print('esperando a mongo02...')" &>/dev/null; do
  sleep 1
done

until mongo --host mongo03 --port 27019 --eval "print('esperando a mongo03...')" &>/dev/null; do
  sleep 1
done

until mongo --host mongo04 --port 27020 --eval "print('esperando a mongo04...')" &>/dev/null; do
  sleep 1
done

echo "Configurando el replica set..."

# Configuración del replica set
mongo --host mongo01 --port 27017 <<EOF
rs.initiate({
  _id: "replica01",
  members: [
    { _id: 0, host: "mongo01:27017", priority: 2 },
    { _id: 1, host: "mongo02:27018" },
    { _id: 2, host: "mongo03:27019" },
    { _id: 3, host: "mongo04:27020" }
  ]
})
EOF
