/*jslint node: true */

var formfront = (function ($) {

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


    var my = {},
        config = {},
        currentOptions = null;

    my.config = function (configObject) {
        config = configObject;
    };

    function getItemList(endpoint, callback) {
        $.ajax({
            url: endpoint,
            type: 'GET',
            success: function (response) {
                callback(response);
            }
        });
    }

    //returns the first object from the response.actions (so handles POST and PUT) May cause problems later.
    function getOptions(endpoint, callback) {
        $.ajax({
            url: endpoint,
            type: 'OPTIONS',
            success: function (response) {
                currentOptions = response.actions[Object.keys(response.actions)[0]];
                for (var field in currentOptions){
                    currentOptions[field].labelLowered = currentOptions[field].label.toLowerCase(); //this could just be = field; ?
                }
                callback(currentOptions);
            }
        });
    }

    function generateListHtml(response) {
        var listRowHtml = "";
        for (var i = 0; i < response.length; i++) {
            var actionHtml = "";
            if (typeof(internalOptions.actions) != "undefined"){
                //<a class='item-action' id='<%= actionId %>'><%= actionName</a>
                var actionCompiled = _.template(templates.listRowAction);
                for (var action in internalOptions.actions){
                    actionHtml += actionCompiled({actionName: action, data: response[i]});
                }
            }
            var compiled = _.template(templates.listRow);
            listRowHtml += compiled({data: response[i], actions: actionHtml });
        }
        var listBodyCompiled = _.template(templates.listBody);
        var listBodyHtml = listBodyCompiled({listRows: listRowHtml});
        return listBodyHtml;
    }

    my.list = function (options) {
        internalOptions = options;
        getItemList(options.endpoint, function (response) {
            $("#" + options.id).html(generateListHtml(response));

            $(".item-edit").on("click", function (e) {
                return options.navigate($(this).attr('id'));
            });

            $(".item-action").on("click", function(){
                options.actions[$(this).data("action")]($(this).data("id"));
            });

            $("#delete-items").on("click", function (e) {

                var selected = [];
                $('.item-selected:checked').each(function () {
                    selected.push($(this).attr('name'));
                });

                for (var i = 0; i < selected.length; i++) {
                    $.ajax({
                        url: options.endpoint + selected[i] + "/",
                        type: 'DELETE',
                        success: function (result) {
                            console.log(result);
                            options.callback();
                        }
                    });
                }
            });
        });
    };

    var getTemplate = function (filename, callback) {

        var jsFileLocation = $('script[src*=formfront]').attr('src');  // the js file path
        jsFileLocation = jsFileLocation.replace('formfront.js', '');
        //alert(jsFileLocation);

        $.ajax({
            url: jsFileLocation + "templates/" + config.template + "/" + filename,
            method: 'GET',
            //async: false,
            success: function (data) {
                callback(data);
            }
        });
    };

    var templates = {};

    my.setupTemplates = function () {
        getTemplate("_field-body.html", function (html) {
            templates.fieldBody = html;
            templatesLoaded = true;
        });
        getTemplate("field-string.html", function (html) {
            templates.stringField = html;
            templatesLoaded = true;
        });
         getTemplate("field-decimal.html", function (html) {
            templates.decimalField = html;
            templatesLoaded = true;
        });
        getTemplate("field-boolean.html", function (html) {
            templates.booleanField = html;
            templatesLoaded = true;
        });
        getTemplate("field-field-body.html", function (html) {
            templates.fieldFieldBody = html;
            templatesLoaded = true;
        });
        getTemplate("field-date.html", function (html) {
            templates.dateField = html;
            templatesLoaded = true;
        });
         getTemplate("field-file.html", function (html) {
            templates.fileField = html;
            templatesLoaded = true;
        });
        getTemplate("field-lookup.html", function (html) {
            templates.lookupField = html;
            templatesLoaded = true;
        });
        getTemplate("field-field-option.html", function (html) {
            templates.fieldFieldOption = html;
            templatesLoaded = true;
        });
        getTemplate("form-body.html", function (html) {
            templates.formBody = html;
            templatesLoaded = true;
        });
        getTemplate("list-body.html", function (html) {
            templates.listBody = html;
            templatesLoaded = true;
        });
        getTemplate("list-row.html", function (html) {
            templates.listRow = html;
            templatesLoaded = true;
        });
        getTemplate("list-row-action.html", function (html) {
            templates.listRowAction = html;
            templatesLoaded = true;
        });

    };
        
    var templatesLoaded = false;

    var generateFormHtml = function (fields) {
        var fieldHtml = "";
        var fieldBody = _.template(templates.fieldBody);

        //should be a better way of doing this?
        if (typeof(internalOptions.ignore) == "undefined"){
            internalOptions.ignore = [];
        }
        for (var field in fields) {
            //tests to see if current field is in ignore list
            if (internalOptions.ignore.indexOf(field) == -1) {
                switch (fields[field].type) {

                    case "string":
                        var compiled = _.template(templates.stringField);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field})
                        });
                        break;

                    case "text":
                        var compiled = _.template(templates.stringField);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field})
                        });
                        break;

                    case "boolean":
                        var compiled = _.template(templates.booleanField);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field})
                        });
                        break;

                    case "integer":
                        var compiled = _.template(templates.stringField);
                        //ignore primary key field
                        if (fields[field].labelLowered != config.primaryKeyName) {
                            fieldHtml += fieldBody({
                                field: field,
                                data: fields[field],
                                fieldHtml: compiled({field: field})
                            });
                        }
                        break;

                    case "decimal":
                        var compiled = _.template(templates.decimalField);
                        //ignore primary key field
                        if (fields[field].labelLowered != config.primaryKeyName) {
                            fieldHtml += fieldBody({
                                field: field,
                                data: fields[field],
                                fieldHtml: compiled({field: field})
                            });
                        }
                        break;

                    case "field": //This should actually be relatedField or something like that.
                        var compiledOption = _.template(templates.fieldFieldOption);
                        var optionHtml = "";

                        //added to have default option of nothing
                        optionHtml += compiledOption({value:null, displayName:"Select " + field});

                        for (var i = 0; i < fields[field].choices.length; i++) {
                            optionHtml += compiledOption(fields[field].choices[i])
                        }
                        var compiled = _.template(templates.fieldFieldBody);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field, options: optionHtml})
                        });
                        break;

                    case "choice":
                        var compiledOption = _.template(templates.fieldFieldOption);
                        var optionHtml = "";
                        for (var i = 0; i < fields[field].choices.length; i++) {
                            optionHtml += compiledOption(fields[field].choices[i])
                        }
                        var compiled = _.template(templates.fieldFieldBody);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field, options: optionHtml})
                        });
                        break;

                    case "date":
                        var compiled = _.template(templates.dateField);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field})
                        });
                        break;

                    case "file upload":
                        var compiled = _.template(templates.fileField);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field})
                        });
                        break;


                    case "lookup field":
                        var compiled = _.template(templates.lookupField);
                        console.log(fields[field]);
                        fieldHtml += fieldBody({
                            field: field,
                            data: fields[field],
                            fieldHtml: compiled({field: field, endpoint: fields[field].endpoint})
                        });
                        break;

                    default:
                        console.log("warning: didn't know how to apply data correctly to: " + field + " (type = " + fields[field].type + ")");
                        console.log()
                        fieldHtml += "<div>Not sure what this is</div>";
                        break;
                }
            }
        }
        var formCompiled = _.template(templates.formBody);
        var formHtml = formCompiled({formBody: fieldHtml});
        return formHtml;
    };

    var bindFormActions = function(){
        $(".ff-lookup").autocomplete({
            source: function (request, response) {
                $.ajax({
                    url: $(this.element).data("endpoint") + "?m=ajax&q=" + request.term,
                    dataType: "json",
                    //data: {query: request.term},
                    success: function (data) {
                        var transformed = $.map(data, function (el) {
                            return {
                                label: el.date + " " + el.description + " " + el.amount,
                                value: el.date + " " + el.description + " " + el.amount,
                                pk: el.pk,
                                gmailId : el.id

                            };
                        });
                        response(transformed);
                    },
                    error: function (error) {
                        var response = JSON.parse(error.responseText);
                        console.log(response);
                        if (typeof(response.redirect) != "undefined"){
                            window.location.href=response.redirect + "&next=" + window.location.hash;
                        } else {
                            alert("unknown error");
                            console.log(error);
                        }
                    }
                });
            },
            select: function( event, ui ) {
                $(this).attr("data-id", ui.item.pk);

                //This should only happen for this field, need a way to override these methods from outside, this needs a big refactor
                alert(ui.item.gmailId);
                var that = this;
                $.ajax({
                   url: "/email/get-gmail-html?id=" + ui.item.gmailId,
                    success: function(data){
                        console.log(data);
                        alert("whole html email is here, do something with it");
                    }
                });


                return false;
              }
        });

    };


    var findByKey = function (o, prop) {
        for (var p in o) {
            if (p == prop) {
                return o[p];
            }
        }
    };


    my.populateFormData = function (data) {
        for (var field in currentOptions) {
            var foundData = findByKey(data, field);
            switch (currentOptions[field].type) {
                case "string":
                    if ($("#field-" + field).length > 0) {
                        $($("#field-" + field).find("input")[0]).val(foundData);
                    }
                    break;
                case "integer":
                    if ($("#field-" + field).length > 0) {
                        $($("#field-" + field).find("input")[0]).val(foundData);
                    }
                    break;
                case "boolean":
                    if ($("#field-" + field).length > 0) {
                        $($("#field-" + field).find("input").prop('checked', foundData));
                    }
                    break;
                case "field":
                    if ($("#field-" + field).length > 0) {
                        $("#field-" + field).find("select").val(foundData);
                    }
                    break;
                case "choice":
                    if ($("#field-" + field).length > 0) {
                        $("#field-" + field).find("select").val(foundData);
                    }
                    break;
                case "date":
                    if ($("#field-" + field).length > 0) {
                        $("#field-" + field).find("input").val(foundData);
                    }
                    break;
                default:
                    console.log("warning: didn't know how to apply data correctly to: " + field + " which is type " + currentOptions[field].type);
                    break;
            }
        }
    };

    var getItem = function (endpoint, callback) {
        $.ajax({
            url: endpoint,
            type: 'GET',
            success: function (response) {
                //console.log(response);
                callback(response);
            }
        });
    };

    var templatesReady = function (callback) {
        if (templatesLoaded) {
            return callback();
        }
        var templateInterval = setInterval(function () {
            if (templatesLoaded) {
                clearInterval(templateInterval);
                callback();
            }
        }, 100);
    };


    var getFormData = function(callback) {
        var filesFound = false;
        var formData = $("#form-body").serializeObject();
        //deal with checkboxes
        $('input:checkbox').each(function () {
            formData[$(this).attr("name")] = $(this).is(':checked');
        });
        //deal with related fields

        //deal with date and other types when saving
        $(".ff-field").each(function(){
            console.log();
            switch ($(this).data("type")){
                case "date":
                if ($(this).find("input").val() == ""){
                    //need to submit blank date as null rather than empty string
                    formData[$(this).data("field")] = null;
                }
                case "lookup field":
                    //alert("loookup");
                    if ($(this).find("input").val() == ""){
                        //need to submit blank date as null rather than empty string
                        formData[$(this).data("field")] = null;
                    } else {
                        formData[$(this).data("field")] = $(this).find("input").data("id"); //THIS SHOULD FUCKING WORK WITH THIS
                    }
                    break;
                case "file upload":
                    var that = this;
                    if ($('.file-field').prop('files').length > 0){
                        filesFound = true; //This stops the method calling back sync
                        var fr = new FileReader();
                        //console.log($('.file-field').prop('files')[0]);
                        fr.onload = function() {
                            formData[$(that).data("field")] = fr.result;
                            //console.log(fr.result);
                            //alert(fr.result);
                            callback(formData);
                        };
                        fr.readAsDataURL($('.file-field').prop('files')[0]);
                    }
            }
        });
        if (!filesFound){
            callback(formData);
        }
        //return formData;
    };

    my.edit = function (options) {
        internalOptions = options;
        if (options.beforeRender) { options.beforeRender(); }
        templatesReady(function () {
            getOptions(options.endpoint, function (optionsResponse) {
                $("#" + options.id).append(generateFormHtml(optionsResponse));
                bindFormActions();
                getItem(options.endpoint, function (itemResponse) {
                    my.populateFormData(itemResponse);
                    var styles = ".form-error{color:red;}";
                    $("#form-styles").html(styles);
                    if (options.afterRender) { options.afterRender(); }

                    console.log(itemResponse);

                    $("#form-submit").on("click", function (e) {
                        e.stopPropagation();
                        e.preventDefault();

                        getFormData(function(formData){
                            $.ajax({
                            url: options.endpoint,
                            type: 'PUT',
                            data: JSON.stringify(formData),
                            contentType: "application/json",
                            success: function (result) {
                                console.log(result);
                                options.success();
                            },
                            error: function (response) {
                                console.log(response);
                                $("#form-errors").html("");
                                $("#form-body div").removeClass("form-error");
                                $("#field-" + error + " > .error").text("");

                                for (var error in response.responseJSON) {
                                    console.log("#field-" + error);
                                    $("#field-" + error).addClass("form-error");
                                    $("#field-" + error + " .ff-error").text(response.responseJSON[error]);
                                    //$("#form-errors").append(error + ": " + response.responseJSON[error]);
                                    console.log(response.responseJSON[error]);
                                }
                            }
                        });
                        });
                    });
                });
            });
        });
    };

    var internalOptions = {};

    my.create = function (options){ //endpoint, id, callback) {
        internalOptions = options;
        if (options.beforeRender) { options.beforeRender(); }
        templatesReady(function () {
            getOptions(options.endpoint, function (optionsResponse) {
                $("#" + options.id).append(generateFormHtml(optionsResponse));
                bindFormActions();
                var styles = ".form-error{color:red;}";
                $("#form-styles").html(styles);
                if (options.afterRender) { options.afterRender(); }
                $("#form-submit").on("click", function (e) {
                    e.stopPropagation();
                    e.preventDefault();


                    getFormData(function(formData){
                        $.ajax({
                        url: options.endpoint,
                        type: 'POST',
                        data: JSON.stringify(formData),
                        contentType: "application/json",
                        success: function (result) {
                            console.log(result);
                            options.success();
                        },
                        error: function (response) {
                            console.log(response);
                            $("#form-errors").html("");
                            $("#form-body div").removeClass("form-error");
                            $("#field-" + error + " > .error").text("");

                            for (var error in response.responseJSON) {
                                console.log("#field-" + error);
                                $("#field-" + error).addClass("form-error");
                                $("#field-" + error + " .ff-error").text(response.responseJSON[error]);
                                //$("#form-errors").append(error + ": " + response.responseJSON[error]);
                                console.log(response.responseJSON[error]);
                            }
                        }
                    });
                    });
                });
            });
        });
    };

    return my;
}(jQuery));



