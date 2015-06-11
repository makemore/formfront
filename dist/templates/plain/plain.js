var formfrontPlain = (function ($) {
    var plain = {};

        var getTemplate = function (filename, callback) {

        var jsFileLocation = $('script[src*=formfront]').attr('src');  // the js file path
            jsFileLocation = jsFileLocation.replace('plain.js', '');
            //alert(jsFileLocation);

            $.ajax({
                url: jsFileLocation + "/templates/plain/" + filename,
                method: 'GET',
                //async: false,
                success: function (data) {
                    callback(data);
                }
            });
        };

        plain.types = {};

        plain.types.string = {};
        plain.types.string.type = "string";
        plain.types.string.templateFile = "field-string.html";
        plain.types.string.render = function(fieldName, data){
            var compiled = _.template(plain.types.string.template);
            return compiled({field:fieldName, data:data});
        };



        /*
        for (var type in plain.types){
            getTemplate(function(html){
                types[type].template = html;
            });
        }*/





    return plain;
}(jQuery));