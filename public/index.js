const host = 'http://localhost:3001' // "https://superchat.onrender.com"
var socket = io.connect(host);


auth();



function auth(){

    async function authenticate(data){
        return await axios.post(`${host}/auth`, data)
    }

    var dialog, form,
    
        // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
        // emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        name = $( "#name" ),
        // email = $( "#email" ),
        password = $( "#password" ),
        allFields = $( [] ).add( name ).add( password ),
        tips = $( ".validateTips" );
    
    function updateTips( t ) {
        tips
        .text( t )
        .addClass( "ui-state-highlight" );
        setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
        }, 500 );
    }
    
    function checkLength( o, n, min, max ) {
        if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
            min + " and " + max + "." );
        return false;
        } else {
        return true;
        }
    }
    
    function checkRegexp( o, regexp, n ) {
        if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
        } else {
        return true;
        }
    }
    
    async function addUser() {
        var valid = true;
        allFields.removeClass( "ui-state-error" );
    
        valid = valid && checkLength( name, "username", 3, 16 );
        // valid = valid && checkLength( email, "email", 6, 80 );
        valid = valid && checkLength( password, "password", 5, 16 );
    
        valid = valid && checkRegexp( name, /^[a-z]([0-9a-z_\s])+$/i, "Username may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );
        // valid = valid && checkRegexp( email, emailRegex, "eg. ui@jquery.com" );
        valid = valid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
    
        if ( valid ) {
        try {
            const res = await authenticate({ username: name.val(), password: password.val() })
            dialog.dialog( "close" );
            $('.container').addClass('container-show');
            setupSocketEvents(res.data);
            setupMessageEmitting(res.data);
            setupUserQuitEventEmitting(res.data);
        } catch (error) {
            let status = error.response && error.response.status || 0;
            console.log('====================================');
            console.log(error);
            console.log('====================================');
            updateTips(status >= 400 && status <= 499 ? error.response.data.details : 'email/password is wrong!')
        }
        }
        return valid;
    }
    
    dialog = $( "#dialog-form" ).dialog({
        autoOpen: false,
        height: 350,
        width: 350,
        modal: true,
        buttons: {
        "Login/signup": addUser,
        // Cancel: function() {
        //     dialog.dialog( "close" );
        // }
        },
        close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
        }
    });
    
    form = dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        addUser();
    });
    
    // $( "#create-user" ).button().on( "click", function() {
    //  
    // });

    dialog.dialog( "open" );
    // document.title = `${document.title}: ${pseudo}`;
    // socket.emit('add_user', pseudo);
}

function setupMessageEmitting(user){
    $("#send").submit(function () {
        message = $("#msgcontent").val();
        socket.emit("msg", { user, message });
        $(".conversation_container").append(msgcontainer(null, message, true));
        $("#conversation").animate({ scrollTop:  $('#conversation').prop('scrollHeight')}, 50);
        message = $("#msgcontent").val("").focus();
        return false;
    });
}

function setupUserQuitEventEmitting(user){
    $(window).on('unload', function(){
        socket.emit("quit", user);
    });
}

function setupSocketEvents(user){
    let message_vanish_id = null;
    let users = null;

    socket.emit('verify_user', user);
    socket.on('verified', (verified) => {
        if(verified){
            socket.on("welcome", (user) => {
                $("#socket_message").html(`Welcome ${user.username}!`);
                
                if(message_vanish_id) clearTimeout(message_vanish_id);
                message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
            })

            socket.on("actives", function (users_list) {
                users = users_list;

                $("#nbr_users").html(users_list.length);
            });
            
            socket.on("new_user", function (user) {
                // add user to active users
                if(!users.find((active => active.id == user.id))){
                    users.push(user);
                    $("#nbr_users").html(users.length);
                }
                
                $("#socket_message").html(`${user.username} just got online!`);
                
                if(message_vanish_id) clearTimeout(message_vanish_id);
                message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
            });
           
            socket.on("user_left", function (left) {
                if(user.id == left.id) {
                    location.reload();
                }
                $("#socket_message").html(`${left.username} has left!`);
                
                users = users.filter(active => active.id != left.id);

                // update active user's number 
                $("#nbr_users").html(users.length);

                // notify user
                if(message_vanish_id) clearTimeout(message_vanish_id);
                message_vanish_id = setTimeout(() => $("#socket_message").html(''), 4 * 1000)
            });
            
            socket.on("msg", function (data) {
                $(".conversation_container").append(msgcontainer(data.user.username, data.message, false));
                $("#conversation").animate({ scrollTop:  $('#conversation').prop('scrollHeight')}, 50);
            });
            
            socket.emit('fetch');
        }
    })
}


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
