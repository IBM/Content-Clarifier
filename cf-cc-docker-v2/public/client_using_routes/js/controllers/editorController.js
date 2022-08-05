webapp.controller('editorCtrl', function($scope, $timeout, $http, $compile, $location, $sce) {

        var targettext;
        //var originaltext;
	/****** Authentication details for API calls ****/
	$scope.id = 'demo-app@us.ibm.com';
	$scope.apikey = '7M0xQYZUa9CvCz8wPmCI';


	/****** Input parameter values ******/
	$scope.outputMode = 0;
	$scope.condenseMode = "abstraction"; // {abstraction, extraction}
	$scope.refs = 0;
	$scope.type = "TEXT";
	$scope.calculateReadingLevels = 0; // Future support 
	$scope.enhanceContentMode=0;
   

         
	/****** Read Input messages from File ******/
	$scope.myText = readTextFile('/public/samples/conversation.txt');

     
      
      /******** Checks if the user is authenticated to access the index page **********/
	$scope.init = function () {
		//if($location.host() != 'localhost'){
		 /* Remove preloader */
            
	    $(".preloader-wrapper").fadeOut(1000, function() {
	     
	      $(this).remove();
	    });
	 }





       /****** Unused trial Code ******/
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
	}

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

	}

	/********* ------------------ contextualSimplifyText() :TAB-1 ------------------------ *********/
    
	$scope.contextualSimplifyText = function(outputmode, enhancedcontentmode ){
		//alert($scope.myText);
               
		$scope.enhanceContentMode=enhancedcontentmode;
		$scope.removeActive=true;
		
		if(enhancedcontentmode==0){
			$scope.simplifyBack="public/images/actions/simplify_on.png"; 
                }else if (enhancedcontentmode ==1){
			$scope.topicsBack="public/images/actions/show_topics_on.png";
		}else if (enhancedcontentmode ==2){
			$scope.defintionsBack="public/images/actions/show_definitions_on.png";
		}else if (enhancedcontentmode ==3){
			$scope.symbolsBack="public/images/actions/show_symbols_on.png";
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
                 $scope.removeActive=true;
		$scope.simplifySummarizeBack="public/images/actions/summarizeAndSimplify_on.png"; 
		
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

	}

	// ------------------ condenceText() ------------------------
    
    	 $scope.condenceText = function(){
       		 $scope.removeActive=true;
		 $scope.summarizeBack="public/images/actions/summarize_on.png"; 
		 
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
                                                 
		 				 //alert(resp.condensed); 
						 //$scope.outputText = resp.condensed; 
                                                 var resp = response.data;
   						 var status = response.status;
    					         var statusText = response.statusText;
    					         var headers = response.headers;
    						  var config = response.config;
           				 //alert(JSON.stringify(resp)); 
       					 //$scope.outputText = resp.condensed;   
            				 $scope.outputcontext = parseToHtml(resp.condensed);           				 
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
	 

	 /***************************** Undo Action  **********************************************************************/
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
