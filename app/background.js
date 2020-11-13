document.addEventListener("DOMContentLoaded", function(event) {

console.log("background js on");


// chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
//    function(tabs){
//      console.log("Sending url..." + tabs[0].url);
//     chrome.tabs.sendMessage(tabs[0].id, {url: tabs[0].url });
//    }
// );

chrome.tabs.onActivated.addListener(
  function(activeInfo) {
    // read changeInfo data and do something with it
    // like send the new url to contentscripts.js
    console.log(JSON.stringify(activeInfo));
    activeinf = null;
    urli = null;
    chrome.tabs.get(activeInfo.tabId, function(tab){
      console.log("you are here: "+tab.url);
      activeinf = activeInfo;
      urli = tab.url;
      // chrome.tabs.sendMessage( activeInfo.tabId, {
      //   message: "New URL!",
      //   url: tab.url
      // });
      console.log(activeinf, urli);
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(activeinf.tabId, {
          message: "New URL!",
          url: urli
        });  
    });
    });
    
    
    console.log("sent message")
  }
);


chrome.runtime.onMessage.addListener(
  function(request) {
    if (request.highlight === "True"){
        console.log("can highlight now");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {mash: "True"});
          });
    } else if(request.highlight === "False"){
        console.log("unhighlight now");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {mash: "False"});
          });
    }
     // sendResponse({farewell: "goodbye"});
      
  });


chrome.runtime.onMessage.addListener(
  function(request) {
    if (request.wordUpdate === "True"){
        console.log("got fresh words");
        data = request.toSimplify;
        console.log(data);
        var keys = Object.keys(data).reverse();
        console.log(keys);
        for(var i = 0; i < keys.length; i++){
          console.log(data[keys[i]]);
          newWord = getSimpleWord(data[keys[i]]);
        }
    } else {
        //
    }
      // sendResponse({farewell: "goodbye"});
      
  });

 function getSimpleWord(word) {

 }


});



// listener waiting on message from popup.js
// on true - sends message to content.js to highlight
// on false - sends message to content.js to undo highlight
// chrome.runtime.onMessage.addListener(
//   function(request) {
//     if (request.highlight === "True"){
//         console.log("can highlight now");
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             chrome.tabs.sendMessage(tabs[0].id, {mash: "True"});
//           });
//     } else {
//         console.log("unhighlight now");
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             chrome.tabs.sendMessage(tabs[0].id, {mash: "False"});
//           });
//     }
//      // sendResponse({farewell: "goodbye"});
      
//   });
// });