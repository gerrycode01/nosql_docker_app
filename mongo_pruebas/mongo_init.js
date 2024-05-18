rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo01:27017" },
    { _id: 1, host: "mongo02:27017" },
    { _id: 2, host: "mongo03:27017" },
    { _id: 3, host: "mongo04:27017" }
  ]
});

print('Conjunto de réplicas iniciado');
