
//Define an angular module for our app
"use strict";

var webapp =angular.module(['myApp'], ['ngMaterial', 'ngMessages',  'material.svgAssetsCache', 'ngSanitize',                                        'ckeditor', '720kb.tooltips', 'slickCarousel', 'angularFileUpload', 'chart.js',                                          , 'uiSwitch']);

var simplifyspeechtext;
var targettext;
var scrolldiv=1;
var scrollpostion = 0;

/*
angular.module('textSizeSlider', [])
  .directive('textSizeSlider', ['$document', function ($document) {
    return {}
  }]); */

/*
 (function (ChartJsProvider) {
 ChartJsProvider.setOptions({ colors : [ 'green', 'red', 'blue', 'yellow', 'orange', 'white', 'black'] });
 }); */

webapp.controller('editorCtrl', function($scope,FileUploader, $timeout, $http, $compile, $location, $sce, $document) {
    $scope.successMessage=false;
    $scope.uploadPanel=false;
    $scope.miccss="miccss";
    $scope.micText="Start Recording";
    $scope.removeUploadButton=false;
    $scope.colours = ['#72C02C', '#3498DB', '#717984', '#F1C40F'];
    $scope.chart;
    
    $scope.min="20";
    $scope.max="72";
    $scope.unit="px";
    $scope.value=16;
    $scope.currentHeight = 33;
    $scope.currentMargin = 20;
    $scope.height=70;
    $scope.highlightdivison=false;
    $scope.lineText="";
    $scope.readingMode = true;
    $scope.focusValue ="OFF";
    $scope.syllablesValue ="OFF";
    $scope.isSafari = false;
    $scope.qty = 16;
    $scope.enableSpeech=false;
    $scope.syllables="";
    var ttstoken;
     
    /*$('.slider').on('change',function(){
            var val = $(this).val();
            alert(val);
    });  */
 
    $scope.textSize = $scope.value;
    
    $scope.$watch('textSize', function (size) {
          //$document[0].body.style.fontSize = size + $scope.unit;
          $scope.increment(size);
        
    }); 
     
    $scope.$watch('speedRate', function (size) {
        //$scope.speakText();
        if (!audio.paused) { 
            audio = document.getElementById('audio');
            audio.playbackRate = $scope.speedRate;
            audio.play();
        }
         // selectCurrentWord();   
    });     
    
    $scope.increment = function(size) {
        
        scrolldiv =1;
        $scope.qty = $scope.textSize;
        $scope.height= $scope.height+3;
        //$scope.qty++;
        //document.getElementById('highlight').style.height = $scope.height+"px";
        
        if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){
                document.getElementById('overlay-parent-div').style.fontSize = $scope.qty + $scope.unit;
                var sampletext= document.getElementById('post-input-div').innerHTML;
                sampletext= sampletext.split("<p>").join("");
                sampletext=sampletext.split("</p>").join(""); 
                sampletext = strip(sampletext);
                 if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithm($scope.syllables);
                }else{
                    textalgorithm(sampletext);
                }
                
           }else{
                document.getElementById('overlay-parent-div').style.fontSize = $scope.qty + $scope.unit;
                var overlayText= document.getElementById('post-output-div').innerHTML;
                overlayText = removeHtmlTags(overlayText, $scope);
                simplifyspeechtext = overlayText;
                simplifyspeechtext =convertSpeechText(simplifyspeechtext);
                simplifyspeechtext= strip(simplifyspeechtext)
                if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithmOutput($scope.syllables);
                }else{
                     textalgorithmOutput(simplifyspeechtext);   
                }
                   
           }
        
        if($scope.enableFocus==true){
                $("#div1").css("background-color", "white");
                $("#div1").css("font-weight", "800");
                $("#div1").css("color", "#0000FF");
                // $("#div1").css("zoom", 1.1);
        }
 
        // document.getElementById('post-output-div').style.textAlign = "justify";
        /* var canvas = document.createElement('canvas');
        var str = document.getElementById('post-input-div').innerHTML;
        var ctx = canvas.getContext("2d");
        ctx.font = $scope.qty + $scope.unit+" sans-serif";        
        var width = ctx.measureText(str).width; */
       
  };
    
    $scope.decrement = function() {
        scrolldiv =1;
        $scope.qty--;
        $scope.height= $scope.height-3;
        
        if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){
            document.getElementById('post-input-div').style.fontSize = $scope.qty + $scope.unit;
            var sampletext= document.getElementById('post-input-div').innerHTML;
            sampletext= sampletext.split("<p>").join("");
            sampletext=sampletext.split("</p>").join(""); 
            sampletext=strip(sampletext);
            if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithm($scope.syllables);
                }else{
                    textalgorithm(sampletext);
                }
        }else{
            document.getElementById('post-output-div').style.fontSize = $scope.qty + $scope.unit;
            var overlayText= document.getElementById('post-output-div').innerHTML;
            overlayText = removeHtmlTags(overlayText, $scope);
            simplifyspeechtext = overlayText;
            simplifyspeechtext =convertSpeechText(simplifyspeechtext);
            simplifyspeechtext= strip(simplifyspeechtext)
            if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithmOutput($scope.syllables);
            }else{
                     textalgorithmOutput(simplifyspeechtext);   
            } 
        }
        
        $("#div1").css("background-color", "white");
        $("#div1").css("font-weight", "800");
        $("#div1").css("color", "#0000FF");
        // $("#div1").css("zoom", 1.1);
        // document.getElementById('post-output-div').style.textAlign = "justify";      
    };
            
    /*  $scope.overlayOnOld = function() {
        $scope.qty = 24;     
        document.getElementById("overlay").style.display = "block";
        document.getElementById("overlay2").style.display = "block";
        document.getElementById("wrapperoverlay").style.display = "block";
        document.getElementById('post-input-div').style.fontSize = $scope.qty + $scope.unit;
        document.getElementById('post-output-div').style.fontSize = $scope.qty + $scope.unit;
        document.getElementById('post-input-div').style.lineHeight = 3;
        document.getElementById('post-input-div').style.letterSpacing = "3px";
        document.getElementById('post-output-div').style.lineHeight = 3;
        document.getElementById('post-output-div').style.letterSpacing = "3px";
        document.getElementById('post-input-div').style.fontWeight=1000;
        document.getElementById('post-output-div').style.fontWeight=1000;
        alert(document.getElementById('post-input-div').innerHTML);
        
        var canvas = document.createElement('canvas');
        var str = document.getElementById('post-input-div').textContent;
        var ctx = canvas.getContext("2d");
        canvas.style.letterSpacing="3px";
        ctx.font = $scope.qty+ $scope.unit+" sans-serif";    
        var width = ctx.measureText(str).width;

         } */
    
    $scope.URLoverlayOn = function(){
        $scope.urlDivVisible=true;
        $scope.overlayOn();
        
    }
    
    $scope.overlayOn = function() {
        //document.getElementById('post-input-div').innerHTML="hi how are you;"
         var overlayText;
        
        $http.get(HOST_URL+ "/api/token").then(function(response) {
            ttstoken= response.data;
            wsURI = "wss://stream.watsonplatform.net/text-to-speech/api/v1/synthesize?voice=" +
            voice + "&watson-token=" + ttstoken;
            });  
        $scope.tempPause=false;
        $scope.qty = 25;
        $scope.textSize = 25;
        $scope.speedRate=1;
        document.getElementById("overlay").style.display = "block";
        document.getElementById("overlay2").style.display = "block";
        document.getElementById("wrapperoverlay").style.display = "block";
        $scope.highlightdivison=true;
        if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){
           
            if($scope.urlDivVisible){
                
                var  dataObj = {
                        url: $scope.urlTextBoxValue
                       
                    };
                $http({
                    url: HOST_URL+ "/getUrlText",
                    method: "POST",
                    data: dataObj,
                    withCredentials: false,
                    timeout: 300000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function onSuccess(response) {
           
                       
                        if(response.data.status=="success"){
                            
                            overlayText=response.data.text;
                            
                            document.getElementById('post-input-div').innerHTML=overlayText;
                            overlayText= overlayText.split("<p>").join("");
                            overlayText=overlayText.split("</p>").join("");
                            simplifyspeechtext = overlayText;
                            simplifyspeechtext =convertSpeechText(simplifyspeechtext);
                            simplifyspeechtext= strip(simplifyspeechtext)
                            $scope.getSyllables(simplifyspeechtext);
                            $scope.speakLineWithTiming(simplifyspeechtext);
                            $scope.prepareTTS();
                            if($scope.enableSyllables) {
                                        $scope.syllables = $scope.syllables.split("~").join("&#8226");
                                        textalgorithm($scope.syllables);
                            }else{
                                       textalgorithm(simplifyspeechtext);
                            }
                        }else{
                            $scope.modalMessage = response.data.message;
                            angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
                            $scope.overlayOff();
                            
                        }
                });
                
            }else{
                overlayText= document.getElementById('post-input-div').innerHTML;
                overlayText= overlayText.split("<p>").join("");
                overlayText=overlayText.split("</p>").join("");
                simplifyspeechtext = overlayText;
                simplifyspeechtext =convertSpeechText(simplifyspeechtext);
                simplifyspeechtext= strip(simplifyspeechtext)
                $scope.getSyllables(simplifyspeechtext);
                $scope.speakLineWithTiming(simplifyspeechtext);
                $scope.prepareTTS();
                if($scope.enableSyllables) {
                            $scope.syllables = $scope.syllables.split("~").join("&#8226");
                            textalgorithm($scope.syllables);
                }else{
                           textalgorithm(simplifyspeechtext);
                }
            }
           
            
            
            
        }else{
            var overlayText= document.getElementById('post-output-div').innerHTML;
            //overlayText=overlayText.substr(overlayText.indexOf(" ")+1);
            overlayText = removeHtmlTags(overlayText, $scope);
            simplifyspeechtext = overlayText;
            simplifyspeechtext =convertSpeechText(simplifyspeechtext);
            simplifyspeechtext= strip(simplifyspeechtext);
            audio.style.cssText = 'display:visible';
            //textalgorithmOutput(simplifyspeechtext);
            
            $scope.getSyllables(simplifyspeechtext);
            if($scope.enableSyllables) {
                            $scope.syllables = $scope.syllables.split("~").join("&#8226");
                            textalgorithmOutput($scope.syllables);
                }else{
                           textalgorithmOutput(simplifyspeechtext);
                }
            $scope.speakLineWithTiming(simplifyspeechtext);
            $scope.prepareTTS();
            //  overlayText=overlayText.replace(/<span[^>]*class="tooltiptexts"[^>]*>(.*?)<\/span>/g,"");                     
        }
         
        
    }
       
    $(window).resize(function(){
        scrolldiv=1;
        if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){
            var sampletext= document.getElementById('post-input-div').innerHTML;
            sampletext= sampletext.split("<p>").join("");
            sampletext=sampletext.split("</p>").join(""); 
            sampletext = strip(sampletext);
             if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithm($scope.syllables);
                }else{
                    textalgorithm(sampletext);
                }
         }else{
            var overlayText= document.getElementById('post-output-div').innerHTML;
            overlayText = removeHtmlTags(overlayText, $scope);
            simplifyspeechtext = overlayText;
            simplifyspeechtext =convertSpeechText(simplifyspeechtext);
            simplifyspeechtext= strip(simplifyspeechtext)
            if($scope.enableSyllables) {
                     $scope.syllables = $scope.syllables.split("~").join("&#8226");
                     textalgorithmOutput($scope.syllables);
            }else{
                     textalgorithmOutput(simplifyspeechtext);   
            }
         }
        
         if($scope.enableFocus==true){
            $("#div1").css("background-color", "white");
            $("#div1").css("font-weight", "800");
            $("#div1").css("color", "#0000FF");
         }
    });
       
    var eventtimeout=false;
    
    document.addEventListener('keydown', function (){
        if(eventtimeout ==false){
            switch (event.key) {
                case "ArrowLeft":
                    //$scope.scrollup();
                    // $('#rangeInput').focus();
                    break;
                case "ArrowRight":
                    // $scope.scrolldown();
                        // $('#rangeInput').focus();
                    break;
                case "ArrowUp":
                    if(!$('#rangeInput').is(':focus') && !$('#speedInput').is(':focus')){
                        $('#speedInput').blur();
                        $('#rangeInput').blur();
                        $scope.scrollup();
                    }
                    break;
                case "ArrowDown":
                    // $('#scrolldown').click();
                    //  $('#rangeInput').blur();
                    if(!$('#rangeInput').is(':focus')&& !$('#speedInput').is(':focus')){
                        $('#speedInput').blur();
                        $('#rangeInput').blur();
                        $scope.scrolldown();
                    }
                break;
             }   
        }
   
    });    
    
    var lastScrollTop = 0;
        // element should be replaced with the actual target element on which you have applied scroll, use window in case of no target element.
        /*document.getElementById("overlay").addEventListener("scroll", function(){ // or window.addEventListener("scroll"....
            if(scrolldiv>=1 && scrolldiv <$scope.divcount ){
                scrolldiv++;
                // $("#div"+(scrolldiv-1)).css("zoom", 1);
                // $("#div"+scrolldiv).css("zoom", 1.1);
                eventtimeout = true;
                $('#scrolldown').prop('disabled', true);
                $scope.speakLine($("#div"+scrolldiv).text());
                $("#div"+(scrolldiv-1)).css("color", "black");
                $("#div"+scrolldiv).css("color", "brown");
                $("#div"+(scrolldiv-1)).css("background-color", "grey");
                $("#div"+scrolldiv).css("background-color", "white");
                //$("#div"+scrolldiv).scrollView();
                $("#div"+(scrolldiv-1)).css("font-weight", "500");
                $("#div"+scrolldiv).css("font-weight", "800");
                /*   $('#overlay').animate({scrollTop: document.getElementById("overlay").scrollTop + (document.getElementById("div"+scrolldiv).scrollHeight+30)});
                $timeout(function(){
                $('#scrolldown').prop('disabled', false);
                        eventtimeout=false;
                    }, 500);
                }
        }); */
    
    $scope.focusline =1;
    $scope.enableFocus =false;
    
    $('#enableFocus').change(function() {
         $scope.enableFocus = $('#enableFocus').prop('checked');
         $scope.focusChg();

     })
     
    $scope.focusChg = function() {
         $scope.setFocus(1);
         $scope.stopAudio();
         $scope.tempPause = false;
         audio.src="";
     }
    
     $scope.syllablesON = function() {
        
         $scope.stopAudio();
         $scope.tempPause = false;
        if($scope.enableFocus){
            $scope.setFocus(1);
        }else{
            if($scope.enableSyllables) {
             $scope.syllables = $scope.syllables.split("~").join("&#8226");
             textalgorithm($scope.syllables);
             $scope.syllablesValue ="ON";
         }else{
              textalgorithm(simplifyspeechtext);
              $scope.syllablesValue ="OFF";
         }
            
        }
     }
    
    $scope.setFocus = function(lines){
        
        if($scope.enableFocus) {
            
            $scope.focusValue ="ON";
            $scope.stopAudio();
            $scope.enableSpeech = false;
            $scope.tempPause = false;
            $scope.focusline =lines;
            scrolldiv =1;
            $scope.enableFocus = true;
            $scope.width = '13%';
            
            if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){
                    var overlayText= document.getElementById('post-input-div').innerHTML;
                    overlayText= overlayText.split("<p>").join("");
                    overlayText=overlayText.split("</p>").join("");
                    overlayText =convertSpeechText(overlayText);
                    overlayText= strip(overlayText)
                    
                    if($scope.enableSyllables) {
                        $scope.syllablesValue ="ON";
                        $scope.syllables = $scope.syllables.split("~").join("&#8226");
                        textalgorithm($scope.syllables);
                   }else{
                       $scope.syllablesValue ="OFF";
                       textalgorithm(overlayText);
                   }
            }else{
                    var overlayText= document.getElementById('post-output-div').innerHTML;
                    overlayText = removeHtmlTags(overlayText, $scope);
                    overlayText =convertSpeechText(overlayText);
                    overlayText= strip(overlayText);
                   if($scope.enableSyllables) {
                        $scope.syllablesValue ="ON";
                        $scope.syllables = $scope.syllables.split("~").join("&#8226");
                        textalgorithmOutput($scope.syllables);
                   }else{
                       $scope.syllablesValue ="OFF";
                       textalgorithmOutput(overlayText);
                   }
                    
            }
            
            $(".overlay").css("background-color", "#303030");
            simplifyspeechtext= $("#div1").text();
            simplifyspeechtext =convertSpeechText(simplifyspeechtext);
            simplifyspeechtext= strip(simplifyspeechtext)
            simplifyspeechtext=simplifyspeechtext.split("•").join("");
            $scope.prepareTTS();
            //$scope.speakLineWithTiming(simplifyspeechtext); //not supporting word timings for Focus mode yet
              
            $("#div1").css("background-color", "white");
            $("#div1").css("font-weight", "800");
            $("#div1").css("color", "#0000FF");
            
       }else{
           
            $scope.focusValue ="OFF";
            $(".preloader-wrapper2").fadeIn();
            $(".preloader-wrapper2").fadeOut(3500, function() { });
            $scope.focusline =lines;
            // alert("reached")
            $scope.overlayOn();
            $(".overlay").css("background-color", "#eeeeee");
            $scope.width = '8%';
       }
    }
   
    /* WORD HIGHLIGHT ON CLICK EVENT */
    document.getElementById("overlay-parent-div").addEventListener('click', on_select_word_el, false);

    function on_select_word_el(e) {
            //alert(e.target.id.substring(5))
            var i = e.target.id.substring(5);
            audio.currentTime = syncData[i].start + 0.01; //Note: times apparently cannot be exactly set and sometimes select too early
            selectCurrentWord();
    }  

     
    /* INPUT TEXT ARRANGEMENT IN LINE DIV */
    // WSCOTT
    function textalgorithm( orgtest)  {
   
            $(".overlay-parent-div").empty();
            var words = orgtest.split(" ");

            if(document.getElementById('post-output-div').innerHTML ==""|| document.getElementById('post-output-div').innerHTML==null){

                var divwidth= ($('.overlay-parent-div').width())* 0.7;

            }else{

                var divwidth= $('#post-output-div').width();
            }

            var wordswithspaces = orgtest.split(" ");
            var words=[];
            var wordscount=0;

            /* to Eliminate the white space */
            for (var i = 0; i < wordswithspaces.length; i++){      
                if(wordswithspaces[i]==""){
                    continue;
                }
                words[wordscount] = wordswithspaces[i];
                wordscount=wordscount+1;          
            }
            // var divwidth= $('#post-input-div').width();
            var n, loopLength = words.length;
            var linestring="";
            var divstring="";
            var linecount=0;

            $scope.divcount=0;

            for (n = 0; n < loopLength; n++) {

                    if(!words[n].includes("<br>")){

                        linestring =linestring+" "+ words[n];
                        divstring =divstring+" <span id='index"+(n+linecount)+"'>"+ words[n]+"</span>";

                    }else{

                        linestring =linestring+" "+ words[n].substring(0,words[n].indexOf("<br>"));  
                        divstring =divstring+" "+ " <span id='index"+(n+linecount)+"'>"+ words[n].substring(0,words[n].indexOf("<br>"))+"</span>"; 
                    }

                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext("2d");
                    ctx.font = ($scope.qty+7)+ $scope.unit+" sans-serif";    
                    //ctx.letterSpacing
                    var linewidth="";
                    if($scope.enableSyllables){
                        
                        linewidth = ctx.measureText(linestring.split("&#8226").join("~")).width;
                    }else{
                       linewidth = ctx.measureText(linestring.split("<br>").join("")).width;
                    }

                    if(linewidth >= $scope.focusline*(divwidth-75)||words[n].includes("<br>")||n==loopLength-1){

                            $scope.divcount++;
                            var childdiv = "div"+$scope.divcount;
                            $(".overlay-parent-div").append("<div id='"+childdiv+"'></div>");
                            $('#'+childdiv).addClass('overlay-child-div');

                            if(linewidth >= $scope.focusline*(divwidth-75)&& !words[n].includes("<br>")){
                                //linecount=linecount+1;
                                $('#'+childdiv).html(divstring.substr(0, divstring.lastIndexOf(words[n]+"</span>")-6));
                                linestring=words[n];
                                divstring="<span id='index"+(n+linecount)+"'>"+ words[n]+"</span>";

                            }else if(linewidth >= $scope.focusline*(divwidth-75)&& words[n].includes("<br>")){

                                linecount=linecount+1;
                                $('#'+childdiv).html(divstring.substr(0, linestring.lastIndexOf(words[n].substring(0,words[n].indexOf("<br>")))));
                                linestring= words[n];
                                divstring="<span id='index"+(n+linecount)+"'>"+ words[n]+"</span>";

                            }else if (linewidth <= $scope.focusline*(divwidth-75)&& words[n].includes("<br>")){
                                linecount=linecount+1;     
                                $('#'+childdiv).html(divstring);
                                linestring=words[n].substr(words[n].lastIndexOf("<br>")+4);
                                divstring="<span id='index"+(n+linecount)+"'>"+ words[n].substr(words[n].lastIndexOf("<br>")+4)+"</span>";

                            }else{

                                $('#'+childdiv).html(divstring);
                                linestring="";
                                divstring="";
                            }

                            $('#'+childdiv).css("fontSize", $scope.qty);
                            $('#'+childdiv).css("lineHeight", $scope.focusline * 1.5);
                            $('#'+childdiv).css("font-family", "OpenDyslexic3-Bold");          
                     }
                    //correctWords.push(words[n]);
            }
     }
       
    
    /* OUTPUT TEXT ARRANGEMENT IN LINE DIV */
    function textalgorithmOutput( orgtest)  {
        
             $(".overlay-parent-div").empty();
             orgtest=orgtest.split('<font color="green">').join('');
             orgtest=orgtest.split('</font>').join('');    
             orgtest=orgtest.split("\\s+").join(" ")
             var wordswithspaces = orgtest.split(" ");
             var words=[];
             var wordscount=0;

             /* to Eliminate the white space */
             for (var i = 0; i < wordswithspaces.length; i++){      
                if(wordswithspaces[i]==""){
                    continue;
                 }
                 words[wordscount] = wordswithspaces[i];
                 wordscount=wordscount+1;          
              }

              //  var correctWords = []; // stores strings that have alphanumeric char
              // var divwidth= $('#post-input-div').width();
              var divwidth= ($('.overlay-parent-div').width())* 0.6;
              var n, loopLength = words.length;
              var linestring ="";
              var divstring  ="";

              $scope.divcount=0;

              for (n = 0; n < loopLength; n++) {
                    linestring =linestring+" "+ words[n];
                    divstring =divstring+" <span id='index"+n+"'>"+ words[n]+"</span>";
                    var canvas = document.createElement('canvas');
                    // var str = document.getElementById('post-input-div').textContent;
                    var ctx = canvas.getContext("2d");
                    ctx.font = ($scope.qty+7)+ $scope.unit+" sans-serif";    
                    //ctx.letterSpacing
                    var linestringlesshtml;
                    linestringlesshtml=linestring.split('<font color="green">').join('');
                    linestringlesshtml=linestringlesshtml.split('</font>').join('');
                    
                   
                    var linewidth="";
                    if($scope.enableSyllables){
                        
                        linewidth = ctx.measureText(linestringlesshtml.split("&#8226").join("~")).width;
                    }else{
                       linewidth = ctx.measureText(linestringlesshtml).width;
                    }

                    if((linewidth >= $scope.focusline* (divwidth-75) || words[n].includes("<br>")||n==loopLength-1) && !words[n].includes("<font") ){

                        $scope.divcount++;
                        var childdiv = "div"+$scope.divcount;
                        $(".overlay-parent-div").append("<div id='"+childdiv+"'></div>");
                        $('#'+childdiv).addClass('overlay-child-div');
                        $('#'+childdiv).html(divstring);
                        $('#'+childdiv).css("fontSize", $scope.qty);
                        $('#'+childdiv).css("font-family", "OpenDyslexic3-Bold");
                        $('#'+childdiv).css("lineHeight", $scope.focusline * 1.5);
                        // document.getElementById(childdiv).textContent=linestring;

                        if(words[n].includes("<br>")){

                            linestring= words[n].substring(words[n].lastIndexOf("<br>")+4);
                            divstring =" <span id='index"+n+"'>"+ words[n].substring(words[n].lastIndexOf("<br>")+4)+"</span>";

                        }else{
                            linestring="";
                            divstring="";
                        }

                     }else{
                     }
                    //correctWords.push(words[n]);
                    }
    }
       
    $scope.overlayOff = function() {
            document.getElementById("overlay").style.display = "none";
            document.getElementById("overlay2").style.display = "none";
            $(".overlay-parent-div").empty();
            $('#scrolldown').prop('disabled', true);
            $(".overlay").css("background-color", "#eeeeee");
            $('#enableFocus').bootstrapToggle('off')  
            scrolldiv=1;
            audio.pause();
            audio.src = "";
            //audio.style.cssText = 'display:none';
            $scope.syllablesValue ="OFF";
            $scope.enableFocus=false;
            $scope.focusline =1;
            $scope.focusValue ="OFF";
            $scope.enableSpeech=false;
            $scope.tempPause = false;
            $scope.speedRate=1;
            $scope.enableSyllables=false;
            $(".preloader-wrapper2").fadeIn(1000, function() {
                //$scope.loaderDiv = false;
            });        
     }
    
     
     
      
     var currentItem;
     var uploader = $scope.uploader = new FileUploader({
        // url: 'upload.php'
        queueLimit: 2,
        url:HOST_URL+ '/upload' //webAPI exposed to upload the file
     });

    // FILTERS

    // a sync filter
    uploader.filters.push({
        name: 'syncFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            console.log('syncFilter');
            return this.queue.length < 2;
        }
    });

    // an async filter
    uploader.filters.push({
        name: 'asyncFilter',
        fn: function(item /*{File|FileLikeObject}*/, options, deferred) {
            console.log('asyncFilter');
            setTimeout(deferred.resolve, 1e3);
        }
    });


    // Add file type filter
    uploader.filters.push({
        name: 'fileFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
            //alert(item.type);
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|pdf|doc|docx|text|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|'.indexOf(type) !== -1;
        }
    });

    //add maxsize filter

    uploader.filters.push({
        'name': 'enforceMaxFileSize',
        'fn': function (item) {
            //console.log('filesize2');
            return item.size <= 5500000; // 5.5MB in bytes
        }
    });
    // CALLBACKS

    uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);

        $scope.successMessage = false;
        $scope.removeUploadButton=true;
        $scope.removePanel(currentItem);
        if(filter.name=="fileFilter"){
            $scope.statusMessage="<b >Unsupported File-Type</b>";
            $scope.failureMessage = true;
        }else if (filter.name=="enforceMaxFileSize"){
            $scope.statusMessage="<b>File size limit exceeded. Max-Size:500KB</b>";
            $scope.failureMessage = true;
        }else if (filter.name=="queueLimit"){

            $scope.statusMessage="<b>Remove current file before adding new file</b>";
            $scope.failureMessage = true;
        }
    };
    uploader.onAfterAddingFile = function(fileItem) {
        if(currentItem !=undefined){
            //  alert("Reached here");
            uploader.removeFromQueue(currentItem);
            currentItem=fileItem;
        }else{
            //alert("Reached here2");
            currentItem=fileItem;
        }
        $scope.removeUploadButton=false;
        $scope.successMessage = false;
        $scope.failureMessage = false;
        console.info('onAfterAddingFile', fileItem);
        $scope.uploadPanel=true;
        targettext=undefined;
    };
    uploader.onAfterAddingAll = function(addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function(item) {
        $scope.removeUploadButton=false;
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function(fileItem, progress) {
         $scope.removeActive = true;
        fileItem.isProcessing=true;
        console.info('onProgressItem', fileItem, progress);
        $scope.statusMessage="<b> Upload complete .Getting the text. Please wait...</b>"
        $scope.successMessage = true;
    };
    uploader.onProgressAll = function(progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function(fileItem, response, status, headers) {

        if(response.status=="success"){
             $scope.removeActive = false;
            fileItem.isProcessing=false;
            $scope.failureMessage = false;
            console.info('onSuccessItem', fileItem, response, status, headers);
            targettext= response.text;
            // simplifyspeechtext=targettext; //assigning the text to watson tts
            $scope.myText=targettext;
            
            //alert(targettext);
            $scope.statusMessage="<b>Now pick an Analyze Option or click the Text Editor icon.</b>"
            $scope.successMessage = true;
        }else if(response.status=="error"){
            $scope.statusMessage="<b>Upload succeeded but Text processing failed due to the following message: </b></br><b>"+response.message+"</b>"
            $scope.failureMessage = true;
            $scope.successMessage = false;
            fileItem.isProcessing=false;
            fileItem.isError=true;
            fileItem.isSuccess=false;
            $scope.removeUploadButton=true;
            targettext= "ERROR";

            // $scope.removeActive=true;

        }


    };
    uploader.onErrorItem = function(fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
        $scope.statusMessage="<b>Upload failed. Please try another file</b>"
        $scope.failureMessage = true;
    };
    uploader.onCancelItem = function(fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function(fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
        currentItem=fileItem;
    };
    uploader.onCompleteAll = function() {
        console.info('onCompleteAll');
    };

    console.info('uploader', uploader);

    $scope.fileUploadSuccess= function(){
        return  $scope.successMessage;
    };

    $scope.fileUploadFailed= function(){
        return  $scope.failureMessage;
    };

    $scope.showTable= function(){
        return  $scope.uploadPanel;
    };

    $scope.removePanel= function(item){
        $scope.failureMessage = false;
        $scope.successMessage = false;
        $scope.uploadPanel=false;
        targettext="";
        if(item !=null || item !=undefined){
            angular.element("input[type='file']").val(null);
            uploader.removeFromQueue(item);
            currentItem=undefined;
        }

    };
    //  }]);



    var INPUT_TYPES = {TEXT: 'TEXT',  URL: 'URL', UPLOAD:'UPLOAD' };

    var audio = document.getElementById('audio');
    var IMAGE_DIR = 'public/images/';
    var IMAGE_ACTIONS_DIR = IMAGE_DIR + 'actions/';

    /****** Authentication details for API calls ****/
    $scope.id;
    $scope.apikey;


    /****** Input parameter values ******/
    $scope.outputMode = 0;
    $scope.condenseMode = "abstraction"; // {abstraction, extraction}
    $scope.refs = 0;
    $scope.type = INPUT_TYPES.TEXT;
    $scope.calculateReadingLevels = 0; // Future support
    $scope.enhanceContentMode=0;


    /* Navbareditor */
    $http.get("public/data/navbareditor.json").then(function(response) {
        $scope.navbareditor = response.data;
    });

    $http.get(HOST_URL+ "/api/token").then(function(response) {
        ttstoken= response.data;
        wsURI = "wss://stream.watsonplatform.net/text-to-speech/api/v1/synthesize?voice=" +
        voice + "&watson-token=" + ttstoken;
        });



    /****** Read initial input text from File ******/
    $scope.myText = readTextFile('public/samples/conversation.txt');
    //alert(document.getElementById('post-input-div').innerHTML)
    $scope.lastRegularText = $scope.myText;
    $scope.lastSpeechToText = "";
    $scope.micImg = IMAGE_DIR + "record.png";
    //for Speech to Text
    $scope.microphoneImage = IMAGE_DIR + "speech_entry_disabled.png";
    $scope.micState      = false;

    /****** Set default URL value ******/
    $scope.origURL = "";
    $scope.inputURL = $scope.origURL;

    $scope.urlTextBoxValue = $scope.inputURL;

    /****** Div visibilities scope ******/
    $scope.areaDivVisible= true;                  /* toggle for displaying text area input div */
    $scope.urlDivVisible= false;                  /* toggle for displaying url input div */
    $scope.fileUploadDivVisible= false;
    $scope.OutputModeActive=false;
    $scope.ShowSideBySide=false;
    $scope.ShowDefault=false;
    $scope.showSuccessMessage= true;
    // ------------------ toggle Input text area and URL input------------------------

    $scope.fileUpload = function(){
        return $scope.fileUploadDivVisible;
    };

    $scope.urlInput = function(){
        return $scope.urlDivVisible;
    };

    /********* Function to show the text or URL input div********/
    $scope.displayTextArea = function() {
        $scope.type = INPUT_TYPES.TEXT;
        $scope.fileUploadDivVisible= false;
        $scope.urlDivVisible= false;
        $scope.speechToTextDivVisible = false;
        $scope.areaDivVisible= true;
        $scope.UrlInputImg = IMAGE_ACTIONS_DIR + "url_entry_disabled.png";
        $scope.TextInputImg = IMAGE_ACTIONS_DIR + "write_on.png";
        $scope.DocInputImg = IMAGE_ACTIONS_DIR + "open_file_disabled.png";
        $scope.microphoneImage = IMAGE_DIR + "speech_entry_disabled.png";
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        
        if(document.getElementById('post-input-div').textContent=="" & $scope.myText !=""){
            document.getElementById('post-input-div').innerHTML=$scope.myText;
        }else if(document.getElementById('post-input-div').textContent=="" && $scope.myText==""){
            $scope.myText=readTextFile('public/samples/conversation.txt');
        }else if(document.getElementById('post-input-div').textContent!=""){
           $scope.myText= document.getElementById('post-input-div').innerHTML;
        }
        
    };

    $scope.displaySpeechToTextArea = function() {
        $scope.type = INPUT_TYPES.TEXT;
        $scope.areaDivVisible = true;
        $scope.fileUploadDivVisible= false;
        $scope.urlDivVisible= false;
        $scope.speechToTextDivVisible = true;
        //$scope.speechButtonLabel = "Start Recording";
        //"start-mic.png";
        //$scope.lastRegularText = $scope.myText;
        //$scope.myText = $scope.lastSpeechToText;
        
        //$scope.myText = "";
        angular.element(document.getElementById('post-input-div')).empty();
        $scope.TextInputImg = IMAGE_ACTIONS_DIR + "write_on_disabled.png";
        $scope.UrlInputImg = IMAGE_ACTIONS_DIR + "url_entry_disabled.png";
        $scope.DocInputImg = IMAGE_ACTIONS_DIR + "open_file_disabled.png";
        $scope.microphoneImage = IMAGE_DIR + "speech_entry_on.png";
        //audio.style.cssText = 'display:none';
        //audio.pause();
    };


    $scope.displayURLArea = function() {
        $scope.DocInputImg = IMAGE_ACTIONS_DIR + "open_file_disabled.png";
        $scope.type = INPUT_TYPES.URL;
        $scope.areaDivVisible= false;
        $scope.fileUploadDivVisible= false;
        $scope.urlDivVisible= true;
        $scope.urlTextBoxValue = $scope.inputURL;
        $scope.speechToTextDivVisible = false;
        $scope.TextInputImg = IMAGE_ACTIONS_DIR + "write_on_disabled.png";
        $scope.UrlInputImg = IMAGE_ACTIONS_DIR + "url_entry_on.png";
        //audio.style.cssText = 'display:none';
        //audio.pause();
        $scope.microphoneImage = IMAGE_DIR + "speech_entry_disabled.png";
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
    };

    $scope.displayUploadArea = function() {
        $scope.type = INPUT_TYPES.UPLOAD;
        $scope.areaDivVisible= false;
        $scope.fileUploadDivVisible= true;
        $scope.urlDivVisible= false;
        // $scope.urlTextBoxValue = $scope.inputURL;
        $scope.speechToTextDivVisible = false;
        $scope.TextInputImg = IMAGE_ACTIONS_DIR + "write_on_disabled.png";
        $scope.UrlInputImg = IMAGE_ACTIONS_DIR + "url_entry_disabled.png";
        $scope.DocInputImg = IMAGE_ACTIONS_DIR + "open_file_on.png";
        $scope.microphoneImage = IMAGE_DIR + "speech_entry_disabled.png";
        //audio.style.cssText = 'display:none';
        //audio.pause();
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
    };


    // ------------------ toggle Input text area and URL input------------------------
    $scope.areainput = function(){
        return $scope.areaDivVisible;
    };

    /******** Gets Invoked as soon as the page loads **********/
    $scope.init = function () {
        //if($location.host() != 'localhost'){
        /* Remove preloader */
        
        if($location.host() == "contentclarifier.mybluemix.net"){  // Support any localhost port
            console.log("Reached content clarifier credentials");
        $http.get(HOST_URL+ "/user-credentials").then(function(response) {
            console.log("Reached content clarifier credentials2" + response.data.id);
            $scope.apikey= response.data.key;
            $scope.id= response.data.id;
            console.log("id of the user2 is: "+$scope.id);
                 if($scope.id != undefined && $scope.id != ""){
                       var  dataObj = {
                                id: $scope.id,
                                apikey: $scope.apikey,
                            };

                        $http({
                            url: HOST_URL+ "/api/chkGdpr",
                            method: "POST",
                            data: dataObj,
                            withCredentials: false,
                            timeout: 300000,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }).then(function onSuccess(response) {

                            //alert(response.data.key);
                            if(response.data.key==0){
                              document.getElementById("gdproverlay").style.display = "block";
                              angular.element('[data-remodal-id=gdprmodal]').remodal({ hashTracking: false }).open();
                            }
                        });
      }
        });
    } else {
         console.log("Reached demo user Credentials");
        $scope.id = API_ID;
        $scope.apikey = '7M0xQYZUa9CvCz8wPmCI';
    }
      console.log("id of the user is: "+$scope.id);
 
        
       /* $http.get(HOST_URL+ "/api/chkGdpr").then(function(response) {
            ttstoken= response.data;
            wsURI = "wss://stream.watsonplatform.net/text-to-speech/api/v1/synthesize?voice=" +
            voice + "&watson-token=" + ttstoken;
        });  */
        $scope.isSafari =  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        $(".preloader-wrapper").fadeOut(1000, function() {

            $(this).remove();
        });
    
        console.log("Scope ID = "+ $scope.id);

        window.ibmNps = {
            offeringId: "9329a139-0450-4028-9774-ebad5428fa7f",
            userId: $scope.id,
            disableHashing: true,
            test: false,
            forceSurvey: false
        };
        
         
       
      
    }

    
    $scope.acceptGDPR = function(){
        console.log("accept gdpr"+ $scope.id);
        var  dataObj = {
                id: $scope.id,
                flag: 1
            };
        
        $http({
            url: HOST_URL+ "/api/updateGdpr",
            method: "POST",
            data: dataObj,
            withCredentials: false,
            timeout: 300000,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function onSuccess(response) {
           
            //alert(response.data.key);
            if(response.data.status=="OK"){
              document.getElementById("gdproverlay").style.display = "none";
              angular.element('[data-remodal-id=gdprmodal]').remodal({ hashTracking: false }).close();
            }
        });
    }
    
    
     $scope.rejectGDPR = function(){
         location.href="../"
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


    $scope.setSpeechText = function(){
        //audio.style.cssText = 'display:none';
        //simplifyspeechtext= parsedText;
        $scope.speakText(0, 'simplify');
    }

    $scope.speakState=false;
     $scope.tempPause = false;
    $scope.speakText = function(){
        $scope.enableSpeech = true;
        audio.playbackRate = $scope.speedRate;
       
           if(audio.paused){
                audio.play();
           }
            $scope.tempPause = true;
            //alert("REached");
    }
    
    
    
    $scope.prepareTTS = function(){
        
         
        //alert(simplifyspeechtext);
        var utteranceOptions;
        var returnUrl;
        var voice = 'en-US_AllisonVoice';
        //alert(simplifyspeechtext);
        audio = document.getElementById('audio');
        audio.playbackRate = $scope.speedRate;
        
        //alert(simplifyspeechtext);
      /*  if(simplifyspeechtext== null || simplifyspeechtext==undefined || $scope.OutputModeActive== false){
            alert("Reached here");
            simplifyspeechtext= $scope.myText;
        } */
        /*else{
         var outputcontent= document.getElementById('post-output-div');
         if (outputcontent.textContent == "" && typeof outputcontent.innerText == "undefined") {
         $scope.modalMessage = "Content not available to Speak";
         angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
         }

         simplifyspeechtext= outputcontent.textContent || outputcontent.innerText;
         }*/

        //var tmp = document.createElement("div");
        //tmp.innerHTML = simplifyspeechtext;
        //simplifyspeechtext=tmp.textContent ;
        simplifyspeechtext =convertSpeechText(simplifyspeechtext);
        simplifyspeechtext= strip(simplifyspeechtext)

        utteranceOptions = {
            text: simplifyspeechtext,
            voice: voice
        };
        synthesizeRequest(utteranceOptions, audio, $scope);
        $(".preloader-wrapper2").fadeOut(7000, function() {});
       /* alert(returnUrl);
        if(returnUrl){
            //audio.pause();
            //alert(returnUrl)
           // audio.src = returnUrl;
           // audio.type = "audio/wav";
            //audio.setAttribute('src', returnUrl);
              //audio.setAttribute('type', 'audio/ogg;codecs=opus');
            //audio.load();
            
            //  audio.addEventListener('canplaythrough', onCanplaythrough);
            audio.controls = true;
            audio.muted = false;
            //audio.style.cssText = 'display:visible';
             alert("reached here");
            if(audio.paused){
                alert("reached here");
                audio.play();
            }
        }*/
        
        //$scope.speakLineWithTiming(simplifyspeechtext);
       // alert(audio.duration);
      //  alert($scope.speakState);
      /*  if($scope.speakState ==true){
            audio.pause();
            $scope.speakState=false;
        }else{
            
            audio.play();
            $scope.speakState =true;
          
        } */
        
    }
    
    
  /*  $scope.speakText = function(){
        
          simplifyspeechtext =convertSpeechText(simplifyspeechtext);
        simplifyspeechtext= strip(simplifyspeechtext)
          $scope.lineText = simplifyspeechtext;
         websocket = new WebSocket(wsURI);
         websocket.onopen = onOpen;
         websocket.onclose = onClose;
         websocket.onmessage = onMessage;
         websocket.onerror = onError;
    } */
    

    
    $scope.speakLine = function(text){
       var readtime= readTimeEstimatorInSecs(text);
        
       if($scope.enableSpeech) {
            var utteranceOptions;
            var returnUrl;
            var voice = 'en-US_AllisonVoice';


            utteranceOptions = {
                text: text,
                voice: voice
            };

            returnUrl =  synthesizeRequest(utteranceOptions, audio, $scope);
            audio.pause();

            audio.src = returnUrl;

            // audio.addEventListener('canplaythrough', onCanplaythrough);
            audio.controls = true;
            audio.muted = false;
            audio.style.cssText = 'display:none';
            audio.play();
          
           $timeout(function(){
               $scope.scrolldown();
              
            }, readtime*1000); 
           
          
           
    }

    }
    
 var websocket;
 $scope.speakLineWithTiming = function(text){
     //alert(text);
     syncData=[];
     $scope.lineText = text;
     websocket = new WebSocket(wsURI);
     websocket.onopen = onOpen;
     websocket.onclose = onClose;
     websocket.onmessage = onMessage;
     websocket.onerror = onError;
     
 }
    
var voice = "en-US_AllisonVoice";
var format = 'audio/wav';

var wsURI;
    

function onOpen(evt) {
   var message = {
        text: $scope.lineText,
        accept: 'audio/wav',
        timings: ['words']
    };
    // The service currently accepts a single message per WebSocket connection.
    syncData = []
    websocket.send(JSON.stringify(message));
}

 var audioParts = [];
 var finalAudio;
 var syncData = [];
 $scope.wordCounter =-2;
    
 function onMessage(evt) {
    if (typeof evt.data === 'string') {
         //   console.log('Received string message: ', evt.data)
            var s = JSON.parse(evt.data);
           // console.log(JSON.parse(evt.data));
           if(s.words[0][0] != undefined && s.words[0][0] != null){
            
           if(!$scope.enableFocus){ 
                var wordtimingdata= { 
                    end: s.words[0][2],
                    start: s.words[0][1],
                    text: s.words[0][0],
                    indexcount:syncData.length
                };
              
                syncData.push(wordtimingdata);
           }else{
               $scope.wordCounter=$scope.wordCounter+1;
               var wordtimingdata= { 
                    end: s.words[0][2],
                    start: s.words[0][1],
                    text: s.words[0][0],
                    indexcount:$scope.wordCounter
                };
                //alert(JSON.stringify(wordtimingdata));
                syncData.push(wordtimingdata);
               
           }
           }
           
          // console.log(syncData);
              //alert(JSON.stringify(syncData))
              
          } else {
           // console.log('Received ' + evt.data.size + ' binary bytes', evt.data.type);
            audioParts.push(evt.data);
          }
        }

        function onClose(evt) {
           // alert(JSON.stringify(syncData));
          console.log('WebSocket closed', evt.code, evt.reason);
          finalAudio = new Blob(audioParts, {type: format});
        //  console.log('final audio: ', finalAudio);
            
           // createSubtitle();
        }

        function onError(evt) {
          console.log('WebSocket error', evt);
        }
    
    
       function getCurrentWord () {
            var i;
            var len;
            var is_current_word;
            var word = null;
            var currentTime = audio.currentTime;
          
            for (i = 0, len = syncData.length; i < len; i += 1) {
                is_current_word = (
                    (
                        currentTime >= (syncData[i].start)
                        &&
                        currentTime <(syncData[i].end)
                    )
                    ||
                    (currentTime < syncData[i].start)
                );
                if (is_current_word) {
                    word = syncData[i];
                    break;
                }
            }
           // alert(currentTime);
          /*  if (!word) {
                throw Error('Unable to find current word and we should always be able to.');
            }*/
          
            return word;
        }
    
    var   _current_end_select_timeout_id =null;
    var _current_next_select_timeout_id= null;
      function selectCurrentWord() {
          
            //var that = this;
            var current_word = getCurrentWord();
         // alert(current_word);
          
          
          if(current_word !=null){
            var is_playing = !audio.paused;
            //alert(current_word.text);
           var current_word_element = document.getElementById("index"+current_word.indexcount);

            if (!current_word_element.classList.contains('speaking')) {
                removeWordSelection();
                current_word_element.classList.add('speaking');
                current_word_element.focus();
                /* $('#overlay').animate({
                        'scrollTop' : $("#index"+current_word.indexcount).position().top
                }); */
               // alert(current_word.text);
               //  alert(current_word_element);
               /* if (this.autofocus_current_word) {
                    current_word.element.focus();
                }*/
            }

            /**
             * The timeupdate Media event does not fire repeatedly enough to be
             * able to rely on for updating the selected word (it hovers around
             * 250ms resolution), so we add a setTimeout with the exact duration
             * of the word.
             */
            if (is_playing) {
                // Remove word selection when the word ceases to be spoken
                var seconds_until_this_word_ends = current_word.end - audio.currentTime; // Note: 'word' not 'world'! ;-)
                if (typeof audio === 'number' && !isNaN(audio)) {
                    //alert($scope.speedRate);
                    seconds_until_this_word_ends *= 1.0/$scope.speedRate;
                } 
                console.log($scope.speedRate);
                seconds_until_this_word_ends *= 1.0/$scope.speedRate;
                clearTimeout(_current_end_select_timeout_id);
                _current_end_select_timeout_id = setTimeout(
                    function () {
                        if (!audio.paused) { // we always want to have a word selected while paused
                            current_word_element.classList.remove('speaking');
                        }
                    },
                    Math.max(seconds_until_this_word_ends * 1000, 0)
                );

                // Automatically trigger selectCurrentWord when the next word begins
                if(current_word.indexcount<syncData.length){
                  var next_word = syncData[current_word.indexcount + 1];
                }
                if (next_word) {
                    var seconds_until_next_word_begins = next_word.start - audio.currentTime;

                    var orig_seconds_until_next_word_begins = seconds_until_next_word_begins; // temp
                   /* if (typeof this.audio_element === 'number' && !isNaN(this.audio_element)) {
                        seconds_until_next_word_begins *= 1.0/this.audio_element.playbackRate;
                    }*/
                    clearTimeout(_current_next_select_timeout_id);
                    _current_next_select_timeout_id = setTimeout(
                        function () {
                            selectCurrentWord();
                        },
                        Math.max(seconds_until_next_word_begins * 1000, 0)
                    );
                }else if (audio.paused) {
                  if($scope.enableFocus){
                        
                        removeWordSelection();
                    }
            }
            }else if (audio.paused) {
                   
                    if($scope.enableFocus){
                        
                        removeWordSelection();
                    }
            }
              
          }else{
              
              if($scope.enableFocus){
                    $scope.scrolldown();
             
               }else{
                    $("#stopAudio").click();
               }
              
          }

    }
    
    
     function removeWordSelection() {
        // There should only be one element with .speaking, but selecting all for good measure
         
         for ( var i = 0, len = syncData.length; i < len; i += 1) {
             if( document.getElementById("index"+i) !=null){
                    document.getElementById("index"+i).classList.remove('speaking');
             }
         }
       /* var spoken_word_els = this.text_element.querySelectorAll('span[data-begin].speaking');
        Array.prototype.forEach.call(spoken_word_els, function (spoken_word_el) {
            spoken_word_el.classList.remove('speaking');
        });*/
    }
       
       var data = { 
					   end: "0.225",
                       start:"0.125",
                        text: "There"
					};
	     			//inputjson.push(data);
      /*syncData = [
                  { "end": "0.225","start": "0.125","text": "There" },
                  {"end": "0.485","start": "0.225","text": "were" },
                  /* ... and so on ... full json is in the demo 
                ]; */
       /*     createSubtitle();

            function createSubtitle()
            {
                var element;
                for (var i = 0; i < syncData.length; i++) {
                    element = document.createElement('span');
                    element.setAttribute("id", "c_" + i);
                    element.innerText = syncData[i].text + " ";
                  //  subtitles.appendChild(element);
                }
            } */

    
    
 
   audio.addEventListener('play', function (e) {
       $("#playAudio").click();
        
         if(!$scope.enableFocus){
             
            selectCurrentWord();
         } 
        
        // $scope.setPlayOn();
            //that.text_element.classList.add('speaking');
        }, false);
       
        /**
         * Abandon seeking the next word because we're paused
         */
    audio.addEventListener('pause', function (e) {
        //alert("Reached current")
         
         
         if($scope.enableFocus && $scope.enableSpeech && $scope.tempPause ){
            $scope.scrolldown();
            removeWordSelection();
         }else{
             $("#stopAudio").click();
         }// We always want a word to be selected
           // that.text_element.classList.remove('speaking');
        
        }, false);
        
    
   /* audio.addEventListener("timeupdate", function(e){
        $scope.enableSpeech = false;
             //syncData.forEach(function(element, index, array){
                 var currentTime = audio.currentTime;
         console.log(syncData.length);
         
                 for(var i=0; i<syncData.length; i++){
                  
                     
                     
                    if( (currentTime >= (syncData[i].start - 0.3) && currentTime <= (syncData[i].end + 0.3))  ){
                       
                     //  document.getElementById("index"+i).style.background = 'yellow';
                        if(i>0 && !$scope.enableFocus){
                               $(".index"+i).css("background-color", "black");
                              $(".index"+i).css("color", "white");
                        }else{
                            $(".index"+i).css("color", "black");
                             // $(".index"+i).css("color", "white");
                        }
                       //recentMovies.removeItem('Superman');
                       // syncData.remove();
                         
                      if(i>0 && !$scope.enableFocus){
                         $(".index"+(i-1)).css("background-color", "#eeeeee");
                        $(".index"+(i-1)).css("color", "black");
                         
                     }// else if(i>0 && $scope.enableFocus){
                      //    $(".index"+(i-1)).css("background-color", "grey");
                      //  $(".index"+(i-1)).css("color", "black");
                         
                     //}
                    }
                     
                    if (audio.paused) {
                       
                         console.log("reached unfocus");
                       $("#stopAudio").click();
                         if(i>0 && !$scope.enableFocus){
                            $(".index"+(i)).css("background-color", "#eeeeee");
                            $(".index"+(i)).css("color", "black");
                         }
                        
                    }
                     
                }; 
               
         if (audio.paused) {
                        console.log("reached audio pausd");
                        if($scope.enableFocus){
                            console.log("reached focus");
                           // $scope.scrolldown();
                           // 
                        }
                    }
            
                
         
              
            
            });  */
        


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
        // alert(targettext);
        stopAudio();
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        if($scope.speechToTextDivVisible){
           
           $scope.myText= document.getElementById("post-input-div").innerHTML;
        }
        if(checkIfContentNotProvided($scope, targettext)){
            return;
        }
        $scope.OutputModeActive=true;
        $scope.enhanceContentMode=enhancedcontentmode;
        $scope.removeActive=true;

        if(enhancedcontentmode==0){
            $scope.simplifyBack = IMAGE_ACTIONS_DIR + "simplify_on.png";
            $scope.analyzeMode = "<b>Simplify:</b> This mode replaces words and phrases with more commonly used wording. "+ "The <font color='green'><b>green</b></font> text shows what was replaced. You can mouse over these to show alternatives.";
        } else if (enhancedcontentmode ==1){
            $scope.readingMode =false;
            $scope.topicsBack = IMAGE_ACTIONS_DIR + "show_topics_on.png";
            $scope.analyzeMode = "<b>Show Topics:</b> This mode inserts additional info about topics found in the content, when possible. To view this info, click the <font color='blue'><b>blue</b></font> links.";
        } else if (enhancedcontentmode ==2){
            $scope.defintionsBack = IMAGE_ACTIONS_DIR + "show_definitions_on.png";
            $scope.analyzeMode = "<b>Show Definitions:</b> This mode inserts simple English definitions for difficult words, when possible. Inserted definitions are in parenthesis and highlighted in <font color='green'><b>( green )</b></font>.";
        } else if (enhancedcontentmode ==3){
            $scope.readingMode =false;
            $scope.symbolsBack = IMAGE_ACTIONS_DIR + "show_symbols_on.png";
            $scope.analyzeMode = "<b>AAC Symbols:</b> This mode inserts augmentative and alternative communication (AAC) symbols, when possible, to give visual cues for meaning.";
        }

        // targettext = $scope.myText;
        //originaltext=$scope.myText;
        //   $scope.myText = "";
        $scope.showTwirly = true;
        document.getElementById('post-output-div').innerHTML = " ";

        var apiContextualSimplifyPath =HOST_URL+ "/api/V1/contextual-simplify";
        var dataObj = {};
        console.log('$scope.type: ' + $scope.type);
        apiContextualSimplifyPath =HOST_URL+ "/api/V1/contextual-simplify";
        if($scope.type === INPUT_TYPES.TEXT) {
            if($scope.speechToTextDivVisible){
                $scope.lastSpeechToText = $scope.myText;
            } else {
                $scope.lastRegularText = $scope.myText;
            }
            $scope.speechToTextDivVisible = false;
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: $scope.myText,
                options: {
                    'enhanceContentMode':$scope.enhanceContentMode, // {1=referenceData, 2=definitions, 3=symbols}
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels
                }
            };
        } else if($scope.type===INPUT_TYPES.URL) {
            var myURL = $scope.urlTextBoxValue;
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                url: myURL,
                options: {
                    'enhanceContentMode':$scope.enhanceContentMode, // {1=referenceData, 2=definitions, 3=symbols}
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels
                }
            };
            apiContextualSimplifyPath =HOST_URL+ "/api/V1/contextual-simplify-url";
            $scope.inputURL = $scope.urlTextBoxValue;
        } else if($scope.type===INPUT_TYPES.UPLOAD) {
            apiContextualSimplifyPath = HOST_URL+"/api/V1/contextual-simplify";
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: targettext,
                options: {
                    'enhanceContentMode':$scope.enhanceContentMode, // {1=referenceData, 2=definitions, 3=symbols}
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels
                }
            };
        }
        //return callAPIContextualSimplify($scope, $http, apiContextualSimplifyPath, dataObj);
        return $http({
            url: apiContextualSimplifyPath,
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
                $scope.modalMessage = resp.message;
                angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
                $scope.undoAction();

            } else {
                console.log(resp.simplified);
                $scope.myText=resp.original;
                simplifyspeechtext = removeDelimiters(resp.simplified);
                var cleanOutput = resp.simplified.replace(/\|_[^_]*?_\|/g,"");
                //  parsedText = identifyReplaceConfidence(cleanOutput);

                var parsedText = parseToHtml(cleanOutput);
                //alert(parsedText);
                parsedText = identifyReplaceConfidence(parsedText);
                 
                //appending compiled html to output text of default view
                var tempDiv = document.createElement("div");
                if($scope.enhanceContentMode == 3) {
                   // $scope.outputcontext = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";
                    tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";
                    var simplifiedResponse = $compile(tempDiv)($scope);
                    angular.element(document.getElementById('post-output-div')).append(simplifiedResponse);

                }else if($scope.enhanceContentMode == 0) {
                    
                    $scope.outputcontext = parsedText; 
                    $scope.ShowDefault=true;
                    /*tempDiv.innerHTML = parsedText;
                    var simplifiedResponse = $compile(tempDiv)($scope);
                    angular.element(document.getElementById('post-output-div-half')).append(simplifiedResponse);*/
                }
                else {
                     
                    tempDiv.innerHTML = parsedText;
                    var simplifiedResponse = $compile(tempDiv)($scope);
                    angular.element(document.getElementById('post-output-div')).append(simplifiedResponse);
                    

                }

                $scope.showTwirly = false;
                $scope.OutputModeActive=true;
                
            }
        });
    };


    /***************************** Condense API action  **********************************************************************/
    $scope.condensesimplify = function() {
        stopAudio();
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        if($scope.speechToTextDivVisible){
           
           $scope.myText= document.getElementById("post-input-div").innerHTML;
        }
        if(checkIfContentNotProvided($scope, targettext)){
            return;
        }
        $scope.speechToTextDivVisible = false;
        $scope.OutputModeActive=true;
        $scope.removeActive=true;
        $scope.simplifySummarizeBack = IMAGE_ACTIONS_DIR + "summarizeAndSimplify_on.png";
        $scope.analyzeMode = " <b>Summarize-Simplify:</b> This mode attempts to pull out the most important info, and create a shorter summary with easier to read wording. "

        //targettext = $scope.myText;
        //originaltext=$scope.myText;
        //$scope.myText = "";
        $scope.showTwirly = true;

        var condenseSimplifyPath =HOST_URL+ "/api/V1/condense-simplify";
        var dataObj = {};
        if($scope.type === INPUT_TYPES.TEXT) {
            condenseSimplifyPath = HOST_URL+ "/api/V1/condense-simplify";
            if($scope.speechToTextDivVisible){
                $scope.lastSpeechToText = $scope.myText;
            } else {
                $scope.lastRegularText = $scope.myText;
            }
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: $scope.myText,
                options: {
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels,
                    'condenseMode':$scope.condenseMode
                }
            };

        } else if($scope.type===INPUT_TYPES.URL) {
            var myURL = $scope.urlTextBoxValue;
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                url: myURL,
                options: {
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels,
                    'condenseMode':$scope.condenseMode
                }
            };
            condenseSimplifyPath =HOST_URL+ "/api/V1/condense-simplify-url";
            $scope.inputURL = $scope.urlTextBoxValue;
        }else if($scope.type===INPUT_TYPES.UPLOAD) {
            condenseSimplifyPath = HOST_URL+"/api/V1/condense-simplify";
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: targettext,
                options: {
                    'outputMode':$scope.outputMode,
                    'calculateReadingLevels':$scope.calculateReadingLevels,
                    'condenseMode':$scope.condenseMode
                }
            };
        }
        return callAPICondenseSimplify($scope, $http, condenseSimplifyPath, dataObj);
    };

    /***************************************    Summarize ********************************************/
    $scope.condenceText = function(){
        //alert($scope.myText);
        stopAudio();
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        
        if($scope.speechToTextDivVisible){
           $scope.myText= document.getElementById("post-input-div").innerHTML;
        }
        
        if(checkIfContentNotProvided($scope, targettext)){
            return;
        }
        $scope.speechToTextDivVisible = false;
        $scope.OutputModeActive=true;
        $scope.removeActive=true;
        $scope.summarizeBack = IMAGE_ACTIONS_DIR + "summarize_on.png";
        $scope.analyzeMode = " <b>Summarize:</b> This mode attempts to pull out the most important info, and create a shorter summary. "
        // targettext = $scope.myText;
        //originaltext=$scope.myText;
        // $scope.myText = "";
        $scope.showTwirly = true;

        var apiCondensePATH = HOST_URL+"/api/V1/condense";
        var dataObj = {};
        if($scope.type === INPUT_TYPES.TEXT) {
            apiCondensePATH = HOST_URL+"/api/V1/condense";
            if($scope.speechToTextDivVisible){
                $scope.lastSpeechToText = $scope.myText;
            } else {
                $scope.lastRegularText = $scope.myText;
            }
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: $scope.myText,
                options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
            };

        } else if($scope.type===INPUT_TYPES.URL) {
            var myURL = $scope.urlTextBoxValue;
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                url: myURL,
                options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
            };
            apiCondensePATH =HOST_URL+ "/api/V1/condense-url";
            $scope.inputURL = $scope.urlTextBoxValue;
        }else if ($scope.type === INPUT_TYPES.UPLOAD) {
            apiCondensePATH = HOST_URL+"/api/V1/condense";
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: targettext,
                options: {'condenseMode':$scope.condenseMode} // WSTODO support toggle in GUI
            };

        }
        return callAPICondense($scope, $http, apiCondensePATH, dataObj);
    };
    
    
    
    
     $scope.getSyllables= function(text){
         
         var dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: text
            };
         
         
            return $http({
            url: "/api/V1/hyphenate",
            method: "POST",
            data: dataObj,
            withCredentials: false,
            timeout: 300000,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function onSuccess(response) {
        
	       var resp = response.data;
                $scope.syllables= resp.hyphenation;
           
                
        })
     }

    /***************************************    Emotion Analysis ********************************************/

    $scope.emotionText = function(){
        $scope.readingMode =false;
        stopAudio();
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        if($scope.speechToTextDivVisible){
           
           $scope.myText= document.getElementById("post-input-div").innerHTML;
        }
        if(checkIfContentNotProvided($scope, targettext)){
            return;
        }
        $scope.speechToTextDivVisible = false;
        $scope.OutputModeActive=true;
        $scope.removeActive=true;
        $scope.emotionsBack = IMAGE_ACTIONS_DIR + "show_emotions_on.png";
        $scope.analyzeMode = " <b>Emotions :</b> This mode looks for the emotion and tone in the text. The chart shows the overall tone, and you can click on the chart to highlight text showing the given emotion. This mode will remove text formatting. <i>If an emotion shown in the chart is only found in very low levels, no text will be highlighted.</i>"
        $scope.showTwirly = true;

        var apiEmotionPATH =HOST_URL+ "/api/V1/analyze-tone";
        var dataObj = {};

        if($scope.type === INPUT_TYPES.TEXT) {
            //$scope.lastRegularText = $scope.myText;
            apiEmotionPATH =HOST_URL+ "/api/V1/analyze-tone";
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: $scope.myText,
                Level: undefined,
                Mode: undefined
            };

        } else if($scope.type===INPUT_TYPES.URL) {
            var myURL = $scope.urlTextBoxValue;
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                url: myURL,
                Level: undefined,
                Mode: undefined
            };
            apiEmotionPATH = HOST_URL+"/api/V1/analyze-tone-url";
            $scope.inputURL = $scope.urlTextBoxValue;
        }else if ($scope.type === INPUT_TYPES.UPLOAD) {
            apiEmotionPATH =HOST_URL+ "/api/V1/analyze-tone";
            dataObj = {
                id: $scope.id,
                apikey: $scope.apikey,
                data: $scope.myText,
                Level: undefined,
                Mode: undefined
                // WSTODO support toggle in GUI
            };

        }

        return callAPIEmotion($scope, $http, apiEmotionPATH, dataObj, $sce);


    };

    
    /***************************************    Emotion Analysis ********************************************/
    
    $scope.removeSpacing = function(){
        document.getElementById('post-input-div').style.lineHeight = 1.5;
       document.getElementById('post-input-div').style.letterSpacing = "0px";
       document.getElementById('post-output-div').style.lineHeight = 1.5;
       document.getElementById('post-output-div').style.letterSpacing = "0px";
       $scope.myText= document.getElementById('post-input-div').innerHTML;
    }

    /*
    $scope.scrolldown = function(){
        alert($scope.currentHeight );     
        $scope.currentHeight = $scope.currentHeight+3;
    $scope.currentMargin = $scope.currentMargin+1.5;
       
        document.getElementById('fademe1').style.height=$scope.currentHeight+"%";
        document.getElementById('fademe3').style.marginTop=$scope.currentMargin+"%";
       // document.getElementById('post-input-div').style.lineHeight = 1.5;
        
    }*/
    $scope.addSpacing = function(){
        /*if($scope.spacingBack== IMAGE_ACTIONS_DIR + "add_spaces_on.png"){
            return;
        }*/
       // alert("Reached here")
        stopAudio();
        
        if ($scope.micState){
            $scope.startOrStopRecording();
        }
        if($scope.speechToTextDivVisible){
           
           $scope.myText= document.getElementById("post-input-div").innerHTML;
        }
        if(checkIfContentNotProvided($scope, targettext)){
            return;
        }
        $scope.speechToTextDivVisible = false;
       // $scope.OutputModeActive=true;
        //$scope.removeActive=true;
        $scope.spacingBack = IMAGE_ACTIONS_DIR + "add_spaces_on.png";
        $scope.analyzeMode = " <b>Spacing :</b> This mode add the line and word spacing for accessibility</i>"
        $scope.showTwirly = true;

       
       document.getElementById('post-input-div').style.lineHeight = 3;
       document.getElementById('post-input-div').style.letterSpacing = "3px";
       document.getElementById('post-output-div').style.lineHeight = 3;
       document.getElementById('post-output-div').style.letterSpacing = "3px";
       $scope.myText= document.getElementById('post-input-div').innerHTML;
    
       $scope.showTwirly = false;
        /*$scope.outputcontext= $sce.trustAsHtml("<div style='line-height: 3;  word-spacing: 4px; letter-spacing: 2px;'>"+$scope.myText+"</div>"); */
        
       

    };
    $scope.onClick = function (points, evt) {

        /*if ($scope.chart) {
         alert("Reached here");
         console.log($scope.chart.getPointsAtEvent(evt));
         }*/

        //console.log(points);
        console.log(points[0]._model);
        //console.log(points[0].['_model']);


        var emotionid= points[0]._model.label;
        var aColl = document.getElementsByClassName(emotionid);
        var colorbg = points[0]._model.backgroundColor;
        changeColor(aColl, colorbg);

        //  alert(document.getElementsByClassName(emotionid));
        //  document.getElementById(emotionid).style.innerHTML = 'color:green';

        // document.getElementsByClassName(emotionid).className = 'cssClass';
        //console.log(points[0]._model['label']);



    };

    /***************************** Back to Analyze Mode  **********************************************************************/
    $scope.undoAction = function() {
        //alert("Reached here");
        angular.element(document.getElementById('post-output-div')).empty();
        angular.element(document.getElementById('post-emotions-div')).empty();
        $scope.outputcontext = "";
        //comment this if you need extracted text from URL or Fileupload
       // $scope.myText= originaltext; 
        
        $scope.removeActive = false;
        $scope.openInactive= false;
        $scope.OutputModeActive= false;
        $scope.labels = undefined;
        $scope.data = undefined;
        $scope.ShowSideBySide= false;
         $scope.ShowDefault = false;
        $scope.simplifySummarizeBack = IMAGE_ACTIONS_DIR + "summarizeAndSimplify_disabled.png";
        $scope.summarizeBack = IMAGE_ACTIONS_DIR + "summarize_disabled.png";
        $scope.simplifyBack = IMAGE_ACTIONS_DIR + "simplify_disabled.png";
        $scope.topicsBack = IMAGE_ACTIONS_DIR + "show_topics_disabled.png";
        $scope.symbolsBack = IMAGE_ACTIONS_DIR + "show_symbols_disabled.png";
        $scope.defintionsBack = IMAGE_ACTIONS_DIR + "show_definitions_disabled.png";
        $scope.emotionsBack = IMAGE_ACTIONS_DIR + "show_emotions_disabled.png";
        $scope.spacingBack = IMAGE_ACTIONS_DIR + "add_spaces.png";
        $scope.analyzeMode="";
        $scope.uploadPanel=false;
        $scope.removeUploadButton=false;
        // $scope.removePanel(this);
        $scope.urlTextBoxValue = "";
        $scope.successMessage = false;
        $scope.failureMessage = false;
        //alert(document.getElementById('post-input-div').textContent);
        simplifyspeechtext = document.getElementById('post-input-div').textContent;
        //audio.style.cssText = 'display:visible';
        //audio.pause();
        $scope.displayTextArea();
        $scope.speechToTextDivVisible = false;
        if ($scope.micState){
            $scope.startOrStopRecording();
        }

        if(currentItem !=null ||currentItem !=undefined){
            //alert("reached here");
            uploader.removeFromQueue(currentItem);
            angular.element("input[type='file']").val(null);
            currentItem=undefined;
        }
        targettext="";
        $scope.readingMode =true;;
        //Added this below so the correct icon is selected when undoAction (text or url)
        //and so the icon for URL is clickable when undoAction, otherwise
        /*
         if($scope.areaDivVisible){
         alert("reached here");
         $scope.displayTextArea();
         } else {
         if($scope.type == INPUT_TYPES.URL){
         alert("reached here2");
         $scope.displayURLArea();
         }
         }*/

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
        /* Hide Watson Relevance
        if(relevance != "" && relevance != null && relevance != "undefined"){
            $(".relevance").html("<b>RELEVANCE: </b> "+relevance);
        }
        */
        if(website != "" && website != null && website != "undefined"){
            $(".website").html("<b>WEBSITE: </b> <a href='"+website+"' target='_blank'>"+website+"</a>");
        }
        //  $( ".result" ).hide();
    };

    $scope.showMessage = function(){
        $scope.modalMessage = "This feature is currently in development, and will be available soon!"
        angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open()
    }

    $scope.showReadingModeMessage = function(){
        if($scope.isSafari){
          $scope.modalMessage = "Reading Mode is not supported on this browser. Please use either the Chrome or the Firefox browser to access this feature."
        }else{
            $scope.modalMessage = "Reading Mode is not supported for this Analyze Option."
        }
        
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
    
    /* $scope.setPlayOn = function(){
         alert( $scope.enableSpeech);
        $scope.enableSpeech = true;
           alert( $scope.enableSpeech);
    }; */

    /***************************** Function to show original output  **********************************************************************/
     $scope.HideOriginal = function(){
       
        
        $scope.ShowSideBySide = false;
        
        $timeout(function(){
               $scope.ShowDefault = true;
            }, 500);
        
        
    };
    
     $scope.ShowOriginal = function(){
        
        $scope.ShowDefault = false;
        $timeout(function(){
            $scope.ShowSideBySide = true;
               
            }, 500);
        
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
    
   
    $scope.stopAudio = function () {
        //console.log("Reached");
         $scope.enableSpeech = false;
        audio.style.cssText = 'display:visible';
        audio.pause();
        $scope.tempPause = true;
    }



    /****** added by Wilson Tiu************/
    /****** codes for computing basic statistics of input text *********/
    var stream = null

    $scope.showStatistics = function(){

        if($scope.myText == "" ||$scope.myText==null){
            $scope.modalMessage = "No content was provided for analysis"
            angular.element('[data-remodal-id=modal2]').remodal({ hashTracking: false }).open();
            return;
        }

        var inputText = $scope.myText;

        if($scope.OutputModeActive == true){
            inputText = simplifyspeechtext; //this variable is same as input given for TexttoSpeech (html stripped off)
        }

        $scope.charCount= charCounter(inputText);
        $scope.wordCount= wordCounter(inputText);
        $scope.uniqWordCount= uniqWordsCounter(inputText);
        $scope.sentCount= sentCounter(inputText);
        $scope.paragCount= paragCounter(inputText);
        $scope.syllableCount= syllableCounter(inputText);
        $scope.readTimeEst= readTimeEstimator(inputText);

        angular.element('[data-remodal-id=statsModal]').remodal({ hashTracking: false }).open()
    }


    //Speech to Text Stuff

    $scope.loadScript = function (url, type, charset) {
        if (type===undefined) type = 'text/javascript'
        if (url) {
            var script = document.querySelector ("script[src*='" + url +"']")
            if (!script) {
                var heads = document.getElementsByTagName ("head")
                if (heads && heads.length) {
                    var head = heads[0]
                    if (head) {
                        script = document.createElement ('script')
                        script.setAttribute ('src', url)
                        script.setAttribute ('type', type)
                        if (charset) script.setAttribute ('charset', charset)
                        head.appendChild (script)
                    }
                }
            }
            return script
        }
    }
    /*
     Starts the streaming and sends audio stream to watson stt to be captioned.
     Once we get the text we display it on html widget with id="output".
     */

    $scope.micStart = function (){
        stream = null;
         var WatsonZpeech = $scope.loadScript ('bower_components/watson-speech/dist/watson-speech.js', 'text/javascript', 'utf-8')
        $scope.loadScript ('bower_components/fetch/fetch.js', 'text/javascript', 'utf-8')

        //adding watson speech to the header section of the HTML page so below can access static var WatsonSpeech
        document.head.appendChild (WatsonZpeech);
        $scope.micState = true;  //for icon

        fetch ('/api/speech-to-text/token').then(function (response) {
            return response.text()
        }).then(function (token) {
            stream = WatsonSpeech.SpeechToText.recognizeMicrophone ({
                token: token,
                continuous : false,
                profanity_filter : true,
                smart_formatting : true,
                inactivity_timeout : 10,
                outputElement: '#post-input-div'
            });
            // 
            stream.on ('error', function(err) {
                stream.stop();
                console.log (err);
                console.log ("");

            });

        }).catch (function(error) {
            console.log (error);
        });
        
    };

    //Stops the streaming and sets the corresponding variables for modifying button icons on the GUI side.
    $scope.micStop = function (){
        if (stream != null)
            stream.stop ();
        delete $scope.micState
        //$scope.myText = outputElement; //??how get this text to be myText?
    };

    //On the webpage use this method to start and stop the recording
    //Starts or stop the microphone streaming depending on current state.
    $scope.startOrStopRecording = function(){
        if ($scope.micState){
            $scope.micText="Start Recording";
            $scope.micStop();
            $scope.micImg = IMAGE_DIR + "record.png"; //"start-mic.png";
            $scope.miccss="miccss";
           
        } else {
            $scope.micStart();
            $scope.micText="Stop Recording";
            $scope.micImg = IMAGE_DIR + "stopRecord.png"; //"start-mic.png";
            $scope.miccss="miccssOn";
          
        }
    };
    
    
    $scope.printElem=function()
        {
        var elem="post-input-div";
        if($scope.OutputModeActive){
            elem="post-output-div";
        }

        var mywindow = window.open('', 'PRINT', 'height=400,width=600');

        mywindow.document.write('<html><head><title></title>');
        mywindow.document.write('</head><body >');
       // mywindow.document.write('<h1>' + document.title  + '</h1>');
        var savetext= document.getElementById(elem).innerHTML;
        savetext=removeHtmlTags(savetext, $scope);
        mywindow.document.write(savetext);

        mywindow.document.write('</body></html>');

        mywindow.document.close(); // necessary for IE >= 10
        mywindow.focus(); // necessary for IE >= 10*/

        mywindow.print();
        mywindow.close();


        return true;
    }

    $scope.download=function(){
        
        var elem="post-input-div";
        var savetext;
        
        if($scope.OutputModeActive){
            elem="post-output-div";
        }
        if($scope.labels){
           var doughnut = document.getElementById("doughnut").outerHTML;
          //  alert(doughnut);
        }
        
        savetext= document.getElementById(elem).innerHTML;
        savetext=removeHtmlTags(savetext, $scope);
     
        var converted = htmlDocx.asBlob(savetext);
       // saveAs(converted, 'test.docx');
        var a = document.body.appendChild(
            document.createElement("a")
        );
        a.href = URL.createObjectURL(converted);
        a.download = "AnalyzedText.docx";
        //   a.href = "data:text/html," + document.getElementById(elem).outerHTML;
        a.click();

    }
    
    $.fn.scrollView = function () {
              return this.each(function () {
                $('html, body').animate({
                  scrollTop: $(this).offset().top
                }, 1000);
              });
    }
    var scroll=24;
    
    $scope.scrolldown =function(){
        
        
        
       
       /* if(scroll-$scope.qty>2){
            scroll=$scope.qty;
        }*/
        //alert(scroll);
        
        //working scroll
      //  if(scrollpostion>=0){
           // alert(scrollpostion);
      //  scrollpostion=scrollpostion+(scroll*3);
            
      //  var highlight = document.querySelector("#highlight");
        
	 //  $("#overlay").scrollTop(scrollpostion)
           // $("#div"+scrolldiv).scrollTop(scrollpostion)
          /*  if(scrolldiv<10){
            $( "#div"+scrolldiv)[0].scrollIntoView(false);
            scrolldiv++;
            }*/
       // }
        
        if(scrolldiv>=1 && scrolldiv <$scope.divcount ){
            scrolldiv++;
            // $("#div"+(scrolldiv-1)).css("zoom", 1);
           // $("#div"+scrolldiv).css("zoom", 1.1);
            eventtimeout = true;
            $('#scrolldown').prop('disabled', true);
            //$scope.speakLine($("#div"+scrolldiv).text());
            simplifyspeechtext = $("#div"+scrolldiv).text();
            simplifyspeechtext=simplifyspeechtext.split("•").join("");
            if($scope.enableSyllables){
                
                simplifyspeechtext =convertSpeechText(simplifyspeechtext);
                simplifyspeechtext= strip(simplifyspeechtext)
               
            }
            
            if($scope.enableFocus == true){
                $("#div"+(scrolldiv-1)).css("color", "black");
                $("#div"+scrolldiv).css("color", "#0000FF");
                $("#div"+(scrolldiv-1)).css("background-color", "#303030");
                $("#div"+scrolldiv).css("background-color", "white");
                $("#div"+(scrolldiv-1)).css("font-weight", "500");
                $("#div"+scrolldiv).css("font-weight", "800");
               //$scope.speakText();
            }
            //$("#div"+scrolldiv).scrollView();
             if($scope.enableSpeech){
                
                 //$scope.speakLineWithTiming(simplifyspeechtext);
                 $scope.prepareTTS();
               //  $scope.speakText();
              }
            
         //   alert((document.getElementById("div"+scrolldiv).scrollHeight));
           // alert((document.getElementById("overlay").scrollTop));
          /*  var windowsdivs = (document.getElementById("overlay2").scrollHeight-100)/((document.getElementById("div"+scrolldiv).scrollHeight)+30);*/
            //alert(Math.round(windowsdivs));
            
        /*    if(scrolldiv%(Math.floor(windowsdivs))==0){
               // alert(windowsdivs);
             
                $('#overlay').animate({scrollTop: document.getElementById("overlay").scrollTop + (Math.floor(windowsdivs)*((document.getElementById("div"+scrolldiv).scrollHeight+30)))});
            } */
           // $('#div'+scrolldiv)[0].animate({scrollIntoView: false});
           // $( "#div"+scrolldiv)[0].scrollIntoView(false);
            
            $('#overlay').animate({scrollTop: document.getElementById("overlay").scrollTop + (document.getElementById("div"+scrolldiv).scrollHeight+30)});
            
            $timeout(function(){
               
                $('#scrolldown').prop('disabled', false);
                eventtimeout=false;
            }, 500);
            //
            
        }else{
             $("#stopAudio").click(); // reached the end of the Focus divs
           
        }

    }
    
    
        $scope.scrollup =function(){
            
            // alert(scrollpostion);
       /* if(scrollpostion>0){
            scrollpostion=scrollpostion-($scope.qty*3);
            var highlight = document.querySelector("#highlight");
            $("#overlay").scrollTop(scrollpostion)
        }*/
            $scope.tempPause = false;
            if(scrolldiv>1 && scrolldiv <=$scope.divcount ){
            scrolldiv--; 
                eventtimeout=true;
                $('#scrollup').prop('disabled', true);
                //$scope.speakLine($("#div"+scrolldiv).text());
                simplifyspeechtext= $("#div"+scrolldiv).text();
                simplifyspeechtext=simplifyspeechtext.split("•").join("");
                if($scope.enableSpeech){
                    $scope.speakText();
                  }
                   // $("#div"+(scrolldiv+1)).css("zoom", 1);
               // $("#div"+scrolldiv).css("zoom", 1.1);
                
                if($scope.enableFocus==true){
                    
                    $("#div"+(scrolldiv+1)).css("color", "black");
                    $("#div"+scrolldiv).css("color", "#0000FF");

                    $("#div"+(scrolldiv+1)).css("background-color", "#303030");
                    $("#div"+scrolldiv).css("background-color", "white");
                    $("#div"+(scrolldiv+1)).css("font-weight", "500");
                    $("#div"+scrolldiv).css("font-weight", "800");
                }
                // $("#div"+scrolldiv).scrollView();
                $('#overlay').animate({scrollTop: '-=93'});
                $('#overlay').animate({scrollTop: document.getElementById("overlay").scrollTop -(document.getElementById("div"+scrolldiv).scrollHeight+30)});
                $timeout(function(){
              
                $('#scrollup').prop('disabled', false);
                    eventtimeout=false;
            }, 750);
           }

        }


});
// end of Controller
/*
var highlight = document.querySelector("#highlight");
//alert("Reached here");
document.getElementById("overlay").addEventListener('scroll', function(e){
    
	var y = document.getElementById("overlay").scrollTop;
	var offset = y % 35;
   //console.log(document.getElementById("overlay").scrollTop);
	highlight.style.marginTop =  - y % 40 + "px";
    
 //   document.getElementById("highlight").style.;
    scrollpostion=document.getElementById("overlay").scrollTop;
    
}); */









var body = document.body,
    overlay = document.querySelector('.overlay'),
    overlay2 = document.querySelector('.overlay2'),
    overlayBtts = document.querySelectorAll('button[class$="overlay"]'),
    overlayBtts2 = document.querySelectorAll('button[class$="overlay2"]');
        
    [].forEach.call(overlayBtts, function(btt) {

      btt.addEventListener('click', function() { 
         
         /* Detect the button class name */
         var overlayOpen = this.className === 'open-overlay';
         
         /* Toggle the aria-hidden state on the overlay and the 
            no-scroll class on the body */
         overlay.setAttribute('aria-hidden', !overlayOpen);
         body.classList.toggle('noscroll', overlayOpen);
         
         /* On some mobile browser when the overlay was previously
            opened and scrolled, if you open it again it doesn't 
            reset its scrollTop property */
         overlay.scrollTop = 0;

      }, false);

    });

 [].forEach.call(overlayBtts2, function(btt) {

      btt.addEventListener('click', function() { 
         
         /* Detect the button class name */
         var overlayOpen = this.className === 'open-overlay';
         
         /* Toggle the aria-hidden state on the overlay and the 
            no-scroll class on the body */
         overlay2.setAttribute('aria-hidden', !overlayOpen);
         body.classList.toggle('noscroll', overlayOpen);
         
         /* On some mobile browser when the overlay was previously
            opened and scrolled, if you open it again it doesn't 
            reset its scrollTop property */
         overlay2.scrollTop = 0;

      }, false);

    });

/*
$("input[type=range]").on({
    ready: function(e) {
         var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
    var percent = val * 100;

    $(this).css('background-image',
        '-webkit-gradient(linear, left top, right top, ' +
        'color-stop(' + percent + '%, #df7164), ' +
        'color-stop(' + percent + '%, #F5D0CC)' +
        ')');

    $(this).css('background-image',
        '-moz-linear-gradient(left center, #DF7164 0%, #DF7164 ' + percent + '%, #F5D0CC ' + percent + '%, #F5D0CC 100%)');
    },
    mousemove: function(e) {
         var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
    var percent = val * 100;

    $(this).css('background-image',
        '-webkit-gradient(linear, left top, right top, ' +
        'color-stop(' + percent + '%, #df7164), ' +
        'color-stop(' + percent + '%, #F5D0CC)' +
        ')');

    $(this).css('background-image',
        '-moz-linear-gradient(left center, #DF7164 0%, #DF7164 ' + percent + '%, #F5D0CC ' + percent + '%, #F5D0CC 100%)');
    },
    click: function(e) {
         var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
    var percent = val * 100;

    $(this).css('background-image',
        '-webkit-gradient(linear, left top, right top, ' +
        'color-stop(' + percent + '%, #df7164), ' +
        'color-stop(' + percent + '%, #F5D0CC)' +
        ')');

    $(this).css('background-image',
        '-moz-linear-gradient(left center, #DF7164 0%, #DF7164 ' + percent + '%, #F5D0CC ' + percent + '%, #F5D0CC 100%)');
    }
});


*/