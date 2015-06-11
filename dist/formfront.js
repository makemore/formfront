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
            var compiled = _.template(templates.listRow);
            listRowHtml += compiled(response[i]);
        }
        var listBodyCompiled = _.template(templates.listBody);
        var listBodyHtml = listBodyCompiled({listRows: listRowHtml});
        return listBodyHtml;
    }

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


    };

    var templatesLoaded = false;

    var generateFormHtml = function (fields) {
        var fieldHtml = "";
        for (var field in fields) {
            switch (fields[field].type) {

                case "string":
                    var compiled = _.template(templates.stringField);
                    fieldHtml += compiled({field:field, data:fields[field]});
                    break;

                case "text":
                    var compiled = _.template(templates.stringField);
                    fieldHtml += compiled({field:field, data:fields[field]});
                    break;

                case "boolean":
                    var compiled = _.template(templates.booleanField);
                    fieldHtml += compiled({field:field, data:fields[field]});
                    break;

                case "integer":
                    var compiled = _.template(templates.stringField);
                    //ignore primary key field
                    if (fields[field].labelLowered != config.primaryKeyName) {
                        fieldHtml += compiled({field:field, data:fields[field]});
                    }
                    break;

                case "decimal":
                    var compiled = _.template(templates.decimalField);
                    //ignore primary key field
                    if (fields[field].labelLowered != config.primaryKeyName) {
                        fieldHtml += compiled({field:field, data:fields[field]});
                    }
                    break;

                case "field":
                    var compiledOption = _.template(templates.fieldFieldOption);
                    var optionHtml = "";
                    for (var i = 0; i < fields[field].choices.length; i++){
                        optionHtml += compiledOption(fields[field].choices[i])
                    }
                    var compiled = _.template(templates.fieldFieldBody);
                    fieldHtml += compiled({field:field, data:fields[field], options:optionHtml});
                    break;

                case "choice":
                    var compiledOption = _.template(templates.fieldFieldOption);
                    var optionHtml = "";
                    for (var i = 0; i < fields[field].choices.length; i++){
                        optionHtml += compiledOption(fields[field].choices[i])
                    }
                    var compiled = _.template(templates.fieldFieldBody);
                    fieldHtml += compiled({field:field, data:fields[field], options:optionHtml});
                    break;

                case "date":
                    var compiled = _.template(templates.dateField);
                    fieldHtml += compiled({field:field, data:fields[field]});
                    break;

                default:
                    console.log("warning: didn't know how to apply data correctly to: " + field + " (type = " + fields[field].type + ")");
                    fieldHtml += "<div>Not sure what this is</div>";
                    break;
            }
        }
        var formCompiled = _.template(templates.formBody);
        var formHtml = formCompiled({formBody: fieldHtml});
        return formHtml;
    };


    var findByKey = function (o, prop) {
        for (var p in o) {
            if (p == prop) {
                return o[p];
            }
        }
    };


    var populateFormData = function (data) {
        for (var field in currentOptions) {

            var foundData = findByKey(data, currentOptions[field].labelLowered);

            switch (currentOptions[field].type) {
                case "string":
                    if ($("#field-" + currentOptions[field].labelLowered).length > 0) {
                        $($("#field-" + currentOptions[field].labelLowered).children()[0]).val(foundData);
                    }
                    break;
                case "integer":
                    if ($("#field-" + currentOptions[field].labelLowered).length > 0) {
                        $($("#field-" + currentOptions[field].labelLowered).children()[0]).val(foundData);
                    }
                    break;
                case "boolean":
                    if ($("#field-" + currentOptions[field].labelLowered).length > 0) {
                        $($("#field-" + currentOptions[field].labelLowered).children()[0]).prop('checked', foundData);
                    }
                    break;
                default:
                    console.log("warning: didn't know how to apply data correctly to: " + field);
                    break;
            }
        };
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


    var getFormData = function() {
        var formData = $("#form-body").serializeObject();
        //deal with checkboxes
        $('input:checkbox').each(function () {
            formData[$(this).attr("name")] = $(this).is(':checked');
        });
        //deal with related fields
        return formData;
    };

    my.edit = function (endpoint, id, callback) {

        templatesReady(function () {
            getOptions(endpoint, function (optionsResponse) {
                $("#" + id).append(generateFormHtml(optionsResponse));
                getItem(endpoint, function (itemResponse) {
                    populateFormData(itemResponse);
                    var styles = ".form-error{color:red;}";
                    $("#form-styles").html(styles);


                    $("#form-submit").on("click", function (e) {
                        e.stopPropagation();
                        e.preventDefault();

                        var formData = getFormData();

                        $.ajax({
                            url: endpoint,
                            type: 'PUT',
                            data: formData,
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
        });
    };

    my.create = function (endpoint, id, callback) {
        templatesReady(function () {
            getOptions(endpoint, function (optionsResponse) {
                $("#" + id).append(generateFormHtml(optionsResponse));

                var styles = ".form-error{color:red;}";
                $("#form-styles").html(styles);
                $("#form-submit").on("click", function (e) {
                    e.stopPropagation();
                    e.preventDefault();


                    var formData = getFormData();

                    $.ajax({
                        url: endpoint,
                        type: 'POST',
                        data: JSON.stringify(formData),
                        contentType: "application/json",
                        success: function (result) {
                            console.log(result);
                            callback();
                        },
                        error: function (response) {
                            console.log(response);
                            $("#form-errors").html("");
                            $("#form-body div").removeClass("form-error");
                            $("#field-" + error + " > .error").text("");

                            for (var error in response.responseJSON) {
                                console.log("#field-" + error);
                                $("#field-" + error).addClass("form-error");
                                $("#field-" + error + " .error").text(response.responseJSON[error]);
                                //$("#form-errors").append(error + ": " + response.responseJSON[error]);
                                console.log(response.responseJSON[error]);
                            }
                        }
                    });
                });
            });
        });
    };

    return my;
}(jQuery));



