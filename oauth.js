
var request = require("request");


var NS = module.exports = {};

var redir = "https://contentclarifier.mybluemix.net/auth/sso/callback";
var authorizationEndpoint = "https://mccp.ng.bluemix.net/login";
NS.getAccessToken = function(code, callback) {
	
        console.log("Getting Access token");
	request.post(authorizationEndpoint+"/oauth/token", 
		{
			'auth': {
				'user': 'ibma_clarifier',
				'pass': process.env.OATH_PASS
        	}
		},
		function(error, response, body) {
                        console.log("Getting Access function");
                        console.log("body: "+body);
                    
			callback(JSON.parse(body))
		}
	)
    .form({
    	"client_id" : 'ibma_clarifier',
    	"grant_type" : "authorization_code",
    	"code" : code,
    	"redirect_uri" : redir
    });
}

NS.getUserInfo = function(token, callback) {

  if (!authorizationEndpoint) {
      process.nextTick(function() {
         NS.getUserInfo(token,callback); 
      });
      return;
  }
  request.get(authorizationEndpoint+"/userinfo",
    {
      'auth': {
        'bearer': token.access_token
      }
    },
    function(error, response, body) {
        try {
          callback(JSON.parse(body))
        } catch (e) {
            console.log(e, body);
            throw e;
        }
    });
}

NS.hasUserRole = function(token, space_guid, role, callback) {

	request.get(authorizationEndpoint+"/rolecheck?space_guid="+space_guid+"&role="+role,
		{
			'auth': {
				'bearer': token.access_token
			}
		},
		function(error, response, body) {
            callback(JSON.parse(body).hasaccess);
		}
	);
};
	
NS.checkAuthInst = function(instance, req, method, callback) {
    /*
    if (bmInfo.deployment == "local") {
        callback(true);
        return;        
    }
    */
    if (!instance || instance.state != "enabled") {
        callback(false, {
            "result" : "ERROR",
            "type" : "PARAM_Invalid",
            "messageId" : "ERR_PARAM_Invalid_InstanceId"
        });
        return;
    }
    
    var authorization = req.headers["authorization"];
    var user = null;
    if (authorization) {
        if ("Basic " == authorization.substring(0,"Basic ".length)) {
            var basicAuthEncoded = authorization.substring(6);
            var basicAuthDecoded = new Buffer(basicAuthEncoded, 'base64').toString("ascii");
            var split = basicAuthDecoded.split(":");

            if (split.length == 2) {
                if ((instance.genName == split[0]) &&
                    (instance.genPassword == split[1]))
                {
                    callback(true);
                    return;
                }
            }
        }
    }
    
    if (req.session.USER_ID) {
        var token = req.session.USER_TOKEN;
    /*    if (bmInfo.deployment != "production" && "68754374-8c19-47fe-bb10-6340cd707003" == instance._id)
        {
            callback(true);
            return;
        } */
        NS.hasUserRole(token, instance.space_guid, "developers", function(hasaccess) {
            if (hasaccess) {
                var domain = req.session.USER_DOMAIN;
                if (domain && instance.userDomains.indexOf(domain) == -1) {
                    instance.userDomains.push(domain);
                    instance.save();
                }

                callback(true);
                return;
            } else {
                callback(false, {
                    "result" : "ERROR",
                    "type" : "UNAUTHORIZED",
                    "messageId" : "ERR_UNAUTHORIZED",
                    "sectype" : "SECURITY_AUTHZ"
                });
                return;
            }
        });
    } else {
        callback(false, {
            "result" : "ERROR",
            "type" : "AUTHENTICATION",
            "messageId" : "ERR_UNAUTHORIZED",
            "sectype" : "SECURITY_AUTHZ"
        });
        return;
    }
}
