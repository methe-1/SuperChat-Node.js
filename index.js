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
  
  
  socket.on("connected_user", async function () {

    const existed_users = JSON.parse(db.getItem(USERS));

    socket.emit("receive_users", existed_users);
    
    socket.on('add_user', (pseudo) => {

      db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) + 1);
      
      // add user 
      db.setItem(USERS, JSON.stringify([...existed_users, pseudo]));
      
      
      // broadcast to the new user
      socket.emit("welcome", ent.encode(pseudo || ''));
      socket.emit('actives', Number(db.getItem(ACTIVES)));
      
      
      // broadcast to eveyone except the new user
      socket.broadcast.emit("new_user", ent.encode(pseudo || ''));
      socket.broadcast.emit("actives", Number(db.getItem(ACTIVES)));

      socket.on("msg", function (data) {
        socket.broadcast.emit("msg", { pseudo: data.pseudo, message: ent.encode(data.message) });
      });

      socket.on("quit", (pseudo) => {
        db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) - 1);
  
        // remove user
        let users = JSON.parse(db.getItem(USERS));
        db.setItem(USERS, JSON.stringify(users.splice(users.indexOf(pseudo), 1)));
        
        socket.broadcast.emit("actives", Number(db.getItem(ACTIVES)));
        socket.broadcast.emit("user_left", ent.encode(pseudo));
      })
    })

    
    
  });
});



server.listen(process.env.PORT || 3001)
