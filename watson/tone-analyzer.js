var http            = require('http');
var fs              = require('fs');
var request         = require('request');
var C               = require('../constants.js');
var ToneAnalyzerV3  = require('watson-developer-cloud/tone-analyzer/v3');

exports = module.exports = ToneAnalyzer;

function ToneAnalyzer() {
	if(C.DEBUG_VERBOSE_LOGGING) console.log("inside toneAnalyzer");
    //Read in config values from a file, which are needed to make the api calls to the Watson NLU API
    try {
        var obj = JSON.parse(fs.readFileSync(__dirname + '/tone-analyzer.json'));
        username = obj.username;
        password = obj.password;
        versionDate = obj.version_date;
        host = obj.host;
        base_url = obj.base_url;
    }

    catch (err) {
        if(C.DEBUG_VERBOSE_LOGGING) console.log('The username, password, versionDate, host or base_url were not detected in the file: natural-language-understanding.json');
        if(C.DEBUG_VERBOSE_LOGGING) console.log('If you do not have a username and password, please register at: https://www.ibm.com/watson/developercloud/tone-analyzer.html');
        process.exit(1);
    }

    //Validate username and password length
    if (username.length != 36) {
        if(C.DEBUG_VERBOSE_LOGGING) console.log('The username in natural-language-understanding.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        if(C.DEBUG_VERBOSE_LOGGING) console.log('Pease register at: https://www.ibm.com/watson/developercloud/tone-analyzer.html');
        process.exit(1);
    }
    if (password.length != 12) {
        if(C.DEBUG_VERBOSE_LOGGING) console.log('The password in natural-language-understanding.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        if(C.DEBUG_VERBOSE_LOGGING) console.log('Please register at: https://www.ibm.com/watson/developercloud/tone-analyzer.html');
        process.exit(1);
    }
    if (versionDate == null || versionDate == undefined) {
        versionDate = ToneAnalyzerV3.VERSION_DATE_2016_05_19;
    }

    this.username = username;
    this.password = password;
    this.version_date = versionDate;
    this.host = host;
    this.base_url = base_url;

    /**
     *	tone - the entry to the ToneAnalyzer endpoint called tone
     *	HTTP Uploader - makes the call, then converts the returned JSON string into a Javascript object.
     *
     *  Uses the Watson Tone Analyzer API
     *	Extracts the entities for text
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
    this.tone = function (parameters, callback) {
	//if(C.DEBUG_VERBOSE_LOGGING) console.log("value of parameters:       "+ parameters);
        var reqParams = '?version=' + this.version_date;
        var url = 'https://' + this.host + this.base_url + reqParams;
       if(C.DEBUG_VERBOSE_LOGGING) console.log(parameters);
        var auth = 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64');
        var opts = {
            method: "POST",
            url: url,
            headers: {
                'Authorization': auth,
                'Content-Type': 'text/plain'
            },
            json: parameters
          // json: {'tones'emotion', true}
        };
        
        return request(opts, function (error, res) {
            if(error) {
               if(C.DEBUG_VERBOSE_LOGGING) console.log("Reached error:"+ error);
                callback({status: 'Error', statusInfo: error});
            } else if(res === null || res.statusCode != 200){
			if(C.DEBUG_VERBOSE_LOGGING) console.log("Reached empty:"+ res.statusCode + res.body);
                return callback({status:'Error', statusCode: res.statusCode, message: res.body});
            } else {
				if(C.DEBUG_VERBOSE_LOGGING) console.log("sending response from watson ta");
                callback(JSON.parse(JSON.stringify(res)));
            }
        });
    };
};

/**
 * doRequest function
 * The Content Clarifier API's all access the Watson Tone Analyzer API by calling this function
 * @param parameters a json object containing the parameters to pass in - containing at least 1 feature, and optional other options
 * @param callback
 */
ToneAnalyzer.prototype.doRequest = function(parameters, callback) {
    parameters = parameters || {}
	if(C.DEBUG_VERBOSE_LOGGING) console.log('from ta do request');
	if(C.DEBUG_VERBOSE_LOGGING) console.log(parameters);
    this.tone(parameters, callback);
};
