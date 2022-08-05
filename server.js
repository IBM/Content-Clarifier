/**
 *
 * Content Clarifier
 * NodeJS server
 *
 *
 */

var express                 = require('express');
var bodyParser              = require('body-parser');
var multer                  = require('multer');
var request                 = require('request');
var cors                    = require('cors');
var compression             = require('compression'); // Support gzip compression
var vcapServices            = require('vcap_services');
var Tokenizer               = require('sentence-tokenizer');
var syllable                = require('syllable');
var SparqlClient            = require('sparql-client');
var fleschKincaid           = require('flesch-kincaid');
var colemanLiau             = require('coleman-liau');
var automatedReadability    = require('automated-readability');
var schedule                = require('node-schedule');
var striptags               = require('striptags');
var htmlToText              = require('html-to-text');
var fs                      = require('fs');
var download                = require('download-file');

var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

// requires stanford-corenlp-full-2014-01-04.zip uzipped to jar dir in node_modules/stanford-simple-nlp
var StanfordSimpleNLP       = require('stanford-simple-nlp');
var stanfordSimpleNLP       = new StanfordSimpleNLP.StanfordSimpleNLP();

// Full text search for AAC symbols
var fulltextsearchlight      = require('full-text-search-light');
var full_txt_search_loaded   = null;
var currentSymbolsMap         = null;

// Natural POS tagger
var natural                 = require('natural'),
    classifier              = new natural.BayesClassifier();
var Tagger                  = require("natural").BrillPOSTagger;
var base_folder             = "./node_modules/natural/lib/natural/brill_pos_tagger/data/English";
var rules_file              = base_folder + "/tr_from_posjs.txt";
var lexicon_file            = base_folder + "/lexicon_from_posjs.json";
var default_category        = 'N';

/* Model dependencies global variables */
var vocabulary;
var thesaurus;
var s_dictionary;
var ignoreList;
var operationRulesList;
var blackList;
var posList;
var nonLiteralsList;
var transitionsList;
var C                       = require('./constants.js');

/* Bluemix containers */
var bluemixContainers       = null;
var bluemixContainersMap    = {};

/* AAC_Symbols */
var AACSymbolsMap  = {};

/* OAUTH authentication */
var oauth                   = require("./oauth");
var session                 = require("express-session");
var bmInfo                  = require("./bluemixParams");
var uuid                    = require("uuid");

/* Watson Services */
var watson                  = require('watson-developer-cloud');
var extend                  = require('util')._extend;

//Create the Natural Language Classifier object
var NaturalLanguageUnderstanding = require('./watson/natural-language-understanding');
var naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();

var SpeechToText = require('./watson/speech-to-text');
var speechToText = new SpeechToText();

//Create the Tone Analyzer object Niyati
var ToneAnalyzer = require('./watson/tone-analyzer');
var toneAnalyzer = new ToneAnalyzer();
var toneResBuilder =  require('./nlp_algs/tone_analyzer_res_builder');

var UrlUtil = require('./utils/url-util');
var urlUtil = new UrlUtil();

// Create the Extraction summary object
var ClarifierExtractionCondense = require('./nlp_algs/extraction_condense');

// Create the Chat summary object
var ClarifierChatCondense = require('./nlp_algs/extraction_condense_ww_chats');


//var StanfordSimpleNLP = require('stanford-simple-nlp');


// var testJSON = require('./model/moment.json');
// var testJSON = require('./model/momentLong.json');
// var testJSON = require('./model/veryBigMoment');
// var testJSON = require('./model/sushank');

//
var vocabMap    = {};
var thesMap     = {};
var sDictMap    = {};
var ignoreListMap = {};
var operationalRulesMap = {};
var blacklistMap = {};
var appUsersMap = {};
var lemmaMap = {};
var properNounsMap = {};
var nonLiteralsMap = {};
var textPosMap = {};
var posListMap = {};
var transListMap = {};
var htmlFormattingMap = {}; // Fix #173
var words       = []; // Input text into system, tokenized by spaces
var punctuation = []; // Punctuation corresponding to each word
var clients = [];

// Chat summarization
var domainKeywordsArr = [];
var questionArr = [];
var stopWordsArr = [];
var domainStopWordsArr = [];
var throttleParticipantsMap = {};
// End Chat summarization

var isLogged = false;

// setup middleware
var app = express();

app.use(cors()); // CORS-enabled for all origins
app.use(express.static(__dirname)); // Serve the web content
//app.use(bodyParser.json()); // parse POST requests
app.use(bodyParser.json({limit: '5mb'})); // support large file
app.use(bodyParser.urlencoded({extended: true, limit: '5mb'})); // support large files

app.use(express.cookieParser());
app.use(express.session({secret: "hQp9VcWTEAdRvpXH"}));
app.use(app.router);
app.use(compression()); // Support Gzip compression

// Redirect all .mybluemix.net requests to HTTPS
// https://www.tonyerwin.com/2014/09/redirecting-http-to-https-with-nodejs.html
app.enable('trust proxy');
app.use (function (req, res, next) {
        if (req.secure) {
                // request was via https, so do no special handling
                next();
        } else {
                // request was via http, so redirect to https
                res.redirect('https://' + req.headers.host + req.url);
        }
});


app.options('*', cors()); // Enable CORS pre-flight across-the-board

        
// setup DB connection
var pool;
var mysql      = require('mysql');

if(C.CC_ENVIRONMENT == 'staging') 
{
    pool  = mysql.createPool({
        acquireTimeout : 20000,
        waitForConnections : true, 
        canRetry : true,
        connectionLimit : C.CC_DB_STAGING_CONN_LIMIT,
        host: C.CC_DB_STAGING_HOST,
        port : C.CC_DB_STAGING_PORT,
        user: C.CC_DB_STAGING_USER,
        password: C.CC_DB_STAGING_PASS,
        database : C.CC_DB_STAGING_NAME
    });
}
else if(C.CC_ENVIRONMENT == 'production'){ 
    
    pool  = mysql.createPool({
        acquireTimeout : 20000,
        waitForConnections : true, 
        canRetry : true,
        connectionLimit : C.CC_DB_PROD_CONN_LIMIT,
        host: C.CC_DB_PROD_HOST,
        port : C.CC_DB_PROD_PORT,
        user: C.CC_DB_PROD_USER,
        password: C.CC_DB_PROD_PASS,
        database : C.CC_DB_PROD_NAME
    });    
}
else{
    console.error("SERVER ERROR - environment not set!");
}


//----------------  Variables ---------------------
var appInfo     = JSON.parse(process.env.VCAP_APPLICATION || "{}");
var services    = JSON.parse(process.env.VCAP_SERVICES || "{}");
var port        = (process.env.VCAP_APP_PORT || 3000);
var host        = (process.env.VCAP_APP_HOST || 'localhost');


process.on('uncaughtException', function (err) {
    console.error("EXCEPTION detected in server:" + err);

    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message)
        }
        if (err.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(err.stack);
        }
    } else {
        console.log('dumpError :: argument is not an object');
    }

});

// ------------------ Services ------------------------

app.get('/',function(req,res,next){
    res.sendfile('./public/index.html');
});



app.post('/getUrlText', function(req,res,next){
    console.log(req.body.url);
    urlUtil.evaluateURLOrDocumentReturnText(req.body.url, function(response) {
        // Surface failures from urlUtil.evaluateURLOrDocumentReturnText       
        if(response.statusCode != 200){
            res.writeHead(200, {"Content-Type": "application/json"});
            responseObj = { status: "error", code: response.statusCode, message: response.message };
            var json = JSON.stringify(responseObj);
            res.end(json);
            return;
        }
        else{
            res.writeHead(200, {"Content-Type": "application/json"});
            responseObj = { status: "success", code: response.statusCode, text: response.text };
            var json = JSON.stringify(responseObj);
            res.end(json);
            return;
            
        }
    });
    
});


app.get('/cle-app-reader',function(req,res,next){
    
    res.sendfile('./public/Editor2.html');
    
});

app.get('/cle-app-select',function(req,res,next){
    
    res.sendfile('./public/Editor3.html');
    
});

app.get('/cc-plugin-app',function(req,res,next){
    
    res.sendfile('./public/Editor4.html');
    
});

app.get('/app',function(req,res,next){
    if(req.get('host').includes("contentclarifier.mybluemix.net")){

        if(req.session.OAUTH_STATE == null){
            res.redirect('back');
        }
        else{
            pool.getConnection(function(err, connection) {
                if(err) {
                    console.error('DB Error in getting connection: ' + err);
                }
                connection.query('SELECT DISTINCT DEMO_OAUTH_STATE FROM usr_api_keys WHERE DEMO_OAUTH_STATE = ?', [req.session.OAUTH_STATE.toString()], function(err, results) {
                    connection.release(); // always put connection back in pool after last query
                    if (err) {
                        console.error('Error while performing confirm login for DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString() + ' : ' + err);
                        res.sendfile('./public/index.html');
                    }
                    else if(results[0] === undefined){ // Didn't find this DEMO_OAUTH_STATE, so not logged in
                        res.sendfile('./public/index.html');
                    }
                    else {
                        console.error('User logged in with DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString());
                        res.sendfile('./public/Editor.html');
                    }
                }); // end connection
            }); // end pool
        }
    }
    else{
        res.sendfile('./public/Editor.html');
    }
});

app.post('/api-login',function(req,res,next){ //
    apiLogin(req,res);
});

//Each Content Clarifier API calls this function to authenticate and make the call
function doAPIPost(action, req, res){
    if(req.body.id === undefined || req.body.apikey === undefined){
        res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
        return;
    }

    return pool.getConnection(function(err, connection) {
        if(err) {
            console.error('DB Error in getting connection: ' + err);
            res.status(500).json({ error: 'DB Error occurred during API authentication.' });
        }
        try{
            connection.query(C.API_KEY_QUERY, [req.body.id.toLowerCase(),req.body.apikey], function(err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.error('Error while performing authentication for ID = ' + req.body.id + ' : ' + err);
                    res.status(500).json({ error: 'Error while performing authentication for ID = ' + req.body.id });
                }
                else if(results[0] === undefined){ // Didn't find this ID/API_Key combination
                    console.error('The API Key could not be authenticated for ID = ' + req.body.id);
                    res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
                }
                else {
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(' The authenticated user key is: ', results[0].Email);
                    action(req,res);
                }
            }); // end connection
        }
        catch(e){
            console.error('A DB connection timeout occurred. This is usually temporary. Please retry the operation');
            res.status(504).json({ error: 'A DB connection timeout occurred. This is usually temporary. Please retry the operation.' });
        }
    }); // end pool
}

app.post(C.API_CONTEXTUAL_SIMPLIFY, function(req,res,next){
    return doAPIPost(apiContextualSimplify, req, res);
});

app.post(C.API_CONTEXTUAL_SIMPLIFY_URL,function(req,res,next){
    return doAPIPost(apiContextualSimplifyURL, req, res);
});

app.post(C.API_CONDENSE,function(req,res,next){ //
    return doAPIPost(apiCondense, req, res);
});

app.post(C.API_CONDENSE_URL,function(req,res,next){ //
    return doAPIPost(apiCondenseURL, req, res);
});

app.post(C.API_CONDENSE_AND_SIMPLIFY,function(req,res,next){ //
    return doAPIPost(apiCondenseAndSimplify, req, res);
});

app.post(C.API_CONDENSE_AND_SIMPLIFY_URL,function(req,res,next){ //
    return doAPIPost(apiCondenseAndSimplifyURL, req, res);
});

app.post(C.API_CONDENSE_WW_CHAT,function(req,res,next){ //
    return doAPIPost(apiCondenseWatsonWorkspaceChat, req, res);
});

app.post('/api-train',function(req,res,next){ //
    return doAPIPost(apiTrain, req, res);
});

//Added By Niyati For Analyze_Tone Api
app.post(C.API_ANALYZE_TONE,function(req,res,next){
    return doAPIPost(apiToneAnalyzer, req, res);
});

app.post(C.API_ANALYZE_TONE_URL,function(req,res,next){
    return doAPIPost(apiToneAnalyzerURL, req, res);
});

app.post(C.API_HYPHENATE,function(req,res,next){
    return doAPIPost(apiHyphenate, req, res);
});

// ------------------ Set the client credentials and the OAuth2 server ------------------------
app.get('/sso', function(req, res, next) {

    //res.redirect('https://localhost:3000/app');
    //console.log("hostname:"+ req.get('host'));
    if(!req.get('host').includes("contentclarifier.mybluemix.net")){

        res.redirect('/app');
    }else{
        if(C.DEBUG_VERBOSE_LOGGING) console.log("host name is:"+req.get('host'));
        var state = uuid.v4();
        var clientid= 'ibma_clarifier';
        var secret = 'hQp9VcWTEAdRvpXH';
        //console.log(req.session);
        req.session.OAUTH_STATE = state;


        // console.log("/sso");
        // console.log(req.session.OAUTH_STATE.toString());

        var hostStr = 'https://mccp.ng.bluemix.net/login';
        if (req.query["X-Bluemix-Authorization-Endpoint"]) {
            hostStr = req.query["X-Bluemix-Authorization-Endpoint"];
        }

        hostStr += "/oauth/authorize?";

        if (req.query["X-Bluemix-Authorization-Endpoint-Query"]) {
            hostStr += req.query["X-Bluemix-Authorization-Endpoint-Query"] + "&";
        }

        hostStr += "state="+state +
            "&response_type=code" +
            "&client_id="+clientid +
            "&client_secret="+secret +
            "&redirect_uri="+"https://contentclarifier.mybluemix.net/auth/sso/callback";

        // console.log("redirec url:   "+ hostStr);
        res.redirect(hostStr);
    }
});

app.get("/auth/sso/callback", function(req, res, next) {


    //console.log("/auth/sso/callback");
    //console.log(req.session.OAUTH_STATE.toString());

    var code = req.query.code;
    if (req.session.OAUTH_STATE != req.query.state) {
        res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
        return;
    } else if (code) {

        oauth.getAccessToken(code, function(token) {

            if (token) {

                req.session.USER_TOKEN = token;

                oauth.getUserInfo(token, function(userInfo) {

                    pool.getConnection(function(err, connection) {
                        if(err) {
                            console.error('DB Error in getting connection: ' + err);
                            res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
                        }
                        connection.query('UPDATE usr_api_keys SET DEMO_OAUTH_STATE = ? WHERE Email = ?', [req.session.OAUTH_STATE.toString(),userInfo.email], function(err, results) {
                            connection.release(); // always put connection back in pool after last query
                            if (err) {
                                console.error('Error while updating DEMO_OAUTH_STATE for ID = ' + userInfo.email + ' : ' + err);
                                res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Connection Failure");
                            }
                            else { // begin authenticated demo else
                                if(C.DEBUG_VERBOSE_LOGGING) console.log('oauth.getAccessToken() The authenticated demo user is: ', userInfo.email);

                                req.session.USER_ID = userInfo.user_id;
                                req.session.EMAIL= userInfo.email;
                                var domain = userInfo.email;
                                if(C.DEBUG_VERBOSE_LOGGING) console.log("processing login by usersentry: "+userInfo.email);
                                if( hasDemoUsersEntry(userInfo.email) !== undefined ){
                                    domain = domain.substring(domain.indexOf("@")+1);
                                    req.session.USER_DOMAIN = domain;
                                    if (req.session.OAUTH_INSTANCEINFO) {
                                        InstanceInfo.get(req.session.OAUTH_INSTANCEINFO, function (err, doc) {
                                            if (doc.userDomains.indexOf(domain) == -1) {
                                                doc.userDomains.push(domain);
                                                doc.save();
                                            }
                                        });
                                    }
                                    if (req.session.OAUTH_REDIR) {
                                        res.redirect(req.session.OAUTH_REDIR);
                                        return;
                                    } else {
                                        console.log(" user exists ");
                                        res.redirect('https://contentclarifier.mybluemix.net/app');
                                        return;
                                    }
                                }
                                else{
                                    // Auto register the user with CC app
                                    //
                                    console.log("Auto register the user with CC app: "+userInfo.email);
                                    pool.getConnection(function(err, connection) {
                                        if(err) {
                                            console.error('DB Error in getting connection: ' + err);
                                            res.send(401,'A problem occurred while authenticating your user ID <b>'+req.body.id+'<b /> with the application. Please return to the Content Clarifier app and retry operation. If the error persists, please send a note to <b>scottw1@us.ibm.com</b>');
                                        }
                                        var generatedAPIKey = makeid().toUpperCase();
                                        // INSERT IGNORE - If new record, inserts, else ignores the insert operation on duplicate key (Email) found
                                        connection.query('INSERT IGNORE INTO usr_api_keys SET Name=?,Email=?,API_Key=?,DEMO_OAUTH_STATE=?,gdpr_flag = ?',
                                            ['',userInfo.email,generatedAPIKey,req.session.OAUTH_STATE.toString(), 0], function(err, results) {
                                                connection.release(); // always put connection back in pool after last query
                                                if (err) {
                                                    
                                                    console.error('Error while inserting into USR_API_KEYS' + err);
                                                }
                                                else if(results.affectedRows == 0){ // User already exists.
                                                    if(C.DEBUG_VERBOSE_LOGGING) console.log('Returning User identified with ID: ' + req.session.EMAIL);
                                                }
                                                else {
                                                    initAppUsersMap();
                                                    console.log("user does not exists");
                                                    
                                                    if(C.DEBUG_VERBOSE_LOGGING) console.log('New User created with ID = ' + req.session.EMAIL);
                                                    res.redirect('https://contentclarifier.mybluemix.net/app');
                                                }
                                            }); // end connection
                                    }); // end pool
                                } 

                            } // end authenticated demo else
                        }); // end connection
                    }); // end pool
                }); //userinfo function close
            } // if token close
        }); //accesstokeb fucntion close
    } else {
        res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
    }
});

app.get('/confirm-login', function (req, res, next) {

        //console.log("/confirm-login");
        //console.log(req.session.OAUTH_STATE.toString());
        if(req.session.OAUTH_STATE == null){
            res.send('false');
        }

        pool.getConnection(function(err, connection) {
            if(err) {
                console.error('DB Error in getting connection: ' + err);
            }
            connection.query('SELECT DISTINCT DEMO_OAUTH_STATE FROM usr_api_keys WHERE DEMO_OAUTH_STATE = ?', [req.session.OAUTH_STATE.toString()], function(err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.error('Error while performing confirm login for DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString() + ' : ' + err);
                    res.send('false');
                }
                else if(results[0] === undefined){ // Didn't find this DEMO_OAUTH_STATE, so not logged in
                    res.send('false');
                }

                else {
                    if(C.DEBUG_VERBOSE_LOGGING)console.log('User logged in with DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString());
                    res.send('true');
                }
            }); // end connection
        }); // end pool
    }
);


/*
 Special API that can only be invoked from the web app client AFTER
 successful SSO authentication.
 */
app.get('/user-credentials', function (req, res, next) {

        var responseObj;
        var json;
        
        res.writeHead(200, {"Content-Type": "application/json"});

        if(C.DEBUG_VERBOSE_LOGGING)console.log("User email is :"+ req.session.EMAIL.toLowerCase().trim() );
        if(C.DEBUG_VERBOSE_LOGGING)console.log("User OAUTH State is  :"+ req.session.OAUTH_STATE.toString()); 
        
        console.log("Retreiving User Credentials" + req.session.OAUTH_STATE);
        pool.getConnection(function(err, connection) {

            if(err) {
                console.error('DB Error in getting connection: ' + err);
                responseObj = { status: "error" };
                json = JSON.stringify(responseObj);
                res.end(json);
                return;
            }
            connection.query('SELECT API_Key, Email FROM usr_api_keys WHERE DEMO_OAUTH_STATE=?', [req.session.OAUTH_STATE.toString()], function(err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.error('Database Error while querying credentials: ' + err);
                    responseObj = { status: "error" };
                    json = JSON.stringify(responseObj);
                    res.end(json);
                    return;
                }
                else if(results[0] === undefined){ // No results
                    console.error('No User credentials found for User: ' + req.session.EMAIL);
                    responseObj = { status: "false" };
                    json = JSON.stringify(responseObj);
                    res.end(json);
                    return;
                }
                else {
                    
                    console.log("Credentials found " + results[0].API_Key);
                    console.log("Credentials found " + results[0].Email);                    if(C.DEBUG_VERBOSE_LOGGING)console.log('User credentials returned for User: ' + req.session.EMAIL);
                    if(C.DEBUG_VERBOSE_LOGGING)console.log("Credentials found " + results[0].API_Key);
                    if(C.DEBUG_VERBOSE_LOGGING)console.log("Credentials found2 " + results[0]['API_Key']);
                    responseObj = { status: "success", id: results[0].Email.toLowerCase().trim(), key: results[0].API_Key };
                    json = JSON.stringify(responseObj);
                    res.end(json);
                    return;

                }
            }); // end connection
        }); // end pool
    }
);


app.get('/logout', function (req, res, next) {

    //console.log("/logout");
    //console.log(req.session.OAUTH_STATE.toString());
    if(req.get('host').includes("contentclarifier.mybluemix.net")){

        pool.getConnection(function(err, connection) {
            if(err) {
                console.error('DB Error in getting connection: ' + err);
            }
            connection.query('UPDATE usr_api_keys SET DEMO_OAUTH_STATE = null WHERE DEMO_OAUTH_STATE = ?', [req.session.OAUTH_STATE.toString()], function(err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.error('Error while performing logging out for DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString() + ' : ' + err);
                    res.redirect('https://contentclarifier.mybluemix.net/app');
                    //res.sendfile('./public/Editor.html');
                }
                else {
                    console.error('Logging out user with DEMO_OAUTH_STATE = ' + req.session.OAUTH_STATE.toString());
                    req.session.OAUTH_STATE=null;
                    //res.sendfile('./public/index.html');
                    var redirect = 'https://contentclarifier.mybluemix.net';
                    res.redirect('https://login.ng.bluemix.net/UAALoginServerWAR/logout.jsp?redirect='+redirect);
                    return;
                }
            }); // end connection
        }); // end pool
    }
    else{
        res.sendfile('./public/Editor.html');
    }
});


app.use(function (req, res, next) {
    /*if (req.originalUrl.length > 5 && req.originalUrl.substring(0, 5) === "/dap/"
     || req.originalUrl === "/api/oauth/login"
     ) {
     */
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    //}

    next();
});


// ------------------ File Upload ------------------------

// REF: https://github.com/watson-developer-cloud/document-conversion-nodejs/blob/master/app.js
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        var cleanFileName = file.originalname.toString().replace(/[^A-Z0-9.]+/ig, "_");
        cb(null, `${Date.now()}-${cleanFileName}`);
        //cb(null, `${Date.now()}-${file.originalname}`);
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

// API path that will upload the files
app.post('/upload', function(req, res) {
    upload(req,res,function(err){
        if(err){
            res.json({status:"error", code:400, message:err });
            return;
        }

        var fileURL = 'http://'+ host + ':' + port + '/uploads/'+ req.file.filename;

        if(C.DEBUG_VERBOSE_LOGGING) console.log(fileURL);

        // 1. Return file contents
        // 2. Delete the file

        urlUtil.evaluateURLOrDocumentReturnText(fileURL, function(response) {
            // Surface failures from urlUtil.evaluateURLOrDocumentReturnText
            if(response.statusCode != 200){
                res.json({status: "error", code: response.statusCode, message: response.message });
            }
            else{
                res.json({status: "success", code: response.statusCode, text: response.text });
            }

            fs.unlink('./uploads/'+ req.file.filename,function(err){
                if(err){
                    console.error('Failed to delete file: /uploads/'+ req.file.filename + ' Err: '+ err);
                }
            });
        }); // end urlUtil
    });// end upload
});


// ------------------ Text of Speech ------------------------

var textToSpeech = watson.text_to_speech({
    version: 'v1',
    username: C.WATSON_TEXT_TO_SPEECH_USER,
    password: C.WATSON_TEXT_TO_SPEECH_PASS
});


var ttsConfig = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/text-to-speech/api',
  username: C.WATSON_TEXT_TO_SPEECH_USER,
  password: C.WATSON_TEXT_TO_SPEECH_PASS
}, vcapServices.getCredentials('text_to_speech'));

var ttsAuthService = watson.authorization(ttsConfig);

//var tts = watson.text_to_speech(ttsConfig);

app.get('/api/token', function(req, res) {
  ttsAuthService.getToken({url: ttsConfig.url}, function(err, token) {
    if (err) {
      console.error('Error retrieving token: ', err);
      return res.status(500).send('Error retrieving token')
    }
     // console.log(token);
    res.send(token);
  });
});

app.post('/api/chkGdpr', function(req, res) {
    
         console.log("Id from Request: "+req.body.id );
  
         pool.getConnection(function(err, connection) {
                            if(err) {
                                console.error('DB Error in getting connection: ' + err);
                                res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
                            }

            connection.query(C.API_KEY_QUERY, [req.body.id.toLowerCase(),req.body.apikey], function(err, results) {
                    connection.release(); // always put connection back in pool after last query
                    if (err) {
                        console.error('Error while performing authentication for ID = ' + req.body.id + ' : ' + err);
                        res.status(500).json({ error: 'Error while performing authentication for ID = ' + req.body.id });
                    }
                    else if(results[0] === undefined){ // Didn't find this ID/API_Key combination
                        console.error('The API Key could not be authenticated for ID = ' + req.body.id);
                        res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
                    }
                    else {
                        console.log(' The authenticated user key is: ', results[0].gdpr_flag);
                        var responseObj = { status: "OK",
                                        key: results[0].gdpr_flag};


                                var json = JSON.stringify(responseObj);

                                res.end(json);
                      // res.send(results[0].gdpr_flag);
                    }
                }); // end connection

         });
    

});


app.post('/api/updateGdpr', function(req, res) {
    
     if( hasDemoUsersEntry(req.body.id.toLowerCase()) !== undefined ){
         pool.getConnection(function(err, connection) {
                            if(err) {
                                console.error('DB Error in getting connection: ' + err);
                                res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
                            }

            connection.query('UPDATE usr_api_keys SET gdpr_flag = ? WHERE Email = ?', [req.body.flag ,req.body.id.toLowerCase()], function(err, results) {

                    connection.release(); // always put connection back in pool after last query
                    if (err) {
                        console.error('Error while performing authentication for ID = ' + req.body.id + ' : ' + err);
                        res.status(500).json({ error: 'Error while performing authentication for ID = ' + req.body.id });
                    }
                    else {
                        console.log(' GDPR flag is updated');
                        var responseObj = { status: "OK"};


                                var json = JSON.stringify(responseObj);

                                res.end(json);
                      // res.send(results[0].gdpr_flag);
                    }
                }); // end connection

         });

     }else{
          var responseObj = { status: "OK",
                                        key: 0};


                                var json = JSON.stringify(responseObj);

                                res.end(json);
        
        
        
            pool.getConnection(function(err, connection) {
                                        if(err) {
                                            console.error('DB Error in getting connection: ' + err);
                                            res.send(401,'A problem occurred while authenticating your user ID <b>'+req.body.id+'<b /> with the application. Please return to the Content Clarifier app and retry operation. If the error persists, please send a note to <b>scottw1@us.ibm.com</b>');
                                        }
                                        var generatedAPIKey = makeid().toUpperCase();
                                        // INSERT IGNORE - If new record, inserts, else ignores the insert operation on duplicate key (Email) found
                                        connection.query('INSERT IGNORE INTO usr_api_keys SET Name=?,Email=?,API_Key=?,DEMO_OAUTH_STATE=?,gdpr_flag = ?',
                                            ['',userInfo.email,generatedAPIKey,req.session.OAUTH_STATE.toString(), 1], function(err, results) {
                                                connection.release(); // always put connection back in pool after last query
                                                if (err) {
                                                    console.error('Error while inserting into USR_API_KEYS' + err);
                                                }
                                                else if(results.affectedRows == 0){ // User already exists.
                                                    if(C.DEBUG_VERBOSE_LOGGING) console.log('Returning User identified with ID: ' + req.session.EMAIL);
                                                }
                                                else {
                                                    initAppUsersMap();
                                                    res.redirect('https://contentclarifier.mybluemix.net/app');
                                                    if(C.DEBUG_VERBOSE_LOGGING) console.log('New User created with ID = ' + req.session.EMAIL);
                                                }
                                            }); // end connection
                                    }); // end pool
        
    }

});




app.get('/api/synthesize', function(req, res, next) {
    var transcript = textToSpeech.synthesize(req.query);
    transcript.on('response', function(response) {
        if (req.query.download) {
            response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
        }
    });
    transcript.on('error', function(error) {
        next(error);
    });
    transcript.pipe(res);
});

app.get('/api/speech-to-text/token', function(req, res) {
    speechToText.getToken(function(response) {
        if(response.token == null) {
            var error = 'There was a problem getting the speech to text token: ' + response.statusCode + ', ' + response.status + ', ' + response.message;
            console.error(error);
            res.status(500).send(error);
            return;
        }
        //console.log('in server.js, response.token: ' + response.token); 
        res.status(200).send(response.token);
        return;
    });
});

app.get('/bower_components/watson-speech/dist/watson-speech.js', function(req, res) {
    res.sendfile ('./public/bower_components/watson-speech/dist/watson-speech.js');
});

app.get('/bower_components/fetch/fetch.js', function(req, res) {
    res.sendfile ('./public/bower_components/fetch/fetch.js');
});


// ------------------ APIs ------------------------

//Shared functions used by the API's
function checkIfEnhancedMode(req){
    var enhanceContentMode = undefined;
    if(req.body.options !== undefined && req.body.options !== null){
        try{
            var reqOptions = JSON.parse(req.body.options);
            if(reqOptions.enhanceContentMode !== undefined && reqOptions.enhanceContentMode !== null){
                enhanceContentMode = reqOptions.enhanceContentMode;
            }
        }
        catch(e){ // Got here then the input is a JSON object, as passed by httprequest
            enhanceContentMode = req.body.options.enhanceContentMode;
        }
    }
    return enhanceContentMode;
}

function getOutputMode(req){
    var outputMode = 0;
    if(req.body.options !== undefined && req.body.options !== null){
        try{
            var reqOptions = JSON.parse(req.body.options);
            if(reqOptions.outputMode !== undefined && reqOptions.outputMode !== null){
                outputMode = reqOptions.outputMode;
            }
        }
        catch(e){
            outputMode = req.body.options.outputMode;
        }
    }
    return outputMode;
}

// For now just 0, here for future support
function getCalculateReadingLevels(req){
    var calculateReadingLevels = 0;
    // if(req.body.options.calculateReadingLevels !== undefined && req.body.options.calculateReadingLevels !== null){
    //    calculateReadingLevels = req.body.options.calculateReadingLevels;
    // }
    return calculateReadingLevels;
}

function checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText){
    var responseObj;
    if(calculateReadingLevels == C.RETURN_READING_LEVELS){
        responseObj = { status: "OK",
            usage: C.TERM_OF_USE_MESSAGE,
            simplified: simplifiedText,
            original: originalText,
            fleschKincaidInput: calculateFleschKincaid(text),
            fleschKincaidOutput: calculateFleschKincaid(formatStringOutput(simplifiedText,2)),
            colemanLiauInput: calculateColemanLiau(text),
            colemanLiauOutput: calculateColemanLiau(formatStringOutput(simplifiedText,2)),
            ariInput: calculateAutomatedReadabilityIndex(text),
            ariOutput: calculateAutomatedReadabilityIndex(formatStringOutput(simplifiedText,2)),
        };
        logReadabilityCalculations(responseObj);
        if(C.DEBUG_VERBOSE_LOGGING)console.log(getLoggingTimestamp() +' Calculation of reading levels complete.');
    }
    else{
        responseObj = { status: "OK",
            usage: C.TERM_OF_USE_MESSAGE,
            simplified: simplifiedText,
            original: originalText };
    }
    return responseObj;
}

function buildAndCallAPIContextSimplify(req, text){
    var apiCall = (req.body.options.flavor != undefined && req.body.options.flavor == 'url') ? C.API_CONTEXTUAL_SIMPLIFY_URL : C.API_CONTEXTUAL_SIMPLIFY;
    callMeterAPICalls(apiCall, req, text)
}

function buildAndCallAPICondense(req, text){
    var apiCall = (req.body.options.flavor != undefined && req.body.options.flavor == 'url') ? C.API_CONDENSE_URL : C.API_CONDENSE;
    callMeterAPICalls(apiCall, req, text)
}

function buildAndCallAPICondenseAndSimplify(req, text){
    var apiCall = (req.body.options.flavor != undefined && req.body.options.flavor == 'url') ? C.API_CONDENSE_AND_SIMPLIFY_URL : C.API_CONDENSE_AND_SIMPLIFY;
    callMeterAPICalls(apiCall, req, text);
}

function callMeterAPICalls(apiCall, req, text){
    meterAPICalls(apiCall,
        JSON.stringify(req.body.options),
        text.length,
        req.body.id,
        req.body.apikey);
}

function setCondenseMode(req){
    var condenseMode = C.DEFAULT_CONDENSE_ALGORITHM;  //default is abstraction
    if(req.body.options !== undefined && req.body.options !== null){
        try{
            var reqOptions = JSON.parse(req.body.options);
            if(reqOptions.condenseMode !== undefined && reqOptions.condenseMode !== null){
                condenseMode = reqOptions.condenseMode;
            }
        }
        catch(e){
            condenseMode = req.body.options.condenseMode;
        }
    }
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Set condenseMode = " + condenseMode);
    return condenseMode;
}

// Each Content Clarifier API calls this function to encode the URL, get the analyzed text and call the next relevant CC API
function processURLAndCallAPI(apiFunction, req, res){
    urlUtil.evaluateURLOrDocumentReturnText(req.body.url, function(response) {
        // Surface failures from urlUtil.evaluateURLOrDocumentReturnText       
        if(response.statusCode != 200){
            res.writeHead(200, {"Content-Type": "application/json"});
            responseObj = { status: "error", code: response.statusCode, message: response.message };
            var json = JSON.stringify(responseObj);
            res.end(json);
            return;
        }
        else{
            return apiFunction(response.text, req, res);
        }
    });
}



//
//API - Contextual Simplify
//
// e.g. curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://localhost:3000/api/V1/contextual-simplify
// curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://textsimplification.mybluemix.net/api/V1/contextual-simplify

//called by the api's contextual-simplify and contextual-simplify-url
function doContextualSimplify(text, req, res){
    var originalText = text;
    //console.log(getLoggingTimestamp() + " Entering [apiContextualSimplify]");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("[apiContextualSimplify] : text = " + text);

    var enhanceContentMode = checkIfEnhancedMode(req);
    var outputMode = getOutputMode(req);
    var calculateReadingLevels = getCalculateReadingLevels(req);

    if(C.DEBUG_VERBOSE_LOGGING) console.log("enhanceContentMode = " + enhanceContentMode);

    // #195 - standard simplify case
    if(enhanceContentMode === 0 || enhanceContentMode === undefined){
        // mark non-literals and transitions
        text = markNonLiteralsAndTransitions(text);
    }
    // mark non-literals and transitions
    // text = markNonLiteralsAndTransitions(text);

    text = text.replace(/</g, " <");   //v2.17 (Study) Add space before tag to separate it from the words
    text = text.replace(/>/g, "> ");   //v2.17 (Study) Add space before tag to separate it from the words
    
    text = markHTMLFormattingAndCreateMap(text); // Fix #173 

    text = text.replace(/"/g, '\\"');   //g global, matches all instances found, replaces " with \" ?
    text = text.replace(/&#39;/g, "'");   //v2.17 (Study)
    
    if(C.DEBUG_VERBOSE_LOGGING) console.log("[apiContextualSimplify] : text = "+ text);

    /* Converting to Watson Natural Language Understanding API
     *  The Relations endpoint in the Alchemy Language API maps to the Semantic Roles feature in Natural Language Understanding API
     *  The NLU API has only 1 endpoint called 'analyze', as opposed to the alchemyapi, which had many endpoints
     *  The NLU API passes in different features, instead of the different endpoints of the alchemyapi
     *  See here documentation on the conversion from alchemyapi to NLU api: https://www.ibm.com/watson/developercloud/doc/natural-language-understanding/migrating.html

     *  The Concepts endpoint in the Alchemy Lamnguage API maps to the Concepts feature in Natural Language Understanding API
     *  NLU concepts has only 1 option, which is optional ->
     *      limit (integer): The maximum number of concepts to return.Default: 8, Maximum you can return: 50.
     *
     *  The alchemyapi concepts call had used an option: 'showSourceText':1
     *  The NLU api does not have this option, so leaving the options values blank here
     */
    var parameters = {"features": {"concepts": {}}};
    naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
        naturalLanguageUnderstanding['concepts'] = {};

        if(response.body != null && response.body['concepts'] != undefined){
            naturalLanguageUnderstanding['concepts'] = { text:text, response:JSON.stringify(response,null,4), results:response.body['concepts'] };
            if(C.DEBUG_VERBOSE_LOGGING) console.log(naturalLanguageUnderstanding['concepts'].response);
            //console.log(getLoggingTimestamp() + " [apiContextualSimplify] successfully queried Natural Language Understanding for concepts. Found " +  naturalLanguageUnderstanding['concepts'].results.length + " concepts");
            if(C.DEBUG_VERBOSE_LOGGING) console.log( naturalLanguageUnderstanding['concepts']);
        }

        // #195 - standard simplify case       
        var modText = text;

        // Make sure to mark proper nouns BEFORE POS tagging;
        //var modText = markProperNounsAndCreateMap(text, naturalLanguageUnderstanding['concepts'].results);
        //console.log(getLoggingTimestamp() + " [apiContextualSimplify] markProperNounsAndCreateMap complete ");

        if(C.DEBUG_VERBOSE_LOGGING) console.log('before stanfordSimpleNLP.process, modText: ' + modText);

        stanfordSimpleNLP.process(modText, function(err, result) {
            if(C.DEBUG_VERBOSE_LOGGING) console.log('in stanfordSimpleNLP.process');
            var brillTagger = new Tagger(lexicon_file, rules_file, default_category, function(bError) {
                if(C.DEBUG_VERBOSE_LOGGING) console.log('brillTagger');
                var wordsPOS = [];
                var brillSentence = [];
                var numTaggedSentences = result.document.sentences.sentence.length;
                for(var i = 0; i<numTaggedSentences; i++){
                    var entry = result.document.sentences.sentence[i].tokens.token;

                    for(var j=0; j<entry.length; j++){
                        var POS = entry[j].POS;
                        if(entry[j].word[0] == '@'){ // check for marked proper noun
                            POS = "NNP";
                        }
                        wordsPOS.push(entry[j].word + "_" + POS);
                        brillSentence.push(entry[j].word);
                    }
                }

                if(!bError) wordsPOS = reconcilePOS(brillTagger, brillSentence, wordsPOS);

                if(C.DEBUG_VERBOSE_LOGGING) console.log(wordsPOS);

                if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() + " [apiContextualSimplify] successfully queried for parts of speech. " +  wordsPOS.length);

                var simplifiedText = "";

                // #195
                res.writeHead(200, {"Content-Type": "application/json"});

                if(enhanceContentMode === 0 || enhanceContentMode === undefined){
                    if(wordsPOS.length == 0) { // We can't get parts of speech. Take best guess for simplification
                        simplifiedText = lexicalSimplify(modText);
                    } else {
                        simplifiedText = contextualLexicalSimplify(wordsPOS, enhanceContentMode);
                    }
                    if(simplifiedText === null){
                        simplifiedText = text;
                    }
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() +' Contextual Lexical Simplification Completed');

                    simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                    // reapply any CSS formatting. Fix #173
                    simplifiedText = reapplyCSSFormatting(simplifiedText);

                    simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() +' Formatting of complete');
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("AFTER " + simplifiedText);

                    var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                    var json = JSON.stringify(responseObj);

                    res.end(json);

                    buildAndCallAPIContextSimplify(req, text);
                    return;

                }
                else{
                    // Don't simplfy the text when just enhancements are requested
                    simplifiedText = text;
                }

                /*
                 if(wordsPOS.length == 0) { // We can't get parts of speech. Take best guess for simplification
                 simplifiedText = lexicalSimplify(modText);
                 } else {
                 simplifiedText = contextualLexicalSimplify(wordsPOS, enhanceContentMode);
                 }
                 if(simplifiedText === null){
                 simplifiedText = text;
                 }
                 console.log(getLoggingTimestamp() +' Contextual Lexical Simplification Completed'); 

                 res.writeHead(200, {"Content-Type": "application/json"});

                 */

                //
                // ENHANCE_DEFINITIONS path
                //

                /* #195
                 if(enhanceContentMode === C.ENHANCE_DEFINITIONS ||
                 enhanceContentMode === 0 ||
                 enhanceContentMode === undefined)
                 {
                 */
                if(enhanceContentMode === C.ENHANCE_DEFINITIONS)
                {
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("enhanceContentMode === " + enhanceContentMode);

                    // #195
                    //for(noun in properNounsMap){  // remove flagged proper nouns in this mode
                    //    simplifiedText = replaceAll(simplifiedText, properNounsMap[noun].id, properNounsMap[noun].displayText);
                    //}

                    if(wordsPOS.length != 0) { // We can't get parts of speech. Take best guess for simplification
                        simplifiedText = contextualLexicalSimplify(wordsPOS, C.ENHANCE_DEFINITIONS);
                    }
                    if(simplifiedText === null){
                        simplifiedText = text;
                    }
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() +' Retreiving Definitions Completed');
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("BEFORE " + simplifiedText);
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("OUTPUT MODE = " + outputMode );

                    // replace non-literals and transitions with Plain English alternatives
                    // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                    // reapply any CSS formatting. Fix #173
                    simplifiedText = reapplyCSSFormatting(simplifiedText);

                    simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() +' Formatting of complete');
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("AFTER " + simplifiedText);

                    var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                    var json = JSON.stringify(responseObj);

                    res.end(json);

                    buildAndCallAPIContextSimplify(req, text);
                    return;
                }// end ENHANCE_DEFINITIONS

                //
                // ENHANCE_TOPICS path, so return reference data from semantic web
                //
                else if(enhanceContentMode === C.ENHANCE_TOPICS){

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("enhanceContentMode === " + enhanceContentMode);

                    // Make sure to mark proper nouns BEFORE POS tagging;
                    simplifiedText = markProperNounsAndCreateMap(simplifiedText, naturalLanguageUnderstanding['concepts'].results);
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() + " [apiContextualSimplify] markProperNounsAndCreateMap complete ");

                    if(isEmpty(properNounsMap)){ // We found no concepts, so we must return here.

                        // replace non-literals and transitions with Plain English alternatives
                        // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                        // reapply any CSS formatting. Fix #173
                        simplifiedText = reapplyCSSFormatting(simplifiedText);

                        var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                        var json = JSON.stringify(responseObj);
                        res.end(json);

                        buildAndCallAPIContextSimplify(req, text);

                        if(C.DEBUG_VERBOSE_LOGGING) console.log("Aborting SPARQL query as there are no pronouns.");

                        return;
                    }

                    var pageNames = [];
                    for(var noun in properNounsMap){
                        pageNames.push(properNounsMap[noun].dbPediaPageName);
                    }

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("############### PAGENAMES ############");
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(pageNames);

                    var queryPageNames = " ";
                    for (var i = 0; i < pageNames.length; i++) {
                        var currPage = pageNames[i];
                        queryPageNames += '<http://dbpedia.org/resource/'+currPage+'> ';
                    }
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("############### QUERYNAME ############");
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Query Semantic Web For:  "+queryPageNames);

                    // Create the query string for the sparql query from the properNounsMap
                    var query = [
                        "PREFIX owl: <http://www.w3.org/2002/07/owl#>",
                        "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
                        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>",
                        "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
                        "PREFIX foaf: <http://xmlns.com/foaf/0.1/>",
                        "PREFIX dc: <http://purl.org/dc/elements/1.1/>",
                        "PREFIX : <http://dbpedia.org/resource/>",
                        "PREFIX dbpedia2: <http://dbpedia.org/property/>",
                        "PREFIX dbpedia: <http://dbpedia.org/>",
                        "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>",
                        "SELECT ?label, ?thumbnail, ?comment",
                        "WHERE {",
                        "?dbpedia rdfs:label ?label .",
                        "?dbpedia dbo:thumbnail ?thumbnail .",
                        "?dbpedia rdfs:comment ?comment",
                        "VALUES ?dbpedia { "+queryPageNames+"} ",
                        'filter(langMatches(lang(?comment),"en") AND langMatches(lang(?label),"en"))',
                        "} "
                    ].join(" ");

                    var client = new SparqlClient(C.SPARQl_ENDPOINT);

                    client.query(query)

                        .execute(function(error, results) {

                            if(error !== undefined && error !== null || results === null){

                                if(C.DEBUG_VERBOSE_LOGGING) console.error("status: "+error.httpStatus);
                                if(error.httpStatus == 500){
                                    responseObj = { status: "error", code: 500, message : "Timeout getting the Enhanced Results." };
                                    json = JSON.stringify(responseObj);
                                    res.end(json);
                                    return;
                                }

                                if(results === null){
                                    console.error("SPARQL RETURNED NULL RESULTS");
                                }

                                // backfail to return with no concepts
                                if(C.DEBUG_VERBOSE_LOGGING) console.log("SPARQL QUERY FAILED : " +  error);
                                for(noun in properNounsMap){
                                    simplifiedText = replaceAll(simplifiedText, properNounsMap[noun].id, properNounsMap[noun].displayText);
                                }

                                // replace non-literals and transitions with Plain English alternatives
                                // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                                // reapply any CSS formatting. Fix #173
                                simplifiedText = reapplyCSSFormatting(simplifiedText);

                                simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                                var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                                var json = JSON.stringify(responseObj);
                                res.end(json);

                                buildAndCallAPIContextSimplify(req, text);
                                return;
                            }
                            else{

                                if(C.DEBUG_VERBOSE_LOGGING) console.log("###################### QUERY RESULTS ######################");
                                var queryMap = {};
                                var i = 0;
                                for(i =0; i < results.results.bindings.length; i++){
                                    var label = results.results.bindings[i].label.value.replace(/ /g,"_");
                                    queryMap[label] = results.results.bindings[i];
                                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Label : " + results.results.bindings[i].label.value);
                                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Thumbnail : " + results.results.bindings[i].thumbnail.value);
                                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Comment : " + results.results.bindings[i].comment.value);
                                }
                                if(C.DEBUG_VERBOSE_LOGGING) console.log("###################### QUERY MAP ######################");
                                //if(C.DEBUG_VERBOSE_LOGGING) console.log(queryMap);

                                // add references to proper noun
                                // format: noun {ref:<key:value>}
                                for(var noun in properNounsMap){

                                    var refs = '%~{"concept":"' + properNounsMap[noun].text + '",';
                                    for (var key in properNounsMap[noun]) {
                                        if (properNounsMap[noun].hasOwnProperty(key)) {
                                            //if(C.DEBUG_VERBOSE_LOGGING) console.log(properNounsMap[noun][key]);
                                            if(key == "relevance" || key == "website" || key == "geo" ){ // return data of interest
                                                refs += '"' + key + '"' + ':"' + properNounsMap[noun][key] + '",';
                                            }
                                        }
                                    }

                                    var dbPediaPageName = properNounsMap[noun]['dbPediaPageName'];
                                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Looking for dbPediaPageName = " + dbPediaPageName);
                                    if( queryMap[dbPediaPageName] !== undefined ){
                                        if(C.DEBUG_VERBOSE_LOGGING) console.log("FOUND!!");
                                        //if(C.DEBUG_VERBOSE_LOGGING) console.log(queryMap[dbPediaPageName]);
                                        var thumbnail = queryMap[dbPediaPageName].thumbnail.value.split("http:").join("https:");
                                        var comment = addslashes(queryMap[dbPediaPageName].comment.value);
                                        refs += '"thumbnail":' + '"' + thumbnail + '",';
                                        refs += '"comment":' + '"' + comment + '",';

                                        // add data we queried from semantic web
                                        refs = refs.substring(0, refs.length - 1);  // remove trailing comma
                                        refs += "}~%";

                                        simplifiedText = replaceAll(simplifiedText, properNounsMap[noun].id, properNounsMap[noun].displayText + refs);

                                    }
                                    else{
                                        if(C.DEBUG_VERBOSE_LOGGING) console.log("NOT FOUND!!");
                                        simplifiedText = replaceAll(simplifiedText, properNounsMap[noun].id, properNounsMap[noun].displayText);
                                    }

                                } // end properNounsMap for

                                // replace non-literals and transitions with Plain English alternatives
                                // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                                // reapply any CSS formatting. Fix #173
                                simplifiedText = reapplyCSSFormatting(simplifiedText);

                                simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                                var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                                var json = JSON.stringify(responseObj);
                                res.end(json);

                                buildAndCallAPIContextSimplify(req, text);
                                return;

                            } // end else NO query error case

                        }); // end client.query

                } // end ENHANCE_TOPICS

                //
                // ENHANCE_SYMBOLS path, so return AAC symbols
                //

                else if(enhanceContentMode === C.ENHANCE_SYMBOLS){

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("enhanceContentMode === " + enhanceContentMode);

                    /* #195
                     for(noun in properNounsMap){ // remove flagged proper nouns in this mode
                     simplifiedText = replaceAll(simplifiedText, properNounsMap[noun].id, properNounsMap[noun].displayText);
                     }
                     */

                    // Get the symbols
                    simplifiedText = mapWordsToAACSymbols(simplifiedText, wordsPOS);

                    if(isEmpty(currentSymbolsMap)){ // We found no images, so we must return here.

                        if(C.DEBUG_VERBOSE_LOGGING) console.log("currentSymbolsMap was EMPTY.");

                        // replace non-literals and transitions with Plain English alternatives
                        // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                        // reapply any CSS formatting. Fix #173
                        simplifiedText = reapplyCSSFormatting(simplifiedText);

                        var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                        var json = JSON.stringify(responseObj);
                        res.end(json);

                        buildAndCallAPIContextSimplify(req, text);
                        return;
                    }
                    // We found symbols!!
                    else{

                        if(C.DEBUG_VERBOSE_LOGGING) console.log("currentSymbolsMap has elements!");

                        if(C.DEBUG_VERBOSE_LOGGING) console.log(currentSymbolsMap);

                        // Begin fix for #226
                        for(var symbol in currentSymbolsMap){

                            var refs = '%~{"symbol":"' + symbol + '",';

                            var aac_ret = hasExactMatchAACSymbolsEntry(symbol);
                            for (var key in aac_ret) {
                                refs += '"' + key + '"' + ':"' + aac_ret[key] + '",';
                            }

                            // add data we queried from semantic web
                            refs = refs.substring(0, refs.length - 1);  // remove trailing comma
                            refs += "}~%";

                            // When replacing IDs, use replaceAll because there may be adjacent key strings
                            simplifiedText = replaceAll(simplifiedText, currentSymbolsMap[symbol], symbol + refs);

                        } // End fix for #226

                        // replace non-literals and transitions with Plain English alternatives
                        // #195 simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                        // reapply any CSS formatting. Fix #173
                        simplifiedText = reapplyCSSFormatting(simplifiedText);

                        simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                        var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                        var json = JSON.stringify(responseObj);

                        res.end(json);

                        buildAndCallAPIContextSimplify(req, text);
                        return;

                    } // End got symbols case
                } // end ENHANCE_SYMBOLS
            }); // end brillTagger
        }); // end stanfordSimpleNLP
    }); // end nlu.concepts
}

var apiContextualSimplify = function(req, res) {
    var text = req.body.data;
    return doContextualSimplify(text, req, res);
};

//
//API - Contextual Simplify
//
// e.g. curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://localhost:3000/api/V1/contextual-simplify
// curl -i -X POST -H 'Content-Type: application/json' -d '{"url":"https://www-03.ibm.com/press/us/en/pressrelease/49787.wss", "options":{}}' http://localhost:3000/api/V1/contextual-simplify-url

var apiContextualSimplifyURL = function(req, res) {
    return processURLAndCallAPI(doContextualSimplify, req, res);
};

//
//API - Condense
//
// e.g. curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://localhost:3000/api/V1/contextual-simplify
// curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://textsimplification.mybluemix.net/api/V1/condense

//called by the API's condense (for text) and condense-url
function doAPICondense(text, req, res){
    if(C.DEBUG_VERBOSE_LOGGING) console.log("[apiCondense1] : text = "+text);
    var originalText = text;
    text = text.replace(/"/g, '\\"');
    text = text.replace(/"/g, '\\"'); // not duplicate. purposeful two pass
    
    text = stripHTMLFormatting(text); // Fix #173

    if(C.DEBUG_VERBOSE_LOGGING) console.log("[apiCondense] : text = "+text);

    var condenseMode = setCondenseMode(req);

    res.writeHead(200, {"Content-Type": "application/json"});

    if(condenseMode == "extraction"){

        if(C.DEBUG_VERBOSE_LOGGING) console.log("Running Extraction Condense...");

        ClarifierExtractionCondense.summarize("", text, function(err, summary) {
            if(err || summary === undefined || summary === null || summary.length == 0){

                if(C.DEBUG_VERBOSE_LOGGING) console.log('Condense Operation Can not be performed.');

                var responseObj = { status: "OK",
                    usage: C.TERM_OF_USE_MESSAGE,
                    condensed: text,
                    original: originalText };

                var json = JSON.stringify(responseObj);

                res.end(json);
                return;
            }
            else{

                var contentLengthTxt = "Content Length: " + text.trim().length;
                var summaryLengthTxt = "Summary Length: " + summary.trim().length;

                var ratio = (100 - (100 * (summary.trim().length / (text.trim().length)))).toFixed(2);
                if(ratio < 0) ratio = 0.00;
                var summaryRatioTxt = "Summary Ratio: " + ratio;

                if(C.DEBUG_VERBOSE_LOGGING) console.log(contentLengthTxt);
                if(C.DEBUG_VERBOSE_LOGGING) console.log(summaryLengthTxt);
                if(C.DEBUG_VERBOSE_LOGGING) console.log(summaryRatioTxt);

                var comparision = "\n\n" + contentLengthTxt + "\n" + summaryLengthTxt + "\n" + summaryRatioTxt;

                var responseObj = { status: "OK",
                    usage: C.TERM_OF_USE_MESSAGE,
                    condensed: summary + comparision,
                    original: originalText };

                var json = JSON.stringify(responseObj);

                res.end(json);

                buildAndCallAPICondense(req, text);
                return;

            }

        });

    }
    else if(condenseMode == "abstraction"){

        if(C.DEBUG_VERBOSE_LOGGING) console.log("Running Abstraction Condense...");

        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {

            naturalLanguageUnderstanding['semantic_roles'] = {};
            if(response.body != null && response.body['semantic_roles'] != undefined){
                naturalLanguageUnderstanding['semantic_roles'] = { text:text, response:JSON.stringify(response,null,4), results:response.body['semantic_roles'] };
                if(C.DEBUG_VERBOSE_LOGGING) console.log(naturalLanguageUnderstanding['semantic_roles'].response);

            }
            // if no semantic roles are found, we can't condense any further so just return the input.
            if( naturalLanguageUnderstanding['semantic_roles'].results === undefined ||
                naturalLanguageUnderstanding['semantic_roles'].results.length == 0){

                if(C.DEBUG_VERBOSE_LOGGING) console.log('Condense Operation Can not be performed.');

                var responseObj = { status: "OK",
                    usage: C.TERM_OF_USE_MESSAGE,
                    condensed: text ,
                    original: originalText };

                var json = JSON.stringify(responseObj);

                res.end(json);

                return;

            }
            else{
                var summary = condense(naturalLanguageUnderstanding['semantic_roles'].results);
                if(summary.length == 0){
                    if(C.DEBUG_VERBOSE_LOGGING) console.log('Condense Operation Can not be performed.');

                    var responseObj = { status: "OK",
                        usage: C.TERM_OF_USE_MESSAGE,
                        condensed: text ,
                        original: originalText };

                    var json = JSON.stringify(responseObj);
                    res.end(json);
                    return;
                }


                var contentLengthTxt = "Content Length: " + text.trim().length;
                var summaryLengthTxt = "Summary Length: " + summary.trim().length;

                var ratio = (100 - (100 * (summary.trim().length / (text.trim().length)))).toFixed(2);
                if(ratio < 0) ratio = 0.00;
                var summaryRatioTxt = "Summary Ratio: " + ratio;

                if(C.DEBUG_VERBOSE_LOGGING) console.log(contentLengthTxt);
                if(C.DEBUG_VERBOSE_LOGGING) console.log(summaryLengthTxt);
                if(C.DEBUG_VERBOSE_LOGGING) console.log(summaryRatioTxt);

                var comparision = "\n\n" + contentLengthTxt + "\n" + summaryLengthTxt + "\n" + summaryRatioTxt;

                var responseObj = { status: "OK",
                    usage: C.TERM_OF_USE_MESSAGE,
                    condensed: summary + comparision ,
                    original: originalText };

                var json = JSON.stringify(responseObj);

                res.end(json);

                buildAndCallAPICondense(req, text);
                return;

            } // end else

        });

    }
    else{
        // bad option
        // WSTODO handle
    }

};

var apiCondense = function(req, res) {
    var text = req.body.data;
    return doAPICondense(text, req, res);
};

//
// API - Condense Chat
//
/* Sample curl invocation
 curl -i -X POST -H 'Content-Type: application/json' -d '{"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","data":[{"ParticipantName": "Scott Chapman", "Message": "it is interesting to go through the NLP info too. For example it found basically 4 \"sentences\"","MessageId": "58dd0fb0e4b0c5168c40aafd","TimeStamp": 1490882480581},{"ParticipantName": "Scott Chapman","Message": "like \"we change the admin doc\", \"we add some more words\", \"remind the end user to wait...\" etc","MessageId": "58dd0fede4b0c5168c40ab34","TimeStamp": 1490882541488},{"ParticipantName": "Jon Brunn","Message": "yeah, so to me there is an action embedded in there - and the decision on whether to carry out the action or not is just part of the fulfillment process in that action","MessageId": "58dd100de4b0c5168c40ab5a","TimeStamp": 1490882573736}], "options":{"classifierThreshold":0.85, "messageFormat":"short"}}' http://localhost:3000/api/V1/condense-conversation


 curl -i -X POST -H 'Content-Type: application/json' -d '{"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","data":[{"ParticipantName": "WILLIE SCOTT","Message": "Players on the batting team take turns hitting against the pitcher of the fielding team, which tries to prevent runs by getting hitters out in any of several ways. A player on the batting team who reaches a base safely can later attempt to advance to subsequent bases during teammates turns batting, such as on a hit or by other means. The teams switch between batting and fielding whenever the fielding team records three outs. One turn batting for both teams, beginning with the visiting team, constitutes an inning. A game is composed of nine innings, and the team with the greater number of runs at the end of the game wins. Baseball has no game clock, although almost all games end in the ninth inning.", "MessageId": "590247d7e4b0971151128f33","TimeStamp": 1493321687972}, {"ParticipantName": "Sushank Reddy Vadde","Message": "Baseball evolved from older bat-and-ball games already being played in England by the mid-18th century. This game was brought by immigrants to North America, where the modern version developed. By the late 19th century, baseball was widely recognized as the national sport of the United States. Baseball is currently popular in North America and parts of Central and South America, the Caribbean, and East Asia, particularly Japan.","MessageId": "590247dfe4b0971151128f3c","TimeStamp": 1493321695396}, {"ParticipantName": "Sushank Reddy Vadde","Message": "In the United States and Canada, professional Major League Baseball (MLB) teams are divided into the National League (NL) and American League (AL), each with three divisions: East, West, and Central. The major league champion is determined by playoffs that culminate in the World Series. The top level of play is similarly split in Japan between the Central and Pacific Leagues and in Cuba between the West League and East League.","MessageId": "590247e7e4b0971151128f42","TimeStamp": 1493321703289}, {"ParticipantName": "WILLIE SCOTT","Message": "The evolution of baseball from older bat-and-ball games is difficult to trace with precision. A French manuscript from 1344 contains an illustration of clerics playing a game, possibly la soule, with similarities to baseball.[1] Other old French games such as thèque, la balle au bâton, and la balle empoisonnée also appear to be related.[2] Consensus once held that todays baseball is a North American development from the older game rounders, popular in Great Britain and Ireland. Baseball Before We Knew It: A Search for the Roots of the Game (2005), by David Block, suggests that the game originated in England; recently uncovered historical evidence supports this position. ", "MessageId": "590247e9e4b0971151128f44","TimeStamp": 1493321705709}], "options":{"classifierThreshold":0.85, "messageFormat":"long"}}' http://localhost:3000/api/V1/condense-conversation

 */

var apiCondenseWatsonWorkspaceChat = function(req, res) {

    var summary;
    var messages = req.body.data;

    //console.log("apiCondenseWatsonWorkspaceChat - Messages:");
    // console.log(messages);

    if(messages === undefined || messages === null || messages == []){
        console.error("The messages JSON array was not defined.");
        res.writeHead(200, {"Content-Type": "application/json"});
        var responseObj = { status: "error", code: 500, message : "The messages JSON array was not defined." };
        var json = JSON.stringify(responseObj);
        res.end(json);
        return;
    }

    /* Example Expected Input Messages JSON array format:
     [
     {
     "ParticipantName": "Scott Chapman",
     "Message": "it is interesting to go through the NLP info too. For example it found basically 4 \"sentences\"",
     "MessageId": "58dd0fb0e4b0c5168c40aafd",
     "TimeStamp": 1490882480581
     },
     {
     "ParticipantName": "Scott Chapman",
     "Message": "like \"we change the admin doc\", \"we add some more words\", \"remind the end user to wait...\" etc",
     "MessageId": "58dd0fede4b0c5168c40ab34",
     "TimeStamp": 1490882541488
     },
     {
     "ParticipantName": "Jon Brunn",
     "Message": "yeah, so to me there is an action embedded in there - and the decision on whether to carry out the action or not is just part of the fulfillment process in that action",
     "MessageId": "58dd100de4b0c5168c40ab5a",
     "TimeStamp": 1490882573736
     }
     ]
     */

    var classifierThreshold = C.STATISTICAL_CLASSIFY_DEFAULT_THRESHOLD;
    if(req.body.options !== undefined && req.body.options !== null){
        try{
            var reqOptions = JSON.parse(req.body.options);
            if(reqOptions.classifierThreshold !== undefined && reqOptions.classifierThreshold !== null){
                classifierThreshold = reqOptions.classifierThreshold;
            }
        }
        catch(e){
            classifierThreshold = req.body.options.classifierThreshold;
        }
    }

    //console.log(" ");
    //console.log("classifierThreshold = " +classifierThreshold);

    var messageFormat = C.DEFAULT_MESSAGE_FORMAT;
    if(req.body.options !== undefined && req.body.options !== null){
        try{
            var reqOptions = JSON.parse(req.body.options);
            if(reqOptions.messageFormat !== undefined && reqOptions.messageFormat !== null){
                messageFormat = reqOptions.messageFormat;
            }
        }
        catch(e){
            messageFormat = req.body.options.messageFormat;
        }
    }

    //console.log(" ");
    // console.log("messageFormat = " +messageFormat);


    try{
        summary = ClarifierChatCondense.getConversationSummary(messages, classifierThreshold, messageFormat, domainKeywordsArr, questionArr, throttleParticipantsMap, stopWordsArr, domainStopWordsArr);
    }
    catch(e){
        console.error("ClarifierChatCondense module threw an exception.");
        res.writeHead(200, {"Content-Type": "application/json"});
        var responseObj = { status: "error", code: 500, message : "Content Clarifier Conversation Condense observed an internal server error." };
        var json = JSON.stringify(responseObj);
        res.end(json);
        return;
    }

    // Last element holds the stats
    if(summary[summary.length-1].CC_SummaryCharCnt == 0 ||
        (summary[summary.length-1].CC_SummaryCharCnt == summary[summary.length-1].ConvoCharCnt))
    { // Handle case where not enough data to summarize.
        console.error("ClarifierChatCondense did not have enough data to process for a summary.");
        res.writeHead(200, {"Content-Type": "application/json"});
        var responseObj = { status: "no content", code: 204, message : "Content Clarifier Conversation Condense was not able to summarize the content. This usually occurs for a few reasons: (1) An incorrect messageFormat {email,chat} was supplied to the API. (2) There was not enough input content provided to generate a summary. (3) Most aspects of the input content are uniform in nature, and as such, the classification algorithm was unable to distinguish non-essential aspects to prune." };
        var json = JSON.stringify(responseObj);
        res.end(json);
        return;
    }

    res.writeHead(200, {"Content-Type": "application/json"});

    var responseObj = { status: "OK",
        usage: C.TERM_OF_USE_MESSAGE,
        condensed: summary };

    var json = JSON.stringify(responseObj);

    res.end(json);
    
    /*meterAPICalls(C.API_CONDENSE_WW_CHAT,
        JSON.stringify(req.body.options),
        messages.length,
        req.body.id,
        req.body.apikey);
        */

    callMeterAPICalls(C.API_CONDENSE_WW_CHAT, req, messages);
  
    return;

};



//
//API - Contextual Simplify
//
// curl -i -X POST -H 'Content-Type: application/json' -d '{"url":"https://www-03.ibm.com/press/us/en/pressrelease/49787.wss", "options":{}}' http://localhost:3000/aapi-condense-url

var apiCondenseURL = function(req, res) {
    return processURLAndCallAPI(doAPICondense, req, res);
};

//
//API - Contextual Simplify
//
// e.g. curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://localhost:3000/api/V1/contextual-simplify
// curl -i -X POST -H 'Content-Type: application/json' -d '{"data":"Some text!", "options":{}}' http://textsimplification.mybluemix.net/api/V1/condense-simplify

//called by the API's condense-simplify (for text) and condense-simplify-url
function doAPICondenseAndSimplify(text, req, res){
    var originalText= text;
    var outputMode = getOutputMode(req);
    var calculateReadingLevels = getCalculateReadingLevels(req);
    var condenseMode = setCondenseMode(req);

    text = text.replace(/"/g, '\\"');
    text = text.replace(/"/g, '\\"'); // not duplicate. purposeful two pass
       
    text = stripHTMLFormatting(text); // Fix #173

    if(C.DEBUG_VERBOSE_LOGGING) console.log("[apiCondenseAndSimplify] : text = "+text);


    if(condenseMode == "extraction"){
        if(C.DEBUG_VERBOSE_LOGGING) console.log("Running Extraction Condense...");

        ClarifierExtractionCondense.summarize("", text, function(err, summary) {

            if(err || summary === undefined || summary === null || summary.length == 0){

                if(C.DEBUG_VERBOSE_LOGGING) console.log('Condense Operation Can not be performed, just attempt to simplify the input.');

                summary = text;
            }

            if(C.DEBUG_VERBOSE_LOGGING) console.log("summary = " + summary);

            // mark non-literals and transitions
            summary = markNonLiteralsAndTransitions(summary);

            res.writeHead(200, {"Content-Type": "application/json"});

            var parameters = {"features": {"semantic_roles": {}}};
            naturalLanguageUnderstanding.doRequest("text", summary, parameters, function(response) {
                naturalLanguageUnderstanding['semantic_roles'] = {};
                if(response.body != null && response.body['semantic_roles'] != undefined){
                    naturalLanguageUnderstanding['semantic_roles'] = { text:text, response:JSON.stringify(response,null,4), results:response.body['semantic_roles'] };
                    if(C.DEBUG_VERBOSE_LOGGING) console.log(naturalLanguageUnderstanding['semantic_roles'].response);
                }
                // if no semantic roles are found, we can't do contextual simplification
                if(naturalLanguageUnderstanding['semantic_roles'].results === undefined ||
                    naturalLanguageUnderstanding['semantic_roles'].results.length == 0){

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Condense And Simplify (Lexical)");

                    var simplifiedText = lexicalSimplify(summary);

                    // replace the non-literals and transitions
                    simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                    simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                    // v2.17 (Study)
                   /* var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                    var json = JSON.stringify(responseObj);

                    res.end(json);

                    buildAndCallAPICondenseAndSimplify(req, text);
                    
                    */
                    
                    var responseObj;

                    if(calculateReadingLevels == C.RETURN_READING_LEVELS){
                        responseObj = { status: "OK",
                            usage: C.TERM_OF_USE_MESSAGE,
                            condensed: simplifiedText,
                            original:originalText,
                            fleschKincaidInput: calculateFleschKincaid(text),
                            fleschKincaidOutput: calculateFleschKincaid(formatStringOutput(simplifiedText,2)),
                            colemanLiauInput: calculateColemanLiau(text),
                            colemanLiauOutput: calculateColemanLiau(formatStringOutput(simplifiedText,2)),
                            ariInput: calculateAutomatedReadabilityIndex(text),
                            ariOutput: calculateAutomatedReadabilityIndex(formatStringOutput(simplifiedText,2)),
                        };
                    } else {
                        responseObj = { status: "OK",
                            usage: C.TERM_OF_USE_MESSAGE,
                            condensed: simplifiedText,
                            original:originalText };
                    }

                    var json = JSON.stringify(responseObj);

                    res.end(json);

                    buildAndCallAPICondenseAndSimplify(req, text);

                    // END v2.17 (Study)                   
                    
                    return;
                }
                else{ // we've got a summary and semantic roles

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("Condense And Simplify (Contextual)");

                    stanfordSimpleNLP.process(summary, function(err, result) {

                        var brillTagger = new Tagger(lexicon_file, rules_file, default_category, function(bError) {

                            var wordsPOS = [];
                            var brillSentence = [];
                            var numTaggedSentences = result.document.sentences.sentence.length;
                            for(var i = 0; i<numTaggedSentences; i++){
                                var entry = result.document.sentences.sentence[i].tokens.token;
                                for(var j=0; j<entry.length; j++){
                                    var POS = entry[j].POS;
                                    if(entry[j].word[0] == '@'){ // check for marked proper noun
                                        POS = "NNP";
                                    }
                                    wordsPOS.push(entry[j].word + "_" + POS);
                                    brillSentence.push(entry[j].word);
                                }
                            }

                            if(!bError) wordsPOS = reconcilePOS(brillTagger, brillSentence, wordsPOS);

                            if(C.DEBUG_VERBOSE_LOGGING) console.log(wordsPOS);

                            var simplifiedText = "";

                            // 2. Simplify it
                            if(wordsPOS.length == 0) { // We can't get parts of speech. Take best guess for simplification

                                simplifiedText = lexicalSimplify(text);
                            } else {
                                simplifiedText = contextualLexicalSimplify(wordsPOS, 0);
                            }
                            if(simplifiedText === null){
                                simplifiedText = summary;
                            }
                            // replace the non-literals and transitions
                            simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                            simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                            // v2.17 (Study)
                            /* var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                            var json = JSON.stringify(responseObj);

                            res.end(json);

                            buildAndCallAPIContextSimplify(req, text);
                            */
                            
                           var responseObj;

                            if(calculateReadingLevels == C.RETURN_READING_LEVELS){
                                responseObj = { status: "OK",
                                    usage: C.TERM_OF_USE_MESSAGE,
                                    condensed: simplifiedText,
                                    original:originalText,
                                    fleschKincaidInput: calculateFleschKincaid(text),
                                    fleschKincaidOutput: calculateFleschKincaid(formatStringOutput(simplifiedText,2)),
                                    colemanLiauInput: calculateColemanLiau(text),
                                    colemanLiauOutput: calculateColemanLiau(formatStringOutput(simplifiedText,2)),
                                    ariInput: calculateAutomatedReadabilityIndex(text),
                                    ariOutput: calculateAutomatedReadabilityIndex(formatStringOutput(simplifiedText,2)),
                                };
                            } else {
                                responseObj = { status: "OK",
                                    usage: C.TERM_OF_USE_MESSAGE,
                                    condensed: simplifiedText,
                                    original:originalText };
                            }

                            var json = JSON.stringify(responseObj);

                            res.end(json);

                            buildAndCallAPICondenseAndSimplify(req, text);
                            
                            // END v2.17 (Study)
                            return;

                        }); // end brillTagger
                    });   // end stanfordSimpleNLP
                }
            }); // end  nlu.semantic_roles
        });  // end ClarifierExtractionCondense.summarize


    } // end condenseMode == "extraction"
    else if(condenseMode == "abstraction"){

        res.writeHead(200, {"Content-Type": "application/json"});

        var parameters = {"features": {"semantic_roles": {}}};
        naturalLanguageUnderstanding.doRequest("text", text, parameters, function(response) {
            naturalLanguageUnderstanding['semantic_roles'] = {};
            if(response.body != null && response.body['semantic_roles'] != undefined){
                naturalLanguageUnderstanding['semantic_roles'] = { text:text, response:JSON.stringify(response,null,4), results:response.body['semantic_roles'] };
                if(C.DEBUG_VERBOSE_LOGGING) console.log(naturalLanguageUnderstanding['semantic_roles'].response);
            }

            // if no semantic roles are found, we can't condense any further, but we can do lexical simplification on the input.
            if(naturalLanguageUnderstanding['semantic_roles'].results.length == 0){

                // var simplifiedText = "SIMPLIFIED! " + text;
                if(C.DEBUG_VERBOSE_LOGGING) console.log("Running Condense and Simplify (Lexical)...");
                var start = new Date().getTime();

                // mark non-literals and transitions
                text = markNonLiteralsAndTransitions(text);

                var simplifiedText = lexicalSimplify(text);
                var end = new Date().getTime();
                var time = end - start;
                if(C.DEBUG_VERBOSE_LOGGING) console.log('Condense And Simplify Completed in: ' + time + 'ms.');

                // replace the non-literals and transitions
                simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                var responseObj = checkCalculateReadingLevelsReturnResponseObj(calculateReadingLevels, simplifiedText, originalText);
                var json = JSON.stringify(responseObj);
                res.end(json);

                buildAndCallAPICondenseAndSimplify(req, text);
                return;

            } else { // we've got semantic roles
                // 1. Condense the text first
                var summary = condense(naturalLanguageUnderstanding['semantic_roles'].results);

                // mark non-literals and transitions
                summary = markNonLiteralsAndTransitions(summary);

                stanfordSimpleNLP.process(summary, function(err, result) {

                    var brillTagger = new Tagger(lexicon_file, rules_file, default_category, function(bError) {

                        var wordsPOS = [];
                        var brillSentence = [];
                        var numTaggedSentences = result.document.sentences.sentence.length;
                        for(var i = 0; i<numTaggedSentences; i++){
                            var entry = result.document.sentences.sentence[i].tokens.token;
                            for(var j=0; j<entry.length; j++){
                                var POS = entry[j].POS;
                                if(entry[j].word[0] == '@'){ // check for marked proper noun
                                    POS = "NNP";
                                }
                                wordsPOS.push(entry[j].word + "_" + POS);
                                brillSentence.push(entry[j].word);
                            }
                        }

                        if(!bError) wordsPOS = reconcilePOS(brillTagger, brillSentence, wordsPOS);

                        if(C.DEBUG_VERBOSE_LOGGING) console.log(wordsPOS);

                        var simplifiedText = "";

                        // 2. Simplify it
                        if(wordsPOS.length == 0) { // We can't get parts of speech. Take best guess for simplification

                            simplifiedText = lexicalSimplify(text);
                        } else {
                            simplifiedText = contextualLexicalSimplify(wordsPOS, 0);
                        }

                        if(simplifiedText === null){
                            simplifiedText = summary;
                        }

                        // replace the non-literals and transitions
                        simplifiedText = replaceNonLiteralsAndTransitions(simplifiedText);

                        simplifiedText = formatStringOutput(simplifiedText, outputMode); // apply the output mode

                        var responseObj;

                        if(calculateReadingLevels == C.RETURN_READING_LEVELS){
                            responseObj = { status: "OK",
                                usage: C.TERM_OF_USE_MESSAGE,
                                condensed: simplifiedText,
                                original:originalText,
                                fleschKincaidInput: calculateFleschKincaid(text),
                                fleschKincaidOutput: calculateFleschKincaid(formatStringOutput(simplifiedText,2)),
                                colemanLiauInput: calculateColemanLiau(text),
                                colemanLiauOutput: calculateColemanLiau(formatStringOutput(simplifiedText,2)),
                                ariInput: calculateAutomatedReadabilityIndex(text),
                                ariOutput: calculateAutomatedReadabilityIndex(formatStringOutput(simplifiedText,2)),
                            };
                        } else {
                            responseObj = { status: "OK",
                                usage: C.TERM_OF_USE_MESSAGE,
                                condensed: simplifiedText,
                                original:originalText };
                        }

                        var json = JSON.stringify(responseObj);

                        res.end(json);

                        buildAndCallAPICondenseAndSimplify(req, text);
                        return;

                    }); // end brillTagger
                });   // end stanfordSimpleNLP
            }
        });

    } // end condenseMode == "abstraction"

}
var apiCondenseAndSimplify = function(req, res) {
    var text = req.body.data;
    return doAPICondenseAndSimplify(text, req, res);
};


//
//API - Contextual Simplify
//
// curl -i -X POST -H 'Content-Type: application/json' -d '{"url":"https://www-03.ibm.com/press/us/en/pressrelease/49787.wss", "options":{}}' http://localhost:3000/api/V1/condense-simplify-url

var apiCondenseAndSimplifyURL = function(req, res) {
    return processURLAndCallAPI(doAPICondenseAndSimplify, req, res);
};

//
//API - Simplify
//
// e.g. curl -i -X POST -H 'Content-Type: application/json' -d '{"text": "Some text!"}' http://localhost:3000/api-simplify
// curl -i -X POST -H 'Content-Type: application/json' -d '{"data":[{"txt1":"def1"},{"txtN":"defN"}]}' http://localhost:3000/api-train
var apiTrain = function(req, res) {

    var trainingPairs = req.body.data;

    if(C.DEBUG_VERBOSE_LOGGING) console.log(trainingPairs);

    res.writeHead(200, {"Content-Type": "application/json"});

    // var simplifiedText = "SIMPLIFIED! " + text;
    if(C.DEBUG_VERBOSE_LOGGING) console.log("Running Train Operation...");
    var start = new Date().getTime();
    var resp = trainBayesianNetwork(trainingPairs);
    var end = new Date().getTime();
    var time = end - start;
    if(C.DEBUG_VERBOSE_LOGGING) console.log('Train Operated Completed in: ' + time + 'ms.');

    var responseObj = { status: "OK",
        usage: C.TERM_OF_USE_MESSAGE,
        response: resp };

    var json = JSON.stringify(responseObj);

    res.end(json);

    return;

};


var trainBayesianNetwork = function(trainingPairs) {

    if(C.DEBUG_VERBOSE_LOGGING) console.log("Calling trainBayesianNetwork");

    var i = 0;
    for (i in trainingPairs){
        for (key in trainingPairs[i]){
            var val = trainingPairs[i][key];
            // if(C.DEBUG_VERBOSE_LOGGING) console.log( key + ": " + val);
            classifier.addDocument(key, val);
        }
    }
    classifier.train();

    //if(C.DEBUG_VERBOSE_LOGGING) console.log(classifier.classify('abscission'));
    //if(C.DEBUG_VERBOSE_LOGGING) console.log(classifier.classify('baseball'));

    if(C.DEBUG_VERBOSE_LOGGING) console.log(classifier.getClassifications('abscission'));
    if(C.DEBUG_VERBOSE_LOGGING) console.log(classifier.getClassifications('baseball'));

    return '{"status":"OK"}';

};

// ------------------ Natural Language Processing ------------------------


var lexicalSimplify = function(text) {

    if(C.DEBUG_VERBOSE_LOGGING) console.log("lexicalSimplify");

    var output = "";

    //words = text.split(" ");
    words = text.split(/[\s\n\r]+/); // must split on spaces or carriage returns

    var simplifiedArr = [];

    for (var i = 0; i < words.length; i++) {

        var currWord        = words[i];
        var simple          = "";
        var leadingPunctuation  = ""; // Punctuation corresponding to each word
        var trailingPunctuation = ""; // Punctuation corresponding to each word
        var specialChars       = []; // [0] leading punctuation, [1] trailing punctuation

        if(currWord !== "" && currWord !== '') { // if not an empty string
            var patt=C.CLEAN_WORD_REGEX;
            var lIndex = -1;
            while (match=patt.exec(currWord)) {
                lIndex = patt.lastIndex;
                if(C.DEBUG_VERBOSE_LOGGING) console.log(match.index + ' ' + patt.lastIndex);
                specialChars.push(currWord.substring(match.index, patt.lastIndex));
            }

            if(specialChars.length > 0){ // punctuation was found
                if(specialChars.length == 1 && lIndex == currWord.length){ // just trailing punctuation
                    trailingPunctuation = specialChars[0];
                    currWord = currWord.replace(trailingPunctuation, '');
                } else if(specialChars.length == 1 && lIndex != currWord.length){ // just leading punctuation
                    leadingPunctuation = specialChars[0];
                    currWord = currWord.replace(leadingPunctuation, '');
                } else if(specialChars.length == 2){ // both leading and trailing punctuation
                    leadingPunctuation = specialChars[0];
                    trailingPunctuation = specialChars[1];
                    currWord = currWord.replace(leadingPunctuation, '');
                    currWord = currWord.replace(trailingPunctuation, '');
                }
            }

            simple = currWord;

            var confidenceLevels = "";

            if( hasIgnoreListEntry(currWord) === undefined ){ // word isn't in the ignore list

                var X = getSimple(currWord,null,0);

                if(X !== null && X.length !== 0 && X !== undefined){
                    simple = "|_" + simple + "_|" + "|^" + X[X.length-1].alternative + "^|";

                    confidenceLevels = "%#[";
                    for(var k=0; k<X.length; k++){
                        confidenceLevels += '{"lexicon":' + '"' +  X[k].alternative + '",';
                        confidenceLevels += '"confidence":' + '"' +  X[k].confidence + '"},';
                    }
                    confidenceLevels = confidenceLevels.substring(0, confidenceLevels.length - 1);  // remove trailing comma
                    confidenceLevels += "]#%";
                }

            }
            // add back any punctuation that was removed and add confidence levels
            simplifiedArr.push(leadingPunctuation + simple + confidenceLevels + trailingPunctuation);
        }
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log(simplifiedArr);

    output = simplifiedArr.slice(0, simplifiedArr.length).join(' ');
    //simplifiedArr.slice(-1);

    return output;
};


var contextualLexicalSimplify = function(wordsPOS, enhanceContentMode) {

    if(C.DEBUG_VERBOSE_LOGGING) console.log("contextualLexicalSimplify");

    var X = null;
    var outStr = "";
    var simplifiedArr = [];
    var indexOfLastTrailingPunctuation = -1;

    for (var i = 0; i < wordsPOS.length; i++) {

        if(i == indexOfLastTrailingPunctuation) continue;

        var currWord        = wordsPOS[i].split('_')[0]; // wordPOS[i] form word_POS
        var POS             = wordsPOS[i].split('_')[1];

        if(wordsPOS[i]== '\'\'_\'\'') currWord = '"';
        if(currWord == '``') currWord = '"';
        if(currWord == '-LRB-') currWord = '(';
        if(currWord == '-RRB-') currWord = ')';
        if(currWord == '-LSB-') currWord = '[';
        if(currWord == '-RSB-') currWord = ']';

        //if(POS.length == 1) continue; // must be punctuations, so got to next one

        if(hasPOSMapEntry(POS) === undefined){
            wordsPOS[i] = currWord + "_.";
        }

        var simple          = "";
        var leadingPunctuation  = ""; // Punctuation corresponding to each word
        var trailingPunctuation = ""; // Punctuation corresponding to each word

        /*if(i >= 1){ // check the n-1 element for leading punctuation, if n >= 1
         if(wordsPOS[i-1].split('_')[1].length == 1 && (i-1) > indexOfLastTrailingPunctuation){
         leadingPunctuation = wordsPOS[i-1].split('_')[0];
         }
         }*/

        if( i+1 < wordsPOS.length){ // check the n+1 element for trailing punctuaction, if n+1 < array.length
            if(wordsPOS[i+1].split('_')[1].length == 1 ){
                trailingPunctuation = wordsPOS[i+1].split('_')[0];
                indexOfLastTrailingPunctuation = i+1;
            }
        }

        simple = currWord;

        var confidenceLevels = "";

        var operationalRule = hasOperationalRulesEntry(currWord);

        // If we need to enforce operational rules (which we DON'T do for definitions!)
        if(operationalRule !== undefined &&
           enhanceContentMode !== C.ENHANCE_DEFINITIONS){
            
            if(C.DEBUG_VERBOSE_LOGGING) console.log(operationalRule);

            // assign maximum confidence to enforced operationalized rule
            var confidence = (Math.random() * (C.OPERATIONALIZED_RULE_MAX - C.OPERATIONALIZED_RULE_MIN)
            + C.OPERATIONALIZED_RULE_MIN).toFixed(15);
            var synonym = {
                "Rank" : -1,
                "type" : "",
                "syllables" : -1,
                "alternative": operationalRule,
                "confidence" : confidence
            };

            simple = "|_" + simple + "_|" + "|^" + synonym.alternative + "^|";

            confidenceLevels = "%#[";
            confidenceLevels += '{"lexicon":' + '"' + synonym.alternative + '",';
            confidenceLevels += '"confidence":' + '"' +  synonym.confidence + '"}';
            confidenceLevels += "]#%";

        }
        // if word isn't in the ignore list, and we could determine the part of speech
        else if( hasIgnoreListEntry(currWord) === undefined && POS != "DNU"){

            X = getSimple(currWord, POS, enhanceContentMode);

            if(C.DEBUG_VERBOSE_LOGGING) console.log("X ====");
            if(C.DEBUG_VERBOSE_LOGGING) console.log(X);

            if(X !== null && X.length !== 0 && X !== undefined){
                simple = "|_" + simple + "_|" + "|^" + X[X.length-1].alternative + "^|";

                confidenceLevels = "%#[";
                for(var k=0; k<X.length; k++){
                    confidenceLevels += '{"lexicon":' + '"' +  X[k].alternative + '",';
                    confidenceLevels += '"confidence":' + '"' +  X[k].confidence + '"},';
                }
                confidenceLevels = confidenceLevels.substring(0, confidenceLevels.length - 1);  // remove trailing comma
                confidenceLevels += "]#%";
            }

        }
        // add back any punctuation that was removed and add confidence levels
        var simpleEntry = leadingPunctuation + simple + confidenceLevels + trailingPunctuation;
        if(C.DEBUG_VERBOSE_LOGGING) console.log("simpleEntry =" + simpleEntry);

        simplifiedArr.push(simpleEntry);

    } // end for

    if(C.DEBUG_VERBOSE_LOGGING) console.log(simplifiedArr);

    output = simplifiedArr.slice(0, simplifiedArr.length).join(' ');

    output = replaceAll(output, " '", "'"); // hande spaces added in words with apostrophes like "I 'm"

    return output;
};


var condense = function(semantic_roles){

    if(C.DEBUG_VERBOSE_LOGGING) console.log("condense");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(semantic_roles);

    var M = getSubjectActionObjectRelationMap(semantic_roles);

    var output = "";
    var firstSentence = null;

    for(sentence in M){

        // First sentence is very important in summarization. Always keep that one!
        if(firstSentence == null){
            output = sentence + " ";
            firstSentence = sentence;
        }
        if(sentence === firstSentence) continue;

        var plainTextSubject = M[sentence].subjects[0].trim();
        var plaintTextAction = M[sentence].actions[0].trim();
        var plaintTextObject = M[sentence].objects[0].trim();

        //
        // operationalized rules
        //

        /*1*/
        if(plaintTextAction == "be") plaintTextAction = "can be";

        if(plaintTextAction.substring(0, 3) == "to "){
            var rule = plaintTextAction.replace("to ", "can ");
            plaintTextAction = rule;
        }


        /*2*/
        if(plainTextSubject ){

            if(plainTextSubject.substring(0, 3) == "an "){
                if(plaintTextAction == "have"){ // bad snippet, inproper grammar so skip
                    continue;
                }
            }

            var currSub = plainTextSubject.split(' ');
            if( currSub[0].toLowerCase() == "many" ||
                currSub[0].toLowerCase() == "numerous" ||
                currSub[0].toLowerCase() == "countless" ||
                currSub[0].toLowerCase() == "few" ||
                currSub[0].toLowerCase() == "several"){
                currSub[0] = "There are " + currSub[0].toLowerCase();
                plainTextSubject = currSub.join(' ');
            }

        }

        //
        // Handle boundary conditions
        //

        if(plainTextSubject){
            if(plaintTextAction){
                if(plaintTextObject){
                    var snippetWords = plainTextSubject.split(' ').length +
                        plaintTextAction.split(' ').length +
                        plaintTextObject.split(' ').length;

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("snippet = " + plainTextSubject + " " +plaintTextAction + " " +plaintTextObject);

                    if(C.DEBUG_VERBOSE_LOGGING) console.log("snippetWords =  " + snippetWords);

                    if(snippetWords <= 3 ){ // bad snippet, so skip
                        continue;
                    }
                    // only 4 words in this snippet, and 1 is the object
                    else if(snippetWords <= 4 && plaintTextObject.split(' ').length <= 1)
                    {
                        // Check if we have another snippet option, see if that works
                        // a. if same subject in both positions
                        if(M[sentence].subjects[1] && (M[sentence].subjects[1] == M[sentence].subjects[0]) )
                        {
                            //b. if longer object in second position
                            if(M[sentence].objects[1] && M[sentence].objects[1].split(' ').length > 1)
                            {
                                plaintTextObject = M[sentence].objects[1];
                            }
                            else{
                                continue;
                            }
                        }
                        else{
                            continue;
                        }
                    }
                    else if(snippetWords <= 4){ //only 4 words in this snippet, so keep original
                        output += sentence + " ";
                        continue;
                    }
                } else { // no object
                    continue;
                }
            } else { // no action
                continue;
            }
        } else { // no subject
            continue;
        }


        // remove punctuation at end of subphrase
        if(!hasAlphaNumericLastChar(plainTextSubject))
            plainTextSubject = plainTextSubject.substring(0, plainTextSubject.length - 1);
        if(!hasAlphaNumericLastChar(plaintTextAction))
            plaintTextAction = plaintTextAction.substring(0, plaintTextAction.length - 1);

        if(!hasAlphaNumericLastChar(plaintTextObject)){

            var punctuation = plaintTextObject[plaintTextObject.length-1];
            if(punctuation != ')' && punctuation != '"' && punctuation != "'")
                plaintTextObject = plaintTextObject.substring(0, plaintTextObject.length - 1);
        }

        output += (plainTextSubject.length > 0) ? plainTextSubject.capitalize() : "";
        output += (plaintTextAction.length > 0) ? " " + plaintTextAction : "";
        output += (plaintTextObject.length > 0) ? " " + plaintTextObject + ". " : ". ";

    } // end for

    if(C.DEBUG_VERBOSE_LOGGING) console.log(output);

    return output;
}


function getLemmas(semantic_roles){

    var currLemmas = {};

    var j = 0;
    for(j = 0; j < semantic_roles.results.length; j++){
        var semantic_role = semantic_roles.results[j];
        if(semantic_role.action && semantic_role.action.lemmatized !== null && semantic_role.action.lemmatized !== undefined){
            currLemmas[semantic_role.action.text] = semantic_role.action.lemmatized;
        }
    }

    return currLemmas;
}


var markProperNounsAndCreateMap = function(text, concepts){

    if(C.DEBUG_VERBOSE_LOGGING)console.log("markProperNounsAndCreateMap");

    //if(C.DEBUG_VERBOSE_LOGGING) console.log(concepts);

    properNounsMap = {};

    var output = text;

    // Handle case where no concepts are identified.
    if(concepts === null || concepts === undefined || concepts.length == 0){
        if(C.DEBUG_VERBOSE_LOGGING)console.log("markProperNounsAndCreateMap - No concepts observed.");
        return  output;   
    }
    
    var i=0;

    if(C.DEBUG_VERBOSE_LOGGING) console.log(concepts);
    var n = 0;
    for(i = 0; i < concepts.length; i++){

        // only keep concept if this concept was found in the text (the NLU conecepts also has propery tect as alchemy api did
        // the makes the sparql query much faster down the line
        var idx = text.toLowerCase().indexOf(concepts[i].text.toLowerCase());
        if (idx !== -1) {

            properNounsMap[n] = concepts[i];
            properNounsMap[n].id = makeid();
            if (concepts[i].hasOwnProperty("website")){  //NLU api does not have the property 'website', alchemyapi had this property (as optional)
                properNounsMap[n].website = concepts[i].website;
            }
            if (concepts[i].hasOwnProperty("dbpedia")){  //alchemyapi has property 'dbpedia', for nlu api this same property is called 'dbpedia_resource'
                properNounsMap[n].dbPediaPageName = concepts[i].dbpedia.split("/")[4];
            } else if (concepts[i].hasOwnProperty("dbpedia_resource")){
                properNounsMap[n].dbPediaPageName = concepts[i].dbpedia_resource.split("/")[4];
            }
            // replace all proper nouns with generated ID

            // make sure case of properNounsMap[i].displayText (coming from concept[i].text) has same case as in original text
            // We search for the first occurrence of the concept in the text, and make case decision based on this
            // Possible BUG. If case changes in the text due to same concept

            if(text[idx] === text[idx].toUpperCase() ){ // if this concept is capitalized in text
                properNounsMap[n].displayText = properNounsMap[n].text.capitalize();
            }
            else{
                properNounsMap[n].displayText = properNounsMap[n].text.toLowerCase();
            }


            if(C.DEBUG_VERBOSE_LOGGING) console.log(properNounsMap[n].displayText);
            output = replaceAll(output, properNounsMap[n].displayText, properNounsMap[n].id);

            n++;

        }// end if idx

    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log("################## PROPER NOUNS MAP ####################");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(properNounsMap);

    return output;
};


var markHTMLFormattingAndCreateMap = function(text){ // Fix #173

    if(C.DEBUG_VERBOSE_LOGGING)console.log("markHTMLFormattingAndCreateMap");

    htmlFormattingMap = {};

    var output = text;

    // #223 var htmlTagRegex = new RegExp(/(<([^>]+)>)/ig);   
    // Parsing HTML is tough. Regex from here: https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags
    // Fix #232 - expand regex to cover the special html codes
    // var htmlTagRegex = new RegExp(/(<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>)/ig); 
    var htmlTagRegex = new RegExp(/(<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>|&ldquo;|&rdquo;|&rsquo;)/ig);

    var matches = output.match(htmlTagRegex);
    if (matches && matches.length) {
        // Create a placeholder for each match
        for(var i=0; i<matches.length; i++){

            var tag = matches[i];
            var entry = {
                formatting: tag,
                id: makeid()
            };

            if(htmlFormattingMap[tag] === undefined){ // we didn't process this tag already
                htmlFormattingMap[tag] = entry;
                // #223 Use replaceAll to replace html tags     
                output = replaceAll(output, htmlFormattingMap[tag].formatting, htmlFormattingMap[tag].id);
            }
        }
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log("################## CSS FORMATTING MAP ####################");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(htmlFormattingMap);

    if(C.DEBUG_VERBOSE_LOGGING) console.log("markHTMLFormattingAndCreateMap: " + output);

    return output;
};


var stripHTMLFormatting = function(text){ // Fix #196

    // Fix #232 Replace special html character codes that CC doesn't handle well
    // with ones CC can handle

    var htmlSpecialCodes = [
        { "char" : "&ldquo;",
            "replacement" : "&quot;"
        },
        { "char" : "&rdquo;",
            "replacement" : "&quot;"
        },
        { "char" : "&rsquo;",
            "replacement" : "&#39;"
        }
    ];

    var char = '';
    var replacement = '';
    for(var i=0; i<htmlSpecialCodes.length; i++){

        char = htmlSpecialCodes[i].char;
        replacement = htmlSpecialCodes[i].replacement;
        idx = text.indexOf(char);
        if ( idx != -1){ // we found a match
            text = replaceAll(text, char, replacement);
        }
    }
    //return striptags(text); v2.17 (Study)
    return htmlToText.fromString(text, {wordwrap: false});
};


var reapplyCSSFormatting = function(text){ // Fix #173
    for(style in htmlFormattingMap){  // replace all css formatting
        text = replaceAll(text, htmlFormattingMap[style].id, htmlFormattingMap[style].formatting);
    }
    return text;
}


function replaceAllWholeWordOnlyMatchCase(str, find, replace) {

    var regEx = new RegExp('\\b' + find + '\\b', "g");
    var replaceMask = replace;
    return str.replace(regEx, replaceMask);
}

function replaceAllMatchCase(str, find, replace) {
    // Replace only whole words in string
    // http://stackoverflow.com/questions/27472010/replacing-only-whole-word-not-words
    //return str.replace(new RegExp('\\b' + find + '\\b', "g"), replace);

    var regEx = new RegExp(find, "g");
    var replaceMask = replace;
    return str.replace(regEx, replaceMask);
}


var mapWordsToAACSymbols = function(output, wordsPOS){

    if(C.DEBUG_VERBOSE_LOGGING)console.log("mapWordsToAACSymbols ##############################################");

    currentSymbolsMap = {};

    var tempMap = {};

    for(var i = 0; i < wordsPOS.length; i++){
        var currW = wordsPOS[i].split("_")[0];
        var pos = wordsPOS[i].split("_")[1];

        if( currW.length >=3 &&
            currW !== "mine" &&
            pos !== "DNU" &&  // can't determine the type
            pos !== "DT" &&  // no determiners
            pos !== "NNP" &&  //
            pos !== "UH" &&  //
            pos !== "PRP" &&  //
            pos !== "PRP$" &&  //
            pos !== "IN" &&  //
            pos !== "MD" &&  //
            pos !== "CC" &&  //
            pos !== "WP" &&  //
            pos !== "WP$")
        {

            if(C.DEBUG_VERBOSE_LOGGING)console.log("Processing word: "+currW);

            var aac_ret = hasExactMatchAACSymbolsEntry(currW);

            if(aac_ret !== undefined){ // if we found a symbol json

                // Begin fix for #226
                var key = currW;
                if(currentSymbolsMap[key] !== undefined){
                    continue; // we've already loaded map with this one, so skip  
                }
                else{
                    var id = makeid();
                    currentSymbolsMap[currW] = id;
                    output = replaceAllWholeWordOnlyMatchCase(output, currW, id);
                }
                // End fix for #226               
            }
            else{

                /*

                 var key = wordsPOS[i].toLowerCase();

                 if(currentSymbolsMap[key] !== undefined) continue; // we've already loaded map with this one, so skip

                 // if not a direct hit, need to manually filter the result array
                 var fs = full_txt_search_loaded.search(currW);

                 if(fs.length > 0){

                 currentSymbolsMap[n] = fs[0]; //  - WSTODO, pick the best one!
                 currentSymbolsMap[n].displayText = currW;
                 currentSymbolsMap[n].id = makeid();

                 console.log(wordsPOS[i]);
                 console.log(fs[0]);


                 output = replaceAllWholeWordOnly(output, currentSymbolsMap[n].displayText, currentSymbolsMap[n].id);

                 n++;
                 }
                 */
            }
        }
    }// end outer for

    if(C.DEBUG_VERBOSE_LOGGING) console.log(currentSymbolsMap);

    return output;
};


var getSubjectActionObjectRelationMap = function(semantic_roles){

    if(C.DEBUG_VERBOSE_LOGGING) console.log("getSubjectActionObjectRelationMap");
    //if(C.DEBUG_VERBOSE_LOGGING) console.log(semantic_roles);

    // format: {"Sentence":[subjects],[objects],[actions]}
    var i = 0;
    var sentenceRelationsMap = {};
    for (i = 0; semantic_roles.length > i; i += 1) {

        var key = semantic_roles[i].sentence.trim();

        if ((key in sentenceRelationsMap) == false) { // Key doesn't exist, so init arrays

            sentenceRelationsMap[key] = {subjects: [], actions: [], objects: []};
        }

        var subject = (semantic_roles[i].subject == undefined) ? '' : semantic_roles[i].subject.text;
        var action = (semantic_roles[i].action == undefined) ? '' : semantic_roles[i].action.text;
        var object = (semantic_roles[i].object == undefined) ? '' : semantic_roles[i].object.text;

        if(C.DEBUG_VERBOSE_LOGGING) console.log("SUBJECT IS: "+ subject);
        if(C.DEBUG_VERBOSE_LOGGING) console.log("ACTION IS: " + action);
        if(C.DEBUG_VERBOSE_LOGGING) console.log("OBJECT IS: " + object);

        sentenceRelationsMap[key].subjects.push(subject);
        sentenceRelationsMap[key].actions.push(action);
        sentenceRelationsMap[key].objects.push(object);

    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log(sentenceRelationsMap);
    return sentenceRelationsMap;
}


/*
 AlchemyAPI may not have sentences for ALL sentences in the content. In order to address this,
 need to combine a general sentence map with the AlchmeyAPI data
 */
var getSimplificationSafeSubjectActionObjectRelationMap = function(text, semantic_roles){

    // http://stackoverflow.com/questions/18914629/split-string-into-sentences-in-javascript

    //sentences = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");

    //sentence = text.match( /[^\.!\?]+[\.!\?]+/g );

    var sentences;

    var tokenizer = new Tokenizer('Chuck');

    try{
        tokenizer.setEntry(text);

        sentences = tokenizer.getSentences();

        if(C.DEBUG_VERBOSE_LOGGING) console.log("getSimplificationSafeSubjectActionObjectRelationMap");

        if(C.DEBUG_VERBOSE_LOGGING) console.log("################# SENTENCES ###################");
        if(C.DEBUG_VERBOSE_LOGGING) console.log(sentences);

        if(C.DEBUG_VERBOSE_LOGGING) console.log("################# RELATIONS ###################");
        if(C.DEBUG_VERBOSE_LOGGING) console.log(semantic_roles);

        // In order to accomplish this we have to loop through the sentences twice
        // 1st time to init the array, and second time to populate from AlchmeyAPI

        var i = 0;
        var sentenceRelationsMap = {};

        for (i = 0; sentences.length > i; i += 1) {  // Init the arrays
            var key = sentences[i].trim();
            sentenceRelationsMap[key] = {subjects: [], actions: [], objects: []};
        }

        // format: {"Sentence":[subjects],[objects],[actions]}
        for (i = 0; semantic_roles.length > i; i += 1) {

            var key = semantic_roles[i].sentence.trim();

            if(C.DEBUG_VERBOSE_LOGGING) console.log(key);

            var subject = (semantic_roles[i].subject == undefined) ? '' : semantic_roles[i].subject.text;
            var action = (semantic_roles[i].action == undefined) ? '' : semantic_roles[i].action.text;
            var object = (semantic_roles[i].object == undefined) ? '' : semantic_roles[i].object.text;

            if(C.DEBUG_VERBOSE_LOGGING) console.log("SUBJECT IS: "+ subject);
            if(C.DEBUG_VERBOSE_LOGGING) console.log("ACTION IS: " + action);
            if(C.DEBUG_VERBOSE_LOGGING) console.log("OBJECT IS: " + object);

            if(sentenceRelationsMap[key] !== undefined){ // sentence key was found, push the parts of speech
                sentenceRelationsMap[key].subjects.push(subject);
                sentenceRelationsMap[key].actions.push(action);
                sentenceRelationsMap[key].objects.push(object);
            }
            // otherwise, we didn't find this sentence, so no-op
        }

        if(C.DEBUG_VERBOSE_LOGGING) console.log("################# sentenceRelationsMap ###################");
        if(C.DEBUG_VERBOSE_LOGGING) console.log(sentenceRelationsMap);

        return sentenceRelationsMap;
    }
    catch(err){
        console.error(err);
        return null;
    }
}


var getSimple = function(word, POS, enhanceContentMode){

    if(C.DEBUG_VERBOSE_LOGGING) console.log('(getSimple) PROCESSING WORD: "' +word + '"');

    var X = null; // X = Intersection of S and Vocabulary

    // Don't replace numbers
    if(isNumeric(word)){
        return null;
    }

    // Don't replace super short words
    if(word.length <= 3){
        return null;
    }

    if(POS !== null)
    {
        var entry = hasPOSMapEntry(POS); // { POS: 'SYM', DESC: 'Symbol', CLASS: 'NA' }
        if(entry !== undefined){

            // Don't replace proper nouns or cardinal numbers
            if(C.DEBUG_VERBOSE_LOGGING) console.log("entry.POS = " + entry.POS + " (" + entry.CLASS + ")");

            if(entry.POS == "NNP"  ||  // NNP Proper noun, singular
                entry.POS == "NNPS" ||  // Proper noun, plural
                entry.POS == "PRP" ||  // Personal pronoun
                entry.POS == "PRP$" || //Possessive pronoun
                entry.POS == "CD" )   // Cardinal number
            {
                return null;
            }
        }
    }
    else{
        if(C.DEBUG_VERBOSE_LOGGING) console.log("POS = null. POS tagging not possible for  = " + word);
    }

    var wStar   = word;
    var T       = null; // Set of synonyms of word in Thesaurus
    var S       = null; // Subset of T with max elements
    var sumConf = 0;

    // If word is in the vocabulary, get the rank. Don't simplify further is
    // word rank is less than C.MIN_FREQUENCY_RANK

    var originalWordRank = -1;
    var vocabJSON = hasVocabEntry(word);

    if(vocabJSON !== null && vocabJSON !== undefined){
        if(vocabJSON.Rank <= C.MIN_FREQUENCY_RANK){
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning with input due to rank.");
            return null;
        }
        originalWordRank = vocabJSON.Rank;
    }

    if(POS !== null){
        T =  getReplacementTextUsingContext(word,POS,originalWordRank,enhanceContentMode);
    }
    else{
        T =  getTargetSynonyms(word);
    }

    if(T == null || T == undefined){
        if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning due to no synonyms found in the thesaurus.");
        return null;
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" TARGET SYNONYMS");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(T);


    if(C.DEBUG_VERBOSE_LOGGING)console.log("T.synonymArr");
    if(C.DEBUG_VERBOSE_LOGGING)console.log(T.synonymArr);

    X = [];
    for(var i = 0; i < T.synonymArr.length; i++){

        var rank = -1;
        var alternative = "";
        var currType = "";
        var vocabJSON = hasVocabEntry(T.synonymArr[i].trim());
        if(vocabJSON !== null && vocabJSON !== undefined){ // see if this synonym is on our vocabulary
            rank = vocabJSON.Rank;
            alternative = T.synonymArr[i].trim();
            currType = T.type;
            var synonym = {
                "Rank" : rank,
                "type" : currType,
                "syllables" : syllable(alternative),
                "alternative": alternative,
                "confidence" : 0.0
            };
            X.push(synonym);
        }
        else{ // Not in thesaurus ... T.synonymArr[i] might be a phrase

            if( originalWordRank >= C.DEFAULT_RANK_THRESHOLD_FOR_PHRASE ||
                originalWordRank == -1 ){

                if(T.synonymArr[i].trim().indexOf(' ') >= 0){ // this synonym is definitely a phrase
                    if(T.synonymArr.length == 1){ // We only have 1 phrase, so high confidence
                        rank = C.MIN_ALLOWED_REPLACEMENT_RANK + 1; // assign low rank for bias
                        alternative = T.synonymArr[i].trim();
                        currType = T.type;
                        var synonym = {
                            "Rank" : rank,
                            "type" : currType,
                            "syllables" : 0.1, // override syllables for bias
                            "alternative": alternative,
                            "confidence" : 0.0
                        };
                        X.push(synonym);
                    }
                }
            }
        }

    }// end for

    if(C.DEBUG_VERBOSE_LOGGING) console.log("originalWordRank =" + originalWordRank);
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");

    if(X.length == 0){
        if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning due to empty X set. ");
        return null;
    }

    var ret = assignSimplificationConfidenceLevels(X);

    X = ret[0];

    sumConf = ret[1];

    // Sort based on calculated confidence level
    X.sort( predicatBy("confidence") );

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" X SET");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(X);

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("X[0] ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(X[X.length-1]);

    // Our highest confidence is very low...so don't allow for a replacement.
    /*  if(X[X.length-1].confidence < C.MIN_CONFIDENCE_LEVEL_THRESHOLD){
     if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning original word due to low max confidence. ");
     return null;
     }

     // Our average confidence is very low...so don't allow for a replacement.
     if((sumConf / X.length) < C.MIN_CONFIDENCE_LEVEL_THRESHOLD){
     if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning original due to low average confidence. ");
     return null;
     }
     */


    // Get the alternative with the highest confidence
    var theFinalAlternative = X[X.length-1];

    // Fix boundary case where thesaurus entry is same as the word (e.g. funded)
    if(theFinalAlternative.alternative.toLowerCase() == wStar.toLowerCase()){
        return null;
    }

    // Fix boundary case where thesaurus entry is a letter!
    if(theFinalAlternative.alternative.length == 1){
        return null;
    }

    // Prevent returning a replacement that is in the blacklist of words
    if( hasBlackListEntry(theFinalAlternative.alternative) !== undefined){
        if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning due to blackisted replacement: " + theFinalAlternative.alternative);
        return null;
    }


    /*
     // Fix boundary case where thesaurus entry selected is less frequently occurring than the input (e.g. eating)
     // And the ranking distance between the selection and original word is too great
     if(originalWordRank !== -1){
     if(( theFinalAlternative.Rank > originalWordRank) &&
     (Math.abs(theFinalAlternative.Rank - originalWordRank) >= C.MAX_RANK_DISTANCE_FOR_DECISION))
     {
     if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning original word because the selected alternative is less frequent [1]. ");
     return null;
     }
     }


     // If the original word and the suggestion is close in rank, don't replace it
     if(originalWordRank !== -1){
     if(Math.abs(theFinalAlternative.Rank - originalWordRank) <= C.MAX_RANK_DISTANCE_FOR_DECISION){
     if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning original word because the selected alternative is less frequent [2]. ");
     return null;
     }
     }
     */

    // As the replacement rank gets closer to the original rank, the ratio gets higher, SO if the
    // frequency ratio is too low, we want to reject the replacement
    if(originalWordRank !== -1){
        var frequencyRatio = (originalWordRank / theFinalAlternative.Rank);
        if(frequencyRatio < 0.60){
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning original word because the frequency ratio is too low. ");
            return null;
        }
    }



    // Prevent bad replacement with words that are TOO common.
    if(theFinalAlternative.Rank < C.MIN_ALLOWED_REPLACEMENT_RANK){
        if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning because too common: " + wStar);
        return null;
    }

    // ...Then bias towards the pevention of returning a replacement that has more syllables.
    if(theFinalAlternative.syllables > syllable(word)){
        if( theFinalAlternative.Rank < originalWordRank ){
            if( Math.abs( theFinalAlternative.Rank - originalWordRank ) < C.MAX_RANK_DISTANCE_FOR_DECISION ){
                if(C.DEBUG_VERBOSE_LOGGING) console.log("Returning due to syllables: " + wStar);
                return null;
            }
        }
    }


    // Capitalize wStar if original word was capitalized
    if(word[0] === word[0].toUpperCase() ){
        for(var i = 0; i < X.length; i++){
            X[i].alternative = X[i].alternative.capitalize();
        }
    }

    return X;

};




function assignSimplificationConfidenceLevels(alternativesArr){

    var i;
    var n = alternativesArr.length;
    var sumConfidence = 0;

    for(i=0; i<n; i++){

        var synonym     = alternativesArr[i];
        var rank        = synonym.Rank;
        var length      = synonym.alternative.length;
        var syllables   = synonym.syllables;
        //var confidence  = (1000 * ((0.45/rank)+(0.275/length)+(0.275/syllables))) / n;
        var confidence  = (1000 * ((C.RANK_WEIGHT/rank)+(C.LENGTH_WEIGHT/length)+(C.SYLLABLES_WEIGHT/syllables))) / n;

        // Prevent confidence over 100
        synonym.confidence = Math.min( C.MAX_CONFIDENCE_LEVEL, confidence);

        sumConfidence += synonym.confidence;

        alternativesArr[i] = synonym;
    }
    return [ alternativesArr, sumConfidence ];
}

var getReplacementTextUsingContext = function(word,POS,originalWordRank,enhanceContentMode){ // Get's replacement text considering POS context

    if(C.DEBUG_VERBOSE_LOGGING) console.log("CALLING: getReplacementTextUsingContext");

    if(C.DEBUG_VERBOSE_LOGGING) console.log("############# POS Tagging ##############");

    var entry = hasPOSMapEntry(POS); // { POS: 'SYM', DESC: 'Symbol', CLASS: 'NA' }
    var partOfSpeech;
    var desc = "";

    var typesSuperset = [];
    var type = null;
    var currType = null;
    var typeOfSpeech = null;

    if(entry !== undefined){
        partOfSpeech = entry.CLASS;
        desc = entry.DESC;
    }
    else{
        partOfSpeech = "NA";
    }

    // If enhanced content is on (enhanceContentMode), then:
    // Attempt to get a simple English defintion, IFF word isn't too frequent
    //
    if(enhanceContentMode == C.ENHANCE_DEFINITIONS){
        if(isTargetForSimpleEnglishDefinition(word,originalWordRank))
        {
            var i;
            var definition;
            var defJSON;
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Dictionary word = " + word);
            var dictJSON = hasSDictionaryEntry(word);
            //console.log(dictJSON);

            if(dictJSON !== null && dictJSON !== undefined){ // We found a dictionary entry
                if( dictJSON[partOfSpeech] !== undefined){
                    if(dictJSON[partOfSpeech].DEFINITIONS.length > 0){ // at least one definition
                        definition = dictJSON[partOfSpeech].DEFINITIONS[0].text;

                        if(definition != "unexpected_format" && definition != "uncountable"){
                            var defArr = [];
                            defArr.push(definition);

                            defJSON = {
                                "type"        : partOfSpeech,
                                "numSynonyms" : 1,
                                "synonymArr"  : defArr // must return as an array for further processing
                            };
                            return defJSON;
                        }
                        else{
                            if(C.DEBUG_VERBOSE_LOGGING) console.log("unexpected_format or uncountable definition");
                            return null;
                        }
                    } // end if
                } // end dictJSON[partOfSpeech] !== undefined
                else{
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("dictJSON[partOfSpeech] == undefined");
                    return null;
                }
            }
        }
        // if we got here, there's not valid simple English definition, so return null
        return null;
    }


    var thesJSON = hasThesEntry(word);
    if(thesJSON == null || thesJSON == undefined){ // We didn't find a thesaurus entry
        return null;
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("1");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(thesJSON);


    // SELECT ALTERNATIVES BASED ON PART OF SPEECH

    if(C.DEBUG_VERBOSE_LOGGING) console.log("Part of speech identified for: " + word + " = " + partOfSpeech + " (" + desc + ")");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("thesJSON:");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(thesJSON);

    for(type = 0; type < thesJSON.TYPE.length; type++ ){
        currType = thesJSON.TYPE[type];
        if(currType == partOfSpeech){
            typeOfSpeech = {
                "type"        : currType,
                "numSynonyms" : thesJSON[currType].length,
                "synonymArr"  : thesJSON[currType] // arrays for each data type
            };
            typesSuperset.push(typeOfSpeech);
            break;
        }
    }
    if(C.DEBUG_VERBOSE_LOGGING) console.log("2");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(typesSuperset)

    if(typesSuperset.length == 0){ // partOfSpeech not matched case

        if(C.DEBUG_VERBOSE_LOGGING) console.log("No matching alternatives with matching part of speech.");

        var numVerbOptions = thesJSON['VERB'].length;
        var numAdverbOptions = thesJSON['ADVERB'].length;
        var numNounOptions = thesJSON['NOUN'].length;
        var numAdjectiveOptions = thesJSON['ADJECTIVE'].length;

        if(C.DEBUG_VERBOSE_LOGGING) console.log("numVerbOptions = " + numVerbOptions);
        if(C.DEBUG_VERBOSE_LOGGING) console.log("numAdverbOptions = " + numAdverbOptions);
        if(C.DEBUG_VERBOSE_LOGGING) console.log("numNounOptions = " + numNounOptions);
        if(C.DEBUG_VERBOSE_LOGGING) console.log("numAdjectiveOptions = " + numAdjectiveOptions);


        // We have the suspected part of speech by the model, but if we STRONG indication from the thesaurus
        // suggesting otherwise, override the part of speech because the model likely misclassified the word
        if(numVerbOptions && !numAdverbOptions && !numNounOptions && !numAdjectiveOptions){
            partOfSpeech = "VERB";
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Overriding part of speech based on thesaurus to " + partOfSpeech);
        }
        if(!numVerbOptions && numAdverbOptions && !numNounOptions && !numAdjectiveOptions){
            partOfSpeech = "ADVERB";
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Overriding part of speech based on thesaurus to " + partOfSpeech);
        }
        if(!numVerbOptions && !numAdverbOptions && numNounOptions && !numAdjectiveOptions){
            partOfSpeech = "NOUN";
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Overriding part of speech based on thesaurus to " + partOfSpeech);
        }
        if(!numVerbOptions && !numAdverbOptions && !numNounOptions && numAdjectiveOptions){
            partOfSpeech = "ADJECTIVE";
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Overriding part of speech based on thesaurus to " + partOfSpeech);
        }

        if( partOfSpeech == "VERB"){

            currType = "VERB";

            if(numAdverbOptions === 0 && numAdjectiveOptions > 0){ // strong indication of adjective
                currType = "ADJECTIVE";
            }
            else if(numAdverbOptions > 0 && numAdjectiveOptions === 0){ // strong indication of adjective
                currType = "ADVERB";
            }
            else if(numAdverbOptions > 0 && numAdjectiveOptions > 0){

                if(numAdverbOptions <= numAdjectiveOptions){
                    currType = "ADJECTIVE";
                }
                else{
                    currType = "ADVERB";
                }

            }

            if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                typeOfSpeech = {
                    "type"        : currType,
                    "numSynonyms" : thesJSON[currType].length,
                    "synonymArr"  : thesJSON[currType] // arrays for each data type
                };
                if(C.DEBUG_VERBOSE_LOGGING) console.log("[1] Finally selected part of speech of " + currType);
                typesSuperset.push(typeOfSpeech);
            }

        }// end verb case
        else if( partOfSpeech == "ADVERB"){

            // See if any adverbs first
            currType = "ADVERB";
            if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                typeOfSpeech = {
                    "type"        : currType,
                    "numSynonyms" : thesJSON[currType].length,
                    "synonymArr"  : thesJSON[currType] // arrays for each data type
                };
                if(C.DEBUG_VERBOSE_LOGGING) console.log("[2] Finally selected part of speech of " + currType);
                typesSuperset.push(typeOfSpeech);
            }

            // if no adverbs found, try verbs next
            if(typesSuperset.length == 0){
                currType = "VERB";
                if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                    typeOfSpeech = {
                        "type"        : currType,
                        "numSynonyms" : thesJSON[currType].length,
                        "synonymArr"  : thesJSON[currType] // arrays for each data type
                    };
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("[3] Finally selected part of speech of " + currType);                    typesSuperset.push(typeOfSpeech);
                }
            }


            // if no verbs found, try adjectives next
            if(typesSuperset.length == 0){
                currType = "ADJECTIVE";
                if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                    typeOfSpeech = {
                        "type"        : currType,
                        "numSynonyms" : thesJSON[currType].length, // thesJSON.currType.length; = 6 for Noun, 24 for Verb
                        "synonymArr"  : thesJSON[currType] // arrays for each data type
                    };
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("[4] Finally selected part of speech of " + currType);                    typesSuperset.push(typeOfSpeech);
                }
            }

        }// end adverb case
        else if( partOfSpeech == "ADJECTIVE"){

            // See if any adjectives first
            currType = "ADJECTIVE";
            if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                typeOfSpeech = {
                    "type"        : currType,
                    "numSynonyms" : thesJSON[currType].length,
                    "synonymArr"  : thesJSON[currType] // arrays for each data type
                };
                if(C.DEBUG_VERBOSE_LOGGING) console.log("[5] Finally selected part of speech of " + currType);
                typesSuperset.push(typeOfSpeech);
            }

            // if no adjectives found, try adverbs next
            if(typesSuperset.length == 0){
                currType = "ADVERB";
                if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                    typeOfSpeech = {
                        "type"        : currType,
                        "numSynonyms" : thesJSON[currType].length,
                        "synonymArr"  : thesJSON[currType] // arrays for each data type
                    };
                    typesSuperset.push(typeOfSpeech);
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("[6] Finally selected part of speech of " + currType);
                }
            }

            // if no adverbs found, try verbs next
            if(typesSuperset.length == 0){
                currType = "VERB";
                if(thesJSON[currType] !== undefined && thesJSON[currType].length !== 0){
                    typeOfSpeech = {
                        "type"        : currType,
                        "numSynonyms" : thesJSON[currType].length,
                        "synonymArr"  : thesJSON[currType] // arrays for each data type
                    };
                    typesSuperset.push(typeOfSpeech);
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("[7] Finally selected part of speech of " + currType);
                }
            }

        }// end adjective case
        else{//
            if(C.DEBUG_VERBOSE_LOGGING) console.log("Did not find an alternative part of speech.");
            return null;
        }

        if(C.DEBUG_VERBOSE_LOGGING) console.log("2a");
        if(C.DEBUG_VERBOSE_LOGGING) console.log(typesSuperset);
    }


    // Now that we have a set to choose from, take a best guess. Assertion is the part of speech (type) with most entries
    // is most suitable, so if more than one type, return set with most entries
    typesSuperset.sort( predicatBy("numSynonyms") );

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("3");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(typesSuperset);

    return typesSuperset[typesSuperset.length-1]; // return part of speech set with most entries.

};

var getTargetSynonyms = function(word){ // This function get synonymns from part of speech type with most entries

    if(C.DEBUG_VERBOSE_LOGGING) console.log("CALLING: getTargetSynonyms");

    var thesJSON = hasThesEntry(word);
    if(thesJSON == null || thesJSON == undefined){ // We didn't find a thesaurus entry
        return null;
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log("1");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(thesJSON);

    var typesSuperset = [];

    if(C.DEBUG_VERBOSE_LOGGING) console.log("thesJSON.TYPE.length = " +  thesJSON.TYPE.length);
    for(var type = 0; type < thesJSON.TYPE.length; type++ ){ // thesJSON.TYPE.length = 2
        var currType = thesJSON.TYPE[type]; // thesJSON.TYPE[type] = NOUN, VERB
        var typeOfSpeech = {
            "type"        : currType,
            "numSynonyms" : thesJSON[currType].length, // thesJSON.currType.length; = 6 for Noun, 24 for Verb
            "synonymArr"  : thesJSON[currType] // arrays for each data type
        };
        typesSuperset.push(typeOfSpeech);
    }

    if(C.DEBUG_VERBOSE_LOGGING) console.log("2");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(typesSuperset);

    // Assertion is the part of speech (type) with most entries
    // is most suitable, so if more than one type, return set with most entries
    typesSuperset.sort( predicatBy("numSynonyms") );

    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(" ");
    if(C.DEBUG_VERBOSE_LOGGING) console.log("3");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(typesSuperset);

    return typesSuperset[typesSuperset.length-1]; // return synonym set with most entries.
};


function reconcilePOS(brillTagger, brillSentence, wordsPOS){

    // If POS tagging from both algorithms agree, then we are highly confident
    // in  the POS classification. If they don't agree, flag those words, and
    // don't allow replacement (as we could get the POS wrong!)

    var brillPOS = [];
    var tags = brillTagger.tag(brillSentence);
    if(wordsPOS.length == tags.length)
    {
        for(var k = 0; k<wordsPOS.length; k++){
            var brillTag = tags[k][1];
            var currW   = wordsPOS[k].split("_")[0];
            var stanTag = wordsPOS[k].split("_")[1];

            if(stanTag != brillTag){ // POS tags don't agree

                if(brillTag == 'N' ||                   // Brill POS 'N' means couldn't classify, so go with Stan POS
                    /^[a-z]+$/i.test(stanTag) == false ){ // contains punctuation
                    wordsPOS[k] = currW + "_" + stanTag;
                }
                else if(brillTag !== null && brillTag !== undefined &&
                        stanTag !== null && stanTag !== undefined &&
                        brillTag.length >= 1 &&
                        stanTag.length >= 1 &&
                        brillTag[0] == stanTag[0])
                { 
                    // v2.17 (Study) Tags don't agree exactly, but are close enough to make a decision, eg. VBP an VBD
                    // so go with Stan Tag
                    wordsPOS[k] = currW + "_" + stanTag;
                    //if(C.DEBUG_VERBOSE_LOGGING) console.log("CLOSELY MATCHED POS: " + currW + " [brill] = " + brillTag  + " [stan] = " + stanTag);           0         
                }
                else if(/^[a-z]+$/i.test(stanTag) && // stanTag contains only letters
                    stanTag != "CD" &&
                    stanTag != "DT" ){
                    wordsPOS[k] = currW + "_DNU"; // do not use
                    if(C.DEBUG_VERBOSE_LOGGING) console.log("MISMATCHED POS: " + currW + " [brill] = " + brillTag  + " [stan] = " + stanTag);

                }
            }
        }
    }

    return wordsPOS;
}


function isTargetForSimpleEnglishDefinition(word, rank){

    var decision    = false;
    var syllables   = syllable(words);

    if(syllables >= 3){
        decision = true;
    }
    else if(word.length >= 7){ // The average is 4.79 letters per word, and 80% are between 2 and 7 letters long
        decision = true;
    }
    else if(rank >= C.DEFAULT_RANK_THRESHOLD_FOR_PHRASE){
        decision = true;
    }

    return decision;
}
// ------------------ Utilities ------------------------

// Check if string us URI encoded
function isEncoded(str){return decodeURIComponent(str) !== str;}


// Check if string is a numeric
function isNumeric(num){
    return !isNaN(num)
}

// Capitalize first letter of a word
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(comparer) {
    for(var i=0; i < this.length; i++) {
        if(comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};

// Swap index element x of an array with index element y
Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

// Used by Array.sort
function predicatBy(prop){
    return function(a,b){
        if( a[prop] > b[prop]){
            return 1;
        }else if( a[prop] < b[prop] ){
            return -1;
        }
        return 0;
    }
}


function logReadabilityCalculations(x){

    if(C.DEBUG_VERBOSE_LOGGING)console.log("Readability Calculations: ");
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Flesch Kincaid (Input) = " + x.fleschKincaidInput);
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Flesch Kincaid (Output) = " + x.fleschKincaidOutput);
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Coleman Liau (Input) = " + x.colemanLiauInput);
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Coleman Liau (Output) = " + x.colemanLiauOutput);
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Automated Readability Index (Input) = " + x.ariInput);
    if(C.DEBUG_VERBOSE_LOGGING)console.log("Automated Readability Index (Output) = " + x.ariOutput);
}

function getLoggingTimestamp(){
    var dt = new Date();
    var utcDate = dt.toUTCString();
    return utcDate;
}

function calculateFleschKincaid(text){

    var fk = -1;

    var numSentences = 0;
    var numWords = 0;
    var numSyllables = 0;

    text = text.trim();

    // sentences
    var tokenizer = new Tokenizer('Chuck');

    try{
        tokenizer.setEntry(text);
        numSentences = tokenizer.getSentences().length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numSentences);

        // word
        var words = text.split(" ");
        numWords = words.length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numWords);

        //syllables
        numSyllables = 0;
        for(var i=0; i < words.length; i++){
            numSyllables += syllable(words[i]);
        }
        // if(C.DEBUG_VERBOSE_LOGGING) console.log(numSyllables);

        if(numSentences == 0 || numWords == 0 || numSyllables == 0){
            return -1;
        }

        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numSyllables);

        fk = fleschKincaid({
            'sentence' : numSentences,
            'word' : numWords,
            'syllable' : numSyllables
        });

        return fk;

    }
    catch(err){
        console.error("Err in calculateFleschKincaid " + err);
        return -1;
    }
}

function calculateColemanLiau(text){

    var cl = -1;

    var numSentences = 0;
    var numWords = 0;
    var numletters = 0;

    text = text.trim();

    // sentences
    var tokenizer = new Tokenizer('Chuck');

    try{
        tokenizer.setEntry(text);
        numSentences = tokenizer.getSentences().length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numSentences);

        // word
        var words = text.split(" ");
        numWords = words.length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numWords);

        //letters
        var noSpecialCharsStr = text.replace(/[^\w\s]/gi, '');
        var noSpacesStr = noSpecialCharsStr.replace(/\s/g, '');
        numletters = noSpacesStr.length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numletters);


        if(numSentences == 0 || numWords == 0 || numletters == 0){
            return -1;
        }

        cl = colemanLiau({
            'sentence' : numSentences,
            'word' : numWords,
            'letter' : numletters
        });

        return cl;
    }
    catch(err){
        console.log("Err in calculateColemanLiau " + err);
        return -1;
    }

}

function calculateAutomatedReadabilityIndex(text){

    var ari = -1;

    var numSentences = 0;
    var numWords = 0;
    var numChars = 0;

    text = text.trim();

    // sentences
    var tokenizer = new Tokenizer('Chuck');

    try{
        tokenizer.setEntry(text);
        numSentences = tokenizer.getSentences().length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numSentences);

        // word
        var words = text.split(" ");
        numWords = words.length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numWords);

        //letters
        var noSpecialCharsStr = text.replace(/[^\w\s]/gi, '');
        var noSpacesStr = noSpecialCharsStr.replace(/\s/g, '');
        numChars = noSpacesStr.length;
        //if(C.DEBUG_VERBOSE_LOGGING) console.log(numChars);

        if(numSentences == 0 || numWords == 0 || numChars == 0){
            return -1;
        }

        ari = automatedReadability({
            'sentence' : numSentences,
            'word' : numWords,
            'character' : numChars
        });

        return ari;
    }
    catch(err){
        console.log("Err in calculateAutomatedReadabilityIndex " + err);
        return -1;
    }

}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function formatStringOutput(str, mode){

    var output = "";

    if(mode == C.MODE_REMOVE_ORIGINAL_WORDS){ // Gets rid of |_word_| and  %#[ confidences ]#%, returns only Returns |^replacement^|
        output = str.replace(/\|_[^_]*?_\|/g,"");
    }
    else if(mode == C.MODE_REMOVE_SPECIAL_CHARS){ // Gets rid of |_word_| and |^replacement^| and %#[ confidences ]#%, returns only replacement
        str = str.replace(/\|_[^_]*?_\|/g,"");
        output = str.replace(/[\|\^\|\^]/g, "");
    }
    else{ // Default case. Mode = 0
        mode = 0;
        output = str; // Doesn't get rid of anything, returns |_word_| |^replacement^| %#[ confidences ]#%
    }

    if(mode != 0){
        // match and get all %#<>#% delimited confidence data
        var matches = output.match(/\%#[^]*?#\%/g);
        if(matches !=null && matches != undefined){
            for (var i = 0; i <matches.length; i++) {
                output = output.split(matches[i]).join(""); // remove the confidence levels
            }
        }
    }

    return output;
}




function hasAlphaNumericLastChar(str) {
    var code;
    code = str.charCodeAt(str.length-1); // last char
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
    }
    return true;
}

function addslashes( str ) { // Escape double quotes
    //return (str + '').replace(/[\\"']/g, '\\$&');
    return (str + '').replace(/[\\"]/g, '\\$&');
}

function makeid() {
    var text = "";
    //var possible = "BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz0123456789";
    // Don't allow numbers in ID as it breaks the parser
    var possible = "BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz";

    for( var i=0; i < 24; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function replaceAll(str, find, replace) {
    // Replace only whole words in string
    // http://stackoverflow.com/questions/27472010/replacing-only-whole-word-not-words
    //return str.replace(new RegExp('\\b' + find + '\\b', "g"), replace);

    var regEx = new RegExp(find, "ig");
    var replaceMask = replace;
    return str.replace(regEx, replaceMask);
}

function replaceAllWholeWordOnly(str, find, replace) {

    var regEx = new RegExp('\\b' + find + '\\b', "ig");
    var replaceMask = replace;
    return str.replace(regEx, replaceMask);
}

// Create a hashtable lookup for vocabulary. This will return the JSON object
// for the corresponding word, or undefined.
// http://mattsnider.com/how- to-efficiently-search-a-json-array/
function initVocabMap(){

    var i = null;
    for (i = 0; vocabulary.length > i; i += 1) {
        var key = vocabulary[i].Word.toLowerCase().trim();
        vocabMap[key] = vocabulary[i];
    }
}
var hasVocabEntry = function(word) {
    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();
    return vocabMap[key];
};


function initThesMap(){

    var i = null;
    for (i = 0; thesaurus.length > i; i += 1) {
        var key = thesaurus[i].WORD.toLowerCase().trim();
        thesMap[key] = thesaurus[i];
    }
}
var hasThesEntry = function(word) {
    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();
    return thesMap[key];
};

function initIgnoreListMap(){

    var i = null;
    for (i = 0; ignoreList.length > i; i += 1) {
        var key = ignoreList[i].WORD.toLowerCase().trim();
        ignoreListMap[key] = ignoreList[i];
    }
}
var hasIgnoreListEntry = function(word) {

    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();
    return ignoreListMap[key];
};


function initOperationalRulesMap(){

    var i = null;
    for (i = 0; operationRulesList.length > i; i += 1) {
        var key = operationRulesList[i].WORD.toLowerCase().trim();
        operationalRulesMap[key] = operationRulesList[i];
    }
}
var hasOperationalRulesEntry = function(word) {

    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();

    var obj = operationalRulesMap[key];

    if(obj == undefined){
        return undefined;
    }

    if(word[0] === word[0].toUpperCase() ){
        return obj.REPLACEMENT.capitalize();
    }
    else{
        return obj.REPLACEMENT;
    }
};

var markNonLiteralsAndTransitions = function(text){

    if(C.DEBUG_VERBOSE_LOGGING) console.log("markNonLiteralsAndTransitions");

    nonLiteralsAndTransitionsMap = {};

    var transition = '';
    var nonLiteral = '';
    var replacement = '';
    var original = '';

    var idx = -1;

    var output = text;

    //
    // mark the transitional phrases
    //
    for(var i = 0; i < transitionsList.length; i++){
        transition = transitionsList[i].TRANSITION.toLowerCase().trim();
        replacement = transitionsList[i].REPLACEMENT.toLowerCase().trim();

        idx = output.toLowerCase().indexOf(transition);
        if (idx != -1){ // we found a match

            original = output.substr(idx,transition.length);

            // keep case of original
            if( replacement.split(' ')[0] === 'i') { // handle replacement of form I....
                replacement = replacement.capitalize();
            }
            else if(original[0] === original[0].toUpperCase() ) {
                replacement = replacement.capitalize();
            }

            var obj = {
                replacement : replacement,
                id : makeid()
            };

            nonLiteralsAndTransitionsMap[original] = obj;

            output = replaceAllWholeWordOnly(output, original, obj.id);
        }
    }

    //
    // mark the non literals
    //
    for(var i = 0; i < nonLiteralsList.length; i++){
        nonLiteral = nonLiteralsList[i].NON_LITERAL.toLowerCase().trim();
        replacement = nonLiteralsList[i].REPLACEMENT.toLowerCase().trim();

        idx = output.toLowerCase().indexOf(nonLiteral);
        if ( idx != -1){ // we found a match

            original = output.substr(idx,nonLiteral.length);

            // keep case of original
            if( replacement.split(' ')[0] === 'i') { // handle replacement of form I....
                replacement = replacement.capitalize();
            }
            else if(original[0] === original[0].toUpperCase() ) {
                replacement = replacement.capitalize();
            }

            var obj = {
                replacement : replacement,
                id : makeid()
            };

            nonLiteralsAndTransitionsMap[original] = obj;

            output = replaceAllWholeWordOnly(output, original, obj.id);
        }
    }


    if(C.DEBUG_VERBOSE_LOGGING) console.log("################## NON LITERALS AND TRANSITIONS MAP ####################");
    if(C.DEBUG_VERBOSE_LOGGING) console.log(nonLiteralsAndTransitionsMap);

    return output;
};


var replaceNonLiteralsAndTransitions = function(text){

    var snippet = '';
    var replacement = '';

    for(nonLiteral in nonLiteralsAndTransitionsMap){

        replacement = nonLiteralsAndTransitionsMap[nonLiteral].replacement;

        // assign maximum confidence to enforced operationalized rule
        var confidence = (Math.random() * (C.OPERATIONALIZED_RULE_MAX - C.OPERATIONALIZED_RULE_MIN)
        + C.OPERATIONALIZED_RULE_MIN).toFixed(15);

        var confidenceLevel = "%#[";
        confidenceLevel += '{"lexicon":' + '"' +  replacement + '",';
        confidenceLevel += '"confidence":' + '"' +  confidence + '"}';
        confidenceLevel += "]#%";

        snippet = "|_" + nonLiteral + "_|" + "|^" + replacement + "^|" + confidenceLevel;

        // Fix #226 When replacing IDs, use replaceAll because there may be adjacent key strings
        text = replaceAll(text, nonLiteralsAndTransitionsMap[nonLiteral].id, snippet);
    }

    return text;
};

function initBlackListMap(){

    var i = null;
    for (i = 0; blackList.length > i; i += 1) {
        var key = blackList[i].WORD.toLowerCase().trim();
        blacklistMap[key] = blackList[i];
    }
}
var hasBlackListEntry = function(word) {

    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();
    return blacklistMap[key];
};

function initAppUsersMap(){

    if(C.DEBUG_VERBOSE_LOGGING) console.log(getLoggingTimestamp() +' Poll for demo users');

    pool.getConnection(function(err, connection) {
        if(err) {
            console.error('DB Error during initAppUsersMap(): ' + err);
        }
        connection.query(C.DEMO_USERS_QUERY, [], function(err, results) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.error('Error while querying for demo users : ' + err);
            }
            else if(results[0] === undefined){ // Didn't find any demo users
                console.error('No demo users found in the DB. ');
            }
            else {
                var i = null;
                for (i = 0; results.length > i; i += 1) {
                    var key = results[i].Email.toLowerCase().trim();
                    var val = {
                        userID : results[i].UserNo,
                        username: results[i].Email,
                        pass: ''
                    }
                    appUsersMap[key] = val;
                }
                //console.log(appUsersMap);
            }
        }); // end connection
    }); // end pool

}

var hasDemoUsersEntry = function(username) {

    if(username == null || username == undefined)
        return undefined;

    var key = username.toLowerCase().trim();
    return appUsersMap[key];
};

function initPOSLookupMap(){

    var i = null;
    for (i = 0; posList.length > i; i += 1) {
        var key = posList[i].POS;
        posListMap[key] = posList[i];
    }
}

var hasPOSMapEntry = function(tag) {

    if(tag == null || tag == undefined)
        return undefined;

    var key = tag;
    return posListMap[key];
};

// Init the s
function initSDictionaryMap(){

    var i = null;
    for (i = 0; s_dictionary.length > i; i += 1) {
        var entry = s_dictionary[i];
        var key = entry.Word.toLowerCase().trim();
        // console.log("WORD = " + key);
        entry = formatSDictionaryDefinitions(entry);
        sDictMap[key] = entry;
    }
}

// Load the nonLiteral Phrases into a NonLiteralsMap
// displayText -> Original Non Literal Phrase
// replacement -> Replacement string
function initNonLiteralsMap() {

    nonLiteralsMap = {};
    var i = 0;
    var n = 0;

    if(C.DEBUG_VERBOSE_LOGGING) console.log("initNonLiteralsMap");

    for (i = 0; nonLiteralsList.length > i; i += 1) {
        var key = nonLiteralsList[i].NON_LITERAL;
        if (key != undefined) {
            nonLiteralsMap[n] = nonLiteralsList[i];
            if(C.DEBUG_VERBOSE_LOGGING) console.log("PHRASE = " + key);
            nonLiteralsMap[n].displayText = key;
            if(C.DEBUG_VERBOSE_LOGGING) console.log("REPLACEMENT= " + nonLiteralsList[i].REPLACEMENT);
            nonLiteralsMap[n].replacement = nonLiteralsList[i].REPLACEMENT;
            // nonLiteralsMap[n].id = makeid();
            n ++;
        }
    }
}

var hasSDictionaryEntry = function(word) {
    if(word == null || word == undefined)
        return undefined;

    var key = word.toLowerCase().trim();
    return sDictMap[key];
};


function initBluemixContainerMetaDataLookupMap(){

    var i = null;
    for (i = 0; bluemixContainers.length > i; i += 1) {
        var key = bluemixContainers[i].name;
        bluemixContainersMap[key] = bluemixContainers[i];
    }
}

var hasBluemixContainerMetaDataMapEntry = function(tag) {

    if(tag == null || tag == undefined)
        return undefined;

    var key = tag;
    return bluemixContainersMap[key];
};


function formatSDictionaryDefinitions(entry){

    var typesArr = entry.TYPE;

    if(typesArr.length == 0){ // redirect case
        return entry;
    }

    var i = null;
    var j = null;
    var k = null;
    var currType = null;
    var currDef = null;
    var definitions = null;

    for(i = 0; i < typesArr.length; i++){
        currType = typesArr[i]; // NOUN, ADJECTIVE, ADVERB, VERB

        //console.log("Before:");
        //console.log(entry[currType].DEFINITIONS);

        definitions = entry[currType].DEFINITIONS;

        for(j = 0; j < definitions.length; j++ ){

            currDef = definitions[j].text;

            // 1. Don't allow uncountable definitions
            if(currDef.indexOf("{{uncountable}}") !== -1 || currDef.length == 0){
                entry[currType].DEFINITIONS[j].text = "uncountable";
                continue;
            }

            // 2. If we find special ''' notation in the definition, process them
            // NOTE: Processing sequence is important!
            if(currDef.indexOf("'''") !== -1){

                if(currDef.split("''' is the")[1] !== undefined){ // ''' is the [......]
                    currDef = currDef.split("''' is the")[1];
                }
                else if(currDef.split("''' is an")[1] !== undefined){ // ''' is a [......]
                    currDef = currDef.split("''' is an")[1];
                }
                else if(currDef.split("''' is also")[1] !== undefined){ // ''' is a [......]
                    currDef = currDef.split("''' is also")[1];
                }
                else if(currDef.split("''' is a")[1] !== undefined){ // ''' is a [......]
                    currDef = currDef.split("''' is a")[1];
                }
                else if(currDef.split("''' is to")[1] !== undefined){ // ''' is to [......]
                    currDef = currDef.split("''' is to")[1];
                }
                else if(currDef.split("''' is")[1] !== undefined){ // ''' is [......]
                    currDef = currDef.split("''' is")[1];
                }
                else if(currDef.split("''' task is")[1] !== undefined){ // ''' task is [.....]
                    currDef = currDef.split("''' task is")[1];
                }
                else if(currDef.split("''', it is")[1] !== undefined){ // ''', it [.....]
                    currDef = currDef.split("''', it is")[1];
                }
                else if(currDef.split("''', it")[1] !== undefined){ // ''', it [.....]
                    currDef = currDef.split("''', it")[1];
                }
                else if(currDef.split("''' refers to the")[1] !== undefined){ // ''' refers to the[.....]
                    currDef = currDef.split("''' refers to the")[1];
                }
                else if(currDef.split("''' refers to")[1] !== undefined){ // ''' refers to [.....]
                    currDef = currDef.split("''' refers to")[1];
                }
                else if(currDef.split("''' when you")[1] !== undefined){ // ''' when you [.....]
                    currDef = currDef.split("''' when you")[1];
                }
                else if(currDef.split("''' something, you")[1] !== undefined){ // ''' something, you [.....]
                    currDef = currDef.split("''' something, you")[1];
                }
                else if(currDef.split("''' someone, you")[1] !== undefined){ // ''' someone, you [.....]
                    currDef = currDef.split("''' someone, you")[1];
                }
                else if(currDef.split("''' something or someone, you")[1] !== undefined){ // ''' something or someone, you [.....]
                    currDef = currDef.split("''' something or someone, you")[1];
                }
                else if(currDef.split(", you are")[1] !== undefined){  // , you are [.....]
                    currDef = currDef.split(", you are")[1];
                }
                else if(currDef.split(", you")[1] !== undefined){  // , you [.....]
                    currDef = currDef.split(", you")[1];
                }
                else{
                    entry[currType].DEFINITIONS[j].text = "unexpected_format";
                    continue;
                }
            }


            // 3. Now only get the important portion of the definition
            if(currDef.indexOf('.') !== -1){
                currDef = currDef.split('.')[0];
            }
            if(currDef.indexOf(':') !== -1){
                currDef = currDef.split(':')[0];
            }
            if(currDef.indexOf(';') !== -1){
                currDef = currDef.split(';')[0];
            }
            if(currDef.indexOf('(') !== -1){
                currDef = currDef.split('(')[0];
            }
            /* if(currDef.indexOf(',') !== -1){ // experimental...
             currDef = currDef.split(',')[0];
             }
             if(currDef.indexOf(" or ") !== -1){  // experimental...
             currDef = currDef.split(" or ")[0];
             }
             */
            if(currDef.indexOf(", often ") !== -1){  // experimental...
                currDef = currDef.split(", often ")[0];
            }
            if(currDef.indexOf(" because ") !== -1){  // experimental...
                currDef = currDef.split(" because ")[0];
            }

            // 4. Handle potential remaining POS artifacts
            currDef = replaceAll(currDef, "Verb|", "");
            currDef = replaceAll(currDef, "Noun|", "");
            currDef = replaceAll(currDef, "Adverb|", "");
            currDef = replaceAll(currDef, "Adjective|", "");

            // 5. Remove special chars from the definition
            currDef = currDef.replace(/[\[\]']+/g,''); // remove [[ and ]]
            currDef = currDef.replace(/\{\{(.+?)\}\}/g, ""); // remove {{indentifier}}
            //currDef = currDef.replace(/\|/g, ''); // remove |
            currDef = currDef.replace(/\|/g, ' / '); // replace | with /
            currDef = currDef.trim(); // remove leading/trailing whitespace


            // if the definition still contains the word itself at this point, mark it uncountable
            if(currDef.indexOf(entry.Word) !== -1){
                entry[currType].DEFINITIONS[j].text = "uncountable";
                continue;
            }

            // 6. Apply operationalized rules (Maybe should convert this piece into function??)
            currDef = currDef.replace(/"/g, '\\"'); // escape all quotes in definition
            currDef = replaceAllWholeWordOnly(currDef, "the state of", "");
            currDef = replaceAllWholeWordOnly(currDef, "the act of", "");
            currDef = replaceAllWholeWordOnly(currDef, "particular", "");
            currDef = replaceAllWholeWordOnly(currDef, "certain", "");
            currDef = replaceAllWholeWordOnly(currDef, "specific", "");
            currDef = replaceAllWholeWordOnly(currDef, "of them", "");
            currDef = replaceAllWholeWordOnly(currDef, "on them", "");
            currDef = replaceAllWholeWordOnly(currDef, "it", "");
            currDef = replaceAllWholeWordOnly(currDef, "them", "");
            currDef = replaceAllWholeWordOnly(currDef, "they", "you");

            currDef = entry.Word + ' ( ' + currDef.trim() + ' ) ';

            // 7. replace definition with formatted version
            entry[currType].DEFINITIONS[j].text = currDef.toLowerCase();

            //console.log("After:");
            //console.log( entry[currType].DEFINITIONS[j].text);
        } // end for
    } // end for

    return entry;
}

// ------------------ Meter API Calls ------------------------
function meterAPICalls(apiCall, options, bodyLength, id, apiKey){

    pool.getConnection(function(err, connection) {
        if(err) {
            console.error('DB Error in meterAPICalls(): ' + err);
        }
        connection.query(C.API_CALLS_INSERT_QUERY, {Email: id,
            API_Key: apiKey,
            API_Call: apiCall,
            API_Call_Options: options,
            Body_Length: bodyLength}, function(err, result) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.error('Error while inserting API call: ' + err);
            }
        }); // end connection
    });

}

// ---------------------- Initial AAC Symbols Table in DB ---------------------

/*
 This function initializes the DB.aac_symbols table with details info on the symbols
 by querying the Bluemix container metadata.
 NOTE: This is a DB intialization that should only be run once by an admin.
 */
function initAACSymbolsTableInDB()
{

    bluemixContainers  = C.BLUEMIX_OBJECT_STORAGE_CONTAINERS;
    bluemixContainersMap = {};

    var dbConn =  mysql.createConnection({
        host : C.CC_DB_HOST,
        user : C.CC_DB_USER,
        password: C.CC_DB_PASS
    });

    dbConn.connect();
    dbConn.query("use "+C.CC_DB_NAME);

    initBluemixContainerMetaDataLookupMap();

    // https://github.com/ibm-bluemix-mobile-services/bluemix-objectstorage-serversdk-nodejs
    // NOTE (1): Use swift CLI to make sure container objects are readable
    // Command: swift post -r '.r:*' <container>
    //
    // NOTE (2) The insert operation is about 26k records. The script executes fast, but
    // May take some time before the records appear in the DB
    // Query "SHOW PROCESSLIST" will show status of batch insert
    //

    var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;

    var credentials = {
        projectId: C.BLUEMIX_OBJECT_STORAGE_PROJECT_ID, // projectID
        userId: C.BLUEMIX_OBJECT_STORAGE_USER_ID, // userID
        password: C.BLUEMIX_OBJECT_STORAGE_PASSWORD, // pass
        region: ObjectStorage.Region.DALLAS
    };

    var objStorage = new ObjectStorage(credentials);

    for(var i=0; i<bluemixContainers.length; i++){

        var containerName = bluemixContainers[i].name;

        if(C.DEBUG_VERBOSE_LOGGING) console.log("Processing container: " + containerName);

        objStorage.getContainer(containerName)
            .then(function(container) {
                return container;
            })
            .then(function(container) {
                return container.listObjects();
            })
            .then(function(objectList) {

                if(C.DEBUG_VERBOSE_LOGGING) console.log("Processing " + objectList.length + " objects in container");

                for(var j=0; j<objectList.length; j++)
                {
                    var obj = objectList[j];

                    var objectName = (obj.name).substr(0, (obj.name).lastIndexOf('.')) || obj.name; // remove file extension
                    objectName = objectName.replace(/_/g, ' '); // now replace underscores with spaces

                    var url = obj.baseResourceUrl;

                    var currContainer = hasBluemixContainerMetaDataMapEntry(containerName);
                    if(currContainer === undefined){
                        if(C.DEBUG_VERBOSE_LOGGING) console.log("ERROR currContainer is UNDEFINED!");
                        return;
                    }

                    //console.log(objectName);
                    //console.log(url);
                    //console.log(currContainer);

                    dbConn.query(C.AAC_SYMBOLS_INSERT_QUERY,
                        {name: objectName,
                            image_url: url,
                            source: currContainer.name,
                            source_url: currContainer.images_source_url,
                            primary_author: currContainer.primary_author,
                            license: currContainer.license,
                            license_url: currContainer.license_url},
                        function(err, result) {
                            if (err) {
                                console.error('Error while inserting aac symbol row: ' + err);
                            }
                        }); // end connection.query

                } // end for

                if(C.DEBUG_VERBOSE_LOGGING)console.log("Completed processing for " + containerName);
            })
            .catch(function(err) {
                console.log(err);
            });
        // } // end if containers.hasOwnProperty(i)

    }// end for


}

/*
 This function initializes the aac_symbols full-text-search json, AACSymbols.json
 NOTE: This should only be run once by an admin.
 */
function saveAACSymbolsFullTextSearch(){

    /* NOTE This is a memory expensive operation, so start server with
     node --max_old_space_size=9100  server.js
     */

    if(C.DEBUG_VERBOSE_LOGGING)console.log(getLoggingTimestamp() +' saveAACSymbolsFullTextSearch()');

    pool.getConnection(function(err, connection) {
        if(err) {
            console.error('DB Error during saveAACSymbolsFullTextSearch(): ' + err);
        }
        connection.query(C.AAC_SYMBOLS_QUERY, [], function(err, results) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.error('Error while querying for aac symbols : ' + err);
            }
            else if(results[0] === undefined){ // Didn't find any demo users
                if(C.DEBUG_VERBOSE_LOGGING)console.log('No aac symbols found in the DB. ');
            }
            else {
                try{
                    var search = new fulltextsearchlight({
                        ignore_case: true,
                        index_amount: 4   // more indexes faster search, but more memory. Can cause crash
                    });

                    search.drop();

                    var i = null;
                    for (i = 0; results.length > i; i += 1) {
                        var obj = {
                            name: results[i].name.toLowerCase().trim(),
                            image_url : results[i].image_url,
                            source: results[i].source,
                            source_url: results[i].source_url,
                            primary_author: results[i].primary_author,
                            license: results[i].license,
                            license_url: results[i].license_url
                        }
                        // Add the AAC symbols object to full text search
                        search.add(obj);
                        if(C.DEBUG_VERBOSE_LOGGING)console.log("added " + results[i].name + " : i = " + i);
                    }
                    if(C.DEBUG_VERBOSE_LOGGING)console.log("Add " + i + " objects to search");

                    // Save symbols to JSON file
                    search.saveSync('./model/AACSymbols.json');

                    if(C.DEBUG_VERBOSE_LOGGING)console.log("Completed saveSync");

                }
                catch(e){
                    console.error("EXCEPTION: " +e);
                }

            }
        }); // end connection
    }); // end pool

}

/* Full text search on the AAC Symbols map */
function initFullTextSearchLoaded(){

    try{
        full_txt_search_loaded = fulltextsearchlight.loadSync('./model/AACSymbols.json');
    }
    catch(e){
        console.error(e);
    }
}



function initAACSymbolsMap(){

    //console.log(getLoggingTimestamp() +' initAACSymbolsMap()');

    pool.getConnection(function(err, connection) {
        if(err) {
            console.error('DB Error during initAACSymbolsMap(): ' + err);
        }
        connection.query(C.AAC_SYMBOLS_QUERY, [], function(err, results) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.error('Error while querying for aac symbols : ' + err);
            }
            else if(results[0] === undefined){ // Didn't find any demo users
                console.error('No aac symbols found in the DB. ');
            }
            else {
                var i = null;
                for (i = 0; results.length > i; i += 1) {
                    var key = results[i].name.toLowerCase().trim();
                    var val = {
                        image_url : results[i].image_url,
                        source: results[i].source,
                        source_url: results[i].source_url,
                        primary_author: results[i].primary_author,
                        license: results[i].license,
                        license_url: results[i].license_url

                    }
                    AACSymbolsMap[key] = val;
                }
                //console.log("AACSymbolsMap has " + Object.keys(AACSymbolsMap).length + " elements");

                //console.log(AACSymbolsMap);
            }
        }); // end connection
    }); // end pool

}

var hasExactMatchAACSymbolsEntry = function(symbolName) {

    if(symbolName == null || symbolName == undefined)
        return undefined;

    var key = symbolName.toLowerCase().trim();
    return AACSymbolsMap[key];
};

// Added by Niyati 
//
// API - Tone Analyzer
//
/* Sample curl invocation

 curl -i -X POST -H 'Content-Type: application/json' -d '{"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","data":"Players on the batting team take turns hitting against the pitcher of the fielding team, which tries to prevent runs by getting hitters out in any of several ways. A player on the batting team who reaches a base safely can later attempt to advance to subsequent bases during teammates turns batting, such as on a hit or by other means. The teams switch between batting and fielding whenever the fielding team records three outs. One turn batting for both teams, beginning with the visiting team, constitutes an inning. A game is composed of nine innings, and the team with the greater number of runs at the end of the game wins. Baseball has no game clock, although almost all games end in the ninth inning."}' http://localhost:3000/api/V1/analyze-tone
 */

var apiToneAnalyzerURL = function(req, res) {
    return processURLAndCallAPI(doAPIToneAnalyzer, req, res);
};

var apiToneAnalyzer = function(req, res) {
    var text = req.body.data;
    return doAPIToneAnalyzer(text, req, res);
};
var doAPIToneAnalyzer = function(text, req, res) {

    text = stripHTMLFormatting(text);

    //console.log("text is " + text);
    var toneResponse="";
    var originalText=text;
    var reqParams = req.body;

    if(C.DEBUG_VERBOSE_LOGGING)console.log("apitoneAnalyzer - Parameters:");
    // console.log(reqParams);

    var textToAnalyze="";
    var level="";
    var mode="";
    var document_tone="";
    var sentences_tone="";
    var tmpresp={};

    if(reqParams === undefined || reqParams === null){
        if(C.DEBUG_VERBOSE_LOGGING)console.log("The params JSON array was not defined.");
        res.writeHead(200, {"Content-Type": "application/json"});
        var responseObj = { status: "error", code: 500, params : "The messages JSON array was not defined." };
        var json = JSON.stringify(responseObj);
        res.end(json);
        return;
    }

    /*
     * Example Expected Input Messages JSON array format: { "Level": "document",
     * "Mode": "tone", "Text": "it is interesting to go through the NLP info
     * too. For example it found basically 4 \"sentences\"" }
     */
    if(reqParams !== undefined && reqParams !== null){
        try{
            textToAnalyze = text;
            level=reqParams.Level;
            mode=reqParams.Mode;
        }
        catch(e){
            console.error(e);
        }
    }

    var parameters = {
        text: textToAnalyze,
        tones: C.TONEANALYZER_DEFAULT_TONE
        //isHTML:true

    };

    // var parameters=textToAnalyze;
    toneAnalyzer.doRequest(parameters, function(response) {

        if(response.body != null && response.body != undefined){

            tmpresp= { text:textToAnalyze, response:JSON.stringify(response,null,4), results:response.body };

            if(C.DEBUG_VERBOSE_LOGGING)console.log('temp response=== '+JSON.stringify(tmpresp.results.document_tone.tone_categories[0].category_name));


            toneResponse=toneResBuilder.toneAnalyzerGenerateResponseObj(level,mode,tmpresp.results, originalText);


            res.writeHead(200, {"Content-Type": "application/json"});

            var responseObj = toneResponse;

            var json = JSON.stringify(responseObj);

            res.end(json);
            return;
        }
        else{
            console.error('no response');
            return;
        }
    });	// end of do request


};


//
// API - Hyphenate
//
/* Sample curl invocation

curl -i -X POST -H 'Content-Type: application/json' -d '{"id":"demo-app@us.ibm.com","apikey":"7M0xQYZUa9CvCz8wPmCI","data":"A certain king had a beautiful garden.","options":{}}' http://localhost:3000/api/V1/hyphenate
 */

var apiHyphenate = function(req, res) {
    var text = req.body.data;
    return doAPIHyphenate(text, req, res);
};

var doAPIHyphenate = function(text, req, res) {

    //text = stripHTMLFormatting(text);
    
    var outputText="";
    var originalText=text;
    var reqParams = req.body;

    if(C.DEBUG_VERBOSE_LOGGING)console.log("apiHyphenate");

     var Hypher = require('hypher'),
        english = require('hyphenation.en-us'),
        h = new Hypher(english);

    var hyphenatedText = h.hyphenateText(originalText);    
    var outputText = hyphenatedText.replace(/\u00AD/g , "~");
    //console.log(outputText);

    res.writeHead(200, {"Content-Type": "application/json"});
    
    var responseObj = { status: "OK",
        usage: C.TERM_OF_USE_MESSAGE,
        original: originalText,
        hyphenation: outputText };    

    var json = JSON.stringify(responseObj);

    res.end(json);
    
    callMeterAPICalls(C.API_HYPHENATE, req, outputText);
    
    return;
 
};



// ------------------ Init Model -----------------------------------------
function initModel(){
    
    /* Set model dependencies global variables */
    
    var urlAACSymbols = C.CC_AACSymbols;
    var urlVocabulary = C.CC_Vocabulary;
    var urlCC_Thesaurus = C.CC_Thesaurus;  
    var modelDir = "./model/";
    
    // this code is run when the server is ready to accept connections
    console.log("Initing Model...");
    var start = new Date().getTime();

    var optionsA = {
        directory: modelDir,
        filename: urlAACSymbols.substring(urlAACSymbols.lastIndexOf('/')+1)
    };
    var optionsV = {
        directory: modelDir,
        filename: urlVocabulary.substring(urlVocabulary.lastIndexOf('/')+1)
    };
    var optionsT = {
        directory: modelDir,
        filename: urlCC_Thesaurus.substring(urlCC_Thesaurus.lastIndexOf('/')+1)
    };  
    

    download(urlVocabulary, optionsV, function(err){
        if (err) throw err
        console.log("Successfully downloaded "+ urlVocabulary);

    });
    
    download(urlCC_Thesaurus, optionsT, function(err){
        if (err) throw err
        console.log("Successfully downloaded "+ urlCC_Thesaurus);

    });
    
    download(urlAACSymbols, optionsA, function(err){
        if (err) throw err
        console.log("Successfully downloaded "+ urlAACSymbols);
        
        // Load everything else after last download.
        s_dictionary            = require('./model/s_dictionary.json');
        ignoreList              = require('./model/ignore_list.json');
        operationRulesList      = require('./model/operational_rule_replacements.json');
        blackList               = require('./model/blacklist.json');
        posList                 = require('./model/pos_tags.json');
        nonLiteralsList         = require('./model/non_literals.json');
        transitionsList         = require('./model/transitions.json');
        
        vocabulary = require('./model/vocabulary.json');
        thesaurus = require('./model/thesaurus.json');
        
        initVocabMap();
        initThesMap();
        initIgnoreListMap();
        initBlackListMap();
        initPOSLookupMap();
        initOperationalRulesMap();
        initSDictionaryMap();
        stanfordSimpleNLP.loadPipelineSync();
        //initFullTextSearchLoaded();
        initAppUsersMap();
        initAACSymbolsMap();       
        
        var end = new Date().getTime();
        var time = end - start;
        console.log('IBM AbilityLab Content Clarifier initialized in: ' + time + 'ms.');

    });

 }




// ------------------ Start Server and Initialize ------------------------

var cron = schedule.scheduleJob(C.POLL_FOR_NEW_USERS_CRON_FREQUENCY, function(){
    initAppUsersMap();
});

var server = app.listen(port,function(){

    // node --max_old_space_size=4096  server.js
    console.log("Node Express Server Started on PORT " + port);

    // initAACSymbolsTableInDB(); One time DB setup by admin
    // saveAACSymbolsFullTextSearch();   One time Full text search setup by admin

    // Initialize domain specific for conversation summarization
    domainKeywordsArr = ClarifierChatCondense.getDomainKeyWordsArr();
    questionArr = ClarifierChatCondense.getQuestionArr();
    throttleParticipantsMap = ClarifierChatCondense.getThrottleParticipantsMap();
    stopWordsArr = ClarifierChatCondense.getStopWordsArr();
    domainStopWordsArr = ClarifierChatCondense.getDomainStopWordsArr();

    //ClarifierChatCondense.getConversationSummary(testJSON, 0.85, "short", domainKeywordsArr, questionArr, throttleParticipantsMap, stopWordsArr, domainStopWordsArr); 
    //return;
    
    initModel();
 
});

// Disable server timeout to allow for longer requests
server.timeout = 0;
server.keepAliveTimeout = 0;

// Particularly bothersome server process that won't go away??
// ps aux | grep node
// kill -9 PID
