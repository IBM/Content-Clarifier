
/** 
 * This script manages all of the displays on the content pages. Transformation overlays are manages in the
 * content/lib/utils.js file
 */

'use strict'
var show = false;
var pluginOn = false;
var transform_menuOn = false;
var readmodeOn = false;
var extensionDiv = document.createElement('div');
var videoStream = document.createElement('video');
var imgCanvas = document.createElement('canvas');
var rectCanvas = document.createElement('canvas');
const mediaOptions = {audio: false, video:true};
var streaming = false;
var initSelect = "";
var selectedText = "";
var prevSelectedText = "";
var width;
var height;
var toppad;
var left;
const serverTimeout = 45000;

window.onload = function(){
    width = Math.round(window.innerWidth);
    height = Math.round(window.innerHeight);
    toppad = Math.round(window.innerWidth * 0);
    left = Math.round(window.innerHeight * 0)

    if (document.getElementById("post-input-div")){
        //get string of background variable
        // var post_input;
        chrome.runtime.sendMessage({method: 'get', data: ""}, function(response) {
            console.log(response);
            // post_input = response;
            // alert(response);
            document.getElementById("post-input-div").innerHTML = response;
            setTimeout(function(){ document.getElementById("UrlSubmit").click(); }, 100);
        });
        document.getElementsByClassName("close-overlay")[0].addEventListener("click", function(){
            window.close();
        });
    }
};

extensionDiv.id = 'myDivId';
videoStream.id = "videoStream"
imgCanvas.id = "imgCanvas";
rectCanvas.id = "rectCanvas";


/**
 * This section is intended for emotional classification (experimental) via webcam video capture
 * This function is currently disabled/hidden due to technical limitations with content parseing 
 * with Watson Discovery service
 */

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === "start") {
            show = true
            activeMode(show);
        }
        if (request.message ==="stop"){
            show = false;
            activeMode(show)
        }
    }
);

function activeMode(show){
    if (show == true){
        emotionDetect(true)
        alert("Active Mode Will Begin!")
        
    }
    if(show == false){
        emotionDetect(false)
        alert("Active Mode Will Stop!")
        
    }
}

function emotionDetect(status){
    if (status){
        // fitToContainer(imgCanvas)

        //append all elements to DOM
        document.body.appendChild(extensionDiv);
        //set attributes for div
        extensionDiv.style.position = 'fixed';
        extensionDiv.style.top = '75%';
        extensionDiv.style.left = '80%';

        extensionDiv.appendChild(videoStream);
        videoStream.style.width = '100%';
        videoStream.style.height = '100%';
        videoStream.style.zIndex = '10';

        extensionDiv.appendChild(imgCanvas);
        imgCanvas.style.display = 'none';
        // fitToContainer(imgCanvas);
        extensionDiv.appendChild(rectCanvas);

        navigator.mediaDevices.getUserMedia(mediaOptions).then(handleSuccess).catch(handleError);

        function handleSuccess(stream) {
            console.log('Got stream with constraints:', mediaOptions);
            window.stream = stream; // make variable available to browser console
            videoStream.srcObject = stream;
            videoStream.onloadedmetadata = function(e) {
                videoStream.play();
            };
        }

        function handleError(error) {
            if (error.name === 'ConstraintNotSatisfiedError') {
            let v = mediaOptions.video;
            console.log(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
            } else if (error.name === 'PermissionDeniedError') {
                console.log('Permissions have not been granted to use your camera');
            }
            console.log(`getUserMedia error: ${error.name}`, error);
        }
    }
    if(!status){
        document.getElementById("myDivId").innerHTML = "";
        stream.getTracks().forEach(track => track.stop());
    }

    videoStream.addEventListener('canplay', function(ev){
        if(!streaming){
            // var width = videoStream.style.width;
            // var height = videoStream.style.height;

            // if (isNaN(height)) {
            //     height = width / (4/3);
            // }

            // videoStream.setAttribute('width', width);
            // videoStream.setAttribute('height', height);
            streaming = true;
        }
    }, false);
    
    startClassification()
}

function startClassification() {
    setInterval(function(){
        // imgCanvas = getElementById(imgCanvas)
        var imgContext = imgCanvas.getContext('2d');
        // console.log(window.innerWidth);
        // console.log(window.innerHeight);
        // console.log(videoStream.width);
        // console.log(videoStream.height);
        imgContext.drawImage(videoStream, 0, 0);
        var dataObj;
        dataObj = {
            text: imgCanvas.toDataURL('image/jpeg', .5)
            // text: "hello"
        }
        console.log(dataObj.text)
    }, 1000) 

}
/**
 * This ends the emotinal classification section for the extension
 */


document.addEventListener("mouseup", wordSelected);
document.addEventListener("mousedown", wordunSelected);

function wordunSelected(){
    if (document.getSelection().toString() == ""){
        initSelect = "";
        selectedText = "";
        prevSelectedText = "";
    }
}

function wordSelected(){
    // console.log("mouseup:" + document.getSelection().toString());
    if(document.getSelection() != "undefined"){
        initSelect = document.getSelection().toString();
        if(initSelect.split(" ").length > 3){
            var x = event.clientX;
            var y = event.clientY;
            // console.log(initSelect);
            // console.log(x);
            // console.log(y);
            if (initSelect != prevSelectedText){
                selectedText = initSelect;
                if(document.getElementById('plugindiv') && !pluginOn){
                    document.getElementById('plugindiv').style.left = x + 'px';
                    document.getElementById('plugindiv').style.top = y + 'px';
                    document.getElementById('plugindiv').style.visibility = "visible";
                }
                if(!document.getElementById('plugindiv'))
                    createMenu(x, y);
                prevSelectedText = initSelect;
                initSelect = "";
            }
            // prevSelectedText = "";
            // createOverlay(selectedText);

        }else{
            // selectedText = document.getSelection().toString();
            // prevSelectedText = "";
            console.log("Need more text in order to perform analysis")
        }
        // initSelect = window.getSelection().toString();
        // prevSelectedText ="";
    }
}

function createMenu(x, y){
    var closeIcon = document.createElement('img');
    var questionIcon = document.createElement('img');
    var pluginDiv = document.createElement('div');
    var setupDiv = document.createElement('div');
    var ccDiv = document.createElement('div');
    var transformDiv = document.createElement('div');
    var waitDiv = document.createElement('div');
    var CCIcon = document.createElement('img');
    var simplifyIcon = document.createElement('img');
    var summarizeIcon = document.createElement('img');
    var sumAndSimpIcon = document.createElement('img');
    var showDefIcon = document.createElement('img');
    var showTopicIcon = document.createElement('img');
    var AACIcon = document.createElement('img');
    var moveIcon = document.createElement('img');
    var readIcon = document.createElement('img');
    var waitIcon = document.createElement('img');

    closeIcon.setAttribute('id', 'closeicon');
    moveIcon.setAttribute('id', 'moveicon');
    pluginDiv.setAttribute('id', 'plugindiv');
    setupDiv.setAttribute('id', 'setupdiv');
    ccDiv.setAttribute('id', 'ccdiv');
    transformDiv.setAttribute('id', 'transformdiv');
    waitDiv.setAttribute('id', 'waitdiv');
    CCIcon.setAttribute('id', 'ccicon');
    simplifyIcon.setAttribute('id', 'simplifyicon');
    simplifyIcon.setAttribute('class', 'transformicon');
    summarizeIcon.setAttribute('id', 'summarizeicon');
    summarizeIcon.setAttribute('class', 'transformicon');
    sumAndSimpIcon.setAttribute('id', 'sumandsimpicon');
    sumAndSimpIcon.setAttribute('class', 'transformicon');
    showDefIcon.setAttribute('id', 'showdeficon');
    showDefIcon.setAttribute('class', 'transformicon');
    showTopicIcon.setAttribute('id', 'showtopicicon');
    showTopicIcon.setAttribute('class', 'transformicon');
    AACIcon.setAttribute('id', 'aacicon');
    AACIcon.setAttribute('class', 'transformicon');
    readIcon.setAttribute('id', 'readicon');
    readIcon.setAttribute('class', 'transformicon');
    questionIcon.setAttribute('id', 'questionicon');
    questionIcon.setAttribute('class', 'transformicon');
    waitIcon.setAttribute('id', 'waiticon');
    

    CCIcon.src = chrome.runtime.getURL('images/ccmain.png');
    simplifyIcon.src = chrome.runtime.getURL('images/simplify_off.png');
    summarizeIcon.src = chrome.runtime.getURL('images/summarize_off.png');
    sumAndSimpIcon.src = chrome.runtime.getURL('images/summarizeAndSimplify_off.png');
    showDefIcon.src = chrome.runtime.getURL('images/show_definitions_off.png');
    showTopicIcon.src = chrome.runtime.getURL('images/show_topics_off.png');
    AACIcon.src = chrome.runtime.getURL('images/show_symbols_off.png');
    readIcon.src = chrome.runtime.getURL('images/reading_mode_off.png');
    closeIcon.src = chrome.runtime.getURL('images/close_off.png');
    questionIcon.src = chrome.runtime.getURL('images/question_off.png');
    moveIcon.src = chrome.runtime.getURL('images/move.png');
    waitIcon.src = chrome.runtime.getURL('images/please_wait_double.png');
 
    closeIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/close.png');
    }
    closeIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/close_off.png');
    }

    simplifyIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/simplify.png');
    }
    simplifyIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/simplify_off.png');
    }

    summarizeIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/summarize.png');
    }
    summarizeIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/summarize_off.png');
    }

    sumAndSimpIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/summarizeAndSimplify.png');
    }
    sumAndSimpIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/summarizeAndSimplify_off.png');
    }

    showDefIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/show_definitions.png');
    }
    showDefIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/show_definitions_off.png');
    }

    showTopicIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/show_topics.png');
    }
    showTopicIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/show_topics_off.png');
    }

    AACIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/show_symbols.png');
    }
    AACIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/show_symbols_off.png');
    }

    readIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/reading_mode_on.png');
    }
    readIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/reading_mode_off.png');
    }

    questionIcon.onmouseover = function(){
        this.src = chrome.runtime.getURL('images/question.png');
    }
    questionIcon.onmouseleave = function(){
        this.src = chrome.runtime.getURL('images/question_off.png');
    }


    if(!pluginOn){
        document.body.appendChild(pluginDiv);
        pluginDiv.append(setupDiv);
        pluginDiv.append(ccDiv);
        pluginDiv.append(transformDiv);
        pluginDiv.append(waitDiv);
        document.getElementById('transformdiv').style.visibility="hidden";
        pluginDiv.style.left = (x) + 'px'
        pluginDiv.style.top = (y) + 'px';

        setupDiv.appendChild(moveIcon);
        setupDiv.appendChild(closeIcon);
        ccDiv.appendChild(CCIcon);
        waitDiv.appendChild(waitIcon);
        document.getElementById('waitdiv').style.visibility="hidden";
        appendTransformMenu();
        pluginOn = true;
    }

    CCIcon.onclick = function(){
        if(!transform_menuOn){
            // pluginDiv.append(transformDiv);
            // appendTransformMenu();  // appends all transformations options
            document.getElementById('transformdiv').style.visibility = "visible";
            transform_menuOn = true;
        }
        else if(transform_menuOn){
            document.getElementById('transformdiv').style.visibility="hidden";
            // elem.remove();
            transform_menuOn = false;
        }
        return false;
    };

    closeIcon.onclick = function(){
        // var elem = document.getElementById('plugindiv');
        // elem.remove();
        document.getElementById('plugindiv').style.visibility="hidden";
        document.getElementById('transformdiv').style.visibility="hidden";
        document.getElementById('waitdiv').style.visibility="hidden";
        pluginOn = false;
        transform_menuOn = false;
        return false;
    };

    questionIcon.onclick = function(){
        window.open("https://contentclarifier.mybluemix.net/",'popUpWindow','height=' + height +',width=' + width + ',left='+left+',top='+toppad+',,scrollbars=yes,menubar=no');
        return false;
    };


    simplifyIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {

            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    console.log(myObj);
                    // console.log();
                    // var noDelimText = removeDelimiters(myObj.simplified);
                    var cleanOutput = myObj.simplified.replace(/\|_[^_]*?_\|/g,"");
                    // console.log(cleanOutput);
                    var parsedText = parseToHtml(cleanOutput);
                    // console.log(parsedText);
                    var parsedText = identifyReplaceConfidence(parsedText)
                    createOverlay(parsedText, 1);
                    // console.log("done");    
                    // createOverlay(myObj.simplified);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/contextual-simplify");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }

    summarizeIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    // console.log(myObj.condensed);
                    var newString = myObj.condensed.split("Content Length:")[0]
                    // console.log(newString);
                    // console.log(myObj.condensed);
                    createOverlay(newString,2);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/condense");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }

    sumAndSimpIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    
                    // console.log(myObj);
                    var cleanOutput = myObj.condensed.replace(/\|_[^_]*?_\|/g,"");     
                    var parsedText = identifyReplaceConfidence(cleanOutput);
                    // console.log(parsedText);
                    // var outputcontext =  parseToHtml(parsedText);
                    // console.log("done");    
                    createOverlay(parsedText, 3);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/condense-simplify");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }

    showDefIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText,
            options: {
                'enhanceContentMode':2, // {1=referenceData, 2=definitions, 3=symbols}
                // 'outputMode':$scope.outputMode,
                // 'calculateReadingLevels':$scope.calculateReadingLevels
            }
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    var cleanOutput = myObj.simplified.replace(/\|_[^_]*?_\|/g,"");
                    // console.log(cleanOutput);
                    var parsedText = parseToHtml(cleanOutput);
                    // console.log(parsedText);
                    var parsedText = identifyReplaceConfidence(parsedText, 1);


                    createOverlay(parsedText, 4);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/contextual-simplify");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }

    showTopicIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText,
            options: {
                'enhanceContentMode':1, // {1=referenceData, 2=definitions, 3=symbols}
            }
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    var cleanOutput = myObj.simplified.replace(/\|_[^_]*?_\|/g,"");
                    // console.log(cleanOutput);
                    var parsedText = parseToHtml(cleanOutput);
                    var parsedText = identifyReplaceConfidence(parsedText)
                    createOverlay(parsedText, 5);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/contextual-simplify");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }


    AACIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        transformDiv.style.visibility = "hidden";
        waitDiv.style.visibility = "visible";
        var data = JSON.stringify({
            "id": "demo-app@us.ibm.com",
            "apikey": "7M0xQYZUa9CvCz8wPmCI",
            "data": selectedText,
            options: {
                'enhanceContentMode':3, // {1=referenceData, 2=definitions, 3=symbols}
                // 'outputMode':$scope.outputMode,
                // 'calculateReadingLevels':$scope.calculateReadingLevels
            }
        });

         
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if(xhr.status === 200){
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                    var myObj = JSON.parse(this.responseText);
                    var cleanOutput = myObj.simplified.replace(/\|_[^_]*?_\|/g,"");
                    // console.log(cleanOutput);
                    var parsedText = parseToHtml(cleanOutput);
                    // console.log(parsedText);
                    var parsedText = identifyReplaceConfidence(parsedText)

                    var tempDiv = document.createElement("div");
                    tempDiv.innerHTML = "<div style='line-height: 6.5;  word-spacing: 6px'>"+parsedText+"</div>";
                    createOverlay(tempDiv.innerHTML, 6);
                }else{
                    // alert("Error: Content Clarifier Unable to Process Your Request.");
                    errorOverlay();
                    waitDiv.style.visibility = "hidden";
                    if(pluginOn)
                        transformDiv.style.visibility = "visible";
                }
            }
        });
        
        xhr.open("POST", "https://contentclarifiertest.mybluemix.net/api/V1/contextual-simplify");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = serverTimeout;
        xhr.send(data);

        // createOverlay("simplify");
        return false;
    }

    readIcon.onclick = function(){
        if(selectedText == undefined || selectedText == "" ){
            errorOverlay("No text selected. Please select any text for Analysis");
            return;
        }
        readmodeOn = true;
        // console.log(selectedText);

        chrome.runtime.sendMessage({method: 'set', data: selectedText}, function(response) {
            console.log(response);
        });
        
        var CCUrl = "https://contentclarifiertest.mybluemix.net/cc-plugin-app";
        window.open(CCUrl,'popUpWindow', 'height='+height+',width='+width+',left=' +left+',top='+toppad+',,scrollbars=yes,menubar=no');
        return false;
    };

   
    function appendTransformMenu(){
        transformDiv.appendChild(readIcon);
        transformDiv.appendChild(simplifyIcon);
        transformDiv.appendChild(summarizeIcon);
        transformDiv.appendChild(sumAndSimpIcon);
        transformDiv.appendChild(showDefIcon);
        transformDiv.appendChild(showTopicIcon);
        transformDiv.appendChild(AACIcon);
        transformDiv.appendChild(questionIcon);
    }

    // Make the DIV element draggable:
    dragElement(document.getElementById("plugindiv"));

    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        document.getElementById("moveicon").onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
    
    
    }

}