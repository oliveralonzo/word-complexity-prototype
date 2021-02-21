// popup.js - define behavior for the popup/user interface

document.addEventListener("DOMContentLoaded", function (event) {
  var checkbox = document.getElementById("togBtn");

  /* Capture input for textSetting slider
   *   - listener open to any change of textSettingSlider
   *   - currently: only Word/Sentences - aligns to 1 and 2, respectively, in terms
   *     of input values
   *   - sends selected setting to content.js for appropriate changes to be made
   */
  textSettingNode = document.getElementById("textSettingInput");
  textSettingNode.addEventListener("input", function () {
    if (this.value == 1) {
      chrome.storage.sync.set({ textSetting: "Word" }, function () {
        // Notify that we saved.
        sendtoContentJS({ textSetting: "Word" });
      });
      //sendtoContentJS({ 'textSetting': 'Word' });
    } else if (this.value == 2) {
      chrome.storage.sync.set({ textSetting: "Sentence" }, function () {
        // Notify that we saved.
        sendtoContentJS({ textSetting: "Sentence" });
      });
    } else if (this.value == 3) {
      chrome.storage.sync.set({ textSetting: "Paragraph" }, function () {
        // Notify that we saved.
        sendtoContentJS({ textSetting: "Paragraph" });
      });
    }
  });

  /*
   * storageGetHelper is used to check the current setting for type of text
   *   - checking chrome storage is asynchronous - which creates the need for the structure seen
   *   - sets value and sends value if nothing is stored yet, otherwise asjusts value to stored
   *   - allow for persisting settings after popup is closed
   */
  storageGetHelper("textSetting").then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      if (value.textSetting === "Sentence") {
        /// tell content js to make sentence level changesw
        sendtoContentJS({ textSetting: "Sentence" });
        textSettingNode.value = 2;
      } else if (value.textSetting === "Word") {
        sendtoContentJS({ textSetting: "Word" });
        textSettingNode.value = 1;
        /// i want to signal that content js has to make word level changes to do
      } else if (value.textSetting === "Paragraph") {
        sendtoContentJS({ textSetting: "Paragraph" });
        textSettingNode.value = 3;
        /// i want to signal that content js has to make word level changes to do
      }
    } else {
      chrome.storage.sync.set({ textSetting: "Word" });
      textSettingNode.value = 1;
      sendtoContentJS({ textSetting: "Word" });
    }
  });

  /*
   * storageGetHelper is used to check the current setting for type of highlight
   *   - checking chrome storage is asynchronous - which creates the need for the structure seen
   *   - if stored value is true, sets highlight to true
   *   - allow for persisting settings after popup is closed
   */
  storageGetHelper("highlight").then(function (value) {
    if (value.highlight === true) {
      chrome.runtime.sendMessage({ highlight: "True" });
      checkbox.checked = true;
    }
  });

  /*
   * Given checkbox present, listener for: setting checkbox value and storing in chrome.storage.sync
   * send message to background through chrome.runtime - to signal highlight on
   */
  if (checkbox) {
    checkbox.addEventListener("change", async function () {
      if (checkbox.checked) {
        chrome.runtime.sendMessage({ highlight: "True" });
        chrome.storage.sync.set({ highlight: true });
        //  checkRecord = true;
      } else if (checkbox.checked === false) {
        chrome.runtime.sendMessage({ highlight: "False" });
        chrome.storage.sync.set({ highlight: false });
      }
    });
  } else {
    console.log("not loaded");
  }

  /*
   * Creates Promise out of chrome.storage.sync.get - value returned once available
   */
  async function storageGetHelper(key) {
    var valuePromise = new Promise(function (resolve, reject) {
      chrome.storage.sync.get(key, function (options) {
        resolve(options);
      });
    });

    const value = await valuePromise;
    return value;
  }

  /*
   * Helper function to send data to content.js
   * - requires specific tab data
   * - tabs[0] should be the active/current tab in the current window
   */
  function sendtoContentJS(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, data);
    });
  }
});
