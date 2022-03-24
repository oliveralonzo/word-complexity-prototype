// background.js - coordinates tasks between popup.js and content.js, API calls

document.addEventListener("DOMContentLoaded", function (event) {
  console.log("background js on");

  var totalParagraphs = 0;

  /*
   * Listener to capture highlight value from popup.js
   *  - future work --> this value can go straight from popup to content, which would negate the need for this
   *  - ideal request
   *    {'highlight': True/False}
   */
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.highlight === true) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          highlight: true,
          settingType: "highlightComplex",
        });
      });
    } else if (request.highlight === false) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          highlight: false,
          settingType: "highlightComplex",
        });
      });
    }
  });

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.highlightReplaced === true) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          highlightReplaced: true,
          settingType: "highlightReplaced",
        });
      });
    } else if (request.highlightReplaced === false) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          highlightReplaced: false,
          settingType: "highlightReplaced",
        });
      });
    }
  });

  /*
   * Listener to capture text that needs to be simplified
   *  - ideal request
   *  - async/await due to async API calls
   *    {'wordUpdate': True/False},
   *    {'toSimplify': [...words to simplify]}
   *    {'toSimplifySentence': [...sentences to simplify]}
   */
  chrome.runtime.onMessage.addListener(async function (request) {
    if (request.wordUpdate === "True") {
      sentenceData = request.toSimplifySentence;
      await getNewText(sentenceData, "sentence");
    } else {
      console.log("request.wordUpdate not True");
    }
  });

  /*
   * Perform API call to simplify text
   * POST request body example : {"type": "word", "text": "apple" } - stringified
   * - text - "apple" - the full string that needs to be simplified
   * - sentenceID - "id50" - the id used to identify this word's span element within the document body
   * - type - "word" - type of text being sent
   * result: a "simplified" version of the provided text argument
   */
  async function getSimpleWord(text, sentenceID, type) {
    let url = "http://127.0.0.1:8000/decomplexify/";
    // Number of paragraphs
    let amount = type === "document" ? `${totalParagraphs}/` : "";
    let response = await fetch(url + amount, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({ type: type, text: text }),
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    } else {
      // if (type === "document") alert("got " + type);
      freshTextPromise = await response.text();
      freshTextPromise = freshTextPromise.replace(/^"(.*)"$/, "$1");
      // toSendBack.push({ sentenceID: sentenceID, text: freshTextPromise });
      return freshTextPromise;
    }
  }

  /*
   * Takes in a set of text - obtains simplified replacements - sends replacements to content.js
   * data - text to be simplified
   * type - type of text being requested
   */
  async function getNewText(data, type) {
    var toSendBack = [];
    if (type === "document") {
      console.log("Received Document data", data);
    }

    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      textID = keys[i];

      let simple = await getSimpleWord(data[textID], textID, type);
      toSendBack.push({sentenceID: textID, text: simple});
    }
    // send to content script and modify those words
    let toSend = JSON.stringify(toSendBack);

    if (toSendBack.length === keys.length) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "simplifiedText",
          toChange: toSend,
          textType: type,
        });
      });
    }
  }

  /*
   * Below is some code working towards getting the current url - may be useful to have url for future work - not currently in use
   */
  // chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
  //    function(tabs){
  //      console.log("Sending url..." + tabs[0].url);
  //     chrome.tabs.sendMessage(tabs[0].id, {url: tabs[0].url });
  //    }
  // );

  // chrome.tabs.onActivated.addListener(
  //   function (activeInfo) {
  //     // read changeInfo data and do something with it
  //     // like send the new url to contentscripts.js
  //     console.log(JSON.stringify(activeInfo));
  //     activeinf = null;
  //     urli = null;
  //     chrome.tabs.get(activeInfo.tabId, function (tab) {
  //       console.log("You are here: " + tab.url);
  //       activeinf = activeInfo;
  //       urli = tab.url;
  //       // chrome.tabs.sendMessage( activeInfo.tabId, {
  //       //   message: "New URL!",
  //       //   url: tab.url
  //       // });
  //       console.log(activeinf, urli);
  //       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //         chrome.tabs.sendMessage(activeinf.tabId, {
  //           message: "New URL!",
  //           url: urli
  //         });
  //       });
  //     });

  //     console.log("sent message")
  //   }
  // );
});
