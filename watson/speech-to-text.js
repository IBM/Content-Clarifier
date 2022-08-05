
var fs      = require('fs');
var C       = require('../constants.js');
var watson  = require('watson-developer-cloud');

function SpeechToText() {
    try {
        var obj = JSON.parse(fs.readFileSync(__dirname + '/' + 'speech-to-text.json'));
        this.username = obj.username;
        this.password = obj.password;
    }

    catch (err) {
        console.error('err: ' + err);
        console.error('The username or password were not detected in the file: speech-to-text.json');
        console.error('If you do not have a username and password, please register at: https://www.ibm.com/watson/services/speech-to-text');
        process.exit(1);
    }

    //Validate username and password length
    if (this.username.length != 36) {
        if(C.DEBUG_VERBOSE_LOGGING)console.log('The username in speech-to-text.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        if(C.DEBUG_VERBOSE_LOGGING)console.log('Please register at: https://www.ibm.com/watson/services/speech-to-text');
        process.exit(1);
    }
    if (this.password.length != 12) {
        if(C.DEBUG_VERBOSE_LOGGING)console.log('The password in natural-language-understanding.json does not appear to be valid. Make sure to run: node nluapi.js YOUR_KEY_HERE');
        if(C.DEBUG_VERBOSE_LOGGING)console.log('Please register at: https://www.ibm.com/watson/services/speech-to-text');
        process.exit(1);
    }

    this.getToken = function(callback){
        var authorization = new watson.AuthorizationV1({
            username: this.username,
            password: this.password,
            url: watson.SpeechToTextV1.URL
        });

        authorization.getToken(function (err, token) {
            if (!token) {
                callback({status :err.error, statusCode: err.code, message: err.description, token: null});
            } else {
                callback({status :'OK', statusCode: '200', message: 'Success', token: token});
            }
        });

    };
}

SpeechToText.prototype.getToken = function(callback) {
    this.getToken(function(response) {
        return callback(response);
    });
};

exports = module.exports = SpeechToText;

// var speechToText = new  SpeechToText();
//
// speechToText.getToken(function (response) {
//     console.log('** in  getToken, response: ' + JSON.stringify(response));
//     console.log('** token: ' + response.token);
// });
//
// speechToText.convertSpeechFileToText(filePath, function (err, response) {
//     if (err)
//         console.log('error:', err);
//     else
//         console.log('in convertSpeechFileToText, response: ');
//         console.log(response);
// });





