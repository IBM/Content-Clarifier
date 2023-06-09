// Watson Text to Speech Credentials
exports.WATSON_TEXT_TO_SPEECH_USER = '4cdf6bd6-9190-4a16-9bf0-1733448a0a48';
exports.WATSON_TEXT_TO_SPEECH_PASS = process.env.WATSON_TEXT_TO_SPEECH_PASS;

// Content Clarifier DB for User Authentication

// RIS Bluemix env
// Viewable with 'cf env phpmyadmin'
exports.CC_DB_USER = 'b8341838fbd43a';
exports.CC_DB_PASS = process.env.CC_DB_PASS;
exports.CC_DB_HOST = 'us-cdbr-iron-east-03.cleardb.net'; // RIS Bluemix env
exports.CC_DB_CONFIG_URL = 'cc-db-production.mybluemix.net'; // RIS Bluemix env
exports.CC_DB_NAME = 'ad_688ec7406009ac9'; // RIS Bluemix env

exports.API_KEY_QUERY = 'SELECT * FROM usr_api_keys WHERE lower(Email) = ? AND API_Key = ?';
exports.DEMO_USERS_QUERY = 'SELECT * FROM usr_api_keys';
exports.API_CALLS_INSERT_QUERY = 'INSERT INTO api_calls SET ?';
exports.POLL_FOR_NEW_USERS_CRON_FREQUENCY =  '0 * * * *';
exports.AAC_SYMBOLS_INSERT_QUERY = 'INSERT INTO aac_symbols SET ?';
exports.AAC_SYMBOLS_QUERY = 'SELECT * FROM aac_symbols';

// API Names
exports.API_CONTEXTUAL_SIMPLIFY = '/api/V1/contextual-simplify';
exports.API_CONTEXTUAL_SIMPLIFY_URL = '/api/V1/contextual-simplify-url';
exports.API_CONDENSE = '/api/V1/condense';
exports.API_CONDENSE_URL = '/api/V1/condense-url';
exports.API_CONDENSE_AND_SIMPLIFY = '/api/V1/condense-simplify';
exports.API_CONDENSE_AND_SIMPLIFY_URL = '/api/V1/condense-simplify-url';

// Summarize Chats
exports.API_CONDENSE_WW_CHAT = '/api/V1/condense-conversation';
exports.STATISTICAL_CLASSIFY_DEFAULT_THRESHOLD = 0.85;
exports.DEFAULT_MESSAGE_FORMAT = 'short'; // message format for summarization { 'short', 'long'}


// Enhance Content Modes
exports.ENHANCE_TOPICS = 1; // reference data queried from semantic web
exports.ENHANCE_DEFINITIONS = 2; // plain English definitions
exports.ENHANCE_SYMBOLS = 3; // AAC Symbols

// Turns verbose logging to server on or off
exports.DEBUG_VERBOSE_LOGGING = true;

// Regex used to strip special chars from beginning and end of a word
exports.CLEAN_WORD_REGEX = /^\W+|\W+$/g;

// Endpoint to query the semantic web
exports.SPARQl_ENDPOINT = 'http://dbpedia.org/sparql';

// If original word rank is less than this constant, no replacements are allowed
exports.MIN_FREQUENCY_RANK    = 900; // 1250?

// Maximum distances between words (in terms of ranking) for making a decision
exports.MAX_RANK_DISTANCE_FOR_DECISION = 1500; //3000;

// Min rank to allow a replacement. Prevents replacement with "overly" frequent words
exports.MIN_ALLOWED_REPLACEMENT_RANK = 205; // 300 ?

// Sets how "aggressive" the algorithm is in return simple English definitions.
exports.DEFAULT_RANK_THRESHOLD_FOR_PHRASE = 3000;

// Use Lemma for word if word doesn't have a thesaurus entry
exports.USE_LEMMAS = false; 

// Removes original words from output of form |_word_|
exports.MODE_REMOVE_ORIGINAL_WORDS = 1;

// Removes the original words from output of form |_word_| and removes the special chars of |^replacement^| in the output
exports.MODE_REMOVE_SPECIAL_CHARS = 2;

// Flag to calculating readability indexes on input and output
exports.RETURN_READING_LEVELS = 1;

// Default algorithm for condense if no option supplied. Options are abstraction and extraction
exports.DEFAULT_CONDENSE_ALGORITHM = "abstraction";

// Used for calculating confidence levels (note weights must equal 1)
exports.RANK_WEIGHT = 0.45;
exports.SYLLABLES_WEIGHT = 0.275;
exports.LENGTH_WEIGHT = 0.275;

// Used for Bluemix Object Storage
exports.BLUEMIX_OBJECT_STORAGE_PROJECT_ID = 'b4208fa2e35e4726ae3ec5da2e147ecf';
exports.BLUEMIX_OBJECT_STORAGE_USER_ID = '8e8fc52c4aaa461d89790842c8d8ad95';
exports.BLUEMIX_OBJECT_STORAGE_PASSWORD = process.env.BLUEMIX_OBJECT_STORAGE_PASSWORD;


exports.BLUEMIX_OBJECT_STORAGE_CONTAINERS = 
[
    {
        "name": 'coughdrop-symbols',
        "images_source_url":'https://www.opensymbols.org/',
        "primary_author":'CoughDrop',       
        "license":'CC',
        "license_url":'https://creativecommons.org/licenses/by/4.0/'
    },    
    {
        "name": 'arasaac',
        "images_source_url":'http://catedu.es/arasaac/',
        "primary_author":'Sergio Palao',
        "license":'CC BY-NC-SA',
        "license_url":'https://creativecommons.org/licenses/by-nc-sa/3.0/'
    },
    {
        "name": 'sclera',
        "images_source_url":'http://www.sclera.be/en/picto/overview',
        "primary_author":'Sclera',        
        "license":'CC BY-NC',
        "license_url":'https://creativecommons.org/licenses/by-nc/2.0/'
    },
    {
        "name": 'straight-street',
        "images_source_url":'http://straight-street.com/gallery.php',
        "primary_author":'Paxtoncrafts Charitable Trust',          
        "license":'CC BY-SA',
        "license_url":'http://creativecommons.org/licenses/by-sa/2.0/uk'
    },
    {
        "name": 'tarasolsymbols',
        "images_source_url":'http://www.tawasolsymbols.org/',
        "primary_author":'Mada, HMC and University of Southampton',
        "license":'CC BY-SA',
        "license_url":'http://creativecommons.org/licenses/by-sa/4.0/'
    }
];


/*exports.RANK_WEIGHT = 0.35;
exports.SYLLABLES_WEIGHT = 0.325;
exports.LENGTH_WEIGHT = 0.325;
*/

exports.MIN_CONFIDENCE_LEVEL_THRESHOLD = 16;
exports.OPERATIONALIZED_RULE_MIN = 90.000000000000000;
exports.OPERATIONALIZED_RULE_MAX = 96.000000000000000;
exports.MAX_CONFIDENCE_LEVEL = (Math.random() * (98.000000000000000 - 97.000000000000000) 
                          + 97.000000000000000).toFixed(15);


exports.TERM_OF_USE_MESSAGE = 'By accessing IBM AbilityLab Content Clarifier API or using information generated by IBM AbilityLab Content Clarifier API, you are agreeing to be bound by the IBM AbilityLab Content Clarifier API Terms of Use.';

