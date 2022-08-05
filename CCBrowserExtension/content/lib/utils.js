'use strict'
var matchMap = {};

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
        // var wordname;
        var symbol;
        var image_url;
        // var words;
        // var divtext;
        var author;
        var license;
        var license_url;
        // var matchMap = {};

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
                        html = "<div id='container' style='display:inline-block; line-height:0.8; '><div  id='num1' style='display:block;' > <img  src="
                            +image_url+" title='Author: "+author+" &#13;License: "+license+"&#13;License-URL:"
                            +license_url+"' height=50; width=50; style='max-height:50px; max-width:50px;'/></div> <div id='num2' style='display:block; text-align:center'>"
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
                        
                        id = makeid();
                        html = '<span class="' + id + '" style="cursor: pointer; color: blue;">' + concept + '</span>';

                        // (A) replaces [concept %~<ref data>~%] tuple with a UID
                        //   simpleText = simpleText.split(concept + " " + matches[i]).join(id);
                        simpleText = simpleText.replace( new RegExp("\\b("+concept+")\\b", "ig"), id+ " ");
                        var matchTuple = {
                            "id": id,
                            "class": id, //use id as class so that same concept will have same dynamically generated class
                            "concept": concept,
                            "modalHTML": html,
                            "web": web,
                            "comment": comment,
                            "thumbnail": thumbnail
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


    return simpleText;
}

function identifyReplaceConfidence(simpleText, enhance = 0){
    // var kcount = 0;
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
            if(!enhance){
                var kcount = 0;
                for(var k = obj.length -1 ; k >=0; k--){
                    kcount++;
                    var lexicon  = obj[k].lexicon != undefined ? obj[k].lexicon : "";
                    targetoutput = targetoutput + lexicon+ "<br/>";
                    if (kcount ==3) break;
                }
                // kcount = 0;
            }
            
            /* generating the html that needs to be replaced in the simpleTex */
            if(!enhance)
                html =  '<div class="tooltips" tooltip-placement="{{getTooltipPlacement()}}">'+replacedWords2[i] +'<span class="tooltiptexts">'+targetoutput+'</span></div>';
            else
                html =  replacedWords2[i];

            simpleText = simpleText.split(replacedWords2[i]).join(html);
        }

    }

    simpleText = simpleText.split("|^").join("<font color='green'>");
    simpleText = simpleText.split("^|").join("</font>");
    simpleText = simpleText.split("\\").join("");
    simpleText = simpleText.split("<p>").join(""); /* added on june 27th,2017 by sushank to remove <p> tags that are auto wrapped */
    return simpleText;
}

function createOverlay(text, mode){
    var nlpDiv = document.createElement('div');
    var closeImg = document.createElement('img');
    // closeImg.setAttribute("class", 'closeimg')
    closeImg.src = chrome.runtime.getURL('images/close_off.png');
    closeImg.id = 'closeimg';
    nlpDiv.id = 'nlpDiv';
    nlpDiv.setAttribute("class", "overlayDiv");
    // document.body.appendChild(closeImg);
    document.body.appendChild(nlpDiv);
    var closeImgHTML = '<img id="closenlpDiv" class="closeimg" src =' + closeImg.src + '>';
    nlpDiv.innerHTML = '<br>' + closeImgHTML + '<div class="modediv">' + showMode(mode) + '</div>' + '<div>' + text + '</div>';
    nlpDiv.style.position = "fixed";
    nlpDiv.style.top = '10%'
    nlpDiv.style.width = '80%'
    nlpDiv.style.left = "10%";
    nlpDiv.style.height = "80%";

    if(mode == 5){
        console.log(Object.keys(matchMap).length);
        var classes = [];
        // var classElement = [];
        for(var key in matchMap){
            // console.log(matchMap[key].class);
            var tmp = document.getElementsByClassName(matchMap[key].class);
            classes.push(tmp);
        }
        // console.log(classes);
        for(let i=0; i < Object.keys(matchMap).length; i++){
            for (let j = 0; j <classes[i].length; j++){
                // console.log(classes[i][j]);
                // var className = classes[i][j].className;
                classes[i][j].addEventListener("click", function(){
                            topicOverlay(classes[i][j].className);
                        });
            }
        }

    }
    
    

    // closeImg.onmouseover = function(){
    //     this.src = chrome.runtime.getURL('images/close_off.png');
    // }
    // closeImg.onmouseleave = function(){
    //     this.src = chrome.runtime.getURL('images/close.png');
    // }
    
    document.getElementById('closenlpDiv').onclick = function(){
        this.parentNode.parentNode
        .removeChild(this.parentNode);
        return false;
    };


}

function showMode(mode){
    if (mode == 1){
        var description = '<b>Simplify:</b>  This mode replaces words and \
        phrases with more commonly used wording. The <font color="green"> \
        <b>green</b></font> text shows what was replaced. You can mouse \
        over these to show alternatives.';
    
    }
    else if (mode == 2){
        var description = '<b>Summarize:</b>  This mode attempts to pull \
        out the most important info, and create a shorter summary.';
    }

    else if (mode == 3){
        var description = '<b>Summarize-Simplify:</b>  This mode attempts \
        to pull out the most important info, and create a shorter summary \
        with easier to read wording. ';
    }

    else if (mode == 4){
        var description = '<b>Show Definitions:</b>  This mode inserts \
        simple English definitions for difficult words, when possible. \
        Inserted definitions are in parenthesis and highlighted in \
        <font color="green"> <b>( green ).</b></font>';
    }

    else if (mode == 5){
        var description = '<b>Show Topics:</b>  This mode inserts \
        additional info about topics found in the content, when \
        possible. To view this info, click the \
        <font color="blue"><b>blue</b></font> links.';
    }
    
    else if (mode == 6){
        var description = '<b>AAC Symbols:</b>  This mode inserts \
        augmentative and alternative communication (AAC) symbols, \
        when possible, to give visual cues for meaning.';
    }
    return description;    
} 

function topicOverlay(className){
    for (var key in matchMap){
        if(matchMap[key].class == className){
            // console.log(matchMap[key].concept);
            // console.log(matchMap[key].thumbnail);
            // alert("goto: " + matchMap[key].thumnbnail);
            var topicOverlayDiv = document.createElement('div');
            var closeOverlay = document.createElement('img');
            // closeOverlay.setAttribute("class", "closeimg");
            closeOverlay.src = chrome.runtime.getURL('images/close_off.png');
            closeOverlay.id = 'closeoverlay';
            topicOverlayDiv.id = 'topicoverlaydiv';
            topicOverlayDiv.setAttribute("class", "overlayDiv");
            // document.body.appendChild(closeImg);
            document.body.appendChild(topicOverlayDiv);
            var closeImgHTML = '<img id="closeoverlay" class="closeimg" src =' + closeOverlay.src + '>';
            var thumbnail = '<img id="thumbnail" class="thumbnailimg" src =' + matchMap[key].thumbnail + ' style="display:block;">';
            var abstract = matchMap[key].comment;
            
            topicOverlayDiv.innerHTML = '<br>' + closeImgHTML + '<div id="thumbnaildiv">' + thumbnail + '</div><br>' + '<div><b>ABSTRACT: </b><br>' + abstract + '</div>';
            topicOverlayDiv.style.position = "fixed";
            topicOverlayDiv.style.top = '10%'
            topicOverlayDiv.style.width = '80%'
            topicOverlayDiv.style.left = "10%";
            topicOverlayDiv.style.height = "80%";

            document.getElementById('closeoverlay').onclick = function(){
                this.parentNode.parentNode
                .removeChild(this.parentNode);
                return false;
            };
       }   
    }

}

function errorOverlay(errormsg){
    var errorOverlayDiv = document.createElement('div');
    var closeOverlay = document.createElement('img');
    // closeOverlay.setAttribute("class", "closeimg");
    closeOverlay.src = chrome.runtime.getURL('images/close_off.png');
    closeOverlay.id = 'closeoverlay';
    errorOverlayDiv.id = 'erroroverlaydiv';
    errorOverlayDiv.setAttribute("class", "overlayDiv");
    // document.body.appendChild(closeImg);
    document.body.appendChild(errorOverlayDiv);
    var closeImgHTML = '<img id="closeoverlay" class="closeimg" src =' + closeOverlay.src + '>';
    // var thumbnail = '<img id="thumbnail" class="thumbnailimg" src =' + matchMap[key].thumbnail + '>';
    if(errormsg == undefined || errormsg ==""){
       errormsg = 'The Content Clarifier was unable to process your request.'
    }
    
    errorOverlayDiv.innerHTML = closeImgHTML + '<br><br>' + '<div id="errormsg">' + '<b>Error: </b>'+ errormsg + '</div>';
    errorOverlayDiv.style.position = "fixed";
    errorOverlayDiv.style.top = '35%'
    errorOverlayDiv.style.width = '50%'
    errorOverlayDiv.style.left = "25%";
    errorOverlayDiv.style.height = "30%";

    document.getElementById('closeoverlay').onclick = function(){
        this.parentNode.parentNode
        .removeChild(this.parentNode);
        return false;
    };
        
    
}

