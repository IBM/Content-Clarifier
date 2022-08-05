/* Background processes are persistent across all content tabs. content.js communicates with background.js via message passing */
var selectedText = ""
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == "set"){
      selectedText = request.data;
      sendResponse("Saved");
    }
    else if (request.method == "get") {
      sendResponse(selectedText);
    }
  });