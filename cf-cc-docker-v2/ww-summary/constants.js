

// Content Clarifier DB for User Authentication
exports.CC_DB_CONNECTION_LIMIT = 3;
exports.CC_DB_USER = 'bbf6c2009cbaab';
exports.CC_DB_PASS = '161bb91e';
exports.CC_DB_HOST = 'us-cdbr-iron-east-04.cleardb.net';
exports.CC_DB_CONFIG_URL = 'content-clarifier-db.mybluemix.net';
exports.CC_DB_NAME = 'ad_ca4af2a12d9dc63';
exports.SELECT_TARGETSPACE = 'SELECT * FROM ww_chat_summarization WHERE SourceSpaceID = ?';
exports.SELECT_TARGETSPACE_NAME = 'SELECT * FROM ww_chat_summarization WHERE SourceSpaceName = ?';
exports.INSERT_NEWSPACE = 'INSERT INTO ww_chat_summarization SET ?';
exports.UPDATE_EXISTING_SPACE = 'UPDATE ww_chat_summarization SET TargetSpaceName = ?, TargetSpaceID = ? WHERE SourceSpaceName = ?';
exports.UPDATE_EXISTINGSPACE_TARGETID = 'UPDATE ww_chat_summarization SET  TargetSpaceID = ? WHERE TargetSpaceName = ?';





// Used for Bluemix Object Storage
exports.BLUEMIX_OBJECT_STORAGE_PROJECT_ID = 'b4208fa2e35e4726ae3ec5da2e147ecf';
exports.BLUEMIX_OBJECT_STORAGE_USER_ID = '8e8fc52c4aaa461d89790842c8d8ad95';
exports.BLUEMIX_OBJECT_STORAGE_PASSWORD = 'R[xOL07gA-Po3sR.';









