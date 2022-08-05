var PDF = require('pdfkit');            //including the pdfkit module
var fs = require('fs');
var CONSTANTS = require('../constants');

function PDFGenerator() {
    this.generatePDF = function(text, pathToFile, api, callback) {
        if(text === null || text.trim() === ""){
            return callback({ status:'Error', statusCode: 400, message: 'The text was null or empty.'});
        } else {
            var newText = text;
            if(api != undefined || api != null || api != ""){
                newText = resolveTextBasedOnAPI(text, api);
            }
            var doc = new PDF();
            writeStream = fs.createWriteStream(pathToFile);
            doc.pipe(writeStream);
            //to write the content on the file system
            doc.text(newText, 100, 100);   //adding the text to be written,
            // more things can be added here including new pages
            doc.end(); //end the document writing.

            //need to do it this way below since if just return the callback then the file will be corrupt
            //pdfkit does not handle callbacks directly, this issue tells how to deal with that:
            //https://github.com/devongovett/pdfkit/issues/265
            writeStream.on('finish', function () {
                return callback({ status:'Success', statusCode: 201, message: 'The PDF document was created: ' + pathToFile});
            });
        }
    };
    function resolveTextBasedOnAPI(text, api, callback) {
        var newText;
        if(api === CONSTANTS.API_CONDENSE ||  api === CONSTANTS.API_CONDENSE_URL ||  api === CONSTANTS.API_CONDENSE_DOC){
            newText = text;
        } else {
            newText = removeDelimiters(text);
            newText = convertSpeechText(newText);
        }
        return newText;
    };


    function removeDelimiters(input) {
        input =  input.replace(/\|_[^_]*?_\|/g,"");
        input=   input.replace(/\%~[^]*?~\%/g, "");
        input=   input.replace(/\%#[^]*?#\%/g, "");
        return input;
    }

    function convertSpeechText(speechtext){
        speechtext = speechtext.split("|^").join("");
        speechtext = speechtext.split("^|").join("");
        return speechtext;
    }


};

PDFGenerator.prototype.generatePDFDocument = function(text, pathToFile, api, callback) {
    this.generatePDF(text, pathToFile, api, function(response) {
        return callback(response);
    });
};

exports = module.exports = PDFGenerator;


