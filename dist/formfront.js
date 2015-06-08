//tbc

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});


var formfront = {};

formfront.list = function(endpoint, id){

    var row = "<div><%= name%></div>";

    $.ajax({
        url: endpoint,
        type: 'GET',
        success:function(response){
            console.log(response);
            for (var i = 0; i < response.length; i++){
                console.log(response[i]);
                var compiled = _.template(row)
                $("#" + id).append(compiled(response[i]));
            }
        }
   });
};

formfront.create = function(endpoint, id, callback){

    var stringField = "<div id='field-<%= labelLowered %>'><%= label %><input type='text' name='<%= labelLowered %>' /></div>";

    $.ajax({
        url: endpoint,
        type: 'OPTIONS',
        success: function(result) {
            var body = "<style id='form-styles'></style><div id='form-errors' class='form-error'></div><form id='form-body' action='" + endpoint + "'>";
            for (var field in result.actions.POST){
                console.log(result.actions.POST[field]);
                switch (result.actions.POST[field].type){
                    case "string":
                        var compiled = _.template(stringField)
                        result.actions.POST[field].labelLowered = result.actions.POST[field].label.toLowerCase();
                        body += compiled(result.actions.POST[field]);
                        break;
                    default:
                        body += "<div>Not sure what this is</div>";
                }
            }
            body += "<input type='submit' id='form-submit'></form>";
            $("#" + id).append(body);

            var styles = ".form-error{color:red;}";

            $("#form-styles").html(styles);

            $("#form-submit").on("click", function(e){
                e.stopPropagation();
                e.preventDefault();

                console.log($("#form-body").serializeObject());

                 $.ajax({
                     url: endpoint,
                     type: 'POST',
                     data: $("#form-body").serializeObject(),
                     success: function (result) {
                         console.log(result);
                         callback();
                     },
                     error:function(response){
                         console.log(response);
                         $("#form-errors").html("");
                         for (var error in response.responseJSON){
                             console.log("#field-" + error);
                             $("#field-" + error).addClass("form-error");
                             $("#form-errors").append(error + ": " + response.responseJSON[error]);
                             console.log(response.responseJSON[error]);
                         }
                     }
                 });

            });

        }
    });

};