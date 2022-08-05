var request = require('request');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
if (appEnv.isLocal) {
    appEnv.port = "3000";
    appEnv.urls = ["https://localhost:3000"];
    appEnv.url = "https://localhost:3000";
}

var bmInfo;

var VCAP_APPLICATION = process.env.VCAP_APPLICATION;
if (VCAP_APPLICATION == null) {
    bmInfo = {
        "deployment": "local",
        "API": "https://mccp.stage1.ng.bluemix.net",
        "DOC_ROOT": "https://www.stage1.ng.bluemix.net/docs/services",
        "OAUTH_ID": "ibma_ecs",
        "OAUTH_SECRET": "DN7XFtdYBgG5Ux9M",
        "LOCATION_DISPLAY_NAME": "Local",
        "ENDPOINT" : appEnv.url,
        "DCC_ENDPOINT": "https://localhost:9043",
        "DCC_INSTANCEID": "2d6ae983-3411-4cd5-bf86-8e5326115066",
        "DCC_USER": "user_2cb1a74c-9148-4d63-940b-c409822fc9b9",
        "DCC_PASS": "010da7df-1b62-46f0-ac11-5e245a6a30e4"
    };
} else {
    VCAP_APPLICATION = JSON.parse(VCAP_APPLICATION);
    // VCAP_APPLICATION:{"limits":{"mem":1536,"disk":1024,"fds":16384},"application_version":"6dd0f0eb-639c-4eab-bc55-17facbc69407","application_name":"Digital Content Checker-Test","application_uris":["ecs-checker-test.stage1.mybluemix.net"],"version":"6dd0f0eb-639c-4eab-bc55-17facbc69407","name":"Digital Content Checker-Test","space_name":"Enterprise Compliance - Stage","space_id":"d93237d8-0e92-43fe-acc1-d8740eef8ae2","uris":["ecs-checker-test.stage1.mybluemix.net"],"users":null,"application_id":"4255f8fb-4a09-4d9d-872a-5dbd34de13d6","instance_id":"b00c7d53821f40bf8e885c52b57fb5f8","instance_index":0,"host":"0.0.0.0","port":63225,"started_at":"2015-08-24 21:47:31 +0000","started_at_timestamp":1440452851,"start":"2015-08-24 21:47:31 +0000","state_timestamp":1440452851}
    // appURI = ecs-checker-test.stage1.mybluemix.net
    var appURI = VCAP_APPLICATION.application_uris[0];

    if (appURI.indexOf("stage1") != -1) {
        bmInfo = {
            "deployment": "stage1",
            "API": "https://mccp.stage1.ng.bluemix.net",
            "DOC_ROOT": "https://www.stage1.ng.bluemix.net/docs/services",
            "OAUTH_ID": "ibma_ecs",
            "OAUTH_SECRET": "DN7XFtdYBgG5Ux9M",
            "LOCATION_DISPLAY_NAME": "US Stage",
            "DCC_ENDPOINT": "https://ecs-checker-engine.stage1.mybluemix.net",
            "DCC_INSTANCEID": "2d6ae983-3411-4cd5-bf86-8e5326115066",
            "DCC_USER": "user_2cb1a74c-9148-4d63-940b-c409822fc9b9",
            "DCC_PASS": "010da7df-1b62-46f0-ac11-5e245a6a30e4"
        };
    } else if (appURI.indexOf("eu-gb") != -1) {
        bmInfo = {
            "deployment": "production",
            "API": "https://mccp.eu-gb.bluemix.net",
            "DOC_ROOT": "https://www.eu-gb.bluemix.net/docs/services",
            "OAUTH_ID": "ibma_ecs",
            "OAUTH_SECRET": "7qQkE6LDc7h2hQ2T",
            "OAUTH_SECRET_STAGE": "DN7XFtdYBgG5Ux9M",
            "LOCATION_DISPLAY_NAME": "United Kingdom",
            "DCC_ENDPOINT": "https://ecs-checker-engine.eu-gb.mybluemix.net",
            "DCC_INSTANCEID": "2d6ae983-3411-4cd5-bf86-8e5326115066",
            "DCC_USER": "user_2cb1a74c-9148-4d63-940b-c409822fc9b9",
            "DCC_PASS": "010da7df-1b62-46f0-ac11-5e245a6a30e4"
        };
    } else if (appURI.indexOf("au-syd") != -1) {
        bmInfo = {
            "deployment": "production",
            "API": "https://mccp.au-syd.bluemix.net",
            "DOC_ROOT": "https://www.eu-gb.bluemix.net/docs/services",
            "OAUTH_ID": "ibma_ecs",
            "OAUTH_SECRET": "7qQkE6LDc7h2hQ2T",
            "OAUTH_SECRET_STAGE": "DN7XFtdYBgG5Ux9M",
            "LOCATION_DISPLAY_NAME": "United Kingdom",
            "DCC_ENDPOINT": "https://ecs-checker-engine.au-syd.mybluemix.net",
            "DCC_INSTANCEID": "2d6ae983-3411-4cd5-bf86-8e5326115066",
            "DCC_USER": "user_2cb1a74c-9148-4d63-940b-c409822fc9b9",
            "DCC_PASS": "010da7df-1b62-46f0-ac11-5e245a6a30e4"
        };
    } else {
        // US Production
        bmInfo = {
            "deployment": "production",
            "API": "https://mccp.ng.bluemix.net",
            "DOC_ROOT": "https://www.ng.bluemix.net/docs/services",
            "OAUTH_ID": "ibma_ecs",
            "OAUTH_SECRET": "7qQkE6LDc7h2hQ2T",
            "OAUTH_SECRET_STAGE": "DN7XFtdYBgG5Ux9M",
            "LOCATION_DISPLAY_NAME": "US South",
            "DCC_ENDPOINT": "https://ecs-checker-engine.mybluemix.net",
            "DCC_INSTANCEID": "2d6ae983-3411-4cd5-bf86-8e5326115066",
            "DCC_USER": "user_2cb1a74c-9148-4d63-940b-c409822fc9b9",
            "DCC_PASS": "010da7df-1b62-46f0-ac11-5e245a6a30e4"
        };
    }
    bmInfo.ENDPOINT = "https://" + appURI;
}
module.exports = bmInfo;

function getInfo() {
    request(bmInfo.API + "/info", function(error, response, body) {
        if (!error && response.statusCode == 200) {
            bmInfo.INFO = JSON.parse(body);
        }
        if (!bmInfo.INFO) {
            getInfo();
        }
    });
}
getInfo();
