//tbc

$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
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
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});


var formfront = (function () {
    var my = {},
        privateVariable = 1;

    function privateMethod() {
        // ...
    }

    var config = {};

    my.config = function(configObject){
        config = configObject;
    };

    var getItemList = function (endpoint, callback) {
        $.ajax({
            url: endpoint,
            type: 'GET',
            success: function (response) {
                callback(response);
            }
        });
    };

    //returns the first object from the response.actions (so handles POST and PUT) May cause problems later.
    var getOptions = function (endpoint, callback) {
        $.ajax({
            url: endpoint,
            type: 'OPTIONS',
            success: function (response) {
                callback(response.actions[Object.keys(response.actions)[0]]);
            }
        });
    };

    var generateListHtml = function (response) {
        var body = "<div><button id='delete-items'>delete selected</button></div>";
        var row = "<div><input type='checkbox' name='<%= pk %>' class='item-selected'><%= name%> <button class='item-edit' id='<%= pk %>'>edit</button></div>";
        for (var i = 0; i < response.length; i++) {
            var compiled = _.template(row);
            body += compiled(response[i]);
        }
        return body;
    };

    my.list = function (endpoint, id, callback, navigate) {
        getItemList(endpoint, function (response) {
            $("#" + id).html(generateListHtml(response));

            $(".item-edit").on("click", function (e) {
                return navigate($(this).attr('id'));
            });

            $("#delete-items").on("click", function (e) {

                var selected = [];
                $('.item-selected:checked').each(function () {
                    selected.push($(this).attr('name'));
                });

                for (var i = 0; i < selected.length; i++) {
                    $.ajax({
                        url: endpoint + selected[i] + "/",
                        type: 'DELETE',
                        success: function (result) {
                            console.log(result);
                            callback();
                        }
                    });
                }
            });
        });
    };


    var generateFormHtml = function (fields) {
        var stringField = "<div id='field-<%= labelLowered %>'><%= label %><input type='text' name='<%= labelLowered %>' /></div>";

        var body = "<style id='form-styles'></style><div id='form-errors' class='form-error'></div><form id='form-body'>";
        for (var field in fields) {
            //console.log(response.actions.POST[field]);
            switch (fields[field].type) {
                case "string":
                    var compiled = _.template(stringField);
                    fields[field].labelLowered = fields[field].label.toLowerCase();
                    body += compiled(fields[field]);
                    break;
                case "integer":
                    var compiled = _.template(stringField);
                    fields[field].labelLowered = fields[field].label.toLowerCase();
                    //ignore primary key field
                    if (fields[field].labelLowered != config.primaryKeyName){
                       body += compiled(fields[field]);
                    }
                    break;
                default:
                    body += "<div>Not sure what this is</div>";
            }
        }
        body += "<input type='submit' id='form-submit'></form>";
        return body;
    };

    var populateFormData = function(data){
        for (var key in data){
            console.log(key);
            console.log(data[key]);
            if ($("#field-" + key).length > 0){
                 $($("#field-" + key).children()[0]).val(data[key]);
            }
        }
    };

    var getItem = function(endpoint, callback){
        $.ajax({
            url: endpoint,
            type: 'GET',
            success: function (response) {
                //console.log(response);
                callback(response);
            }
        });
    };


    my.edit = function (endpoint, id, callback) {
        getOptions(endpoint, function (optionsResponse) {
            $("#" + id).append(generateFormHtml(optionsResponse));
            getItem(endpoint, function(itemResponse){
                populateFormData(itemResponse);
                var styles = ".form-error{color:red;}";
                $("#form-styles").html(styles);

                $("#form-submit").on("click", function (e) {
                e.stopPropagation();
                e.preventDefault();
                console.log($("#form-body").serializeObject());
                $.ajax({
                    url: endpoint,
                    type: 'PUT',
                    data: $("#form-body").serializeObject(),
                    success: function (result) {
                        console.log(result);
                        callback();
                    },
                    error: function (response) {
                        console.log(response);
                        $("#form-errors").html("");
                        for (var error in response.responseJSON) {
                            console.log("#field-" + error);
                            $("#field-" + error).addClass("form-error");
                            $("#form-errors").append(error + ": " + response.responseJSON[error]);
                            console.log(response.responseJSON[error]);
                        }
                    }
                });
            });

            });
        });
    };

    my.create = function (endpoint, id, callback) {
        getOptions(endpoint, function (response) {
            $("#" + id).append(generateFormHtml(response));

            var styles = ".form-error{color:red;}";
            $("#form-styles").html(styles);
            $("#form-submit").on("click", function (e) {
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
                    error: function (response) {
                        console.log(response);
                        $("#form-errors").html("");
                        for (var error in response.responseJSON) {
                            console.log("#field-" + error);
                            $("#field-" + error).addClass("form-error");
                            $("#form-errors").append(error + ": " + response.responseJSON[error]);
                            console.log(response.responseJSON[error]);
                        }
                    }
                });
            });
        });
    };

    return my;
}());



