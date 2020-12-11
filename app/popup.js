// popup.js - define behavior for the popup/user interface


document.addEventListener("DOMContentLoaded", function (event) {
  console.log("popup js on");
  var checkbox = document.getElementById("togBtn");
  var checkRecord = false;


  /* Capture input for textSetting slider
   *   - listener open to any change of textSettingSlider
   *   - currently: only Word/Sentences - aligns to 1 and 2, respectively, in terms
   *     of input values
   *   - sends selected setting to content.js for appropriate changes to be made
   */
  textSettingNode = document.getElementById("textSettingInput");
  textSettingNode.addEventListener('input', function () {
    if (this.value == 1) {
      console.log("Words");
      chrome.storage.sync.set({ 'textSetting': 'Word' }, function () {
        // Notify that we saved.
        console.log('textSetting value saved');
        sendtoContentJS({ textSetting: 'Word' });
      });
      //sendtoContentJS({ 'textSetting': 'Word' });
    } else if (this.value == 2) {
      console.log("Sentences");
      chrome.storage.sync.set({ 'textSetting': 'Sentence' }, function () {
        // Notify that we saved.
        console.log('textSetting value saved');
        sendtoContentJS({ textSetting: 'Sentence' });
      });
    }
  });



  /* 
   * storageGetHelper is used to check the current setting for type of text
   *   - checking chrome storage is asynchronous - which creates the need for the structure seen
   *   - sets value and sends value if nothing is stored yet, otherwise asjusts value to stored
   *   - allow for persisting settings after popup is closed
   */
  storageGetHelper('textSetting').then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      if (value.textSetting === 'Sentence') {
        /// tell content js to make sentence level changesw
        sendtoContentJS({ textSetting: 'Sentence' });
        textSettingNode.value = 2;
      } else if (value.textSetting === 'Word') {
        sendtoContentJS({ textSetting: 'Word' });
        textSettingNode.value = 1;
        /// i want to signal that content js has to make word level changes to do
      }
    } else {
      chrome.storage.sync.set({ 'textSetting': 'Word' }, function () {
        // Notify that we saved.
        console.log('textSetting value init saved');
      });
      textSettingNode.value = 1;
      sendtoContentJS({ textSetting: 'Word' });
    }
  })

  /* 
   * storageGetHelper is used to check the current setting for type of highlight
   *   - checking chrome storage is asynchronous - which creates the need for the structure seen
   *   - if stored value is true, sets highlight to true
   *   - allow for persisting settings after popup is closed
   */
  storageGetHelper('highlight').then(function (value) {
    if (value.highlight === true) {
      console.log("setting to true");
      checkbox.checked = true;
      checkRecord = true;
    }
  })


  /* 
   * Given checkbox present, listener for: setting checkbox value and storing in chrome.storage.sync
   * send message to background through chrome.runtime - to signal highlight on
   */
  if (checkbox) {

    checkbox.addEventListener('change', async function () {
      if (checkbox.checked && checkRecord === false) {

        chrome.runtime.sendMessage({ highlight: "True" });
        checkRecord = true;

        chrome.storage.sync.set({ 'highlight': true }, function () {
          // Notify that we saved.
          console.log('highlight on setting value saved');
        });

      } else if (checkbox.checked === false && checkRecord === true) {
        chrome.runtime.sendMessage({ highlight: "False" });
        checkRecord = false;
        chrome.storage.sync.set({ 'highlight': false }, function () {
          // Notify that we saved.
          console.log('highlight off setting value saved');
        });
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
      })
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
