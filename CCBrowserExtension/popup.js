// This script controls the communication between the popup interface and the content/background

document.addEventListener('DOMContentLoaded', function() {
    var summarize = document.getElementById('summarize');
    var simplify = document.getElementById('simplify');
    var topics = document.getElementById('topics');
    var definitions = document.getElementById('definitions');
    var emotions = document.getElementById('emotions');
    var emotions_off = document.getElementById('emotions_off');

    summarize.addEventListener('click', function() {
        if (window.confirm("Do you want to summarize content?")) { 
            window.open("exit.html", "Thanks for Visiting!");
        }
        else{
            //do nothing for now
        }
    });

    simplify.addEventListener('click', function() {
        if (window.confirm("Do you want to simplify content?")) { 
            window.open("exit.html", "Thanks for Visiting!");
        }
        else{
            //do nothing for now
        }
    });

    topics.addEventListener('click', function() {
        if (window.confirm("Do you want to show topics for this content?")) { 
            window.open("exit.html", "Thanks for Visiting!");
        }
        else{
            //do nothing for now
        }
    });

    definitions.addEventListener('click', function() {
        if (window.confirm("Do you want to show definitions for this content?")) { 
            window.open("exit.html", "Thanks for Visiting!");
        }
        else{
            //do nothing for now
        }
    });

    emotions.addEventListener('click', function() {
        if (window.confirm("Would you like to enable active mode?")) {
            //sends a message to the content.js to start 
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {"message": "start"});
            });
        }
        else{
            //do nothing for now
        }
    });

    emotions_off.addEventListener('click', function() {
        if (window.confirm("Would you like to disable active mode?")) {
            //sends a message to the content.js to start 
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {"message": "stop"});
            });
        }
        else{
            //do nothing for now
        }
    });
});

