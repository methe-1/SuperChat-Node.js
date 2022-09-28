const http = require("http");
const express = require("express");
const ent = require("ent");
const socket = require("socket.io");


const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

app.use('/', express.static('public'));

// real-time database
let nbr_users = 0;

// firestore database
let users = []

io.sockets.on("connection", function (socket) {
  nbr_users = nbr_users + 1;

  socket.broadcast.emit("nbr_users", nbr_users);
  
  socket.on("new_user", function (pseudo) {
    socket.broadcast.emit("new_user", ent.encode(pseudo));
    socket.on("msg", function (mess) {
      message = ent.encode(mess);
      socket.broadcast.emit("msg", { pseudo: socket.pseudo, message: message });
    });
  });
});

server.listen(8080);
