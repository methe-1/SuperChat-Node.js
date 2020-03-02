var http = require('http'), 
    express  = require('express'),
    ent = require('ent'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
    


    
    app.get('/', function(req, res){
     //  res.sendFile(__dirname + '/index.html');
      res.render('index.ejs');
    })


var nbr_users = 0;
io.sockets.on('connection', function(socket){
nbr_users = nbr_users + 1;

 socket.broadcast.emit('nbr_users', nbr_users);

 socket.on('new_user', function(pseudo){
    socket.pseudo = ent.encode(pseudo);
    socket.broadcast.emit('new_user', pseudo);
    console.log(socket.pseudo + ' is connected');
  socket.on('msg', function(mess){
      message = ent.encode(mess);
     socket.broadcast.emit('msg', {pseudo:socket.pseudo,
                                  message: message});
  })
});

});
server.listen(8080);