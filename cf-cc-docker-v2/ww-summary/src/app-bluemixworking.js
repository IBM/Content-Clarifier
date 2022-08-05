// A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

import express from 'express';
import * as request from 'request';
import * as util from 'util';
import * as bparser from 'body-parser';
import { createHmac } from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as oauth from './oauth';
import * as ssl from './ssl';
import debug from 'debug';
import hashmap from 'hashmap';

// Debug log
const log = debug('watsonwork-echo-app');
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


// setup DB connection
var mysql      = require('mysql');
var C          = require('../constants.js');


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


// Echoes Watson Work chat messages containing 'hello' or 'hey' back
// to the space they were sent to
export const echo = (appId, token) => (req, res) => {
  // Respond to the Webhook right away, as the response message will
    // be sent asynchronously
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
                 
                 if(sourceSpaceName.startsWith('CC') && sourceSpaceName.endsWith('Summary')){
			var spacetextmessage = '*This message command is invalid for a target summary space.*';
 			sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
				  					if (!err) log('Sent message to space %s', req.body.spaceId);
			});  
                   return;
                 }

                pool.getConnection(function(err, connection) { 
			if(err) { 
      				console.log('DB Error in getting connection: ' + err); 
      				
    			}

                        connection.query(C.SELECT_TARGETSPACE_NAME, [req.body.spaceName], function(err, results){
                            		
                                     if (err) {
             		        	console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + err);            
            				}
          			     else {
                				console.log('Multiple SourceSpaceNames exists', results.length);
                                                
						if(results.length==0){
                                                        targetspacename = 'CC'+req.body.spaceName+'Summary';
							spacetextmessage = 'Create a space named *CC'+req.body.spaceName+'Summary* and install the Summarization App there';
						}else if(results.length>=1){
 							targetspacename = 'CC'+req.body.spaceName+'Summary'+(results.length);
                		            		spacetextmessage = 'Create a space named *CC'+req.body.spaceName+'Summary'+(results.length)+'* and install the Summarization App there';
						 console.log('textmessage returned is--->'+spacetextmessage );
						
                                                }
						connection.query(C.INSERT_NEWSPACE, {SourceSpaceID: req.body.spaceId, SourceSpaceName: req.body.spaceName, TargetSpaceName:targetspacename},
						 function(err, result){
                            				connection.release();

                           				if (err) {
             		        				console.log('Error while performing authentication for ID = ' + req.body.spaceId + ' : ' + err);            
            						}
                        				 else{
                               					 
								 console.log('Succesfully inserted data');
								sendSummarySpaceName(req.body.spaceId, spacetextmessage, token(), function (err, res) {
				  					if (!err) log('Sent message to space %s', req.body.spaceId);
								});  
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


// sends http request to the content clarifier for summarization
const ccrequest = (messageblog, token, sourceSpaceID) => {
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



const getSpaceID = (spaceId, cb) => {
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
                		console.log('The API Key could not be authenticated for ID = ' + req.body.id); 
                		res.set({"WWW-Authenticate": "Basic realm=\"Restricted Area\""}).status(401).send("Authentication Failure");
          		}
          		else {
                		console.log('TargetSpaceName for the given SourceName:  ', result[0].TargetSpaceID);
                		 cb(null, result[0].TargetSpaceID);
            		}
                        });
  		}); // end pool 

 
}


const sendSummarySpaceName = (spaceId, text, tok, cb) => {

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

//queries the GraphQL for results-experimenting
const getmessage = (spaceId, tok,starttime, endtime, cb) => {
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


// Send an app message to the conversation in a space
const send = (spaceId, text, tok, cb) => {
  
    
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
                         title2= "CC-Summary: "+formatDate(startdate)+" "+days[startdate.getDay()]+", "+formatAMPM(startdate) +" CST  -  "+formatDate(enddate)+" "+days[enddate.getDay()]+", "+formatAMPM(enddate)+" CST   ";
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
        				return;
     		 		}
           
      log('Send result %d, %o', res.statusCode, res.body);
      cb(null, res.body);
    });
    }else{
      log(' Empty Summary content, No Message sent to Space');
    }

};



const getSpace = (spaceId, tok, cb) => {

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

// Verify Watson Work request signature
export const verify = (wsecret) => (req, res, buf, encoding) => {
  if(req.get('X-OUTBOUND-TOKEN') !==
    createHmac('sha256', wsecret).update(buf).digest('hex')) {
    log('Invalid request signature');
    const err = new Error('Invalid request signature');
    err.status = 401;
    throw err;
  }
};

// Handle Watson Work Webhook challenge requests
export const challenge = (wsecret) => (req, res, next) => {
  if(req.body.type === 'verification') {
    log('Got Webhook verification challenge %o', req.body);
    const body = JSON.stringify({
      response: req.body.challenge
    });
    res.set('X-OUTBOUND-TOKEN',
      createHmac('sha256', wsecret).update(body).digest('hex'));
    res.type('json').send(body);
    return;
  }
  next();
};

// Create Express Web app
export const webapp = (appId, secret, wsecret, cb) => {
  // Authenticate the app and get an OAuth token
  oauth.run(appId, secret, (err, token) => {
    if(err) {
      cb(err);
      return;
    }

    // Return the Express Web app
    cb(null, express()

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


export const formatAMPM = (date) => {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours-5 + ':' + minutes + ' ' + ampm;
  return strTime;
};


export const formatDate = (value) => {
   return value.toLocaleDateString(); 
};


// App main entry point
const main = (argv, env, cb) => {
  // Create Express Web app
  webapp(
    env.ECHO_APP_ID, env.ECHO_APP_SECRET,
    env.ECHO_WEBHOOK_SECRET, (err, app) => {
      if(err) {
        cb(err);
        return;
      }

      if(env.PORT) {
        // In a hosting environment like Bluemix for example, HTTPS is
        // handled by a reverse proxy in front of the app, just listen
        // on the configured HTTP port
        log('HTTP server listening on port %d', env.PORT);
        http.createServer(app).listen(env.PORT, cb);
      }

      else
        // Listen on the configured HTTPS port, default to 443
        ssl.conf(env, (err, conf) => {
          if(err) {
            cb(err);
            return;
          }
          const port = env.SSLPORT || 443;
          log('HTTPS server listening on port %d', port);
          https.createServer(conf, app).listen(port, cb);
        });
    });
};

if (require.main === module)
  main(process.argv, process.env, (err) => {
    if(err) {
      console.log('Error starting app:', err);
      return;
    }
    log('App started');
  });




