var ffTemplatePlain = {};

ffTemplatePlain.string = {
    templateFile: "field-string.html", //needs to turn into .template for real thing
    generateHtml: function(){
        var compiled = _.template(templates.stringField);
        fieldHtml += fieldBody({
            field: field,
            data: fields[field],
            fieldHtml: compiled({field: field})
        });
    }
};