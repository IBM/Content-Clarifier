// Content Clarifier DB for User Authentication

// SETS STAGING OR PRODUCTION ENVIRONMENT (updates DB in code as well)
exports.CC_ENVIRONMENT = 'production';
//exports.CC_ENVIRONMENT = 'staging';

// Production ENV 
exports.CC_DB_PROD_USER          = 'admin';
exports.CC_DB_PROD_PASS          = 'RXUDVPEUTBVCLOIB';
exports.CC_DB_PROD_HOST          = 'sl-us-south-1-portal.47.dblayer.com'; 
exports.CC_DB_PROD_PORT          = 19279; 
exports.CC_DB_PROD_NAME          = 'cc_db_scalable_prod'; 
exports.CC_DB_PROD_CONN_LIMIT    = 151; 

// Staging ENV 
exports.CC_DB_STAGING_USER          = 'admin';
exports.CC_DB_STAGING_PASS          = 'OISYSWJPOTDAWHGS';
exports.CC_DB_STAGING_HOST          = 'sl-us-south-1-portal.47.dblayer.com'; 
exports.CC_DB_STAGING_PORT          = 19285; 
exports.CC_DB_STAGING_NAME          = 'cc_staging'; 
exports.CC_DB_STAGING_CONN_LIMIT    = 151; 

// Model on Cloud Object Storage
exports.CC_AACSymbols = "https://s3.us-east.cloud-object-storage.appdomain.cloud/cc-model/AACSymbols.json";
exports.CC_Vocabulary = "https://s3.us-east.cloud-object-storage.appdomain.cloud/cc-model/vocabulary.json";
exports.CC_Thesaurus = "https://s3.us-east.cloud-object-storage.appdomain.cloud/cc-model/thesaurus.json";

// Watson Text to Speech Credentials
exports.WATSON_TEXT_TO_SPEECH_USER = '4cdf6bd6-9190-4a16-9bf0-1733448a0a48';
exports.WATSON_TEXT_TO_SPEECH_PASS = 'TsJwCgVVMCtB';

//Watson Discovery credentials
/*exports.WATSON_DISCOVERY_USER = '0193eb9f-f6b9-42b0-b057-8dd59079e8d0';
exports.WATSON_DISCOVERY_PASS = 'D4QAcgIjZXuD';
exports.WATSON_DISCOVERY_URL = 'https://gateway.watsonplatform.net/discovery/api';
exports.WATSON_DISCOVERY_VERSION = '2018-08-15';
exports.WATSON_ENVIRONMENT_ID = '1461f47b-bd2c-4d38-96fe-a4ec6476127f';
exports.WATSON_COLLECTIONS_ID = 'a4330bc4-78fa-4a61-9bc7-528b07a9f835';
*/

//Watson Discovery credentials NEW - WSCOTT
exports.WATSON_DISCOVERY_USER = '0193eb9f-f6b9-42b0-b057-8dd59079e8d0';
exports.WATSON_DISCOVERY_PASS = 'D4QAcgIjZXuD';

exports.WATSON_DISCOVERY_IAM_APIKEY = 'Nn8mbriHKn-YLHACjbKQl17DyfRodmsXIBjdImirlsbv';
exports.WATSON_DISCOVERY_URL = 'https://gateway.watsonplatform.net/discovery/api';
exports.WATSON_DISCOVERY_VERSION = '2018-12-03';
exports.WATSON_ENVIRONMENT_ID = '4c20c655-ae39-4e90-821f-0e395b45fe2b';
exports.WATSON_COLLECTIONS_ID = 'd49b520e-1e72-417c-bc23-cc816bd581af';
exports.WATSON_CONFIGURATION_ID = 'd49b520e-1e72-417c-bc23-cc816bd581af';



//warning: Table names are case-sensitive
//Link:https://stackoverflow.com/questions/12895467/mysql-case-sensitive-table-names-in-queries
exports.API_KEY_QUERY = 'SELECT * FROM usr_api_keys WHERE lower(Email) = ? AND API_Key = ?';
exports.API_KEY_QUERY_BY_USERNAME = 'SELECT * FROM usr_api_keys WHERE lower(Email) = ?';
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
exports.API_ANALYZE_TONE='/api/V1/analyze-tone';
exports.API_ANALYZE_TONE_URL='/api/V1/analyze-tone-url';
exports.API_HYPHENATE='/api/V1/hyphenate';

// Summarize Chats
exports.API_CONDENSE_WW_CHAT = '/api/V1/condense-conversation';
exports.STATISTICAL_CLASSIFY_DEFAULT_THRESHOLD = 0.85; // .85 - .91 usually works
exports.DEFAULT_MESSAGE_FORMAT = 'short'; // message format for summarization { 'short', 'long'}


// Enhance Content Modes
exports.ENHANCE_TOPICS = 1; // reference data queried from semantic web
exports.ENHANCE_DEFINITIONS = 2; // plain English definitions
exports.ENHANCE_SYMBOLS = 3; // AAC Symbols

// Turns verbose logging to server on or off
exports.DEBUG_VERBOSE_LOGGING = false;

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
exports.BLUEMIX_OBJECT_STORAGE_PASSWORD = 'R[xOL07gA-Po3sR.';


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


exports.TERM_OF_USE_MESSAGE = 'By accessing Content Clarifier API or using information generated by Content Clarifier API, you are agreeing to be bound by the Content Clarifier API Terms of Use.';

//Added by Niyati
exports.TONEANALYZER_DEFAULT_TONE='emotion';
exports.TONEANALYZER_DEFAULT_OPTION=true;
exports.TONEANALYZER_DOCUMENT_LEVEL='document';
exports.TONEANALYZER_SENTENCE_LEVEL='sentence';
exports.TONEANALYZER_MODE_TONE='tone';
exports.TONEANALYZER_MODE_ASSERTIVE='assertiveness';




