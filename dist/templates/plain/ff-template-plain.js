var ffTemplatePlain = {};





ffTemplatePlain.getBase = function(derived){

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

    var loadTemplate = function(){

    };

    derived.init = function(){
        alert();
    };
    return derived;
};


ffTemplatePlain.string = ffTemplatePlain.getBase({
    templateFile: "field-string.html", //needs to turn into .template for real thing
    generateHtml: function() {
        var compiled = _.template(templates.stringField);
        fieldHtml += fieldBody({
            field: field,
            data: fields[field],
            fieldHtml: compiled({field: field})
        });
    }
}).init();