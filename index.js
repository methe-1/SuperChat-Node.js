const http = require("http");
const express = require("express");
const ent = require("ent");
const socket = require("socket.io");

const { FieldValue } = require('firebase-admin/firestore');
const db = require("./firebase.js");
const { errorLogger, logger } = require("./utils/logger");

// set up server and socket.io
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);
// serve the frontend
app.use("/", express.static("public"));

// logger
app.use(logger());
// body parser
app.use(express.json());

// auth endpoint
app.post("/auth", async (req, res) => {
  const { body } = req;
  try {
    let user = null;
    const check_username = await db
      .collection("users")
      .select("username", "connected", "email")
      .where("username", "==", body.username)
      .get();
   
      if(!check_username.docs.length ){
        user = await db
              .collection('users')
              .add({ username: ent.encode(body.username), password: ent.encode(body.password), connected: true })
        user = await user.get();
        user.data = user.data();
      }else{
        user = await db
              .collection("users")
              .select("username", "connected", "email")
              .where("username", "==", body.username)
              .where("password", "==", body.password)
              .get();
        if (!user.docs.length) throw { code: 409, details: "If you're singing up then this username is taken, otherwise if if you're logging in, then your password is incorrect" };
        // set user.connected to be true
        await db.collection('users').doc(user.docs[0].id).update({
          connected: true
        })
        user = { id: user.docs[0].id, data: user.docs[0].data()}
      }

      
    res.status(200).send({ id: user.id, ...user.data });
  } catch (error) {
    console.log('====================================');
    console.log(error);
    console.log('====================================');
    req.error = error;
    res.status(error.code || 500).send({
      details: error.details || JSON.stringify("something went wrong!"),
    });
  }
});

// socket
io.sockets.on("connection", async function (socket) {

  
  try {

    socket.on("verify_user", async function (user) {
   
      try {
        const userRef = await db.collection("users").doc(user.id);

        socket.emit("verified", true);
    
        // get all active users
        const { docs: users } = await db
        .collection("users")
        .select("username", "email", "connected")
        .where("connected", "==", true)
        .get();
    
        // broadcast to the new user
        socket.emit("welcome", user);
      
        socket.emit("actives", mapUsers(users));
        
        // broadcast to eveyone except the new user

        socket.broadcast.emit("new_user", user);

        // socket.broadcast.emit("actives", mapUsers(users));

      } catch (error) {
        errorLogger(error);
        socket.emit("verified", false);
      }
    });
    

    socket.on("msg", async (data) => {
      // added msg to db
      try {
        const userRef = await db.collection("users").doc(data.user.id);

        let msg = await db.collection("messages").add({
          body: ent.encode(data.message),
          date: FieldValue.serverTimestamp(),
          user_id: `/users/${data.user.id}`,
        });
        msg = await msg.get();

        socket.broadcast.emit("msg", {
          user: data.user,
          message: msg.data().body,
        });
      } catch (error) {
        socket.emit("mesg", {
          user: data.user,
          msg: "send message failed!"
        })
      }
    });

    socket.on("quit", async (user) => {
    // update DB
    await db.collection('users').doc(user.id).update({ connected: false });

    // broadcast a user left
    socket.broadcast.emit("user_left", {...user, connected: false});
  });
  } catch (error) {
    errorLogger(error);
    socket.emit("verified", false);
  }
});
function mapUsers(users){
  return users.map(user => ({ id: user.id, ...user.data() }))
}
server.listen(process.env.PORT || 3001);
