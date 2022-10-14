const host = 'http://localhost:3001' // "https://superchat.onrender.com"
var socket = io.connect();
var message_vanish_id = null;


socket.on("actives", function (data) {
  $("#nbr_users").html(data);
});

socket.on("new_user", function (pseudo) {
  $("#socket_message").html(`${pseudo} just got online!`);

  if(message_vanish_id) clearTimeout(message_vanish_id);
  message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
});
socket.on("welcome", (pseudo) => {
  $("#socket_message").html(`Welcome ${pseudo}!`);

  if(message_vanish_id) clearTimeout(message_vanish_id);
  message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
})
socket.on("user_left", function (pseudo) {
    $("#socket_message").html(`${pseudo} has left!`);

    if(message_vanish_id) clearTimeout(message_vanish_id);
    message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
});

socket.on("msg", function (data) {
    $(".conversation_container").append(msgcontainer(data.pseudo, data.message, false));
    $("#conversation").animate({ scrollTop:  $('#conversation').prop('scrollHeight')}, 50);
});


let users = []
let pseudo = null;

socket.on("receive_users", function (data) {
    users = data;
    let prompt_msg = "type your username"
    while(!pseudo) {
        pseudo = prompt(prompt_msg);
        
        if(pseudo.length < 3){
            prompt_msg = `${pseudo}: username must be at least of 3 charcaters`;
            pseudo = null;
        }

        if(users.indexOf(pseudo) != -1){
            prompt_msg = `${pseudo} is taken`;
            pseudo = null;
        }
        
    }
    document.title = `${document.title}: ${pseudo}`;
    socket.emit('add_user', pseudo);

   
});

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

socket.emit("connected_user");

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
