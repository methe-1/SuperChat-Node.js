var socket = io.connect("http://localhost:8080");



socket.on("actives", function (data) {
  $("#nbr_users").html(data);
});

// socket.on("new_user", function (pseudo) {
//   $("#conversation").append(`
//     <div  class="message_container  ">
//         ${pseudo} just got online!
//     </div>
//   `);
// });
// socket.on("welcome", (pseudo) => {
//   $("#conversation").append(`
//     <div  class="message_container message_container_mb  ">
//         Welcome ${pseudo}!
//     </div>
//   `);

// })
socket.on("user_left", function (pseudo) {
    $("#conversation").prepend("<p><em> " + pseudo + " has left </em></p>");
});

socket.on("msg", function (data) {
    $(".conversation_container").append(msgcontainer(data.pseudo, data.message, false));
    $("#conversation").animate({ scrollTop:  $('#conversation').prop('scrollHeight')}, 50);
});

var pseudo = prompt("donnez votre pseudo") || 'anonymous';
document.title = `${document.title}: ${pseudo}`;

socket.emit("new_user", pseudo);

$("#send").submit(function () {
  message = $("#msgcontent").val();
  socket.emit("msg", { pseudo, message});
  $(".conversation_container").append(msgcontainer(pseudo, message, true));
  $("#conversation").animate({ scrollTop:  $('#conversation').prop('scrollHeight')}, 50);
  message = $("#msgcontent").val("").focus();
  return false;
});



$(window).unload(function(){
    socket.emit("quit", pseudo);

 });
function msgcontainer(pseudo, msg, mine) {
  return (
    `
    <div  class="message_container ${ mine ? 'message_container_mb' : ''}  ">
        <div style="width: 100%;">
            <div class="msg_sub_cont ${ mine ? 'my_message' : 'their_message'}">
                <div class="message ${ mine ? 'my_msg_color' : 'their_msg_color'}">
                ${msg}
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; padding-right: 15px; ">
                <sub style="font-size: smaller; vertical-align: sub; ">
                ${mine ? '' : pseudo}
                </sub>
            </div>
        </div>
    </div>
    `
  );
}
