/*istanbul ignore next*/'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webapp = exports.challenge = exports.verify = exports.echo = undefined;


var /*istanbul ignore next*/_express = require('express');

/*istanbul ignore next*/var _express2 = _interopRequireDefault(_express);

var /*istanbul ignore next*/_request = require('request');

/*istanbul ignore next*/var request = _interopRequireWildcard(_request);

var hashmap = require('hashmap');


var /*istanbul ignore next*/_util = require('util');

/*istanbul ignore next*/var util = _interopRequireWildcard(_util);

var /*istanbul ignore next*/_bodyParser = require('body-parser');

/*istanbul ignore next*/var bparser = _interopRequireWildcard(_bodyParser);

var /*istanbul ignore next*/_crypto = require('crypto');

var /*istanbul ignore next*/_http = require('http');

/*istanbul ignore next*/var http = _interopRequireWildcard(_http);

var /*istanbul ignore next*/_https = require('https');

/*istanbul ignore next*/var https = _interopRequireWildcard(_https);

var /*istanbul ignore next*/_oauth = require('./oauth');

/*istanbul ignore next*/var oauth = _interopRequireWildcard(_oauth);

var /*istanbul ignore next*/_ssl = require('./ssl');

/*istanbul ignore next*/var ssl = _interopRequireWildcard(_ssl);

var /*istanbul ignore next*/_debug = require('debug');

/*istanbul ignore next*/var _debug2 = _interopRequireDefault(_debug);


// setup DB connection
var mysql      = require('mysql');
var C          = require('../constants.js');

   	var date = new Date();
		var date2 = new Date();
		var lastweek = date.setDate(date.getDate() - 10);
		var thisweek = date2.setDate(date2.getDate());


process.on('uncaughtException', function (err) { 
     console.log("EXCEPTION detected in server:");
     console.error(err); 

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

var pool  = mysql.createPool({
  host     : C.CC_DB_HOST,
  user     : C.CC_DB_USER,
  password : C.CC_DB_PASS,
  database : C.CC_DB_NAME    
});


function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Debug log
// A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

var log = /*istanbul ignore next*/(0, _debug2.default)('watsonwork-echo-app');


var matchTuple={};
var momentTuple={};
var conversationmap = new hashmap(); 
var momentmap = new hashmap(); 
var messagecount=0;
var currentmessagetime;
var lastmessagetime=0;
var timer;
var momentid;
var data;
var inputjson = [];




// Echoes Watson Work chat messages containing 'hello' or 'hey' back
// to the space they were sent to
var echo = /*istanbul ignore next*/exports.echo = function echo(appId, token) /*istanbul ignore next*/{
  return function (req, res) {


res.status(201).end();

      

         /********************************************* Coversation-Moment Event ***************************************************************************************/

	//if (req.body.annotationType === 'conversation-moment' && req.body.spaceId== '5717e0d09932fed8d0ed575d'){
/*
        if(req.body.type == 'message-created' && req.body.content === 'RunSummary'){
          	 log('reached Summary run loop',"Success");
 	

          	conversationmap.forEach(function(value, key) {
   		 		//content = content+conversationmap.get(key).messages+". ";

				data = { 
					ParticipantName: conversationmap.get(key).user,
                                	Message:conversationmap.get(key).message,
                                	MessageId: conversationmap.get(key).messageid,
                                	TimeStamp: conversationmap.get(key).time 
					};
	     			inputjson.push(data);
 
             			conversationmap.remove(key);
        	        	});
       			var json = inputjson;
                      //  var testjson = JSON.parse(json);
                        inputjson=[];
       			console.log("Final content : " + json);
       			ccrequest(json, token, req.body.spaceId )
          	
          }


         if(req.body.type == 'message-created' && req.body.content === '/CC summary last 2 days'){
          	 log('GetSummary for Last 10 days',"Success");
                  	var date = new Date();
		var date2 = new Date();
		var lastweek = date.setDate(date.getDate() - 2);
		var thisweek = date2.setDate(date2.getDate());

          	  getmessage(req.body.spaceId,  token(),lastweek, thisweek, function (err, res) {
          			if (!err){
                                     log('got message from space %s', res.data.conversation.messages);
                                     var items = res.data.conversation.messages.items;
 				     for (var i=items.length-1; i>0; i--){
                                        log('Dispayname: ',items[i].createdBy.displayName);
			                  log('Message :',items[i].content);
                                         
                                     if(items[i].content !== undefined && items[i].content !== null){
					data = { 
						ParticipantName: items[i].createdBy.displayName,
                                		Message:items[i].content,
                                		MessageId: items[i].id,
                                		TimeStamp: new Date(items[i].created).getTime()
						};
                                          inputjson.push(data);
				     }
					
                                     }//close for items.length
                                     var json = inputjson;
                        	     inputjson=[];
       				     console.log("Final content : " +JSON.stringify(json));
       				     ccrequest(json, token, req.body.spaceId)
				     }//close if error
                                 
        	         }); 
          	
          } */

        if (req.body.annotationType === 'conversation-moment'){
           var momentsummary;
          
                log('Moment Event summary******************',req.body);
                log('Moment id json******************',JSON.parse(req.body.annotationPayload));

                        var startTimeStamp = JSON.parse(req.body.annotationPayload).startMessage.published;
                        var endTimeStamp = JSON.parse(req.body.annotationPayload).lastUpdatedMessage.published;

                if(momentmap.has(req.body.spaceId)){
                    log('Existing Space Entry for Moments',req.body.spaceId+"  :  "+req.body.annotationId);
                    momentsummary = momentmap.get(req.body.spaceId);
                    momentid= momentsummary.annotationId;
                    log('Checking if existing moment is equal',momentid +" ==? "+req.body.annotationId);
                    if(momentid !== req.body.annotationId && conversationmap !== undefined ){
  			momentmap.set(req.body.spaceId, req.body);
         		log('New Moment ID is generated, Pulling the summary date for Old Moment',momentid);
                        var startTimeStamp = JSON.parse(momentsummary.annotationPayload).startMessage.published;
                        var endTimeStamp = JSON.parse(momentsummary.annotationPayload).lastUpdatedMessage.published;
                         log('StartTime : ',startTimeStamp);
			 log('EndTime : ',endTimeStamp);
                         getmessage(req.body.spaceId,  token(),startTimeStamp, endTimeStamp, function (err, res) {
          			if (!err){
                                     log('got message from space %s', res.data.conversation.messages);
                                     var items = res.data.conversation.messages.items;
 				     for (var i=items.length-1; i>=0; i--){
                                        log('Dispayname: ',items[i].createdBy.displayName);
			                  log('Message :',items[i].content);
                                         
                                     if(items[i].content !== undefined && items[i].content !== null){
					data = { 
						ParticipantName: items[i].createdBy.displayName,
                                		Message:items[i].content,
                                		MessageId: items[i].id,
                                		TimeStamp: new Date(items[i].created).getTime()
						};
                                          inputjson.push(data);
				     }
					
                                     }//close for items.length
                                     var json = inputjson;
                        	     inputjson=[];
       				     console.log("Final content : " +JSON.stringify(json));
       				     ccrequest(json, token, req.body.spaceId)
				     }//close if error
                                 
        	         }); 
       			
      		    }else if(momentid === req.body.annotationId){
                             log('Moment ID unchanged for the existing space',req.body.annotationId);
                                momentmap.set(req.body.spaceId, req.body);
                    }
                }else{
                   log('New Space Entry for Moments',req.body.spaceId+"  :  "+req.body.annotationId);
                   momentmap.set(req.body.spaceId, req.body);
                  
                }
   	 } else if(req.body.annotationType === 'conversation-moment' && req.body.spaceId!== '5717e0d09932fed8d0ed575d'){
           log('Reached different moemnt loop',req.body);
          }//close if

         /********************************************* New Message Event ***************************************************************************************/

     	if (req.body.type == 'message-created' && req.body.userId !== appId){
    		log('Got a message %o', req.body);
                 if(req.body.content.includes('/CC create target')){
		 var targetspacename;
  		 var spacetextmessage;
                 var sourceSpaceName = req.body.spaceName;
                    log(sourceSpaceName);
			log(sourceSpaceName.startsWith('CC'));
			log(sourceSpaceName.endsWith('Summary'));
                 if(sourceSpaceName.startsWith('CC') && sourceSpaceName.endsWith('Summary')){
			var spacetextmessage = '*This message command is invalid for a target Summary space.✅ 👍 *';
 			sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
				  					if (!err) log('Sent message to space %s', req.body.spaceId);
			});  
                   return;
                 }

                pool.getConnection(function(err, connection) { 
			if(err) { 
      				console.log('DB Error in getting connection: ' + err); 
				connection.release();
				return;
      				
    			}

                        connection.query(C.SELECT_TARGETSPACE_NAME, [req.body.spaceName], function(err, results){
                            		
                                     if (err) {
             		        	console.log('Error while performing authenticationss for ID = ' + req.body.spaceId + ' : ' + err);  
					 connection.release();
				         return;    
            				}
          			     else {
                				console.log('Multiple SourceSpaceNames exists', results.length);
                                                
						if(results.length==0){
                                                        targetspacename = 'CC'+req.body.spaceName+'Summary';
							spacetextmessage = 'Create a space named *CC'+req.body.spaceName+'Summary* and install the Summarization App there';
                                                       console.log('textmessage returned is--->'+spacetextmessage );
						}else if(results.length>=1){
 							targetspacename = 'CC'+req.body.spaceName+'Summary'+(results.length);
                		            		spacetextmessage = 'Create a space named *CC'+req.body.spaceName+'Summary'+(results.length)+'* and install the Summarization App there';
						 console.log('textmessage returned is--->'+spacetextmessage );
                              
						
                                                }
						connection.query(C.INSERT_NEWSPACE, {SourceSpaceID: req.body.spaceId, SourceSpaceName: req.body.spaceName, TargetSpaceName:targetspacename},
						 function(err, result){
                            				

                           				if (err) {
								console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + err);  
                                                                if(err.code=='ER_DUP_ENTRY'){
									console.log('Duplicate entry exists.Retriving the existing record=  ' + req.body.spaceId + ' : ' + err); 	
									 connection.query(C.SELECT_TARGETSPACE, [req.body.spaceId], function(err, result){
                            						

		                   						 if (err) {
		     		        						console.log('Error while selcting results using sourceID = ' + req.body.spaceId + ' : ' + err);  
											connection.release();
									                return; 
		                 							}         
		    								 else if(result[0] === undefined){ // Didn't find this ID/API_Key combination
		        								console.log('No results returned for the given sourceID = ' + req.body.id); 
		        								
		  								 }
		  								else {
											console.log(' Results Identified for the given sourceID = ' + result[0]); 
											var targetid = result[0].TargetSpaceID;
											var targetname = result[0].TargetSpaceName;
											console.log('Identified targetId = ' + targetid);
											console.log('Identified targetname = ' + targetname);
											if(targetid == null || targetid == undefined || targetid == ""){
		        								 console.log('TargetSpace Not created Yet');
											 spacetextmessage = 'Target Space name *'+targetname+'* was already requested but is not Initialized 													      yet';
											}else {
												console.log('Already Created');
											  spacetextmessage = 'Target Space name *'+targetname+'* was already requested and  Initialized'; 													     
											}
											sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
				  								if (!err) log('Sent message to space %s', req.body.spaceId);
											});
		        								
		    								}
                       							 });
									
									
									  
								}
																							
             		        				connection.release();
 								return;          
            						}
                        				 else{
                               					 
								 console.log('Succesfully inserted data');
								sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
				  					if (!err) log('Sent message to space %s', req.body.spaceId);
								});   
								 connection.release();  
								return;
                          				}
                       				 });			
            				}		
				});  
		     
  		}); // end pool   
      
            } else if(req.body.content.includes('/CC init summary')){

                var targetspace = req.body.spaceName;
                var sourcespace = req.body.spaceName.substring(targetspace.indexOf("CC")+2, targetspace.lastIndexOf("Summary"));
                 log("SourceName : "+sourcespace);
                 log("Targetspace : "+targetspace);

                pool.getConnection(function(err, connection) {       
    			if(err) { 
      				console.log('DB Error in getting connection: ' + err); 
      				res.status(500).json({ error: 'DB Error occurred during API authentication.' });
    			}

                        connection.query(C.UPDATE_EXISTINGSPACE_TARGETID, [req.body.spaceId, 
                            targetspace], function(error, results, fields){
                            connection.release();

                           if (error) {
             		        console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + error);            
            			}
                            else if (results.affectedRows === 0){
                                  var spacetextmessage = "*This message command is invalid for a source space. Please run this Command in your assigned summary space*";
                                sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
		  			if (!err) log('Sent message to space %s', req.body.spaceId);
				});
                            }
                         else if (results.affectedRows != 0){

				console.log('Succesfully Updated data'+results.length);
				console.log(results.getTargetID);
 				   var spacetextmessage = 'Summarised content activated for the Space: *'+sourcespace+" ✅  👍 *";
                                sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
		  			if (!err) log('Sent message to space %s', req.body.spaceId);
				});
                          }
                        });
  		}); // end pool 
             } else if (req.body.content === 'GetInfo'){
			 pool.getConnection(function(err, connection) {       
    			if(err) { 
      				console.log('DB Error in getting connection: ' + err); 
      				res.status(500).json({ error: 'DB Error occurred during API authentication.' });
    			}

                        connection.query(C.SELECT_TARGETSPACE, [req.body.spaceId], function(err, result){
                            connection.release();

                           if (err) {
             		        console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + err);   
                         }         
            		else if(result[0] === undefined){ // Didn't find this ID/API_Key combination
                		console.log('The API Key could not be authenticated for ID = ' + req.body.id); 
                		res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
          		}
          		else {
                		console.log('[apiContextualSimplify] The authenticated user key is: ', result[0].TargetSpaceID);
                		
            		}
                        });
  		}); // end pool 
            } //end content CC
    	}
    
  };
};

var ccrequest = function ccrequest(messageblog, token, sourceSpaceID) {
        log('reached ccrequest', messageblog.length);
        if(messageblog !==[]){
	     	var replyMessage;

	     	var value = JSON.stringify({
	      		id: "demo-app@us.ibm.com",
	      		apikey: "7M0xQYZUa9CvCz8wPmCI",
	      		data:messageblog,
	      		options: {"classifierThreshold":0.85 }
	   	 });

	     	var request = new http.ClientRequest({
	      		//hostname: 'contentclarifier.mybluemix.net',
                        hostname: '169.46.23.129',
	      		port:"3000",
	      		path: "/api/V1/condense-ww-chat",
	      		method: "POST",
	      		headers: {
				"Access-Control-Allow-Headers": "*",
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
	      		}
	    	});


	    	request.on('error', function (err) {
	      		// Handle error
	      		log('request error %s', err);
	    	});

	    	request.end(value);

	     	request.on('response', function (response) {

	      		var data = '';
	      		response.setEncoding('utf8');
	      		response.on('data', function (chunk) {
                                log('done with ccrequest-new', chunk);
				data += chunk;
		 		
		 		

	      		});
                        response.on('end', function(){
  				var obj = JSON.parse(data);
				var targetSpace;
                                 getSpaceID(sourceSpaceID, function(err, res){
 					if (!err){
                                         log('Select Succesfull',+err);
					 targetSpace = res;
					}
					log('Status of the spaceID', targetSpace);
                                var status = obj['status'];
                                log('Status of the CC-Server', status);
 				if (messageblog != "" && obj != undefined && status !=="error") send(targetSpace, obj, token(), function (err, res) {
		  			if (!err) log('Sent message to space %s', '58c1c146e4b074e18c213a90');
				});
                                 });
				
			});
	    	});
        }else {
        	log('reached ccrequest empty message', messageblog);
        }
   
}


var getSpaceID = function getSpaceID(spaceId, cb){
  pool.getConnection(function(err, connection) {       
    			if(err) { 
      				console.log('DB Error in getting connection: ' + err); 
      				cb(err , null);
    			}

                        connection.query(C.SELECT_TARGETSPACE, [spaceId], function(err, result){
                            connection.release();

                           if (err) {
             		        console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + err);   
                         }         
            		else if(result[0] === undefined){ // Didn't find this ID/API_Key combination
                		console.log("No Results are avaible for the Select target Space"); 
                		
          		}
          		else {
                		console.log('TargetSpaceName for the given SourceName:  ', result[0].TargetSpaceID);
                		 cb(null, result[0].TargetSpaceID);
            		}
                        });
  		}); // end pool 

 
}

var sendSummarySpaceName = function sendSummarySpaceName(spaceId, text, tok, cb) {

    request.post(
    			'https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
      			headers: {
        			Authorization: 'Bearer ' + tok
      			},
      			json: true,
      			// An App message can specify a color, a title, markdown text and
      			// an 'actor' useful to show where the message is coming from
      			body: {
  				type: 'appMessage',
  				version: '1',

  				annotations:  [{
          				type: 'generic',
          				version: 1.0,
          				color: '#6CB7FB',
          				title: 'App Message',
          				text: text,
          				actor: {
            					name: ""
          				}
        		}] }	

    			}, (err, res) => {
      				if(err || res.statusCode !== 201) {
        				log('Error sending message %o', err || res.statusCode);
        				cb(err || new Error(res.statusCode));
        				return;
     		 		}
           
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });

}



// Send an app message to the conversation in a space
var send = function send(spaceId, text, tok, cb) {
  
   var outputmessages = [];
   var participant;
   var messagestext;
   var starttime;
   var endtime;
   var inputSentenceCount;
   var outputSentenceCount;
   var inputWordCount;
   var outputWordCount;
   var sentenceReductionPercent;
   var wordReductionPercent;
   var title2;
   var text2="";
 

   log('Reached CurrParitipantss', text['condensed'].length);

	for (var i=0; i<text['condensed'].length; i++){
                
    		participant= text['condensed'][i].ParticipantName;
    		messagestext = text['condensed'][i].Summarized_Message;
                starttime= text['condensed'][i].CC_SummaryStartTimeStamp;
		endtime= text['condensed'][i].CC_SummaryEndTimeStamp;
                inputSentenceCount= text['condensed'][i].CC_SummaryConvoSentenceCnt;
                outputSentenceCount= text['condensed'][i].CC_SummarySentenceCnt;
                inputWordCount= text['condensed'][i].CC_SummaryConvoWordCnt;
                outputWordCount= text['condensed'][i].CC_SummaryWordCnt;
               
              
                if(starttime != undefined && endtime != undefined && inputSentenceCount != undefined && outputSentenceCount != undefined && inputWordCount != undefined && outputWordCount != undefined && outputWordCount != 0){
                    	var startdate = new Date(starttime);
                    	var enddate = new Date(endtime);
               		var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];    
             		sentenceReductionPercent= (inputSentenceCount-outputSentenceCount)*100/inputSentenceCount;
              		wordReductionPercent= (inputWordCount-outputWordCount)*100/inputWordCount;
			console.log("REduced percentrage------------->" +wordReductionPercent);
			if(wordReductionPercent < 70)return;
                        title2= "CC-Conversation Summary: "+formatDate(startdate)+" "+days[startdate.getDay()]+", "+formatAMPM(startdate) +" - "+days[enddate.getDay()]+", "+formatAMPM(enddate)+"   ";
                        text2= text2+ " { Conversation Words: "+ inputWordCount+",  Summarization Words: "+outputWordCount+",  Reduced: "+wordReductionPercent.toFixed(2) +"% } \n\n"
              
              		//   outputmessages[i] = outputs2;
                }

    		log('entered For loop', participant);
               	if(participant != undefined && messagestext != undefined && participant != ""){
    		   text2 = text2 + "*"+participant+"*"+"\n"+ messagestext+"\n\n";
               }
 
      
    
	} 
  // log('Reached CurrParitipantss', outputmessages);
    if(text2!="" && title2!= undefined){
   request.post(
    			'https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
      			headers: {
        			Authorization: 'Bearer ' + tok
      			},
      			json: true,
      			// An App message can specify a color, a title, markdown text and
      			// an 'actor' useful to show where the message is coming from
      			body: {
  				type: 'appMessage',
  				version: '1',

  				annotations:  [{
          				type: 'generic',
          				version: 1.0,
          				color: '#6CB7FB',
          				title: title2,
          				text: text2,
          				actor: {
            					name: ""
          				}
        		}] }	

    			}, (err, res) => {
      				if(err || res.statusCode !== 201) {
        				log('Error sending message %o', err || res.statusCode);
        				cb(err || new Error(res.statusCode));
        				return
     		 		}
           
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });
    }else{
      log(' Empty Summary content, No Message sent to Space');
    }
};



// View a message from a Moment
var getmessage = function getmessage(spaceId, tok,starttime, endtime, cb) {
 	//log('Reached Get Message',spaceId);
  	request.post('https://api.watsonwork.ibm.com/graphql/' , {
    		headers: {
      			Authorization: 'Bearer ' + tok
    		},
    		json: true,
    		// An App message can specify a color, a title, markdown text and
    		// an 'actor' useful to show where the message is coming from
    		body: {
            		//"query": "query getConversation { conversation(id: \"4070eebaa56d51756753c69b5bf221ead9f959ac\") {id created updated messages(first: 50) { items { content contentType 				annotations } } } }",
            		//  "query": "query getSpace {  space(id: \"58c99350e4b0b552cfc3fad0\") { title  description membersUpdated members { items { email displayName } } conversation{  messages{ items 				{id  content }  } } } }",
            		// "query": "query getConversation { conversation(id: \"58c99350e4b0b552cfc3fad0\") { id created updated messages(first: 50) { items {id content updatedBy } } } }",
                	//"query":   "query getMessage { message(id: \"58dd7a5ce4b090f924ba380c\") { createdBy { displayName } } }",
                	//"operationName": "getMessage"

                    /*    "query": "query getConversation { conversation(id:\"58ee512fe4b0330c39acd0e8\"){ messages(oldestTimestamp: \"1492020289344\", mostRecentTimestamp: \"1492020380828\"){ items{id  content createdBy { displayName } } } } }" */
                        "query": "query getConversation { conversation(id:\"" + spaceId+ "\"){ messages(oldestTimestamp: \""+starttime+"\", mostRecentTimestamp: \""+endtime+"\"){ items{id  content created createdBy { displayName } } } } }"
                        
    		}
 	 }, function (err, res) {
    		if (err || res.statusCode !== 200) {
      			log('Error getting message %o', err || res.statusCode);
     			cb(err || new Error(res.statusCode));
      	     		return ;
    	    	}
               var result=res.body;
    		log('Get result %d, %o', res.statusCode, res.body);
    	    log('Get result2 %d, %o', res.statusCode, res.body.data.conversation.messages);
             log('Get result2 %d, %o', res.statusCode, res.body.data.conversation.messages.items[0].id);
    		//log('Get result2 %d, %o', res.statusCode, res.body.data.conversation.messages.items);
    		//  log('Get result3 %d, %o', res.statusCode,  JSON.parse(res.body).data.conversation.messages.items.content[0]);
    		//   log('Get result4 %d, %o', res.statusCode,  JSON.parse(res.body.data.conversation.messages.items).content[0]);
    		cb(null, result);
    		
  	  });
};


// Verify Watson Work request signature
var verify = /*istanbul ignore next*/exports.verify = function verify(wsecret) /*istanbul ignore next*/{
  return function (req, res, buf, encoding) {
    if (req.get('X-OUTBOUND-TOKEN') !== /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(buf).digest('hex')) {
      log('Invalid request signature');
      var err = new Error('Invalid request signature');
      err.status = 401;
      throw err;
    }
  };
};

// Handle Watson Work Webhook challenge requests
var challenge = /*istanbul ignore next*/exports.challenge = function challenge(wsecret) /*istanbul ignore next*/{
  return function (req, res, next) {
    if (req.body.type === 'verification') {
      log('Got Webhook verification challenge %o', req.body);
      var body = JSON.stringify({
        response: req.body.challenge
      });
      res.set('X-OUTBOUND-TOKEN', /*istanbul ignore next*/(0, _crypto.createHmac)('sha256', wsecret).update(body).digest('hex'));
      res.type('json').send(body);
      return;
    }
    next();
  };
};

// Create Express Web app
var webapp = /*istanbul ignore next*/exports.webapp = function webapp(appId, secret, wsecret, cb) {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, function (err, token) {
  log("started");
    if (err) {
      console.log('Error in authentication:', err);
      cb(err);
      return;
    }

    // Return the Express Web app
    cb(null, /*istanbul ignore next*/(0, _express2.default)()

    // Configure Express route for the app Webhook
    .post('/echo',

    // Verify Watson Work request signature and parse request body
    bparser.json({
      type: '*/*',
      verify: verify(wsecret)
    }),

    // Handle Watson Work Webhook challenge requests
    challenge(wsecret),

    // Handle Watson Work messages
    echo(appId, token)));
  });
};

var getSpace = function getSpace(spaceid, tok, cb){

   request.post('https://api.watsonwork.ibm.com/graphql/' , {
    		headers: {
      			Authorization: 'Bearer ' + tok
    		},
    		json: true,
    		body: {
            
                        //"query": "query getSpace { space(id: \""+spaceid+" \") { title  members { items { email } } } }"
                       // "query": "query getSpace { space(input: { title: \"ContentTestSpace\"}) { id  members { items { email } } } }"
                       // "query":" query getSpace {  space(id: "space-id") { title description membersUpdated members { items { email displayName } } conversation{ messages{ items { content } } } } }"
                       // "query getSpaces { spaces(first: 200) { items { id title } } }


                        "query": "mutation createSpace { createSpace(input: { title: \"ContentTestSpace\"}){ space { id } } }"
                       
    		}
 	 }, function (err, res) {
    		if (err || res.statusCode !== 200) {
      			log('Error getting space details %o', err || res.statusCode);
     			cb(err || new Error(res.statusCode));
      	     		return ;
    	    	}
               var result=res.body;
    		log('Get result %d, %o', res.statusCode, res.body);
    		cb(null, result);
    		
  	  });

}


var formatAMPM = function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours-5 + ':' + minutes + ' ' + ampm;
  return strTime;
}

var formatDate = function formatDate(value)
{
   return value.toLocaleDateString(); 
} 


// App main entry point
var main = function main(argv, env, cb) {
  // Create Express Web app
  webapp(env.ECHO_APP_ID, env.ECHO_APP_SECRET, env.ECHO_WEBHOOK_SECRET, function (err, app) {
    if (err) {
      cb(err);
      return;
    }

    if (env.PORT) {
      // In a hosting environment like Bluemix for example, HTTPS is
      // handled by a reverse proxy in front of the app, just listen
      // on the configured HTTP port
      log('HTTP server listening on port %d', env.PORT);
      http.createServer(app).listen(env.PORT, cb);
    } else
      // Listen on the configured HTTPS port, default to 443
      ssl.conf(env, function (err, conf) {
        if (err) {
          cb(err);
          return;
        }
        var port = env.SSLPORT || 443;
        log('HTTPS server listening on port %d', port);
        https.createServer(conf, app).listen(port, cb);
      });
  });
};

if (require.main === module) main(process.argv, process.env, function (err) {
  if (err) {
    console.log('Error starting app:', err);
    return;
  }

  log('App started');
  log(date);
  log(date2);
log(thisweek);
log(lastweek);

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hcHAuanMiXSwibmFtZXMiOlsicmVxdWVzdCIsInV0aWwiLCJicGFyc2VyIiwiaHR0cCIsImh0dHBzIiwib2F1dGgiLCJzc2wiLCJsb2ciLCJlY2hvIiwiYXBwSWQiLCJ0b2tlbiIsInJlcSIsInJlcyIsInN0YXR1cyIsImVuZCIsImJvZHkiLCJ0eXBlIiwidXNlcklkIiwicmVzcG9uc2VtZXNzYWdlIiwiY29udGVudCIsInZhbHVlIiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwiYXBpa2V5IiwiZGF0YSIsIm9wdGlvbnMiLCJDbGllbnRSZXF1ZXN0IiwiaG9zdG5hbWUiLCJwYXRoIiwibWV0aG9kIiwiaGVhZGVycyIsIm9uIiwiZXJyIiwicmVzcG9uc2UiLCJzZXRFbmNvZGluZyIsImNodW5rIiwicGFyc2UiLCJjb25kZW5zZWQiLCJzZW5kIiwic3BhY2VJZCIsImZvcm1hdCIsInVzZXJOYW1lIiwidGV4dCIsInRvayIsImNiIiwicG9zdCIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwidmVyc2lvbiIsImFubm90YXRpb25zIiwiY29sb3IiLCJ0aXRsZSIsImFjdG9yIiwibmFtZSIsInN0YXR1c0NvZGUiLCJFcnJvciIsInZlcmlmeSIsIndzZWNyZXQiLCJidWYiLCJlbmNvZGluZyIsImdldCIsInVwZGF0ZSIsImRpZ2VzdCIsImNoYWxsZW5nZSIsIm5leHQiLCJzZXQiLCJ3ZWJhcHAiLCJzZWNyZXQiLCJydW4iLCJjb25zb2xlIiwibWFpbiIsImFyZ3YiLCJlbnYiLCJFQ0hPX0FQUF9JRCIsIkVDSE9fQVBQX1NFQ1JFVCIsIkVDSE9fV0VCSE9PS19TRUNSRVQiLCJhcHAiLCJQT1JUIiwiY3JlYXRlU2VydmVyIiwibGlzdGVuIiwiY29uZiIsInBvcnQiLCJTU0xQT1JUIiwicmVxdWlyZSIsIm1vZHVsZSIsInByb2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFHQTs7OztBQUNBOzs0QkFBWUEsTzs7QUFDWjs7NEJBQVlDLEk7O0FBQ1o7OzRC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LElBQUl1QyxRQUFRYixJQUFSLEtBQWlCYyxNQUFyQixFQUNFZCxLQUFLZSxRQUFRZCxJQUFiLEVBQW1CYyxRQUFRYixHQUEzQixFQUFnQyxVQUFDeEMsR0FBRCxFQUFTO0FBQ3ZDLE1BQUdBLEdBQUgsRUFBUTtBQUNOcUMsWUFBUS9ELEdBQVIsQ0FBWSxxQkFBWixFQUFtQzBCLEdBQW5DO0FBQ0E7QUFDRDtBQUNEMUIsTUFBSSxhQUFKO0FBQ0QsQ0FORCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBIHNhbXBsZSBjaGF0Ym90IGFwcCB0aGF0IGxpc3RlbnMgdG8gbWVzc2FnZXMgcG9zdGVkIHRvIGEgc3BhY2UgaW4gSUJNXG4vLyBXYXRzb24gV29ya3NwYWNlIGFuZCBlY2hvZXMgaGVsbG8gbWVzc2FnZXMgYmFjayB0byB0aGUgc3BhY2VcblxuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgKiBhcyByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCAqIGFzIGJwYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xuaW1wb3J0ICogYXMgb2F1dGggZnJvbSAnLi9vYXV0aCc7XG5pbXBvcnQgKiBhcyBzc2wgZnJvbSAnLi9zc2wnO1xuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJztcblxuLy8gRGVidWcgbG9nXG5jb25zdCBsb2cgPSBkZWJ1Zygnd2F0c29ud29yay1lY2hvLWFwcCcpO1xuXG4vLyBFY2hvZXMgV2F0c29uIFdvcmsgY2hhdCBtZXNzYWdlcyBjb250YWluaW5nICdoZWxsbycgb3IgJ2hleScgYmFja1xuLy8gdG8gdGhlIHNwYWNlIHRoZXkgd2VyZSBzZW50IHRvXG5cbmV4cG9ydCBjb25zdCBlY2hvID0gKGFwcElkLCB0b2tlbikgPT4gKHJlcSwgcmVzKSA9PiB7XG4gIC8vIFJlc3BvbmQgdG8gdGhlIFdlYmhvb2sgcmlnaHQgYXdheSwgYXMgdGhlIHJlc3BvbnNlIG1lc3NhZ2Ugd2lsbFxuICAvLyBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gIHJlcy5zdGF0dXMoMjAxKS5lbmQoKTtcblxuICAvLyBPbmx5IGhhbmRsZSBtZXNzYWdlLWNyZWF0ZWQgV2ViaG9vayBldmVudHMsIGFuZCBpZ25vcmUgdGhlIGFwcCdzXG4gIC8vIG93biBtZXNzYWdlc1xuICAvL2Fubm90YXRpb25UeXBlIFxuICBsb2coJ1JlcG9ydGluZyB0aGUgRXZlbnQgJW8nLCByZXEuYm9keSk7XG4gIGlmKHJlcS5ib2R5LnR5cGUgIT09ICdtZXNzYWdlLWNyZWF0ZWQnIHx8IHJlcS5ib2R5LnVzZXJJZCA9PT0gYXBwSWQpXG4gICAgcmV0dXJuO1xuXG4gIGxvZygnR290IGEgbWVzc2FnZSAlbycsIHJlcS5ib2R5KTtcblxuICAvLyBSZWFjdCB0byAnaGVsbG8nIG9yICdoZXknIGtleXdvcmRzIGluIHRoZSBtZXNzYWdlIGFuZCBzZW5kIGFuIGVjaG9cbiAgLy8gbWVzc2FnZSBiYWNrIHRvIHRoZSBjb252ZXJzYXRpb24gaW4gdGhlIG9yaWdpbmF0aW5nIHNwYWNlXG4gLyogaWYocmVxLmJvZHkuY29udGVudFxuICAgIC8vIFRva2VuaXplIHRoZSBtZXNzYWdlIHRleHQgaW50byBpbmRpdmlkdWFsIHdvcmRzXG4gICAgLnNwbGl0KC9bXkEtWmEtejAtOV0rLylcbiAgICAvLyBMb29rIGZvciB0aGUgaGVsbG8gYW5kIGhleSB3b3Jkc1xuICAgIC5maWx0ZXIoKHdvcmQpID0+IC9eKGhlbGxvfGhleSkkL2kudGVzdCh3b3JkKSkubGVuZ3RoKVxuXG4gICAgLy8gU2VuZCB0aGUgZWNobyBtZXNzYWdlXG4gICAgc2VuZChyZXEuYm9keS5zcGFjZUlkLFxuICAgICAgdXRpbC5mb3JtYXQoXG4gICAgICAgICdIZXkgJXMsIGRpZCB5b3Ugc2F5ICVzPycsXG4gICAgICAgIHJlcS5ib2R5LnVzZXJOYW1lLCByZXEuYm9keS5jb250ZW50KSxcbiAgICAgIHRva2VuKCksXG4gICAgICAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgaWYoIWVycilcbiAgICAgICAgICBsb2coJ1NlbnQgbWVzc2FnZSB0byBzcGFjZSAlcycsIHJlcS5ib2R5LnNwYWNlSWQpO1xuICAgICAgfSk7XG59OyAqL1xuXG4gICB2YXIgcmVzcG9uc2VtZXNzYWdlO1xuICBsb2coJ2NvbnRlbnQgYmVmb3JlICVzJyxcImNvbnRlbnRcIik7XG4gICB2YXIgY29udGVudCA9IHJlcS5ib2R5LmNvbnRlbnQ7XG4gIC8vIGxvZygnY29udGVudCBhZnRlciAlcycsY29udGVudCk7XG5cbiBsb2coJ3Jlc3BvbnNlIG1lc3NhZ2UgJXMnLFwibWVzc2FnZTFcIik7XG4gICAgdmFyIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkgKHtcbiAgICAgICAgICAgIGlkOiBcImRlbW8tYXBwQHVzLmlibS5jb21cIixcbiAgICAgICAgICAgIGFwaWtleTogXCI3TTB4UVlaVWE5Q3ZDejh3UG1DSVwiLFxuICAgICAgICAgICAgZGF0YTogY29udGVudCxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcImNvbmRlbnNlTW9kZVwiOlwiYWJzdHJhY3Rpb25cIn1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgIGxvZygncmVzcG9uc2UgdmFsdWUgJXMnLFwibWVzc2FnZTJcIik7XG5cbiAgICB2YXIgcmVxdWVzdCA9IG5ldyBodHRwLkNsaWVudFJlcXVlc3Qoe1xuICAgIGhvc3RuYW1lOiAnY29udGVudGNsYXJpZmllci5teWJsdWVtaXgubmV0JyxcbiAgICAvL3BvcnQ6XCIzMDAwXCIsXG4gICAgcGF0aDogXCIvYXBpL1YxL2NvbmRlbnNlXCIsXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIipcIixcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiXG4gICAgfVxufSk7XG5cbnJlcXVlc3Qub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgLy8gSGFuZGxlIGVycm9yXG4gICAgICBsb2coJ3JlcXVlc3QgZXJyb3IgJXMnLGVycik7XG59KTtcbiAgICAvL2xvZygncmVxdWVzdCB2YWx1ZSAlcycsXCJtZXNzYWdlM1wiKTtcbiAgICByZXF1ZXN0LmVuZCh2YWx1ZSk7XG4gICAgXG4gICAgXG5cbnJlcXVlc3Qub24oJ3Jlc3BvbnNlJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cbiAgXG4gIHJlc3BvbnNlLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gIHJlc3BvbnNlLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG4gICAvLyBjb25zb2xlLmxvZygnQk9EWTogJyArIGNodW5rKTtcbiAgICByZXNwb25zZW1lc3NhZ2UgPSBKU09OLnBhcnNlKGNodW5rKS5jb25kZW5zZWQ7XG4gICAgLy9yZXNwb25zZW1lc3NhZ2UgPSBcIjxhIGhyZWY9J3d3dy5pYm0uY29tJz5TYW1wbGUgbGluayB0ZXN0PC9hPlwiO1xuICAgIGlmKHJlcS5ib2R5LmNvbnRlbnQgIT0gXCJcIiAmJiByZXNwb25zZW1lc3NhZ2UgIT0gXCJcIilcbiAgICBzZW5kKHJlcS5ib2R5LnNwYWNlSWQsXG4gICAgICB1dGlsLmZvcm1hdChcbiAgICAgICAgcmVzcG9uc2VtZXNzYWdlLFxuICAgICAgICByZXEuYm9keS51c2VyTmFtZSwgcmVxLmJvZHkuY29udGVudCksXG4gICAgICB0b2tlbigpLFxuICAgICAgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgIGlmKCFlcnIpXG4gICAgICAgICAgbG9nKCdTZW50IG1lc3NhZ2UgdG8gc3BhY2UgJXMnLCByZXEuYm9keS5zcGFjZUlkKTtcbiAgICAgIH0pO1xuICB9KTtcbn0pO1xuXG5cbiBcblxuIC8qIGlmKHJlcS5ib2R5LmNvbnRlbnRcbiAgICAvLyBUb2tlbml6ZSB0aGUgbWVzc2FnZSB0ZXh0IGludG8gaW5kaXZpZHVhbCB3b3Jkc1xuICAgIC5zcGxpdCgvW15BLVphLXowLTldKy8pXG4gICAgLy8gTG9vayBmb3IgdGhlIGhlbGxvIGFuZCBoZXkgd29yZHNcbiAgICAuZmlsdGVyKCh3b3JkKSA9PiAvXihoZWxsb3xoZXkpJC9pLnRlc3Qod29yZCkpLmxlbmd0aCkgKi9cblxuICAgIC8vIFNlbmQgdGhlIGVjaG8gbWVzc2FnZVxuXG59O1xuXG5cblxuLy8gU2VuZCBhbiBhcHAgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uIGluIGEgc3BhY2VcbmNvbnN0IHNlbmQgPSAoc3BhY2VJZCwgdGV4dCwgdG9rLCBjYikgPT4ge1xuICByZXF1ZXN0LnBvc3QoXG4gICAgJ2h0dHBzOi8vYXBpLndhdHNvbndvcmsuaWJtLmNvbS92MS9zcGFjZXMvJyArIHNwYWNlSWQgKyAnL21lc3NhZ2VzJywge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tcbiAgICAgIH0sXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgLy8gQW4gQXBwIG1lc3NhZ2UgY2FuIHNwZWNpZnkgYSBjb2xvciwgYSB0aXRsZSwgbWFya2Rvd24gdGV4dCBhbmRcbiAgICAgIC8vIGFuICdhY3RvcicgdXNlZnVsIHRvIHNob3cgd2hlcmUgdGhlIG1lc3NhZ2UgaXMgY29taW5nIGZyb21cbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdHlwZTogJ2FwcE1lc3NhZ2UnLFxuICAgICAgICB2ZXJzaW9uOiAxLjAsXG4gICAgICAgIGFubm90YXRpb25zOiBbe1xuICAgICAgICAgIHR5cGU6ICdnZW5lcmljJyxcbiAgICAgICAgICB2ZXJzaW9uOiAxLjAsXG5cbiAgICAgICAgICBjb2xvcjogJyM2Q0I3RkInLFxuICAgICAgICAgIHRpdGxlOiAnRWNobyBtZXNzYWdlJyxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuXG4gICAgICAgICAgYWN0b3I6IHtcbiAgICAgICAgICAgIG5hbWU6ICdTYW1wbGUgZWNobyBhcHAnXG4gICAgICAgICAgfVxuICAgICAgICB9XVxuICAgICAgfVxuICAgIH0sIChlcnIsIHJlcykgPT4ge1xuICAgICAgaWYoZXJyIHx8IHJlcy5zdGF0dXNDb2RlICE9PSAyMDEpIHtcbiAgICAgICAgbG9nKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UgJW8nLCBlcnIgfHwgcmVzLnN0YXR1c0NvZGUpO1xuICAgICAgICBjYihlcnIgfHwgbmV3IEVycm9yKHJlcy5zdGF0dXNDb2RlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZygnU2VuZCByZXN1bHQgJWQsICVvJywgcmVzLnN0YXR1c0NvZGUsIHJlcy5ib2R5KTtcbiAgICAgIGNiKG51bGwsIHJlcy5ib2R5KTtcbiAgICB9KTtcbn07XG5cbi8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZVxuZXhwb3J0IGNvbnN0IHZlcmlmeSA9ICh3c2VjcmV0KSA9PiAocmVxLCByZXMsIGJ1ZiwgZW5jb2RpbmcpID0+IHtcbiAgaWYocmVxLmdldCgnWC1PVVRCT1VORC1UT0tFTicpICE9PVxuICAgIGNyZWF0ZUhtYWMoJ3NoYTI1NicsIHdzZWNyZXQpLnVwZGF0ZShidWYpLmRpZ2VzdCgnaGV4JykpIHtcbiAgICBsb2coJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0ludmFsaWQgcmVxdWVzdCBzaWduYXR1cmUnKTtcbiAgICBlcnIuc3RhdHVzID0gNDAxO1xuICAgIHRocm93IGVycjtcbiAgfVxufTtcblxuLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG5leHBvcnQgY29uc3QgY2hhbGxlbmdlID0gKHdzZWNyZXQpID0+IChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBpZihyZXEuYm9keS50eXBlID09PSAndmVyaWZpY2F0aW9uJykge1xuICAgIGxvZygnR290IFdlYmhvb2sgdmVyaWZpY2F0aW9uIGNoYWxsZW5nZSAlbycsIHJlcS5ib2R5KTtcbiAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgcmVzcG9uc2U6IHJlcS5ib2R5LmNoYWxsZW5nZVxuICAgIH0pO1xuICAgIHJlcy5zZXQoJ1gtT1VUQk9VTkQtVE9LRU4nLFxuICAgICAgY3JlYXRlSG1hYygnc2hhMjU2Jywgd3NlY3JldCkudXBkYXRlKGJvZHkpLmRpZ2VzdCgnaGV4JykpO1xuICAgIHJlcy50eXBlKCdqc29uJykuc2VuZChib2R5KTtcbiAgICByZXR1cm47XG4gIH1cbiAgbmV4dCgpO1xufTtcblxuLy8gQ3JlYXRlIEV4cHJlc3MgV2ViIGFwcFxuZXhwb3J0IGNvbnN0IHdlYmFwcCA9IChhcHBJZCwgc2VjcmV0LCB3c2VjcmV0LCBjYikgPT4ge1xuICAvLyBBdXRoZW50aWNhdGUgdGhlIGFwcCBhbmQgZ2V0IGFuIE9BdXRoIHRva2VuXG4gIG9hdXRoLnJ1bihhcHBJZCwgc2VjcmV0LCAoZXJyLCB0b2tlbikgPT4ge1xuICAgIGlmKGVycikge1xuICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbiBhdXRoZW50aWNhdGlvbjonLCBlcnIpO1xuICAgICAgY2IoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIEV4cHJlc3MgV2ViIGFwcFxuICAgIGNiKG51bGwsIGV4cHJlc3MoKVxuXG4gICAgICAvLyBDb25maWd1cmUgRXhwcmVzcyByb3V0ZSBmb3IgdGhlIGFwcCBXZWJob29rXG4gICAgICAucG9zdCgnL2VjaG8nLFxuXG4gICAgICAgIC8vIFZlcmlmeSBXYXRzb24gV29yayByZXF1ZXN0IHNpZ25hdHVyZSBhbmQgcGFyc2UgcmVxdWVzdCBib2R5XG4gICAgICAgIGJwYXJzZXIuanNvbih7XG4gICAgICAgICAgdHlwZTogJyovKicsXG4gICAgICAgICAgdmVyaWZ5OiB2ZXJpZnkod3NlY3JldClcbiAgICAgICAgfSksXG5cbiAgICAgICAgLy8gSGFuZGxlIFdhdHNvbiBXb3JrIFdlYmhvb2sgY2hhbGxlbmdlIHJlcXVlc3RzXG4gICAgICAgIGNoYWxsZW5nZSh3c2VjcmV0KSxcblxuICAgICAgICAvLyBIYW5kbGUgV2F0c29uIFdvcmsgbWVzc2FnZXNcbiAgICAgICAgZWNobyhhcHBJZCwgdG9rZW4pKSk7XG4gIH0pO1xufTtcblxuLy8gQXBwIG1haW4gZW50cnkgcG9pbnRcbmNvbnN0IG1haW4gPSAoYXJndiwgZW52LCBjYikgPT4ge1xuICAvLyBDcmVhdGUgRXhwcmVzcyBXZWIgYXBwXG4gIHdlYmFwcChcbiAgICBlbnYuRUNIT19BUFBfSUQsIGVudi5FQ0hPX0FQUF9TRUNSRVQsXG4gICAgZW52LkVDSE9fV0VCSE9PS19TRUNSRVQsIChlcnIsIGFwcCkgPT4ge1xuICAgICAgaWYoZXJyKSB7XG4gICAgICAgIGNiKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoZW52LlBPUlQpIHtcbiAgICAgICAgLy8gSW4gYSBob3N0aW5nIGVudmlyb25tZW50IGxpa2UgQmx1ZW1peCBmb3IgZXhhbXBsZSwgSFRUUFMgaXNcbiAgICAgICAgLy8gaGFuZGxlZCBieSBhIHJldmVyc2UgcHJveHkgaW4gZnJvbnQgb2YgdGhlIGFwcCwganVzdCBsaXN0ZW5cbiAgICAgICAgLy8gb24gdGhlIGNvbmZpZ3VyZWQgSFRUUCBwb3J0XG4gICAgICAgIGxvZygnSFRUUCBzZXJ2ZXIgbGlzdGVuaW5nIG9uIHBvcnQgJWQnLCBlbnYuUE9SVCk7XG4gICAgICAgIGh0dHAuY3JlYXRlU2VydmVyKGFwcCkubGlzdGVuKGVudi5QT1JULCBjYik7XG4gICAgICB9XG5cbiAgICAgIGVsc2VcbiAgICAgICAgLy8gTGlzdGVuIG9uIHRoZSBjb25maWd1cmVkIEhUVFBTIHBvcnQsIGRlZmF1bHQgdG8gNDQzXG4gICAgICAgIHNzbC5jb25mKGVudiwgKGVyciwgY29uZikgPT4ge1xuICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcG9ydCA9IGVudi5TU0xQT1JUIHx8IDQ0MztcbiAgICAgICAgICBsb2coJ0hUVFBTIHNlcnZlciBsaXN0ZW5pbmcgb24gcG9ydCAlZCcsIHBvcnQpO1xuICAgICAgICAgIGh0dHBzLmNyZWF0ZVNlcnZlcihjb25mLCBhcHApLmxpc3Rlbihwb3J0LCBjYik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKVxuICBtYWluKHByb2Nlc3MuYXJndiwgcHJvY2Vzcy5lbnYsIChlcnIpID0+IHtcbiAgICBpZihlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzdGFydGluZyBhcHA6JywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbG9nKCdBcHAgc3RhcnRlZCcpO1xuICB9KTtcblxuXG4iXX0=
