document.addEventListener("DOMContentLoaded", function (event) {

console.log("background js on");

var toSendBack = []


  // chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
  //    function(tabs){
  //      console.log("Sending url..." + tabs[0].url);
  //     chrome.tabs.sendMessage(tabs[0].id, {url: tabs[0].url });
  //    }
  // );

  chrome.tabs.onActivated.addListener(
    function (activeInfo) {
      // read changeInfo data and do something with it
      // like send the new url to contentscripts.js
      console.log(JSON.stringify(activeInfo));
      activeinf = null;
      urli = null;
      chrome.tabs.get(activeInfo.tabId, function (tab) {
        console.log("you are here: " + tab.url);
        activeinf = activeInfo;
        urli = tab.url;
        // chrome.tabs.sendMessage( activeInfo.tabId, {
        //   message: "New URL!",
        //   url: tab.url
        // });
        console.log(activeinf, urli);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(activeinf.tabId, {
            message: "New URL!",
            url: urli
          });
        });
      });


      console.log("sent message")
    }
  );


  // todo: send to active tab
  chrome.runtime.onMessage.addListener(
    function (request) {
      if (request.highlight === "True") {
        console.log("can highlight now");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          console.log("sending message bckg");
          chrome.tabs.sendMessage(tabs[0].id, { mash: "True" });
        });
      } else if (request.highlight === "False") {
        console.log("unhighlight now");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { mash: "False" });
        });
      }
      // sendResponse({farewell: "goodbye"});

    });


  chrome.runtime.onMessage.addListener(
    async function (request) {
      console.log(request);
      if (request.wordUpdate === "True") {
        console.log("got fresh words");
        data = request.toSimplify;
        console.log(data);
        var keys = Object.keys(data).reverse();
        console.log(keys);
        for (var i = 0; i < keys.length; i++) {
          wordID = keys[i];
          console.log("About to simplify word: ", data[wordID]);
          newWord = "";
          await getSimpleWord(data[wordID], wordID);
          // while (newWord.length > 5){
          //   newWord = getSimpleWord(data[wordID]);
          // }
          
         // console.log("adding new word ", newWord);
         // toSendBack.push({wordID: wordID, word: newWord});
        }
        // send to content script and modify those words 
        // todo: send to active tab
        console.log(typeof(toSendBack), toSendBack);
        toSend = JSON.stringify(toSendBack);
        if(toSend.length > 5) {


        // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        //   var port = chrome.tabs.connect(tabs[0].id, {name: "newWords"});
        //   port.postMessage({ type: "InPlace",
        //   toChange: toSend });
        // });
          // var port = chrome.runtime.connect(tabs[0].id, {name: "newWords"});
          // port.postMessage({ type: "InPlace",
          // toChange: toSend });

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "InPlace",
                                          toChange: toSend });
        });
      } //else {
      //   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      //     chrome.tabs.sendMessage(tabs[0].id, { type: "InPlac",
      //                                     toChange: toSend });
      //   });
      // }
        console.log("Should be sent");
      } else {
        console.log("No fresh yes")
      }
      // sendResponse({farewell: "goodbye"});

    });

 async function getSimpleWord(word, wordID) {
    freshWord = "";
    let response = await fetch('http://127.0.0.1:8000/decomplexify/', {
      mode: 'cors',
      method: "POST",
      body: JSON.stringify({ "type": "word", "text":word[0] }),
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow'
    });

    if(!response.ok){
      throw new Error(`HTTP error status: ${response.status}`);
    }else {
      freshWordPromise = await response.text()
      console.log(freshWordPromise);
      freshWordPromise = freshWordPromise.replace(/^"(.*)"$/, '$1');
      toSendBack.push({wordID: wordID, word: freshWordPromise});
      return freshWordPromise;
    }

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