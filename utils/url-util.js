var http = require('http');
var request = require('request');
var validator = require('validator');
var Tokenizer = require('sentence-tokenizer');
var DocumentConversion = require('../watson/document-conversion');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
var NaturalLanguageUnderstanding = require('../watson/natural-language-understanding');
const CONTENT_TYPES = {URL: 'URL', DOC: 'DOC'};
const documentTypes = ['text/html', 'text/xhtml+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
var C                       = require('../constants.js');
var fs                      = require('fs');
var path = require("path");
var originalfilename;
var documentid;


function UrlUtil() {
    /**
     * Evaluate the content-type of a URL's response header to know if to continue with URL or Document
     *
     * Valid file types for Document, according to Watson Document Convderter (Acceptable MIME type values):
     *  text/html
     *  text/xhtml+xml
     *  application/pdf
     *  application/msword
     *  application/vnd.openxmlformats-officedocument.wordprocessingml.document
     * @param url the url to evaluate
     * @param callback
     * @returns {*}
     */
    this.evaluateURLType = function(url, callback) {
        var contentType = null;
        console.log('------------ ')
        console.log(url);
        originalfilename = url.substring(url.indexOf("uploads/")+8);
        //console.log(originalfilename);
        if(url === undefined || url === null || url === '') {
            return callback( { status:'error', statusCode: 400, message: 'No value was entered for the URL'});
        }
         // if (!validator.isURL(url)){ Must set validator options
         if (!validator.isURL(url,{require_tld:false, require_host:false, allow_underscores:true})){            
            return callback({ status:'error', statusCode: 400, message: 'The value passed in for the URL is not in a proper url format:  ' + url});
        }
        
        //from server.js - to Fix Issue #36
        if(isEncoded(url) === false) {
            url = encodeURI(url)
        }

        var urlReq;
        try{
            urlReq = request.get(url);
        }
        catch(e){
            return callback({ status:'error', statusCode: 400, message: 'Unsupported URL format. Neither http:// or https:// was observed.'});  
        }
        urlReq.on('response', function(response) {
            if (response.statusCode !== 200) {
                return callback({ status:'error', statusCode: 400, message: 'Response status was ' + response.statusCode});
            }
            contentType = response.headers['content-type'];
            
            //
            // Processing a link URL link to a document
            // 
            if(contentType != undefined && contentType != null && 
            
            //documentTypes.includes(contentType)){ Doesn't support v5.9.0 and below 
             documentTypes.join(" ").indexOf(contentType) !== -1){ 
                
                console.log("Processing a URL link to a document with contentType: "+contentType);
                //URL leads to a document
                processDocumentConversionToText(urlReq, url,  contentType, function(response) {  //anonymous function will run when the callback is called
                    callback(response);
                });
            } 
            else {
                //
                // Processing a regular URL, not a link to a document
                // 
                
                 console.log("Processing a regular URL link with contentType: "+contentType);
                if(contentType.indexOf('/html') == -1){
                    console.log("Found invalid file content type while attempting to process a regular URL");                    
                    //We got here, but we aren't actually processing a regular URL...a link to a unsupported file type may have slipped through (e.g. .txt)
                    return callback({ status:'error', statusCode: 400, message: 'Unsupported URL format.'});  
                 }
                else{
                   var naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
                    var nluParameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
                    naturalLanguageUnderstanding.doRequest("url", url, nluParameters, function(res)  {
                        if(res.statusCode == 200 && res.body != null && res.body.analyzed_text != undefined){
                            return callback({ status:'success', statusCode: 200, text: res.body.analyzed_text});
                        } else {
                            return callback({ status:'error', statusCode: 400, message: 'NLU processing did not work correctly.'});
                        }
                    });

                }    
                /*var naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
                var nluParameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
                naturalLanguageUnderstanding.doRequest("url", url, nluParameters, function(res)  {
                    if(res.statusCode == 200 && res.body != null && res.body.analyzed_text != undefined){
                        return callback({ status:'success', statusCode: 200, text: res.body.analyzed_text});
                    } else {
                        return callback({ status:'error', statusCode: 400, message: 'NLU processing did not work correctly.'});
                    }
                });
                */

                //method below not working, saying callback is not a function, need to see why, meanwhile using code above
                // processURLToText(url, contentType, function(response) {  //anonymous function will run when the callback is called
                //     return callback(response);
                // });
            }



        });
        urlReq.on('error', function (err) {
            fs.unlink(dest);
            return callback({ status:'error', statusCode: 400, message: err.message});
        });
    };


}


function verifyDocumentTypeValid(value){
    var found = false;
    for(var i = 0; i < vendors.length; i++) {
        if (vendors[i].Name == value) {
            found = true;
            break;
        }
    }
}

function getFileExtensionFromDocumentType(documentType){
    var extension = null;
    switch(documentType) {
        case 'text/html':
            extension = '.html';
            break;
        case 'text/xhtml+xml':
            extension = '.xml';
            break;
        case 'application/pdf':
            extension = '.pdf';
            break;
        case 'application/msword':
            extension = '.doc';
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            extension = '.docx';
            break;
        default:
            extension = 'unsupported'; // default set to unsupported
    }
    return extension;
}

// Check if string is URI encoded, taken from server.js
function isEncoded(str){
    return decodeURIComponent(str) !== str;
}

// taken from server.js
function removeWhitespaceFromText(text){
    var tokenizer = new Tokenizer('Chuck');
    tokenizer.setEntry(text);
    return tokenizer.getSentences().join(" ");
}

processDocumentConversionToText = function (urlReq, url,  contentType, callback) {
   
   //var documentConversion = new DocumentConversion(); THIS HAS BEEN DEPRECATED.
    
   /* var discovery = new DiscoveryV1({
        version_date: C.WATSON_DISCOVERY_VERSION,
        username: C.WATSON_DISCOVERY_USER,
        password: C.WATSON_DISCOVERY_PASS,
        url: C.WATSON_DISCOVERY_URL
    });
    */
    
    
    // WSCOTT - New Object Required for Discovery Service (2019)
    var discovery= new DiscoveryV1({
        url: C.WATSON_DISCOVERY_URL,
        version: C.WATSON_DISCOVERY_VERSION,
        iam_apikey: C.WATSON_DISCOVERY_IAM_APIKEY
    });
 

    
    var fileExtension = getFileExtensionFromDocumentType(contentType);
    if(fileExtension == 'unsupported'){
            return callback({ status:'error', statusCode: 400, message: 'The file type is unsupported.'});        
    }
    var fileName = 'tempFile' + fileExtension;
    var readfile = fs.createReadStream(path.resolve("Text-Simplification", "../uploads/"+originalfilename ));
    //var readfile = fs.readFileSync(filedir+"/"+originalfilename);
    //console.log(readfile);
    
    var document_obj = {
            environment_id: C.WATSON_ENVIRONMENT_ID,
            collection_id: C.WATSON_COLLECTIONS_ID,
            configuration_id: C.WATSON_CONFIGURATION_ID, // WSCOTT New requirement for Discovery Service (2019)
            filename:originalfilename, // WSCOTT New requirement for Discovery Service (2019)
            file:  {
                    value: readfile,
                    options: {
                        filename:originalfilename
                    },
            metadata: {
                    title: originalfilename
                    }
            }
    };
    
//   Using Document Discovery to retrieve the text from a Supported Document
    discovery.addDocument((document_obj),
         function(error, data) {
                console.log("Processing Document using Document Discovery ");
                if(error){
                    console.log("discovery.addDocument Error Condition 1:" + JSON.stringify(error, null, 2));
                    return callback({ status:'error', statusCode: 400, message: 'The url was to a document but the file was not created properly.'});
                } else {
                    //console.log(JSON.stringify(data, null, 2));
                    documentid = data.document_id;
                    console.log("documentid= "+documentid );
                    setTimeout(function() {
                            discovery.query(({ environment_id: C.WATSON_ENVIRONMENT_ID, collection_id: C.WATSON_COLLECTIONS_ID, natural_language_query: originalfilename}), function(error, data) {
                              
                                if(error){
                                        console.log(JSON.stringify(data, null, 2));
                                        return callback({ status:'error', statusCode: 400, message: 'The url was to a document but the file was not created properly.'});
                                }else{
                                        //console.log(JSON.stringify(data, null, 2));
                                        if(data.results[0] !=undefined){
                                                console.log(data.results[0].text);

                                                var discoveryresponse=  {status: "success", statusCode: 200, text: data.results[0].text.split("no title").join("")};

                                                discovery.deleteDocument({ environment_id: C.WATSON_ENVIRONMENT_ID, collection_id: C.WATSON_COLLECTIONS_ID, document_id:documentid }, function(error, data) {
                                                        console.log(JSON.stringify(data, null, 2));
                                                });

                                                return callback(discoveryresponse);
                                            }else{
                                                return callback({ status:'error', statusCode: 400, message: 'Failed to Convert this Document, Try Another document'});
                                            }
                                 }
                            });
                    }, 10000);                
                }
          
        }); 
    
   
    
    /* As Document Conversion is sunsetting it is replaed with Document Discovery
    documentConversion.createFile(urlReq, fileName, null, function(response) {
        if(response.statusCode != 200){
            return callback({ status:'error', statusCode: 400, message: 'The url was to a document but the file was not created properly.'});
        } else {
            documentConversion.convertFileToText(response.file, function(res) {
                return callback(res);
            });
        }
    }); */
};

processURLToText = function (url, callback) {
    var naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();
    var nluParameters = {"features": {"concepts": {}}, "return_analyzed_text": true};
    naturalLanguageUnderstanding.doRequest("url", url, nluParameters, function(res)  {
        if(res.statusCode == 200 && res.body != null && res.body.analyzed_text != undefined){
            return callback({ status:'success', statusCode: 200, text: res.body.analyzed_text});
        } else {
            return callback({ status:'error', statusCode: 400, message: 'NLU processing did not work correctly.'});
        }
    });
};

UrlUtil.prototype.evaluateURLOrDocumentReturnText = function(url, callback) {
    this.evaluateURLType(url, function(response) {
        if(response.statusCode != 200){
            //return callback(response.message); Surface statusCode
            return callback({statusCode: response.statusCode, message: response.message}); 
        } else {
           // return callback(response.text); Surface statusCode
            return callback({statusCode: response.statusCode, text: response.text});  
        }
    });
};

exports = module.exports = UrlUtil;