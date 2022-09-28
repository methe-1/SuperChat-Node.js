var socket = io.connect("http://localhost:8080");
var pseudo = prompt("donnez votre pseudo");

socket.emit("new_user", pseudo);
document.title = pseudo + ": " + document.title;

socket.on("nbr_users", function (data) {
  $("#nbr_users").html(data);
});

socket.on("new_user", function (pseudo) {
  $("#conversation").prepend("<p><em> " + pseudo + " is here </em></p>");
});

$("#send").submit(function () {
  message = $("#msgcontent").val();
  socket.emit("msg", message);
  $("#conversation").prepend(msgcontainer(pseudo, message));
  message = $("#msgcontent").val("").focus();
  return false;
});

socket.on("msg", function (data) {
  $("#conversation").prepend(msgcontainer(data.pseudo, data.message));
});

function msgcontainer(pseudo, msg) {
  return (
    '<p> <h5 style="display:inline">' +
    pseudo +
    " " +
    "</h5>" +
    "<span>" +
    msg +
    "</span></p>"
  );
}
