//Define an angular module for our app
"use strict";

var webapp =angular.module(['myApp'], [ 'ngSanitize',  'ckeditor', '720kb.tooltips', 'slickCarousel']);



webapp.controller('editorCtrl', function($scope, $timeout, $http, $compile, $location, $sce) {
       
        var targettext;
        //var originaltext;
	/****** Authentication details for API calls ****/
	$scope.id;
	$scope.apikey;


	/****** Input parameter values ******/
	$scope.outputMode = 0;
	$scope.condenseMode = "abstraction"; // {abstraction, extraction}
	$scope.refs = 0;
	$scope.type = "TEXT";
	$scope.calculateReadingLevels = 0; // Future support 
	$scope.enhanceContentMode=0;

	 /* Navbareditor */
	    $http.get("public/data/navbareditor.json").then(function(response) {
	      $scope.navbareditor = response.data;
	    });


       //if($location.port() != 3000){ 
       if($location.host() == "contentclarifier.mybluemix.net"){  // Support any localhost port          
	$http.get("/user-credentials").then(function(response) {
                    $scope.apikey= response.data.key;
		      $scope.id= response.data.id;
                        
	  });
        }else{
		$scope.id = 'demo-app@us.ibm.com';
		$scope.apikey = '7M0xQYZUa9CvCz8wPmCI';
	}
   

         
	/****** Read Input messages from File ******/
	$scope.myText = readTextFile('public/samples/conversation.txt');
        
        
      
        /******** Gets Invoked as soon as the page loads **********/
	$scope.init = function () {
		//if($location.host() != 'localhost'){
		 /* Remove preloader */
            
	    $(".preloader-wrapper").fadeOut(1000, function() {
	     
	      $(this).remove();
	    });
	 }

	/****** Unused trial Code
	var template = "<div>Total hours <button ng-click='changetext()'>Analyze</button></div>";
	$scope.htmltooltip = '<div><button ng-click="changetext()">Analyze</button></div>';

	webapp.directive('dynamic', function ($compile) {
	  return {
	    restrict: 'A',
	    replace: true,
	    link: function (scope, ele, attrs) {
	      scope.$watch(attrs.dynamic, function(html) {
		ele.html(html);
		$compile(ele.contents())(scope);
	      });
	    }
	  };
	});

	$scope.html ="<div><button ng-click='changetext()'>Analyze</button></div>";
	$scope.areaDivVisible=false;
	$scope.text2="tooltips";

	$scope.changetext = function() {

		$scope.text2="newtooltip";
	}  ******/


	/***************************** Word Count **********************************************************************/
	$scope.countOf = function(text) {
               
            var normalizedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/^\s+|\s+$/g, "").replace("&nbsp;", " ");
            normalizedText = strip(normalizedText);
            var words = normalizedText.split(/\s+/);

            for (var wordIndex = words.length - 1; wordIndex >= 0; wordIndex--) {
                if (words[wordIndex].match(/^([\s\t\r\n]*)$/)) {
                    words.splice(wordIndex, 1);
                }
            }
            return (words.length);
	};

	/***************************** Para Count **********************************************************************/
	$scope.paraOf = function(text) {	   
	   // var s = text.split(/\r\n/);
	    return (text.replace(/&nbsp;/g, " ").replace(/(<([^>]+)>)/ig, "").replace(/^\s*$[\n\r]{1,}/gm, "++").split("++").length);
	};


       

	/***************************** Auto Word Highlight  **********************************************************************/
	$scope.highlight = function(haystack, needle) {
		//alert("reached here" + haystack);
		 if(!needle) {
			return $sce.trustAsHtml(haystack);
		 }
		/*   $scope.outputcontext =  $scope.outputcontext+haystack.replace(new RegExp(needle, "gi"), function(match) {
				return '<span class="highlightedText">' + match +'</span>';
		   }); */
		  
		//$scope.outputcontext =  haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+'<span id="highlightedText" class="highlightedText">' + needle +'</span>'+" ");

		//$scope.outputcontext =  haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" ");

		//var tempDiv = document.createElement("div");
		//tempDiv.innerHTML =  haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" ");
		//var simplifiedResponse = $compile(haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" "))($scope);
		//$scope.outputcontext = haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" ");

		/*working highlight piece */
		//$scope.outputcontext =  haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+'<span id="highlightedText" class="highlightedText">' + needle +'</span>'+" ");
		/*working highlight with dynamic modal*/

		var htmlmodal = '<a href="" ng-click="getThumbnail()" >'+needle+'</a>';

		//$scope.myText=document.getElementById('post-input-textarea2').innerHTML;

		angular.element(document.getElementById('post-input-textarea2')).empty();
		angular.element(document.getElementById('post-input-textarea2')).append($compile(haystack.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" "))($scope));  

	        // Sets the cursor at the end of the Sentence
		var elem = document.getElementById('post-input-textarea2');//This is the element that you want to move the caret to the end of
		setEndOfContenteditable(elem);
   
		/*  return $sce.trustAsHtml(haystack.replace(new RegExp(needle, "gi"), function(match) {
		      
			return '<span class="highlightedText">' + match + '</span>';
		})); */
	};
        


	/***************************** Word Highlight by Action  **********************************************************************/
	$scope.applyHtml = function(needle) {

		var htmlmodal = '<a href="" class="highlightedText" ng-click="getThumbnail()" >'+needle+'</a>';
		var htmlinput = document.getElementById('post-input-textarea2').innerHTML;
		angular.element(document.getElementById('post-input-textarea2')).empty();
		angular.element(document.getElementById('post-input-textarea2')).append($compile(htmlinput.replace(new RegExp(" "+needle+" ", "gi"), " "+htmlmodal+" "))($scope));  

	};
      

	/*****************************Simplify;Topics; Symbols; Definitions ***********************************************************/
    
	$scope.contextualSimplifyText = function(outputmode, enhancedcontentmode ){
		//alert($scope.myText);
               
                if($scope.myText == "" ||$scope.myText==null){
			$scope.modalMessage = "No content was provided for analysis"
			angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
			return;
		}
		$scope.enhanceContentMode=enhancedcontentmode;
		$scope.removeActive=true;
		
		if(enhancedcontentmode==0){
			$scope.simplifyBack="public/images/actions/simplify_on.png"; 
                           $scope.analyzeMode = "<b>Simplify:</b> This mode looks for difficult word or non-literal phrases and replaces them with more commonly used wording. "+
			"The <span><font color='green'><b>green</b></font></span> text shows the replaced words or phrases. You can mouse over these to show alternatives, when available. ";
                }else if (enhancedcontentmode ==1){
			$scope.topicsBack="public/images/actions/show_topics_on.png";
			 $scope.analyzeMode = "<b>Show Topics:</b> This mode inserts additional info about topics found in the content, when possible. To view this info, click the <span><font color='blue'><b>blue</b></font></span> links."; 
		}else if (enhancedcontentmode ==2){
			$scope.defintionsBack="public/images/actions/show_definitions_on.png";
			$scope.analyzeMode = "<b>Show Definitions:</b> This mode inserts simple English definitions for difficult words, when possible. Inserted definitions are in parenthesis and highlighted in <span><font color='green'><b>( green )</b></font></span>.";  
		}else if (enhancedcontentmode ==3){
			$scope.symbolsBack="public/images/actions/show_symbols_on.png";
			$scope.analyzeMode = "<b>AAC Symbols:</b> This mode inserts augmentative and alternative communication (AAC) symbols, when possible, to give visual cues for meaning."; 
                }
                        

       		 targettext = $scope.myText;
		
  		// originaltext = $scope.myText;
                 $scope.myText = "";
                 $scope.showTwirly = true; 
        	document.getElementById('post-output-div').innerHTML = " ";
        	
           		var responsePromise = $http({
            		url: "/api/V1/contextual-simplify",
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
        		}).then(function onSuccess(response) {
                                                 
		 				
				
				 var resp = response.data;
				 //alert(resp.simplified);
   				 var status = response.status;
    			         var statusText = response.statusText;
    		                 var headers = response.headers;
    				 var config = response.config;
           			
            
               				if(resp.status == "error"){
                 				$scope.showTwirly2 = false; 
                 				setTimeout(function(){ 
                					loadingRemodal.close(); 
                 					}, 1000);
                 				alert(resp.message+ " Please try again later." ); 
           
             				}else{
          					
						var cleanOutput = resp.simplified.replace(/\|_[^_]*?_\|/g,"");
             					//  parsedText = identifyReplaceConfidence(cleanOutput);
						
               					var parsedText = parseToHtml(cleanOutput);
						
               					parsedText = identifyReplaceConfidence(parsedText);
               					
              					//appending compiled html to output text of default view
             					var tempDiv = document.createElement("div");
            					if($scope.enhanceContentMode == 3) {
             						tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";   
             					} else{
               						tempDiv.innerHTML = parsedText;   
             					}
              
             					var simplifiedResponse = $compile(tempDiv)($scope);
             					angular.element(document.getElementById('post-output-div')).append(simplifiedResponse); 
             					//appending compiled html to output text of side by side view 
             					$scope.showTwirly = false; 
             					
						$scope.OutputModeActive=true;
               					
             					
             					
             				}
        		 }).error(function(resp, status, headers, config) {
            				//loadingRemodal.close();
            				setTimeout(function(){ 
                				loadingRemodal.close(); 
                				alert("Sorry, an error occurred.");               
           				 }, 1000);
            				$scope.showTwirly2 = false; 
            				
            				console.log(resp);
            				console.log(status);
            				console.log(headers);
        		 }); 
       		
   	 };  
        

	/***************************** Condense API action  **********************************************************************/
	$scope.condensesimplify = function() {
		if($scope.myText == "" ||$scope.myText==null){
			$scope.modalMessage = "No content was provided for analysis"
			angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
			return;
		}
                 $scope.removeActive=true;
		$scope.simplifySummarizeBack="public/images/actions/summarizeAndSimplify_on.png"; 
		  $scope.analyzeMode = " <b>Summarize-Simplify:</b> This mode attempts to pull out the most important info, and create a shorter summary with easier to read wording. "
                 targettext = $scope.myText;
                 $scope.myText = "";
                 $scope.showTwirly = true; 
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
		 		}).then(function onSuccess(response) {
                                                 
		 				 //alert(resp.condensed); 
						 //$scope.outputText = resp.condensed; 
                                                 var resp = response.data;
   						 var status = response.status;
    					         var statusText = response.statusText;
    					         var headers = response.headers;
    						  var config = response.config;
		    				 var cleanOutput = resp.condensed.replace(/\|_[^_]*?_\|/g,"");
		    				 cleanOutput = identifyReplaceConfidence(cleanOutput);
                                                 
                                        
       								 $scope.outputcontext =  parseToHtml(cleanOutput);
        					
		    				  
		    				 //$scope.outputTextCondenseSimplifiedDefault = parseToHtml(cleanOutput); 
		    				 //condensesimplifyspeechtext = removeDelimiters(resp.condensed); 
		    				 $scope.showTwirly = false; 
						// $scope.removeActive=true;
						// $scope.openInactive=true;
						$scope.OutputModeActive=true;
						// $scope.simplifySummarizeBack="public/images/actions/back.png";

		      				// $scope.outputDivVisible = true; 
		    				
		 		}).error(function(resp, status, headers, config) {
		    				 $scope.showTwirly = false; 
		    				 $scope.outputDivVisible = false; 
		   				 alert("Sorry, an error occurred."); 
				 }); 

	};
 

	/***************************************    Summarize ********************************************/
    	 $scope.condenceText = function(){
		 if($scope.myText == "" ||$scope.myText==null){
			$scope.modalMessage = "No content was provided for analysis"
			angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
			return;
		}
       		 $scope.removeActive=true;
		
		 $scope.summarizeBack="public/images/actions/summarize_on.png"; 
		 $scope.analyzeMode = " <b>Summarize:</b> This mode attempts to pull out the most important info, and create a shorter summary. "
      		 targettext = $scope.myText;
                 $scope.myText = "";
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
        		 }).then(function onSuccess(response) {
                                                 
		 				 
						 //$scope.outputText = resp.condensed; 
                                                 var resp = response.data;
   						 var status = response.status;
    					         var statusText = response.statusText;
    					         var headers = response.headers;
    						  var config = response.config;
					//alert(resp.condensed); 
           				 //alert(JSON.stringify(resp)); 
       					 //$scope.outputText = resp.condensed;   
            				 $scope.outputcontext = parseToHtml(resp.condensed).split("\n").join("</br>");;      
 					//alert( $scope.outputcontext);      				 
            				 $scope.showTwirly = false; 
					// $scope.removeActive=true;
				         //$scope.openInactive=true;
					$scope.OutputModeActive=true;
					 //$scope.SummarizeBack="public/images/actions/back.png";

         		 }).error(function(resp, status, headers, config) {
            				$scope.showTwirly = false; 
            				
            				alert("Sorry, an error occurred."); 
        		 });  
         	
   	 };  
	 

	 /***************************** Back to Analyze Mode  **********************************************************************/
        $scope.undoAction = function() {
		//alert("Reached here");
		angular.element(document.getElementById('post-output-div')).empty();
		$scope.outputcontext = ""; 
		$scope.myText= targettext;
		$scope.removeActive = false;	
		$scope.openInactive= false;
		$scope.OutputModeActive= false;
		$scope.simplifySummarizeBack="public/images/actions/summarizeAndSimplify_disabled.png";
		$scope.summarizeBack="public/images/actions/summarize_disabled.png";
		$scope.simplifyBack="public/images/actions/simplify_disabled.png"; 
		$scope.topicsBack="public/images/actions/show_topics_disabled.png";
		$scope.symbolsBack="public/images/actions/show_symbols_disabled.png"; 
		$scope.defintionsBack="public/images/actions/show_definitions_disabled.png"; 
		$scope.analyzeMode="";
		
		
	};
	

	/***************************** Trial Popovers  **********************************************************************/
        $scope.showPopover = function() {
		$scope.popoverIsVisible = true; 
	};

	$scope.hidePopover = function () {
		$scope.popoverIsVisible = false;
	};

	/***************************** Invoke Modal Popup  **********************************************************************/
	$scope.getThumbnail = function(relevance, website, displayName, comment, thumbnail){
		
		angular.element('[data-remodal-id=modal]').remodal({ hashTracking: false }).open()
         	$(".abstract").html("");
         	$(".displayname").html("");
         	$(".relevance").html("");
         	$(".website").html("");
             
         	
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
         };

	$scope.showMessage = function(){
		$scope.modalMessage = "This feature is currently in development, and will be available soon!"
		angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open()
        }

        
        /***************************** Show Animation  **********************************************************************/
	$scope.showLoadingAnimation = function(){
       		return $scope.showTwirly;
   	 }; 

	/***************************** Close Active buttons  **********************************************************************/
	$scope.closeActive = function(){
       		return $scope.removeActive;
   	 }; 
	
	/***************************** Show Inactive Button  **********************************************************************/
	$scope.opengrey = function(){
       		return $scope.openInactive;
   	 };
	/***************************** Show showOutputStatus Button  **********************************************************************/
	$scope.showOutputStatus = function(){
       		return $scope.OutputModeActive;
   	 }; 

	/***************************** Function to Activate More Actions  **********************************************************************/
	$scope.enableShowMore = function(){
       		$scope.activateShowMore = true;;
   	 }; 

	/***************************** Function to Activate More Actions  **********************************************************************/
	$scope.enableShowless = function(){
       		$scope.activateShowMore = false;;
   	 }; 

	/***************************** ShowMore Buttons  **********************************************************************/
	$scope.showmore = function(){
	
       		return $scope.activateShowMore;
   	 }; 

	$scope.getTooltipPlacement = function () {
    		return ($(window).width() < 768) ? 'top' : 'left';
	};

	/***************************** Show Back Button  **********************************************************************/
	/*$scope.showback = function(){
       		return $scope.reverseAction;
   	 };  */


      


}); // end of Controller


/***************************** UTIL functions**********************************************************************/


	function setEndOfContenteditable(contentEditableElement)
	{
	    var range,selection;
	    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
	    {
		range = document.createRange();//Create a range (a range is a like the selection but invisible)
		range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
		range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
		selection = window.getSelection();//get the selection object (allows you to change selection)
		selection.removeAllRanges();//remove any selections already made
		selection.addRange(range);//make the range you have just created the visible selection
	    }
	    else if(document.selection)//IE 8 and lower
	    { 
		range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
		range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
		range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
		range.select();//Select the range (make it the visible selection
	    }
	}

	function strip(html) {
		var tmp = document.createElement("div");
		// Add filter before strip
		// html = filter(html);
		tmp.innerHTML = html;

		if (tmp.textContent == "" && typeof tmp.innerText == "undefined") {
			return "";
		}
		return tmp.textContent || tmp.innerText;
	}

	function filter(html) {
		if(config.filter instanceof CKEDITOR.htmlParser.filter) {
			var fragment = CKEDITOR.htmlParser.fragment.fromHtml(html),
			writer = new CKEDITOR.htmlParser.basicWriter();
		        config.filter.applyTo( fragment );
		        fragment.writeHtml( writer );
		        return writer.getHtml();
		    }
		return html;
	}



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
					
						var lexicon  = obj[k].lexicon != undefined ? obj[k].lexicon : "";    
					
		                 		var confidence   = obj[k].confidence != undefined ? obj[k].confidence : "";
		                 		confidence = confidence.substring(0, 6); 
		                 		targetoutput = targetoutput + lexicon+ " | conf = "+ confidence + "<br/>";
		            		} 
					/* generating the html that needs to be replaced in the simpleTex */ 
		                     
					html =  '<div class="tooltips" tooltip-placement="{{getTooltipPlacement()}}">'+replacedWords2[i] +'<span class="tooltiptexts">'+targetoutput+' </span></div>';
				
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
           // alert(simpleText);
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
							
							// #226 We can't ignore the case when doing the symbol replacements
                            //simpleText = simpleText.replace( new RegExp("\\b("+symbol+")\\b", "ig"), id+ "   ");
                            simpleText = simpleText.replace( new RegExp("\\b("+symbol+")\\b", "g"), id+ "   ");
                            
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
				
				for(var key in matchMap){ 
					
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
            
            //alert(simpleText);
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
