const http = require("http");
const express = require("express");
const ent = require("ent");
const socket = require("socket.io");
const { db, ACTIVES,  USERS } = require('./db');


// set up server and socket.io
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

// serve the frontend
app.use('/', express.static('public'));


io.sockets.on("connection", async function (socket) {
  
  db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) + 1);

  
  
  socket.on("new_user", async function (pseudo) {

    socket.broadcast.emit("actives", Number(db.getItem(ACTIVES)));
    socket.emit('actives', Number(db.getItem(ACTIVES)));

    db.setItem(USERS, JSON.stringify([... JSON.parse(db.getItem(USERS)), pseudo]));

    socket.broadcast.emit("new_user", ent.encode(pseudo || ''));
    socket.emit("welcome", ent.encode(pseudo || ''));
    
    socket.on("msg", function (data) {
      socket.broadcast.emit("msg", { pseudo: data.pseudo, message: ent.encode(data.message) });
    });
    socket.on("quit", (pseudo) => {
      db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) - 1);

      // remove user
      let users = JSON.parse(db.getItem(USERS));
      db.setItem(USERS, JSON.stringify(users.splice(users.indexOf(pseudo, 1))));
      
      socket.broadcast.emit("actives", Number(db.getItem(ACTIVES)));
      socket.broadcast.emit("user_left", ent.encode(pseudo));
    })
  });
});



server.listen(8080)
