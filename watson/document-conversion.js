
// -------------------------------------------------------------------
//
//
// 
// THIS IS DEPRECATED.
//
//
// -------------------------------------------------------------------

var http = require('http');
var fs = require('fs');
var request = require('request');
var validator = require('validator');
//var DocumentConversionV1 = require('watson-developer-cloud/document-conversion/v1'); DEPRECATED



/**
 *  Watson Document Conversion API
 *	For an Overview, please refer to: https://www.ibm.com/watson/developercloud/doc/document-conversion/
 *	For the API Reference, please refer to: https://www.ibm.com/watson/developercloud/document-conversion/api/v1/
 *  var document_conversion = watson.document_conversion({
 *  username:     '{username}',
 *  password:     '{password}',
 *  version:      'v1',
 *  version_date: '2015-12-15'
 *  API parameters:
 *  file (required): The file to convert. Maximum file size is 50 MB.
 *    The API automatically detects the type, but you can specify it if incorrect.
 *    Acceptable MIME type values are:
 *      text/html, text/xhtml+xml, application/pdf, application/msword,
 *      and application/vnd.openxmlformats-officedocument.wordprocessingml.document.
 *
 * conversion_target (required): Controls the output format of the conversion.
 *   Valid values are:
 *       ANSWER_UNITS, NORMALIZED_HTML, and NORMALIZED_TEXT.
 *   For more information about conversion_target, see Advanced customization options and search for "conversion_target".
 *
 * config (object, optional): A config object that defines tags and structure in the conversion output. Maximum size of the object is 1 MB.
 * Example config can pass in, otherwise uses some default:
 *      var config = { word: {heading: { fonts: [{ level: 1, min_size: 24 },{ level: 2, min_size: 16, max_size: 24 }]}}};
 *
 * The response depends on the value of output type in the request:
 * When the conversion_target is normalized_text (as we are using here), returns the converted document as plain text (MIME type text/plain)
 */

function DocumentConversion() {
    //Read in config values from a file, which are needed to make the api calls to the Watson Document Conversion API
    try {
        var obj = JSON.parse(fs.readFileSync(__dirname + '/document-conversion.json'));
        username = obj.username;
        password = obj.password;
        version = obj.version;
        versionDate = obj.version_date;
        host = obj.host;
        base_url = obj.base_url;
    }

    catch (err) {
        console.log('The username, password, versionDate, host or base_url were not detected in the file: natural-language-understanding.json');
        console.log('If you do not have a username and password, please register at: https://www.ibm.com/watson/developercloud/document-conversion.html');
        process.exit(1);
    }

    //Validate username and password length
    if (username.length != 36) {
        console.log('The username in natural-language-understanding.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        console.log('Pease register at: https://www.ibm.com/watson/developercloud/natural-language-understanding.html');
        process.exit(1);
    }
    if (password.length != 12) {
        console.log('The password in natural-language-understanding.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        console.log('Please register at: https://www.ibm.com/watson/developercloud/natural-language-understanding.html');
        process.exit(1);
    }

    this.username = username;
    this.password = password;
    this.version_date = versionDate;
    this.host = host;
    this.base_url = base_url;

    /**
     *  convertPDFFileToText function
     *	uses the convert method (the endpoint) or the Watson Document Conversion API
     *	Imports a PDF file, outputs the text from the file
     *
     *	INPUT:
     *	parameters -> the absolute file path
     *	callback -> the callback function
     *
     *	OUTPUT:
     *	The response, already converted from JSON to a Javascript object.
     */
    this.convertPDFFileToText = function(filename, callback) {
        if(!fs.existsSync(filename)){ //check if the file exists
            return callback({ status:'Error', statusCode: 400, message: 'The file does not exist: ' + filename});
        } else {
            var document_conversion = new DocumentConversionV1({
                username:     this.username,
                password:     this.password,
                version_date: this.version_date
            });
            document_conversion.convert({
                file: fs.createReadStream(filename),
                conversion_target: document_conversion.conversion_target.NORMALIZED_TEXT,
                //can add custom configuration properties, otherwise uses defaults
            }, function (err, response) {
                var res;
                if (err) {
                    res = { status:'Error', statusCode: 400, message: 'There was a problem converting this file with the Watson Document Converter.', text: ""};
                } else {
                    //console.log('Document conversion extracted the following content:');
                    //console.log(response);
                    var returnText = response;
                    if(returnText.length >= 8 ){
                        var leadingText = returnText.substring(0, 8);
                        if(leadingText == 'no title'){ // Get rid message inserted by Document Conversion
                             returnText = returnText.substring(8, returnText.length);
                        }                     
                    }
                    res = { status:'Success', statusCode: 200, message: 'Succeeded to create the file', text: returnText};
                }
                return callback(res);
            });
        }
    };

    /**
     * Downloads the file that the URL points to, example PDF file
     * @param url the url of the file to download
     * @param fileDirectory the location to write the file to, calls the file "tempPDF.pdf"
     * @param callback
     * @returns {*}
     */
    this.downloadFileFromURL = function(url, fileDirectory, callback) {
        var destinationToWriteFile;
        var fileName = 'tempPDF.pdf';

        if(url === undefined || url === null) {
            return callback( { status:'Error', statusCode: 400, message: 'The url was either not defined or was null, please enter a url value'});
        }
        if (!validator.isURL(url)){
            return callback({ status:'Error', statusCode: 400, message: 'The string passed in for the url is not a valid url format: ' + url});
        }
        if(fileDirectory === undefined ||  fileDirectory === null) {
            destinationToWriteFile = __dirname + fileName;
        } else {
            destinationToWriteFile = fileDirectory + '/' + fileName;
        }

        var file = fs.createWriteStream(destinationToWriteFile);
        var urlReq = request.get(url);

        urlReq.on('response', function(response) {
            if (response.statusCode !== 200) {
                return callback({ status:'Error', statusCode: 400, message: 'Response status was ' + response.statusCode});
            }

            //validate the file type (response.headers['content-type']) is supported by the Watson Document Converter
            var validContentFileTypes = ['text/html','text/xhtml+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if(validContentFileTypes.indexOf(response.headers['content-type']) === -1){  //not equal one of the valid types
                return callback({ status:'Error', statusCode: 400, message: 'The content-type of the file is not supported: ' + response.headers['content-type']});
            }
        });
        urlReq.on('error', function (err) {
            fs.unlink(fileDirectory);
            return callback({ status:'Error', statusCode: 400, message: err.message});
        });

        urlReq.pipe(file);

        file.on('finish', function() {
            file.close(callback({ status:'Success', statusCode: 200, message: 'Succeeded to create the file', file: destinationToWriteFile}));
        });

        file.on('error', function(err) {
            fs.unlink(fileDirectory); // Delete the file async. (But we don't check the result)
            return callback({ status:'Error', statusCode: 400, message: err.message});
        });
    };

    this.createFile = function(urlReq, fileName, fileDirectory, callback) {
        var destinationToWriteFile;

        if(fileName === undefined ||  fileName === null) {
            fileName = 'tempPDF.pdf';
        }

        if(fileDirectory === undefined ||  fileDirectory === null) {
            destinationToWriteFile = __dirname + '/' + fileName;
        } else {
            destinationToWriteFile = fileDirectory + '/' + fileName;
        }

        var file = fs.createWriteStream(destinationToWriteFile);

        urlReq.pipe(file);

        file.on('finish', function() {
            file.close();
            return callback({ status:'Success', statusCode: 200, message: 'Succeeded to create the file', file: destinationToWriteFile});
        });

        file.on('error', function(err) {
            fs.unlink(fileDirectory); // Delete the file async. (But we don't check the result)
            return callback({ status:'Error', statusCode: 400, message: err.message});
        });
    };
}

/**
 * getTextFromFileInURL function
 * The Content Clarifier API's all access the Watson NLU API by calling this function
 * @param url the url pointing to a file
 * @param callback
 *
 * 1. Downloads the file
 * 2. Call Watson Document Converter API to extrace the text from the downloaded file
 *    This API usually automatically detects the file type from the file itself
 * 3. Delete the file? or option to delete or keep?
 */
DocumentConversion.prototype.getTextFromFileInURL = function(url, dest, callback) {
    var downloadedFile;
    var cls = this; //need this so can access the second function from this within the nested callback
    this.downloadFileFromURL(url, dest, function(response) {
        if(response.statusCode != 200){
            return callback(response);
        } else {
            downloadedFile = response.file;
            cls.convertPDFFileToText(downloadedFile, function(res) {
                return callback(res);
            })
        }
    });
};

DocumentConversion.prototype.downloadFileFromURL = function(urlReq, fileName, fileDirectory, callback) {
    var downloadedFile;
    var cls = this; //need this so can access the second function from this within the nested callback
    this.createFile(urlReq, fileName, fileDirectory, function(response) {
        if(response.statusCode != 200){
            return callback(response);
        } else {
            downloadedFile = response.file;
            cls.convertPDFFileToText(downloadedFile, function(res) {
                return callback(res);
            })
        }
    });
};

DocumentConversion.prototype.convertFileToText = function(filePath, callback) {
    this.convertPDFFileToText(filePath, function(response) {
        return callback(response);
    });
};


exports = module.exports = DocumentConversion;