var http = require('http');
var fs = require('fs');
var request = require('request');

var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

exports = module.exports = NaturalLanguageUnderstanding;

/**
 *  Watson Natural Language Understanding (NLU) API
 *	For an Overview, please refer to: https://www.ibm.com/watson/developercloud/doc/natural-language-understanding/
 *	For the API Reference, please refer to: https://www.ibm.com/watson/developercloud/natural-language-understanding/api/v1/
 *
 *  username and password are required for the specific NLU instance on Bluemix that is to be accessed
 *  version is a query parameter passed in to each NLU api call, used to specify the version of nlu to use
 */

function NaturalLanguageUnderstanding() {
    //Read in config values from a file, which are needed to make the api calls to the Watson NLU API
    try {
        var obj = JSON.parse(fs.readFileSync(__dirname + '/natural-language-understanding.json'));
        username = obj.username;
        password = obj.password;
        versionDate = obj.version_date;
        host = obj.host;
        base_url = obj.base_url;
    }

    catch (err) {
        console.log('The username, password, versionDate, host or base_url were not detected in the file: natural-language-understanding.json');
        console.log('If you do not have a username and password, please register at: https://www.ibm.com/watson/developercloud/natural-language-understanding.html');
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
    if (versionDate == null || versionDate == undefined) {
        versionDate = NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27;
    }

    this.username = username;
    this.password = password;
    this.version_date = versionDate;
    this.host = host;
    this.base_url = base_url;

    /**
     *	analyze - the entry to the one NLU endpoint called analyze
     *	HTTP Uploader - makes the call, then converts the returned JSON string into a Javascript object.
     *
     *  Uses the Watson Natural Language Understanding API
     *	Extracts the entities for text, a URL or HTML.
     *
     *	INPUT:
     *	parameters -> json object containing the input to the watson api call,
     *	              contains the the text or url value, one of these is required,
     *	              and contains the features object - one or more features need to be defined
     *	callback -> the callback function
     *
     *	OUTPUT:
     *	The response, already converted from JSON to a Javascript object.
     */
    this.analyze = function (parameters, callback) {
        var reqParams = '?version=' + this.version_date;
        var url = 'https://' + this.host + this.base_url + reqParams;
        var auth = 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64');
        var opts = {
            method: "POST",
            url: url,
            headers: {
                'Authorization': auth
            },
            json: parameters
        };
        
        return request(opts, function (error, res) {
            if(error) {
                callback({status: 'Error', statusInfo: error});
            } else if(res === null || res.statusCode != 200){
                return callback({status:'Error', statusCode: res.statusCode, message: res.body});
            } else {
                callback(JSON.parse(JSON.stringify(res)));
            }
        });
    };
};

/**
 * doRequest function
 * The Content Clarifier API's all access the Watson NLU API by calling this function
 * @param flavor "text", "url" or "html" (for now we have implementing processing of text and url)
 * @param data the text or url value as a string
 * @param parameters a json object containing the parameters to pass in - containing at least 1 feature, and optional other options
 * @param callback
 */
NaturalLanguageUnderstanding.prototype.doRequest = function(flavor, data, parameters, callback) {
    parameters = parameters || {}
    parameters[flavor] = data;

    this.analyze(parameters, callback);
};

/* Natural Language Understanding Watsom API
 *  List of possiblw features:
 *  concepts -> options:
 *              limit (integer) The maximum number of concepts to return.Default: 8, Maximum you can return: 50.
 *
 *  categories -> has no options
 *
 *  emotion -> options
 *             target: (array[string]) The service analyzes emotion for each target string found in the text
 *             document: (boolean) Set this to false to hide document-level emotion results.
 *
 *  entities -> options:
 *              emotion (boolean) Set this to true to enable emotion analysis for detected entities.
 *              sentiment (boolean) Set this to true to enable sentiment analysis for detected entities.
 *              model (string) Enter a custom model ID to override the standard entity detection model.
 *                    Watson Knowledge Studio custom models do not return entity relevance scores.
 *              limit (integer) Maximum number of entities to return. Default: 50, Maximum: 250.
 *
 *  keywords -> options
 *              emotion (boolean) Set this to true to enable emotion analysis for detected keywords
 *              sentiment (boolean) Set this to true to enable sentiment analysis for detected keywords
 *              limit (integer) Maximum number of keywords to return. Default: 50, Maximum: 250.
 *
 *  metadata -> has no options
 *
 *  relations -> options
 *               model (string) Specify the ID of a deployed Watson Knowledge Studio custom model to override the default model
 *
 *  semantic_roles -> options
 *                    entities (boolean) Set this to true to return entity information for subjects and objects
 *                    keywords (boolean) Set this to true to return keyword information for subjects and objects
 *                    limit (integer) Maximum number of semantic role results to return. Default: 50
 *
 *  sentiment -> options
 *               targets (array[string]) The service analyzes sentiment for each target string found in the text. Returns up to 20 targets.
 *               document (boolean) Set this to false to hide document-level sentiment results.
 */


/*
 This is the call to the NLU api that is written in the Watson documentation, which works as well
 var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
 var natural_language_understanding = new NaturalLanguageUnderstandingV1({
     'username': '{username}',
     'password': '{password}',
     'version_date': '2017-02-27'
 });
 var parameters = {
     'url': 'www.ibm.com',
     'features': {
         'concepts': {
             'limit': 3
         }
     }
 };
 natural_language_understanding.analyze(parameters, function(err, response) {
 if (err)
    console.log('error:', err);
 else
    console.log(JSON.stringify(response, null, 2));
 });
 */