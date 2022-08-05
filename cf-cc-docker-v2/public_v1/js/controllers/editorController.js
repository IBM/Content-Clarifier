webapp.controller('editorCtrl', function($scope, $timeout, $http, $compile, $location, $sce) {

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


	/***************************** Condense API action  **********************************************************************/
	$scope.condensesimplify = function() {
                  
                 var targettext = $scope.myText;
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
		      				// $scope.outputDivVisible = true; 
		    				
		 		}).error(function(resp, status, headers, config) {
		    				 $scope.showTwirly = false; 
		    				 $scope.outputDivVisible = false; 
		   				 alert("Sorry, an error occurred."); 
				 }); 

	}

	// ------------------ condenceText() ------------------------
    
    	 $scope.condenceText = function(){
       		
      		 var targettext = $scope.myText;
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

         		 }).error(function(resp, status, headers, config) {
            				$scope.showTwirly = false; 
            				
            				alert("Sorry, an error occurred."); 
        		 });  
         	
   	 };   

	/***************************** Trial Popovers  **********************************************************************/
        $scope.showPopover = function() {
		$scope.popoverIsVisible = true; 
	};

	$scope.hidePopover = function () {
		$scope.popoverIsVisible = false;
	};

	/***************************** Invoke Modal Popup  **********************************************************************/
	$scope.getThumbnail = function(){
		angular.element('[data-remodal-id=modal]').remodal({ hashTracking: false }).open()
	};

        
        /***************************** Show Animation  **********************************************************************/
	$scope.showLoadingAnimation = function(){
       		return $scope.showTwirly;
   	 }; 



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
