var webapp =angular.module(['myApp'], [ 'ngSanitize',  'ckeditor', '720kb.tooltips', 'slickCarousel']);

webapp.controller('myCtrl', function($scope, $timeout, $http, $compile, $location) {


    
    var input;
    var targettext;
    var speechtext;
    var parsedText;
    var condensedtext;
    var condenseSpeech;
    var condenseSimplifySpeech;
    var simplifySpeech;
    var condensedsimplifiedtext;
    var simplifyspeechtext;
    var condensespeechtext;
    var condensesimplifyspeechtext;
    var audio = document.getElementById('audio');


  
    /****** Authentication details for API calls ****/
    $scope.id = 'demo-app@us.ibm.com';
    $scope.apikey = '7M0xQYZUa9CvCz8wPmCI';

   
     
    /****** Application details *******/
    $scope.name     = "Content Clarifier";
    $scope.version  = "";
    //$scope.release  = "07/13/2016";
    //$scope.message  = "This app serves as a demo for the Content Clarifier API, a Computing effort to perform content summarization and simplification. (Release " + $scope.version.trim() + ", " + 	   	$scope.release.trim() + ")"; 

   
    /****** Div visibilities scope ******/
    $scope.outputDivVisible     = false;          /* toggle for displaying output div */
    $scope.showTwirly           = false;          /* toggle for displaying working icon */  
    $scope.inputOutputDivVisible = false;         /* toggle for displaying sidebyside div */
    $scope.messageDiv = false;                    /* toggle for displaying message div */
    $scope.urlDivVisible= false;                  /* toggle for displaying url input div */
    $scope.areaDivVisible= true;                  /* toggle for displaying text area input div */
    $scope.radiosDivVisible = false;;             /* toggle for displaying radio buttons div */



    /****** Text visibility scopes ******/
    $scope.inputText    = "";                     /* user input text */
    $scope.outputText   = "";                     /* simplified text output from the system */ 
    $scope.outputTextcontextual   = "";           /* contextual text output from the system */ 
    $scope.outputTextCondensed = "";              /* condense text output from the system */ 
    $scope.outputTextCondenseSimplified = "";     /* condense simplified text output from the system */ 
    $scope.textAbstract = "";                    /* summmary statement  */ 

    
    /****** Scope to enble/disable button ******/
    $scope.condenseSimplifyButtonClicked = false; 
    $scope.inputCondenseSimplifyButtonClicked = false;
    $scope.condenceButtonClicked = false;
    $scope.inputCondenceButtonClicked = false;

    /******  Radio buttons on change textinput *******/
    $scope.firstRadio = readTextFile('/public/samples/conversation.txt');
    $scope.secondRadio = readTextFile('/public/samples/news.txt');
    $scope.thirdRadio = readTextFile('/public/samples/technical.txt');
    $scope.fourthRadio = readTextFile('/public/samples/annoucement.txt');    
    $scope.inputText = $scope.firstRadio;


    /****** Input parameter values ******/
    $scope.outputMode = 0;
    $scope.condenseMode = "abstraction"; // {abstraction, extraction}
    $scope.refs = 0;
    $scope.type = "TEXT";
    $scope.calculateReadingLevels = 0; // Future support 
    $scope.enhanceContentMode=0;
   
    


      /******** Checks if the user is authenticated to access the index page **********/
	$scope.init = function () {
		//if($location.host() != 'localhost'){
		if($location.port() != 3000){  
         		console.log("Port in myController.js = "+$location.port() );
			$http.get('/confirm-login').success(function(isLoggedIn) {
                    		if(isLoggedIn == "false"){
					$location.path('/landing');   
				}
                  		else{
                    			$location.path('/index');
                 		}
            		}); 
      		}
   	 }


      /********* reloads the index page ***********/
	$scope.reload = function(value) {
		location.reload();
	}


      /********* Function to show only the text area div ********/
	$scope.newValue = function(value) {
		$scope.urlDivVisible= false;
    		$scope.areaDivVisible= true;
    		$scope.type ="TEXT";
    		$scope.inputText = $scope.inputTextRadio;
    
   	 }

      /********* Function to show only the URL input div *********/
    	$scope.newValueurl = function(value) {
    
    		 $scope.urlDivVisible= true;
    		 $scope.areaDivVisible= false;
    	         $scope.type ="URL";
   		 $scope.inputText =
		"http://www.nytimes.com/2016/04/17/science/calls-for-shipping-and-aviation-to-do-more-to-cut-emissions.html?action=click&contentCollection=Energy%26Environment&module=RelatedCoverage&region=Marginalia&pgtype=article";
 
  	}




      /********** function for UI switch button, shows the enhance mode options ********/
    	$scope.changeCallback = function() {
    
   		 $scope.radiosDivVisible =! $scope.radiosDivVisible;
   		 if(!$scope.radiosDivVisible){
      			 $scope.enhanceContentMode=0;
    		 } else{
       			 $scope.enhanceContentMode=1;
    		 } 
    		 $scope.messageDiv = ! $scope.messageDiv; 
   		 if($scope.messageDiv){
      			angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open()
    		 }
   		 if($scope.refs == 0){
   			 $scope.refs = 1;
   		 } else if($scope.refs == 1){
   			 $scope.refs = 0;
   		 }
   		 console.log('This is the state of my model ' + $scope.enabled);
   	 };



       /******** logouts the user ***********/
    	$scope.logout = function() {
        	var redirect;
        	if(location.hostname == 'localhost2'){
          		 redirect = 'http://localhost:3000';
           		 location.href=redirect;
       		}else{
           		 $http.get('/logout') 
			.success(function (isLoggedIn) {
            				//  alert("logout:"+ isLoggedIn);
           				 if(isLoggedIn == "false"){
                				 redirect = "https://contentclarifier.mybluemix.net";
                 				 location.href=encodeURI('https://login.ng.bluemix.net/UAALoginServerWAR/logout.jsp?redirect='+redirect);
           				 }
			
      			 });
           
       		}          
    	} 


       /********* plays the audio for Watson TTS ********/
	$scope.play = function(){
		audio.style.cssText = 'display:inline-block';
		audio.play();
      		scrollToBottom();
    	}


      /********** sets the text and voice for each simplify, condense and ultra mode ********/
	$scope.speakText = function(play, tab){
                var utteranceOptions;
        	var voice = 'en-US_AllisonVoice';
        	audio = document.getElementById('audio');
    		// speechtext =convertSpeechText(speechtext); 
    
		if(tab =="simplify" && simplifySpeech == null || simplifySpeech ==""){
			simplifyspeechtext =convertSpeechText(simplifyspeechtext);
            		utteranceOptions = {
                    		text: simplifyspeechtext,
                    		voice: voice
                    	};

            		simplifySpeech =  synthesizeRequest(utteranceOptions, audio);
            		returnUrl= simplifySpeech;
        	}else if (tab =="simplify"){
           		returnUrl = simplifySpeech;
        	};

        	if(tab =="condense" && condenseSpeech == null || condenseSpeech ==""){
         		condensespeechtext =convertSpeechText(condensespeechtext);
           		utteranceOptions = {
                  		text: condensespeechtext,
                   		voice: voice
                 	};
             		condenseSpeech =  synthesizeRequest(utteranceOptions, audio);
             		returnUrl = condenseSpeech;
         	} else if (tab =="condense"){
           		returnUrl = condenseSpeech;
        	};
        	if(tab =="condensesimplify" && condenseSimplifySpeech == null || condenseSimplifySpeech ==""){
            		condensesimplifyspeechtext =convertSpeechText(condensesimplifyspeechtext);
             		utteranceOptions = {
              		      text: condensesimplifyspeechtext,
                 	      voice: voice
                   	};
            		condenseSimplifySpeech =  synthesizeRequest(utteranceOptions, audio);
             		returnUrl = condenseSimplifySpeech;
         	}else if (tab =="condensesimplify"){
           		returnUrl= condenseSimplifySpeech;
        	};

      		 //  var  returnUrl =  synthesizeRequest(utteranceOptions, audio);

         	 audio.pause();
         	 audio.src = returnUrl; 
       		 // audio.addEventListener('canplaythrough', onCanplaythrough);
   	 	 audio.controls = true;
         	 audio.muted = false;
    		 //audio.style.cssText = 'display:none';
          	 if(play ==1){
  	  		audio.play();
         		scrollToBottom();
          	 }

	 }



	$scope.setSpeechText = function(){
		audio.style.cssText = 'display:none';
		//simplifyspeechtext= parsedText;
            	$scope.speakText(0, 'simplify');
        }


        /********* ------------------ contextualSimplifyText() :TAB-1 ------------------------ *********/
    
	$scope.contextualSimplifyText = function(){
		// alert($scope.enhanceContentMode);
        	audio.pause();
        	audio.style.cssText = 'display:none';
       		targettext = $scope.inputText;
         
         	if($scope.type == "TEXT"){ //SV to-do ..replace type with scope.type
           		type = "TEXT";
              		if(targettext == "" || targettext == null){
            	  		//alert("Please enter some text to simplify.");
                  		angular.element('[data-remodal-id=modal4]').remodal({ hashTracking: false }).open()
                 	return;
                 	}
           	}
		else {
               		type = "URL";
               		if(targettext == "" || targettext == null){
              	 		//alert("Please enter some text to simplify.");
         	  	angular.element('[data-remodal-id=modal5]').remodal({ hashTracking: false }).open()
          	  	return;
        	 	}
    		}
        	$scope.outputDivVisible = false;
 		$scope.inputOutputDivVisible = false;
        	var loadingRemodal = angular.element('[data-remodal-id=modal3]').remodal({ hashTracking: false });
        	loadingRemodal.open();
        	$scope.showTwirly2 = true; 
      		//$scope.type = "TEXT";
        	document.getElementById('myDiv').innerHTML = " ";
        	document.getElementById('myDiv2').innerHTML = "";
         	/* if( $scope.type = "URL"){
             	type = "URL";	
		}  */
 
          	if(input != targettext){
          	//$scope.contextualSimplifyText = true;
            		$scope.condenseSimplifyButtonClicked = false;
       		} 
        	input = targettext;
  		 /*if(contextinput != targettext){
          	 $scope.inputCondenseSimplifyButtonClicked = false;
          	 // $scope.contextualSimplifyTextInput = true;
        	} 
        	contextinput = targettext;
        	if(condence != targettext){
          	$scope.condenceButtonClicked = false;
          	//  $scope.condenceText = true;
        	} 
        	condence = targettext;
        	if(condenceinput != targettext){
          	$scope.inputCondenceButtonClicked = false;
          	//  $scope.condenceTextInput = true;
        	} 
       		condenceinput = targettext;
       		// $scope.contextualSimplifyText=false; 
        	 $scope.contextButtonClicked = true;    */    

       		var callUrl;
       		if(type=="URL"){
          		callUrl="/api/V1/contextual-simplify-url"
          		var responsePromise = $http({
             		url: callUrl,
             		method: "POST",
             		data: {
                 		id: $scope.id,
                 		apikey: $scope.apikey,
                 		url: targettext,
                 		options: {
						'enhanceContentMode':$scope.enhanceContentMode, // {1=referenceData, 2=definitions, 3=symbols}
                           			'outputMode':$scope.outputMode,
                           			'calculateReadingLevels':$scope.calculateReadingLevels                           
                          		}
             			},
             		withCredentials: false,
             		timeout: 300000,              
             		headers: {
                 	'Content-Type': 'application/json'
             		}
         		}).success(function(resp, status, headers, config) {
           			// autoScroll(1500);
             			 if(resp.status == "error"){
                 		 	$scope.showTwirly2 = false; 
                 		 	setTimeout(function(){ 
                		 		loadingRemodal.close(); 
                 		 	}, 1000);
                 			alert(resp.message+ " Please try again later." ); 
             			 }
				 else{
					var cleanOutput = resp.simplified.replace(/\|_[^_]*?_\|/g,"");
      					parsedText = parseToHtml(cleanOutput);
               				parsedText = identifyReplaceConfidence(parsedText);
             				simplifyspeechtext = removeDelimiters(resp.simplified);
              				//appending compiled html to output text of default view
             				var tempDiv = document.createElement("div");
             				if($scope.enhanceContentMode == 3) {
             					tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";    
             				} else{
               					tempDiv.innerHTML = parsedText;   
            			  	}
             				var simplifiedResponse = $compile(tempDiv)($scope);
             				angular.element(document.getElementById('myDiv')).append(simplifiedResponse); 
            				$scope.outputDivVisible = true; 
            				$scope.inputTextfinal = replaceNewLinesWithLineBreaks(targettext);
            				loadingRemodal.close();
            				$scope.showTwirly2 = false; 
            				$scope.speakText(0, 'simplify');
            			}
         		}).error(function(resp, status, headers, config) {
            			$scope.showTwirly2 = false; x
            			$scope.outputDivVisible = false; 
            			loadingRemodal.close();
            			alert("Sorry, an error occurred."); 
            			console.log(resp);
            			console.log(status);
            			console.log(headers); 
         		}); 
        	}else {
          		callUrl="/api/V1/contextual-simplify";
           		var responsePromise = $http({
            		url: callUrl,
             		method: "POST",
             		data: {
                 		id: $scope.id,
                 		apikey: $scope.apikey,
                 		data: targettext,
                 		options: {
					            'enhanceContentMode':$scope.enhanceContentMode, // {1=referenceData, 2=definitions, 3=symbols}
                           		'outputMode':$scope.outputMode,
                           		'calculateReadingLevels':$scope.calculateReadingLevels                                                      
                          		}
             			},
             		withCredentials: false,
             		timeout: 300000,               
             		headers: {
                 		'Content-Type': 'application/json'
            		        }
        		}).success(function(resp, status, headers, config) {
           				//alert("reached response");
             				autoScroll(1500);
               				if(resp.status == "error"){
                 				$scope.showTwirly2 = false; 
                 				setTimeout(function(){ 
                					loadingRemodal.close(); 
                 					}, 1000);
                 				alert(resp.message+ " Please try again later." ); 
           
             				}else{
          					//  alert(resp.simplified);
						var cleanOutput = resp.simplified.replace(/\|_[^_]*?_\|/g,"");
             					//  parsedText = identifyReplaceConfidence(cleanOutput);
               					parsedText = parseToHtml(cleanOutput);
               					parsedText = identifyReplaceConfidence(parsedText);
               					simplifyspeechtext = removeDelimiters(resp.simplified);
              					//appending compiled html to output text of default view
             					var tempDiv = document.createElement("div");
            					if($scope.enhanceContentMode == 3) {
             						tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";   
             					} else{
               						tempDiv.innerHTML = parsedText;   
             					}
              
             					var simplifiedResponse = $compile(tempDiv)($scope);
             					angular.element(document.getElementById('myDiv')).append(simplifiedResponse); 
             					//appending compiled html to output text of side by side view 
             					var tempDivsbs = document.createElement("div");
             					if($scope.enhanceContentMode == 3) {
             						tempDivsbs.innerHTML ="<b>Analyzed content</b><br><br>" + "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";   
             					} else{
               						tempDivsbs.innerHTML ="<b>Analyzed content</b><br><br>"  +parsedText;   
             					}
             					var simplifiedResponseTab = $compile(tempDivsbs)($scope);
             					angular.element(document.getElementById('myDiv2')).append(simplifiedResponseTab); 
             					$scope.inputOutputDivVisible = true; 
             					$scope.buttonDivVisible = true;
             					$scope.button2DivVisible=false;
               					var inputfinal = targettext;
             					inputfinal = replaceNewLinesWithLineBreaks(inputfinal); 
             					inputfinal = identifyReplacedWords(resp.simplified, inputfinal)
             					$scope.simplifiedInputText = "<b>Original content</b> </br></br>"+inputfinal;
             					loadingRemodal.close();
             					$scope.showTwirly2 = false;
             					$scope.speakText(0, 'simplify');
             				}
        		 }).error(function(resp, status, headers, config) {
            				//loadingRemodal.close();
            				setTimeout(function(){ 
                				loadingRemodal.close(); 
                				alert("Sorry, an error occurred.");               
           				 }, 1000);
            				$scope.showTwirly2 = false; 
            				$scope.outputDivVisible = false; 
            				console.log(resp);
            				console.log(status);
            				console.log(headers);
        		 }); 
       		 }

            	 loadingRemodal.close();   
   	 };  


   

   	// ------------------ condenceText() ------------------------
    
    	 $scope.condenceText = function(){
       		 audio.pause();
        	 audio.style.cssText = 'display:none';
      		 if( $scope.outputTextCondensedDefault != null &&  $scope.outputTextCondensedDefault != ""){
         		// cospeechtext = $scope.outputTextCondensedDefault;
          		$scope.speakText(0,'condense');
          	 return;
       		 } 
       		 //alert("reached here2");
      		 //$scope.condenceText = false;
     		 //$scope.condenceButtonClicked = true;          
        	 $scope.outputDivVisible = false;        
        	 // $http.defaults.useXDomain = true;      
       		 $scope.showTwirly = true; 
        	 if($scope.type == "TEXT"){
       			 var responsePromise = $http({
            			 url: "/api/V1/condense",
            			 method: "POST",
             		 	data: {
                 			id: $scope.id,
                 			apikey: $scope.apikey,
                 			data: targettext,
                 			options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
            		    	      },
             				 withCredentials: false,
             				 timeout: 300000,                        
               		 		 headers: {
                	      		 	'Content-Type': 'application/json'
             			 	}
        		 }).success(function(resp, status, headers, config) {
           				 //alert(JSON.stringify(resp)); 
       					 //$scope.outputText = resp.condensed;   
            				 $scope.outputTextCondensedDefault = parseToHtml(resp.condensed);
            				 condensespeechtext = removeDelimiters(resp.condensed);
            				 $scope.showTwirly = false; 
            				 $scope.outputDivVisible = true; 
            				 $scope.speakText(0,'condense');
         		 }).error(function(resp, status, headers, config) {
            				$scope.showTwirly = false; 
            				$scope.outputDivVisible = false; 
            				alert("Sorry, an error occurred."); 
        		 });  
         	} else {
           		var responsePromise = $http({
             				url: "/api/V1/condense-url",
              				method: "POST",
             				data: {
                 				id: $scope.id,
                 				apikey: $scope.apikey,
                 				url: targettext,
                 				options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
             				},
             				withCredentials: false,
             				timeout: 300000,                              
             				headers: {
                 				'Content-Type': 'application/json'
             				}
         		}).success(function(resp, status, headers, config) {
            				//alert(JSON.stringify(resp)); 
        				//$scope.outputText = resp.condensed;   
            				$scope.outputTextCondensedDefault = parseToHtml(resp.condensed);  
            				condensespeechtext = removeDelimiters(resp.condensed); 
            				$scope.showTwirly = false; 
            				$scope.outputDivVisible = true; 
           				$scope.speakText(0, 'condense');   
       		        }).error(function(resp, status, headers, config) {
            				$scope.showTwirly = false; 
            				$scope.outputDivVisible = false; 
            				alert("Sorry, an error occurred."); 
         		});  
           
         	}      
   	 };   


     // ------------------ condenceAndSimplifyText() ------------------------
  
	$scope.condenceAndSimplifyText = function(){
		audio.pause();
           	audio.style.cssText = 'display:none';
           	if( $scope.outputTextCondenseSimplifiedDefault != null &&  $scope.outputTextCondenseSimplifiedDefault != ""){
         		//speechtext = $scope.outputTextCondenseSimplifiedDefault;
            		$scope.speakText(0,'condensesimplify');
          	return;
       		} 
     		//$scope.condenceText = false;
     		//$scope.contextButtonClicked = true;                
    		//$scope.condenseSimplifyButtonClicked = true;
        	// $http.defaults.useXDomain = true;
		$scope.outputDivVisible = false;         
        	$scope.showTwirly = true; 
        	if($scope.type == "TEXT"){
        		var responsePromise = $http({
             			url: "/api/V1/condense-simplify",
             			method: "POST",
             			data: {
                 			id: $scope.id,
                 			apikey: $scope.apikey,
                 			data: targettext,
                 			options: {
                           			'outputMode':$scope.outputMode,
                           			'calculateReadingLevels':$scope.calculateReadingLevels,
                           			'condenseMode':$scope.condenseMode                      
                          			}
             				},
             			withCredentials: false,
             			timeout: 300000,                       
             			headers: {
                 			'Content-Type': 'application/json'
             			}
         		}).success(function(resp, status, headers, config) {
         				 //alert(resp.condensed); 
        				 //$scope.outputText = resp.condensed; 
            				 var cleanOutput = resp.condensed.replace(/\|_[^_]*?_\|/g,"");
            				 cleanOutput = identifyReplaceConfidence(cleanOutput);
            				 $scope.outputTextCondenseSimplifiedDefault =  parseToHtml(cleanOutput); 
            				 //$scope.outputTextCondenseSimplifiedDefault = parseToHtml(cleanOutput); 
            				 condensesimplifyspeechtext = removeDelimiters(resp.condensed); 
            				 $scope.showTwirly = false; 
              				 $scope.outputDivVisible = true; 
            				 $scope.speakText(0, 'condensesimplify');
         		}).error(function(resp, status, headers, config) {
            				 $scope.showTwirly = false; 
            				 $scope.outputDivVisible = false; 
           				 alert("Sorry, an error occurred."); 
        		 }); 
         	} 
		else{
            	        var responsePromise = $http({
             			url: "/api/V1/condense-simplify-url",
             			method: "POST",
             			data: {
                 			id: $scope.id,
                 			apikey: $scope.apikey,
                 			url: targettext,
                 			options: {
                     				'outputMode':$scope.outputMode,
                     				'calculateReadingLevels':$scope.calculateReadingLevels,
                     				'condenseMode':$scope.condenseMode  // WSTODO support toggle in GUI                     
                 				}
             				},
             			withCredentials: false,
             			timeout: 300000,                                
             			headers: {
                			 'Content-Type': 'application/json'
             				}
         		}).success(function(resp, status, headers, config) {
            				//alert(JSON.stringify(resp)); 
        				//$scope.outputText = resp.condensed;   
               				var cleanOutput = resp.condensed.replace(/\|_[^_]*?_\|/g,"");
              				cleanOutput = identifyReplaceConfidence(cleanOutput);
              				$scope.outputTextCondenseSimplifiedDefault = parseToHtml(cleanOutput);
            				condensesimplifyspeechtext = removeDelimiters(resp.condensed); 
            				$scope.showTwirly = false; 
            				$scope.outputDivVisible = true;   
            				$scope.speakText(0,'condensesimplify');
         		}).error(function(resp, status, headers, config) {
            				$scope.showTwirly = false; 
            				$scope.outputDivVisible = false; 
            				alert("Sorry, an error occurred."); 
         		}); 
         	 }
       
    	};   


   
      // ------------------ defaultView() ------------------------ 
	$scope.defaultView = function(){
         	audio.style.cssText = 'display:none';
         	$scope.outputDivVisible = true;
         	$scope.inputOutputDivVisible = false; 
         	activateFirstChild();
        	 //speechText = parsedText;
         	$scope.speakText(0, 'simplify');
         	$scope.buttonDivVisible = false; 
         	$scope.button2DivVisible = true;
       	 }
    


      // ------------------ SideBySideView() ------------------------ 
	$scope.sideBySideView = function(){   
		if($scope.type == "TEXT"){
      			audio.style.cssText = 'display:none';
         		$scope.buttonDivVisible = true; 
        		$scope.button2DivVisible = false;
         		$scope.outputDivVisible = false;
         		$scope.inputOutputDivVisible = true; 
         		activateFirstChild();
        		//speechText = parsedText;
         		$scope.speakText(0, 'simplify');
         	}
        }
    
   

      // ------------------ condenceText() ------------------------
	$scope.condenceTextInput = function(){
          	audio.pause();
          	audio.style.cssText = 'display:none';
         	if( $scope.outputTextCondensed != null &&  $scope.outputTextCondensed != ""){
           		//speechtext = condensedtext;
             		$scope.speakText(0,'condense');
          	return;
       		} 
           	$scope.outputDivVisible = false; 
            	$scope.inputOutputDivVisible = false;              
        	$scope.showTwirly = true; 

        	var responsePromise = $http({
         	    url: "/api/V1/condense",
         	    method: "POST",
           	    data: {
           	      	id: $scope.id,
             	   		 apikey: $scope.apikey,
             	    		 data: targettext,
             	    		 options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
            	 	},
            	 	withCredentials: false,
             		timeout: 300000,                        
             		headers: {
                 		'Content-Type': 'application/json'
             	     		 }
        	 }).success(function(resp, status, headers, config) {
           		 //alert(JSON.stringify(resp)); 
         		 //$scope.outputText = resp.condensed;   
            		 condensedtext = parseToHtml(resp.condensed);
            		 condensespeechtext = removeDelimiters(resp.condensed);
            		 $scope.outputTextCondensed ="<b>Analyzed content</b> </br></br>"+ condensedtext;
            		 $scope.showTwirly = false; 
            		 $scope.outputDivVisible = false; 
            		 $scope.inputOutputDivVisible = true; 
            		 $scope.condensedInputText ="<b>Original content</b> </br></br>"+ replaceNewLinesWithLineBreaks(targettext);
            		 $scope.speakText(0,'condense');
        	 }).error(function(resp, status, headers, config) {
           		 $scope.showTwirly = false; 
           		 $scope.outputDivVisible = false; 
           		 alert("Sorry, an error occurred."); 
         	});  
       		 	/*   }
        	  	  else{
          			      $scope.outputDivVisible = false; 
           			      $scope.inputOutputDivVisible = true;  
             		      }    */  
   	 }; 
    
    
      // ------------------ condenceAndSimplifyTextInput() ------------------------
	$scope.condenceAndSimplifyTextInput = function(){
		audio.pause();
         	audio.style.cssText = 'display:none';
       		if( $scope.outputTextCondenseSimplified != null &&  $scope.outputTextCondenseSimplified != ""){
          		// speechtext = condensedsimplifiedtext;
           		$scope.speakText(0,'condensesimplify');
          	return;
       		} 
        	$scope.outputDivVisible = false;
        	$scope.inputOutputDivVisible = false;  
        	$scope.showTwirly = true; 
        	var responsePromise = $http({
             		url: "/api/V1/condense-simplify",
             		method: "POST",
             		data: {
                 		id: $scope.id,
                 		apikey: $scope.apikey,
                 		data:targettext,
                 		options: {
                           		'outputMode':$scope.outputMode,
                           		'calculateReadingLevels':$scope.calculateReadingLevels,
                           	    'condenseMode':$scope.condenseMode                            
                          	}
             		},
             		withCredentials: false,
             		timeout: 300000,                        
            		headers: {
                 		'Content-Type': 'application/json'
            	 	}
         	}).success(function(resp, status, headers, config) {
            		//alert(resp.condensed); 
            		var cleanOutput = resp.condensed.replace(/\|_[^_]*?_\|/g,"");
            		condensesimplifyspeechtext = removeDelimiters(resp.condensed);
            		condensedsimplifiedtext = identifyReplaceConfidence(cleanOutput);
            		condensedsimplifiedtext = parseToHtml(condensedsimplifiedtext);
            		$scope.outputTextCondenseSimplified ="<b>Analyzed content</b> </br></br>"+ condensedsimplifiedtext;   
            		$scope.showTwirly = false; 
            		$scope.outputDivVisible = false; 
            		$scope.inputOutputDivVisible = true;
            		var inputcondensed =  replaceNewLinesWithLineBreaks(targettext);
            		inputcondensed = identifyReplacedWords(resp.condensed, inputcondensed)
            		$scope.simplifiedCondensedInputText = "<b>Original content</b> </br></br>"+inputcondensed;
            		$scope.speakText(0,'condensesimplify');
                }).error(function(resp, status, headers, config) {
          		$scope.showTwirly = false; 
            		$scope.outputDivVisible = false; 
           		alert("Sorry, an error occurred."); 
        	});        
   	 }; 



    // ------------------ GetModalPopup------------------------
	$scope.getThumbnail = function(relevance, website, displayName, comment, thumbnail){
		angular.element('[data-remodal-id=modal]').remodal({ hashTracking: false }).open()
         	$(".abstract").html("");
         	$(".displayname").html("");
         	$(".relevance").html("");
         	$(".website").html("");

         	//alert("Invoking the Modal");
        	if(thumbnail != "" && thumbnail != null && thumbnail != "undefined"){
			thumbnail = thumbnail.split('^').join("'");
           		$(".thumbnail").attr('src',thumbnail);	
        	} 
        	else {
           		$(".thumbnail").attr('src','img/Image_not_available.png');
        	}
       
        	if(comment != "" && comment != null && comment != "undefined"){
            		comment = comment.split('^').join("'");
           		$(".abstract").html("<b>ABSTRACT: </b> <br>"+comment);
        	}
        	if(displayName != "" && displayName != null && displayName != "undefined"){
	    		 displayName = displayName.split('^').join("'");
             		$(".displayname").html("Topic: "+displayName);
       		 }
        	if(relevance != "" && relevance != null && relevance != "undefined"){
           		$(".relevance").html("<b>RELEVANCE: </b> "+relevance);
        	}
        	if(website != "" && website != null && website != "undefined"){
           		$(".website").html("<b>WEBSITE: </b> <a href='"+website+"' target='_blank'>"+website+"</a>");
        	}
      		//  $( ".result" ).hide();
         }


      /* ------------------ GetModalPopup------------------------
	$scope.getSymbol = function(displayName,thumbnail){
         	angular.element('[data-remodal-id=modal]').remodal({ hashTracking: false }).open()
         	$(".displayname").html("");

        	 //alert("Invoking the Modal");
        	if(thumbnail != "" && thumbnail != null && thumbnail != "undefined"){
			thumbnail = thumbnail.split('^').join("'");
           		$(".thumbnail").attr('src',thumbnail);	
       		 } 
        	else {
           		$(".thumbnail").attr('src','img/Image_not_available.png');
        	}
        	if(displayName != "" && displayName != null && displayName != "undefined"){
	     		displayName = displayName.split('^').join("'");
             		$(".displayname").html("Symbol: "+displayName);
        	}
      		//  $( ".result" ).hide();
         } */
   
    // ------------------ clearInputText() ------------------------
	$scope.clearInputText = function(inputtype){
		 /*     if(inputtype == "URL"){
       		$scope.type = "URL";
       		$scope.inputText.cannedtext = "";
      		}
      		else {
      		$scope.type = "TEXT";
      		$scope.inputText.cannedtext = "";
      		document.querySelector('textarea').style.cssText = 'height:25vh';
      		} */
      
      		$scope.outputDivVisible = false;
      		$scope.buttonDivVisible = false; 
      		$scope.button2DivVisible= false;
      		$scope.inputOutputDivVisible = false; 
      		$scope.showTwirly = false;          
      		$scope.outputTextcontextual   = ""; 
      		$scope.outputTextCondensed = "";
      		$scope.outputTextCondenseSimplified = "";
      		$scope.outputTextCondensedDefault = "";
      		$scope.outputTextCondenseSimplifiedDefault = "";
      		$scope.condenseSimplifyButtonClicked = false;
      		$scope.inputCondenseSimplifyButtonClicked = false;
      		$scope.condenceButtonClicked = false;
      		$scope.inputCondenceButtonClicked = false;
      		activateFirstChild();
      		condenseSpeech = null;
      		condenseSimplifySpeech = null;
      		simplifySpeech = null; 
    	}; 



       // ------------------ Show EnhancedMode radio div------------------------
	$scope.showEnhanceModeRadios=function(){
       		return $scope.radiosDivVisible;
   	};

    
      // ------------------ ShowOutputDiv------------------------
	$scope.showOutput = function(){
       		return $scope.outputDivVisible;
    	}; 

	$scope.showButton = function(){
       		return $scope.buttonDivVisible;
    	};  


      // ------------------ toggle Input text area and URL------------------------
	$scope.urlinput = function(){
       		return $scope.urlDivVisible;
    	}; 

    	$scope.areainput = function(){
       		return $scope.areaDivVisible;
    	}; 
 

      // ------------------ ShowAnimation------------------------
	$scope.showLoadingAnimation = function(){
       		return $scope.showTwirly;
   	 }; 


      // ------------------ ShowAnimation------------------------
	$scope.showLoadingAnimation2 = function(){
      		return $scope.showTwirly2;
    	}; 
     // ------------------ ShowInputOutputDiv------------------------
    	$scope.showInputOutput = function(){
       		return $scope.inputOutputDivVisible;
    	}; 

     	$scope.showButton2 = function(){
      		return $scope.button2DivVisible;
    	};	  
   
     // ------------------ ShowInputOutputDiv------------------------
	$scope.showMessageDiv = function(){
      		return $scope.messageDiv;
    	}; 

      
     // ------------------ Auto resizes the Text box------------------------ 
	$scope.outputTextHeight = 'auto';
        $scope.inputOutputTextHeight = 'auto';
	var textarea = document.querySelector('textarea');
    	var divx =  document.querySelector('autoload');
	//textarea.addEventListener('keydown', autosize(textarea));
    	//textarea.addEventListener('load', autosize(textarea));	     
    	function autosize(txtarea){
     		//alert("reached autosize")
		var el = txtarea;
	  	setTimeout(function(){
	    		el.style.cssText = 'height:auto; padding:0';
	    		// for box-sizing other than "content-box" use:
	    		// el.style.cssText = '-moz-box-sizing:content-box';
             		var x = el.scrollHeight;
	      		el.style.cssText = 'height:' + x + 'px';
          		/*  el.style.cssText = 'auto';
            		el.style.cssText = 'overflow:hidden';
              		var output = $scope.outputText;
             		$scope.outputTextHeight =   $scope.outputText.scrollHeight + 'px';
              		$scope.outputTextHeight = el.scrollHeight*2+ 'px';
              		$scope.inputOutputTextHeight = el.scrollHeight*2+ 'px';
              		alert(scope.outputTextHeight());
	      		$scope.$apply(); */
	  	},0);
	}
      
      }); // End of the Web controller ********************************************






  function autoScroll(height){
 	  	window.scrollTo(0,500);
 	 }

  function scrollToBottom(){
		window.scrollTo(0,document.body.scrollHeight);
 	 }
 
  function activateFirstChild(){
 		$('#abc .accordion__title:first-child').addClass('active').siblings().removeClass('active');
 		$('#abc .accordion__content:not(:first)').hide();
		$('#abc .accordion__content:first').show();
		$('#xyz .accordion__title:first-child').addClass('active').siblings().removeClass('active');
		$('#xyz .accordion__content:not(:first)').hide();
		$('#xyz .accordion__content:first').show();
  	}


   // ------------------ Converts the return text from the Server to HTML------------------------

	/* SUSHANK's
   function parseToHtml(simpleText){
	varsimpleText = "";
	try{
           	var concept;
           	var relevance;
           	var web;
           	var thumbnail;
           	var comment;
           	var jsonlist = []; // used to filter the duplicate jsons
           	var wordname;
          	var linebreaks =  simpleText.match(/\n/g);
           	if(linebreaks != null){
              		for (var k = 0; k <linebreaks.length; k++) {
               		simpleText = simpleText.split(linebreaks[k]).join("<br>");
              		}
           	}
            	// Identifying all the JSON within the simpleText
           	var matches = simpleText.match(/\%~[^]*?~\%/g);      
           	// console.log("MATCHES:");
           	//console.log(matches);
           	if(matches !=null){  
                // matches is an array of JSONS
              		for (var i = 0; i <matches.length; i++) {
               			simpleText = simpleText.split(matches[i]).join("");
				console.log(matches[i]);
				console.log("simpleText = " + simpleText);
              		 }
              		for (var i = 0; i <matches.length; i++) {
                 		json =  matches[i].replace(/[\%\~\%\~]/g, ""); // Removing the special chars from JSON
				if( !jsonlist.includes(json)){
                     			jsonlist.push(json); 
                     			obj       = JSON.parse(json);
                     			console.log("obj =");
                     			console.log(obj);
					concept  = obj.concept != undefined ? obj.concept : "";
                     			comment   = obj.comment != undefined ? obj.comment : "";
                     			// removes json from the text
                   			// simpleText = simpleText.split(matches[i]).join("");

                    			 if(concept != "" && comment != ""){ // If we have sufficient data, add the modal code     
						// To avoid HTML parsing replacing single and double quotes with ^
                        			comment   = comment.split('"').join('^');
                        			comment   = comment.split("'").join('^');  
						relevance = obj.relevance != undefined ? obj.relevance : "";
						web       = obj.website != undefined ? obj.website : "";
                        			thumbnail = obj.thumbnail != undefined ? obj.thumbnail : "";  
                         			console.log("comment = " + comment);
                         			console.log("relevance = " + relevance);
                         			console.log("web = " + web);
                         			console.log("thumbnail = " + thumbnail);
						// hyperlinks the Concept and attaches the function that invokes the modal
                        			simpleText =  simpleText.replace(new RegExp(concept+" ", 'ig'), '<a ng-click="getThumbnail(\''+relevance+'\',
						\''+web+'\',\''+concept+'\', \''+comment+'\', \''+thumbnail+'\')" href="">'+concept+'</a>');
                         
                         			console.log(simpleText);
					}
                   		}// end of if loop for checking duplicate jsons
               		} //end of for loop fr iterating multiple jsons
            	} // end of if loop for checking empty json
            	// removes the delimiters for the replacement and turns the font text to green
            	simpleText = simpleText.split("|^").join("<font color='green'>");
            	simpleText = simpleText.split("^|").join("</font>");
             	simpleText = simpleText.split("\\").join("");
       	}
       catch(exception){
           //alert(exception);
       }
       return simpleText;
   } */


       /* Shows the confidence levels of each suggested word in the tool tips */
	function identifyReplaceConfidence(simpleText){
   		 var confidencejson;
   		 var obj;
		 var matchesjson = simpleText.match(/\%#[^]*?#\%/g);
    		 var replacedWords2  =  simpleText.match(/\|\^[^_]*?\^\|/g);
    		 var html;
		 if(matchesjson !=null && matchesjson != undefined){ 
			for (var i = 0; i <matchesjson.length; i++) {
                    		simpleText = simpleText.split(matchesjson[i]).join("");
             		 }
            		 for (var i = 0; i <matchesjson.length; i++) {
				confidencejson =  matchesjson[i].replace(/[\%\#\%\#]/g, "");
				obj = JSON.parse(confidencejson);
				var targetoutput="";

                   		for(var k = obj.length -1 ; k >=0; k--){
					lexicon  = obj[k].lexicon != undefined ? obj[k].lexicon : "";    
                         		confidence   = obj[k].confidence != undefined ? obj[k].confidence : "";
                         		confidence = confidence.substring(0, 6); 
                         		targetoutput = targetoutput + lexicon+ " | conf = "+ confidence + "<br/>";
                    		} 
			        /* generating the html that needs to be replaced in the simpleTex */ 
				html =  '<div class="tooltips">'+replacedWords2[i] +'<span class="tooltiptexts">'+targetoutput+' </span></div>';
				simpleText = simpleText.split(replacedWords2[i]).join(html);
             		  }
              
       		 }

            	simpleText = simpleText.split("|^").join("<font color='green'>");
            	simpleText = simpleText.split("^|").join("</font>"); 
            	simpleText = simpleText.split("\\").join("");
		simpleText = simpleText.split("<p>").join(""); /* added on june 27th,2017 by sushank to remove <p> tags that are auto wrapped */
       	   return simpleText;
  	 }


	function parseToHtml(simpleText){
		try{
           		var concept;
           		var relevance;
           		var web;
           		var thumbnail;
           		var comment;
           		var json;
           		var obj;
           		var html;
           		var id;
           		var wordname;
           		var symbol;
           		var image_url;
           		var words;
           		var divtext;
           		var author;
           		var license;
           		var license_url;
			var matchMap = {};
                     
           		// match and get all %~<>~% delimited reference data
           		var matches = simpleText.match(/\%~[^]*?~\%/g); 
           
           		if(matches !=null && matches != undefined){ 
               			for (var i = 0; i <matches.length; i++) {
				//alert(matches[i]+ "k")
                    		simpleText = simpleText.split(matches[i]).join("");
              			}

             			// Create map of all unique reference data matches
               			for(var i = 0; i < matches.length; i++){
					json =  matches[i].replace(/[\%\~\%\~]/g, ""); // remove %~ ~% delimiiters
					obj = JSON.parse(json);
					concept  = obj.concept != undefined ? obj.concept : "";                         
                         		comment   = obj.comment != undefined ? obj.comment : "";
                         		symbol= obj.symbol != undefined ? obj.symbol : "";
                         		image_url= obj.image_url != undefined ? obj.image_url : "";
                         		author= obj.primary_author != undefined ? obj.primary_author : "";	
			 		license_url= obj.license_url != undefined ? obj.license_url : "";
			 		license= obj.license != undefined ? obj.license : "";

                        		if(!matchMap.hasOwnProperty(symbol)){ // if this match isn't already in the map
						if(symbol != "" && image_url != ""){ // If we have sufficient data, add the modal code 
							symbol   = symbol.split("'").join('^');
							html = "<div id='container' style='display:inline-block; line-height:0.8; '><div  id='num1' style='display:block;' > <img src="
							+image_url+" title='Author: "+author+" &#13;License: "+license+"&#13;License-URL:"
							+license_url+"' height=50; width=50;/></div> <div id='num2' style='display:block; text-align:center'>"
							+symbol+"</div></div>";
                           				//html = '<a ng-click="getSymbol(\''+symbol.split("'").join('')+'\', \''+image_url+'\')" href="">'+symbol+'</a>';
							id = makeid();
							// (A) replaces [symbol %~<ref data>~%] tuple with a UID
							simpleText = simpleText.replace( new RegExp("\\b("+symbol+")\\b", "ig"), id+ "   ");
							var matchTuple = {
                                       			 	"id": id,
                                        			"modalHTML" : html
                                    			}; 
                                			matchMap[symbol] = matchTuple;
                             
                        	 		} // end if aymbol
                    			} // end if !matchMap
                   
                        		if(!matchMap.hasOwnProperty(concept)){ // if this match isn't already in the map
 						if(concept != "" && comment != ""){ // If we have sufficient data, add the modal code
							// replace the ' and " in the comment temporarily
                                			comment   = comment.split('"').join('^');
                                			comment   = comment.split("'").join('^');  
							//concept   = concept.split("'").join('^');
							relevance = obj.relevance != undefined ? obj.relevance : "";
                                			web       = obj.website != undefined ? obj.website : "";
                                			thumbnail = obj.thumbnail != undefined ? obj.thumbnail : "";  
							thumbnail=thumbnail.split("'").join('^')
						       //html='<a ng-click="getThumbnail(\''+relevance+'\',\''+web+'\',\''+concept+'\', \''+comment+'\', \''+thumbnail+'\')" href="#modal">'+concept+'</a>';
							html = '<a ng-click="getThumbnail(\''+relevance+'\',\''+web+'\',\''+concept.split("'").join('')+'\', \''+comment+'\', \''+thumbnail+'\')" 								href="">'+concept+'</a>';
							id = makeid();
							// (A) replaces [concept %~<ref data>~%] tuple with a UID
                              				//   simpleText = simpleText.split(concept + " " + matches[i]).join(id);
                               				simpleText = simpleText.replace( new RegExp("\\b("+concept+")\\b", "ig"), id+ " ");
							var matchTuple = {
                                        			"id": id,
                                        			"modalHTML" : html
                                    			}; 
							matchMap[concept] = matchTuple;
                             
                         			} // end if concept
                    			} // end if !matchMap
               			} // end for
               
               			//
               			// Replace the matches in the text
               			//  
				for(key in matchMap){ 
					// Replaces UID set in (A) with the associated modalHTML the pop up                  
                    			simpleText = simpleText.split(matchMap[key].id).join(matchMap[key].modalHTML);
				}
			} // end if matches !=null
            		// removes the delimiters for the replacement and turns the font text to green
       		}
       		catch(exception){
          	 console.log("parseToHtml threw an exception!");
           	 console.log(exception);
      	 	}
      	 	return simpleText;
  	 }

	function replaceAll(str, find, replace) {
   	 	var regEx = new RegExp(find, "g");
   	 	var replaceMask = replace;
    		return str.replace(regEx, replaceMask);    
	}


	// Handle Socket.io Messages from the server
	function doSocketMessage( message ) {  
 	 	var data = null;
 	 	var element = null;
		// Parse
		data = JSON.parse( message.data );
		console.log(data);
	}

        //Reads the test from the Files adn loads it
	function readTextFile(file){
    		var allText;
  		var rawFile = new XMLHttpRequest();
    		rawFile.open("GET", file, false);
    		rawFile.onreadystatechange = function (){
     	  		 if(rawFile.readyState === 4){
      	      			if(rawFile.status === 200 || rawFile.status == 0){
            	    			allText = rawFile.responseText;
         	   		}
       	 		 }
    		}
     		rawFile.send(null);
    		return allText;
    	}

 	//Identifies the newlines in the input and retains in the original content of the output
  	function replaceNewLinesWithLineBreaks(targettext){
           var linebreaks =  targettext.match(/\n/g);
           if(linebreaks != null){
              for (var k = 0; k <linebreaks.length; k++) {
		 targettext = targettext.split(linebreaks[k]).join("<br>");
              }
           }
  	return targettext;
  	}


	//Identifies the replaced words in the input text and highlights it
  	function identifyReplacedWords(outputtext, targettext){
  		console.log("Identify the replaced words");
  		var replacedWords  =  outputtext.match(/\|_[^_]*?_\|/g);
  		var replacements =    outputtext.match(/\|\^[^_]*?\^\|/g);
   		var mapid;
   		var matchMap = null;

		if(replacements != null){
      	  		matchMap = new Array(replacements.length);
       	    		console.log("Replacements are found");
        	 	for (var k = 0; k <replacements.length; k++) {  
         	   		console.log("replaced word: "+replacements[k]);
          	  		replacements[k] =" " + replacements[k].replace(/[\|\^\|\^]/g, "");
         	 	}
       		};
           	if(replacedWords != null){
             		for (var k = 0; k <replacedWords.length; k++) {  
                 		replacedWords[k] = replacedWords[k].split("|_").join("");
                 		replacedWords[k]= replacedWords[k].split("_|").join("");  
                		// var html = '<a class="tooltip">showme<span>Facebook</span></a>';  
                 		mapid = makeid();  
                		//targettext =   targettext.replace(replacedWords[k],"<span><font color='green'>"+replacedWords[k]+"</font></span><div class='replacementsDiv'>"+replacements[k]+"</div>"); 
                  		targettext =   targettext.replace(replacedWords[k],mapid);  
                  		var matchTuple = {
                                     "mapid": mapid,
                                      "replacement":"<span><font color='green' style='border-bottom: 1px dotted black'>"+replacedWords[k]+"</font></span><div class='replacementsDiv'>"+replacements[k]+
				      "</div>"
                                    };   
				matchMap[k] = matchTuple;
              		}
          	 }
      		if(replacedWords != null){
        		for(var k = 0; k <replacedWords.length; k++){   
                 		   // Replaces UID set in (A) with the associated modalHTML the pop up                  
                  		   targettext = targettext.split(matchMap[k].mapid).join(matchMap[k].replacement);
             		}
     		  }
  	return targettext;
  	}


	function convertSpeechText(speechtext){
		speechtext = speechtext.split("|^").join("");
        	speechtext = speechtext.split("^|").join(""); 
        	return speechtext;
 	}

	function synthesizeRequest(options, audio) {
		var downloadURL = '/api/synthesize' +
      		'?voice=' + options.voice +
      		'&text=' + encodeURIComponent(options.text); /* +
      		'&X-WDC-PL-OPT-OUT=' +  sessionPermissions; */

    		if (options.download) {
      			downloadURL += '&download=true';
     			// window.location.href = downloadURL;
     			// return true;
    		}
 
    		return downloadURL; 
  	}

 	function makeid() {
    		var text = "";
    		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    		for( var i=0; i < 16; i++ )
        		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
 	}  

  	function removeDelimiters(input) {
    		input =  input.replace(/\|_[^_]*?_\|/g,"");
     		input=   input.replace(/\%~[^]*?~\%/g, "");
     		input=   input.replace(/\%#[^]*?#\%/g, "");
  	return input;       
  	}
