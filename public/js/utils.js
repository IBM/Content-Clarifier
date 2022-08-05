/***************************** UTIL functions**********************************************************************/
var simplifyspeechtext;
   var INPUT_TYPES = {TEXT: 'TEXT',  URL: 'URL', UPLOAD :'UPLOAD' };

var newdiv = document.createElement("div");
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
    html=html.split("<br>"). join(" ");
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

function synthesizeRequest(options, audio, $scope) {
    var downloadURL = HOST_URL+'/api/synthesize' +
        '?voice=' + options.voice +
        '&accept=' + 'audio/wav' +
        '&text=' + encodeURIComponent(options.text); /* +
     '&X-WDC-PL-OPT-OUT=' +  sessionPermissions; */
      
    if (options.download) {
        downloadURL += '&download=true';
        // window.location.href = downloadURL;
        // return true;
    }
    
    
    fetch (downloadURL).then(function (response) {
        if (response.ok) {
           response.blob().then(function (blob) {
                  var url = window.URL.createObjectURL(blob);
                  //audio.setState({ loading: true, hasAudio: true });

                  audio.setAttribute('src', url);
                  audio.setAttribute('type', 'audio/wav');
                  audio.playbackRate = $scope.speedRate;
                 if($scope.enableFocus && $scope.enableSpeech){ 
                    $scope.tempPause=false;
                   audio.play();
                    
                 }
                  return true;
            });
          } else{
                return false;
          }
           // return response.text()
        }).catch (function(error) {
            console.log (error);
            return false;
        });

   // return downloadURL;
}

/*
function synthesizeRequestold(options, audio) {
    var downloadURL = HOST_URL+'/api/synthesize' +
        '?voice=' + options.voice +
        '&accept=' + 'audio/ogg;codecs=opus' +
        '&text=' + encodeURIComponent(options.text);
   fetch(downloadURL).then((response) => {
      if (response.ok) {
        response.blob().then((blob) => {
          const url = window.URL.createObjectURL(blob);
          //this.setState({ loading: false, hasAudio: true });

          audio.setAttribute('src', url);
          audio.setAttribute('type', 'audio/ogg;codecs=opus');
        });
      } else {
        this.setState({ loading: false });
        response.json().then((json) => {
          this.setState({ error: json });
          setTimeout(() => this.setState({ error: null, loading: false }), 5000);
        });
      }
    });
}*/





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

function checkIfContentNotProvided($scope, targettext){
    var noContent = false;
    if($scope.type===INPUT_TYPES.TEXT && ($scope.myText == "" ||$scope.myText == undefined )){
        $scope.modalMessage = "No content was provided for analysis"
        angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
        noContent = true;
    }else if ($scope.type===INPUT_TYPES.URL && ($scope.urlTextBoxValue == "" ||$scope.urlTextBoxValue == undefined)){
       
        $scope.modalMessage = "No URL was provided for analysis"
        angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
        noContent = true;
    }else if($scope.type===INPUT_TYPES.UPLOAD && (targettext==""||targettext==undefined||targettext=="ERROR")){
       if(targettext=="ERROR"){
        	$scope.modalMessage = "Text processing failed for this file";
		
        }else{
		$scope.modalMessage = "No file  uploaded for Analysis"
	}
        angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
        noContent = true;
    }
    return noContent;
}

//API calls

function callAPIContextualSimplify($scope, $http, apiPath, dataObj){
    return $http({
        url: apiPath,
        method: "POST",
        data: dataObj,
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
            $scope.showTwirly = false;
            setTimeout(function(){
                loadingRemodal.close();
            }, 1000);
            alert(resp.message+ " Please try again later." );

        }else{
            $scope.myText = resp.original;
            var cleanOutput = resp.simplified.replace(/\|_[^_]*?_\|/g,"");
            //  parsedText = identifyReplaceConfidence(cleanOutput);

            var parsedText = parseToHtml(cleanOutput);

            parsedText = identifyReplaceConfidence(parsedText);

            //appending compiled html to output text of default view
            
            var tempDiv = document.createElement("div");
            if($scope.enhanceContentMode == 3) {
                
                tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";
                
            }else{
               
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
        $scope.showTwirly = false;
        $scope.undoAction();
        console.log(resp);
        console.log(status);
        console.log(headers);
    });
}

function callAPICondense($scope, $http, apiURL, dataObj){
    return $http({
        url: apiURL,
        method: "POST",
        data: dataObj,
        withCredentials: false,
        timeout: 300000,
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function onSuccess(response) {
        //alert(resp.condensed);
        //$scope.outputText = resp.condensed;
	var resp = response.data;
	
        if(resp.status == "error"){
		$scope.showTwirly = false;
                 $scope.modalMessage = resp.message;
		angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
		$scope.undoAction();

        }else{
		var statusText = response.statusText;
		var headers = response.headers;
		var config = response.config;
		//alert(JSON.stringify(resp));
		//$scope.outputText = resp.condensed;
		    
		simplifyspeechtext = removeDelimiters(resp.condensed); 
		$scope.myText = resp.original;
		$scope.outputcontext = parseToHtml(resp.condensed).split("\n").join("</br>");      
		$scope.showTwirly = false;
		// $scope.removeActive=true;
		//$scope.openInactive=true;
		$scope.OutputModeActive=true;
        $scope.ShowDefault=true;
	}
        //$scope.SummarizeBack="public/images/actions/back.png";

    }).error(function(resp, status, headers, config) {
        $scope.showTwirly = false;

         $scope.modalMessage = resp.message;
	 angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
	 $scope.undoAction();
    });
}


function callAPIEmotion($scope, $http, apiURL, dataObj, $sce){
	// alert("Reached emotion");
	
	//document.getElementsByClassName('post-output-div ng-binding').style["line-height"]=" 6.5"
    return $http({
        url: apiURL,
        method: "POST",
        data: dataObj,
        withCredentials: false,
        timeout: 300000,
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function onSuccess(response) {
        //alert(response);
        //$scope.outputText = resp.condensed;
	var resp = response.data;
	
        if(resp.status == "error"){
		$scope.showTwirly = false;
                 $scope.modalMessage = resp.message;
		angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
		$scope.undoAction();

        }else{
               
		var statusText = response.statusText;
		var headers = response.headers;
		var config = response.config;
		//alert(JSON.stringify(resp));
		 var document;
		if(resp.sentences == undefined){
			//alert("Reached document loop");
			var jsonData = resp.tones;
			var labelarray = [];
			var dataarray = [];
		
			    for(var i=0; i<jsonData.length; i++){
			
		                   if(document !=undefined){
		                   	document = document+ " </br> " + jsonData[i].tone+ ": "+jsonData[i].score;
				   }else {
					document = jsonData[i].tone+ ": "+jsonData[i].score;
				   }
				labelarray.push(jsonData[i].tone);
				dataarray.push(jsonData[i].score);
				
			    }
			$scope.labels = labelarray;
  			$scope.data = dataarray;
                }else{
			//alert("Reached sentence loop");
			var jsonData = resp.sentences;
			//alert(JSON.stringify(jsonData));
			
			var sentence="";
			var finalSentences="";
			var decision_distance = DISTANCE_DECISION;
			var classifierThresold = CLASSIFIER_THRESHOLD;
			var averagescore;
			
                        for(var i=0; i<jsonData.length; i++){
				var score=undefined;
				var tone=undefined;
				var totalscore=0;
				sentence=jsonData[i].sentence;
				sentence = sentence.split('{"text":"').join("");
				sentence = sentence.split('","tones":"emotion"}').join("");
 
				for(var j=0; j<jsonData[i].tones.length; j++){
					totalscore=totalscore+jsonData[i].tones[j].score;
					if(score!= null||score!= undefined){
						if(score < jsonData[i].tones[j].score){
							   score = jsonData[i].tones[j].score;
							   tone=jsonData[i].tones[j].tone;
						}
		                               
					}else{
					   score=jsonData[i].tones[j].score;
					   tone=jsonData[i].tones[j].tone;
					}
                                       
					//sentence=sentence+ "</br>"+ jsonData[i].tones[j].tone+ ": "+jsonData[i].tones[j].score
				}
				
				averagescore = totalscore/jsonData[i].tones.length;
				if(score < classifierThresold) {

					finalSentences=finalSentences+"&nbsp<div style='line-height:2.5; display:inline;'>"+sentence+ "</div>";
				}else{

					if(score-averagescore < decision_distance){
                                   		finalSentences=finalSentences+"&nbsp<div style='line-height:2.5; display:inline;'>"+sentence+ "</div>";
					}else {
						finalSentences=finalSentences+"&nbsp<div class='"+tone+"' style='line-height:2.5; display:inline;'>"+sentence+ "</div>";
					}
                                }
				

				// sentence=sentence+ "</br>highest score: "+score+ "</br>tone : "+tone+ "</br></br>" 
				//tone= "id='"+tone+"'";
				//finalSentences=finalSentences+createElementHtml(tone, 'div', sentence);
				//alert(finalSentences);
				//var newdiv = document.createElement('div'); 
				//newdiv.id = tone;  
				//newdiv.textContent=sentence;
				//finalSentences=finalSentences+newdiv;
				
			}
			var jsonToneData = resp.tones;
			var labelarray = [];
			var dataarray = [];
		
			    for(var i=0; i<jsonToneData.length; i++){
			
		                   if(document !=undefined){
		                   	document = document+ " </br> " + jsonToneData[i].tone+ ": "+jsonToneData[i].score;
				   }else {
					document = jsonToneData[i].tone+ ": "+jsonToneData[i].score;
				   }
				labelarray.push(jsonToneData[i].tone);
				dataarray.push(jsonToneData[i].score);
				
			    }
			$scope.labels = labelarray;
  			$scope.data = dataarray;
			
		}

		$scope.outputcontext =  $sce.trustAsHtml(document && finalSentences); 
		$scope.showTwirly = false;
		$scope.OutputModeActive=true;

		//$scope.outputcontext =  document && finalSentences; 
		//simplifyspeechtext = removeDelimiters(resp.tones); 
		$scope.myText = resp.original;
		//alert(finalSentences);
		//angular.element(document.getElementsByClassName('post-output-div')).style["line-height"] = 6.5;
		//angular.element(document.getElementById('post-output-div')).style.cssText = 'line-height: 6.5'
		//document.getElementById('post-output-div').style.cssText = 'line-height: 6.5' 
		//alert(  $scope.outputcontextEmotions);
	}
        //$scope.SummarizeBack="public/images/actions/back.png";

    }).error(function(resp, status, headers, config) {
        $scope.showTwirly = false;

         $scope.modalMessage = resp.message;
	 angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
	 $scope.undoAction();
    });
}

function callAPICondenseSimplify($scope, $http, apiURL, dataObj){
    return $http({
        url: apiURL,
        method: "POST",
        data: dataObj,
        withCredentials: false,
        timeout: 300000,
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function onSuccess(response) {

        //$scope.outputText = resp.condensed;
        var resp = response.data;
	
        if(resp.status == "error"){
		$scope.showTwirly = false;
                $scope.modalMessage = resp.message;
		angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
		$scope.undoAction();

        }else{
        
            var statusText = response.statusText;
            var headers = response.headers;
            var config = response.config;
            simplifyspeechtext = removeDelimiters(resp.condensed); 
            $scope.myText = resp.original;
            var cleanOutput = resp.condensed.replace(/\|_[^_]*?_\|/g,"");
                        
            cleanOutput = identifyReplaceConfidence(cleanOutput);


            $scope.outputcontext =  parseToHtml(cleanOutput);


            //$scope.outputTextCondenseSimplifiedDefault = parseToHtml(cleanOutput);
            //condensesimplifyspeechtext = removeDelimiters(resp.condensed);
            $scope.showTwirly = false;
            // $scope.removeActive=true;
            // $scope.openInactive=true;
            $scope.OutputModeActive=true;
            $scope.ShowDefault=true;

            // $scope.simplifySummarizeBack="public/images/actions/back.png";

            // $scope.outputDivVisible = true;
        }

    }).error(function(resp, status, headers, config) {
        $scope.showTwirly = false;
        $scope.outputDivVisible = false;
         $scope.modalMessage = resp.message;
	angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
	$scope.undoAction();
    });
}

function stopAudio(){
	audio.style.cssText = 'display:none';
	audio.pause();
}

      
        // CHARACTER COUNTER SUB-FUNCTION //
        // excludes spaces between words as characters
function charCounter(inputText) {
        var charCount = 0;
        inputText = inputText.trim(); // removes trailing and leading spaces
        inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
        inputText = inputText.replace(/(<([^>]+)>)/ig,""); // strips HTML tags like <p> </p>
        charCount = inputText.length - inputText.split(" ").length + 1; 
        //the minus is intended to exclude spaces between words
        //alert("\n\tCHAR COUNT = " + charCount);
        return charCount;
}


 // SYLLABLE COUNTER SUB-FUNCTION
        // criteria: used a RegExp pattern found in stackoverflow website
        // stackoverflow.com/questions/43971774/separating-words-by-syllable-count
        // categorized words by syllable count an idea also found on same webpage
        // Grouping of words into their syllable count as an object
function syllableCounter(inputText) {
        inputText = inputText.trim(); // removes trailing and leading spaces
        inputText = inputText.replace(/&#39;/g, ''); //replace single "'" with ""
        inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
        inputText = inputText.replace(/(<([^>]+)>)/g,""); // replace HTML tags as space
        inputText = inputText.replace(/\W/g," "); //replace non-word characters with space
        var syllableCountDict = groupBySyllableCount(inputText.split(" ")); 
                        
        function groupBySyllableCount(wordList) {
                var wordsBySyllableCount = {};
                var slblCount = 0;       
                
                for (var x = 0, len = wordList.length; x < len; x++) {
                    slblCount = new_count(wordList[x]);
                    if (wordsBySyllableCount[slblCount] === undefined) {
                        wordsBySyllableCount[slblCount] = [wordList[x]];
                    }
                    else {
                        if(/\w/.test(wordList[x])) { // added to exclude nonWords
                            wordsBySyllableCount[slblCount].push(wordList[x]);
                        } 
                    }            
                }
                return wordsBySyllableCount;
         }
            // the following function counts the syllables of an input word
            // key is the regular expression pattern
            // criteria one or two consecutive vowel/s counted as one syllable
            // ooo will be counted as two syllables, "oo" and "o"
            // it first removes excess letters e.g.,
            // removes words not ending with [^laeiouy] + [es, ed, e]
            // and then removes "Y" if it starts the word
            // before counting consecutive vowels
            // I addded the "if" condition at the end to check for vowel in string
            // Treats string without any vowels as 1 syllable, e.g., http
        function new_count(word) {
                word = word.toLowerCase();
                if(word.length <= 3) { return 1; }
                word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
                word = word.replace(/^y/, ''); 
                if (/[aeiou]+/.test(word)) {
                    return word.match(/[aeiouy]{1,2}/g).length;
                } 
                else { return 1; }
            }
            // Sums the total number of syllables per syllable count group
            var syllableCountTotal = 0;    
            for (var i =1; i < 15; i++) {
                if (syllableCountDict[i] !== undefined) {
                    syllableCountTotal += (i * syllableCountDict[i].length);
                    //alert("syllable count = " + i + "\n\n\t" +
                    //      syllableCountDict[i].join(" / "));
                }       
            }
            //alert("\n\tsyllable count = " + syllableCountTotal);
            return syllableCountTotal;
}

 // WORD COUNTER SUB-FUNCTION //        
        // criteria: separate string with blank space as delimiter first,  
        // then count only substrings that have alphanumerics. 
        function wordCounter(inputText) {
            inputText = inputText.trim(); // removes trailing and leading spaces
            inputText = inputText.replace(/(<([^>]+)>)/ig," "); // replace HTML tags as space
            inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
            var words = inputText.split(" ");
            var correctWords = []; // stores strings that have alphanumeric char
            var n, loopLength = words.length;
            for (n = 0; n < loopLength; n++) {
                if(/\w/.test(words[n])) { 
                    // uses Regular Expression to test if Word[n] is a word or not
                    correctWords.push(words[n]);
                }
            }
            //alert("WORDS\n\n\t" + correctWords.join(" / "));
            return correctWords.length
        }
         
        // UNIQUE WORD COUNTER SUB-FUNCTION
        // criteria:  Rid each substring of non-alphanumeric characters
        // then add all first instances of words to the output array
        // Need to convert to lower case in order to accurate match
        function uniqWordsCounter(inputText) {
            inputText = inputText.trim(); // removes trailing and leading spaces
            inputText = inputText.replace(/(<([^>]+)>)/ig," "); // replace HTML tags with space
            inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
            var words = inputText.split(" ");
            var uniqWords = [];
            var tempStr;
            var tempWord = "";
            var i;
            var loopLength = words.length;
            for (i = 0; i < loopLength; i++) {
                if( /\w/.test(words[i]) ) {
                    //tempStr = words[i].replace(/\W/g,""); too aggressive
                    tempStr = words[i].replace(/^\W/,""); //remove non-word char at beginning
                    tempStr = tempStr.replace(/\W$/,""); //remove non-word char at end
                    tempWord = tempStr.toLowerCase();
                    if( uniqWords.indexOf(tempWord) < 0 ) {
                        uniqWords.push(tempWord);
                    }
                }
            }
            //alert("UNIQUE WORDS\n\n" + uniqWords.join(" / "));
            return uniqWords.length;
        }


 // SENTENSE COUNTER SUB-FUNCTION
        // Logic: assumed sentenses end with ./?/|! and space.
        // and used this as break
        function sentCounter(inputText) {
            inputText = inputText.trim(); // removes trailing and leading spaces
            inputText = inputText.replace(/(<([^>]+)>)/ig," "); // converts HTML tags to space
            inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
                                    
            var sentCount = 0;        
            var tempSentence = inputText.split(". ");
            sentCount += tempSentence.length - 1; 
            //alert("SENTENCE period count = " + sentCount +
            //      "\n\n" + tempSentence.join(" / \n\n "));
            tempSentence = inputText.split("! ");
            sentCount += tempSentence.length - 1;
            //alert("SENTENCE period + exclamation count = " + sentCount +
            //      "\n\n" + tempSentence.join(" / \n\n "));
            tempSentence = inputText.split("? ");
            sentCount += tempSentence.length - 1;
            //alert("SENTENCE Period + exclamation + Qmark count = " + sentCount +
            //      "\n\n" + tempSentence.join(" / \n\n "));
            
            return sentCount;
        }
                  
        // PARAGRAPH COUNTER SUB-FUNCTION //
        // used \n as paragraph counter
        function paragCounter(inputText) {
            inputText = inputText.replace(/&nbsp;/g, ''); //cleans &nbsp
            inputText = inputText.replace(/(<([^>]+)>)/ig,""); // strips HTML tags like <p> </p>
            inputText = inputText.replace(/[<]br[^>]*[>]/gi,"\n");             
            //unsure if input text will have both <br> and <p> and \n, 
            //so replaced all <br> to \n first
            inputText = inputText.replace(/\n$/gm, ""); //remove multiple lines
            
            //alert("PARAGRAPH\n\n" + inputText.split("\n").join(" / \n\n "));
            return inputText.split("\n").length;
        }

        function readTimeEstimator(inputText) {
		var wordCount = wordCounter(inputText);  
		var estReadTime = wordCount / 275;
		var readTimeOutput = "";
		
		if(estReadTime < 1.0){
		    estReadTime = estReadTime * 60;
		    readTimeOutput = estReadTime.toFixed(0) + " sec";
		}
		else {readTimeOutput = estReadTime.toFixed(1) + " min";}
		return readTimeOutput;
    	}

   function readTimeEstimatorInSecs(inputText) {
		var wordCount = wordCounter(inputText);  
		var estReadTime = wordCount / 275;
		var readTimeOutput = "";
		
		
		    estReadTime = estReadTime * 60*2;
		    
		
		return estReadTime;
    	}

    function createElementHtml(id,tagname,content){
	  var containerdiv = document.createElement('div'),
	      nwtag = document.createElement(tagname);
		nwtag.innerHTML+=content;
	  nwtag.id = id;
	  containerdiv.appendChild(nwtag);
        //  containerdiv.innerHTML+=content;
	  return containerdiv.innerHTML;
}

function changeColor(coll, color){

    for(var i=0, len=coll.length; i<len; i++)
    {
	
	if(coll[i].style["border-bottom-color"] =="white"||coll[i].style["border-bottom-color"]==""){
        	//coll[i].style["background-color"] = color;
		coll[i].style["border-bottom"] ="3px solid blue";
		coll[i].style["border-bottom-color"] =color; 
	}else{
		
		//coll[i].style["background-color"] ="white";
		coll[i].style["border-bottom"] ="none";
		coll[i].style["border-bottom-color"] ="white"; 
    
	}
	//coll[i].style["display"] = "inline";
	
    }
}

function removeHtmlTags(savetext, $scope){
    
    if(!$scope.labels){
            savetext=savetext.replace(/<span[^>]*class="tooltiptexts"[^>]*>(.*?)<\/span>/g,"");
            //savetext = savetext.replace(/<div[^>]*class="tooltips"[^>]*><\/div>/g,"");
            savetext = savetext.replace(/<\/?div[^>]*class="tooltips">?/g,"");
            savetext = savetext.split("</div>").join("");
       }
       if($scope.enhanceContentMode==2){
           savetext = savetext.split('tooltip-placement="left">').join("");
       }
    return savetext;
}





