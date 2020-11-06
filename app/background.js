document.addEventListener("DOMContentLoaded", function(event) {

console.log("background js on");

// listener waiting on message from popup.js
// on true - sends message to content.js to highlight
// on false - sends message to content.js to undo highlight
chrome.runtime.onMessage.addListener(
  function(request) {
    if (request.highlight === "True"){
        console.log("can highlight now");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {mash: "True"});
          });
    } else {
        console.log("unhighlight now");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {mash: "False"});
          });
    }
     // sendResponse({farewell: "goodbye"});
      
  });
});