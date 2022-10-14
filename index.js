const http = require("http");
const express = require("express");
const ent = require("ent");
const socket = require("socket.io");

const db = require('./firebase.js');


// const { db, ACTIVES,  USERS } = require('./db');


// set up server and socket.io
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

// serve the frontend
app.use('/', express.static('public'));

app.use(express.json());
app.post('/auth', (req, res) => {
  console.log('====================================');
  console.log('body', req.body);
  console.log('====================================');
  res
  .status(200)
  .send({ body: req.body})
})
io.sockets.on("connection", async function (socket) {
  
  
  socket.on("connected_user", async function () {

    // const existed_users = JSON.parse(db.getItem(USERS));

    // socket.emit("start_auth");
    
    socket.on('add_user', async (pseudo) => {

      // remove this
      db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) + 1);
      
      // create user 
      // const user = await db.collection('users').add({ username: ent.encode(pseudo), connected: true })
      db.setItem(USERS, JSON.stringify([...existed_users, pseudo]));

      // get all active users
      // const users = await db.collection('users').where('connected', '==', true).get();
      
      
      // broadcast to the new user
      // socket.emit("welcome", user);
      socket.emit("welcome", ent.encode(pseudo || ''));
      
      // socket.emit('actives', users);
      socket.emit('actives', Number(db.getItem(ACTIVES)));
      
      
      // broadcast to eveyone except the new user
      // socket.broadcast.emit("new_user", user);
      socket.broadcast.emit("new_user", ent.encode(pseudo || ''));
      
      // socket.broadcast.emit('actives', users);
      socket.broadcast.emit("actives", Number(db.getItem(ACTIVES)));

      socket.on("msg", async (data) => {
        // added msg to db
        // const msg = await db.collection('messages').add({ body: ent.encode(data.message), date: FieldValue.serverTimestamp(), user_id: `/users/${data.user.id}`})
        //  socket.broadcast.emit("msg", { pseudo: data.user, message: msg.body });
        socket.broadcast.emit("msg", { pseudo: data.pseudo, message: ent.encode(data.message) });
      });

      socket.on("quit", async (pseudo) => {
        // update DB
        // await db.collection('users').doc(user.id).update({ connected: false });
        db.setItem(ACTIVES, Number(db.getItem(ACTIVES)) - 1);
        
        // broadcast a user left 
        // socket.broadcast.emit("user_left", user);

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
