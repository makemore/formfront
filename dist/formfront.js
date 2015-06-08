//tbc




var formfront = function(endpoint, id){


    var stringField = "<div><%= label %><input type='text'/></div>";


    $.ajax({
        url: endpoint,
        type: 'OPTIONS',
        success: function(result) {
            var body = "<div id='form-errors'></div><form id='form-body' action='" + endpoint + "'>";
            for (var field in result.actions.POST){
                console.log(result.actions.POST[field]);
                switch (result.actions.POST[field].type){
                    case "string":
                        var compiled = _.template(stringField)
                        body += compiled(result.actions.POST[field]);
                        break;
                    default:
                        body += "<div>Not sure what this is</div>";
                }

            }
            body += "<input type='submit' id='form-submit'></form>";
            $("#" + id).append(body);

            $("#form-submit").on("click", function(e){
                e.stopPropagation();
                e.preventDefault();

                 $.ajax({
                     url: endpoint,
                     type: 'POST',
                     data: $("#form-body").serialize(),
                     success: function (result) {
                         console.log(result);
                     },
                     error:function(response){
                         console.log(response);
                         $("#form-errors").html("");
                         for (var error in response.responseJSON){
                             $("#form-errors").append(error + ": " + response.responseJSON[error]);
                             console.log(response.responseJSON[error]);
                         }
                     }
                 });

            });

        }
    });

};