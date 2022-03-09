// popup.js - define behavior for the popup/user interface

document.addEventListener("DOMContentLoaded", function (event) {
  const checkbox = document.getElementById("togBtn");
  const highlightReplacedBtn = document.getElementById("highlightReplacedBtn");

  wordReplacementDisabled = false;

  /* Capture input for simplification type slider
   */
  simpSettingNode = document.getElementById("simpTypeInput");
  simpSettingValues = ["lexical", "syntactic_and_lexical", "syntactic"];
  simpSettingNode.addEventListener("input", function () {
    simpSetting = simpSettingValues[this.value - 1]
    chrome.storage.sync.set({ simpSetting: simpSetting}, function () {
      sendtoContentJS({
        simpSetting: simpSetting,
        settingType: "simpType"
      });
    });
    toggleWordReplacement(simpSetting != "lexical");
    updateTextSetting();
  });

  /* Capture input for textSetting slider
   *   - listener open to any change of textSettingSlider
   *   - sends selected setting to content.js for appropriate changes to be made
   */

  textSettingNode = document.getElementById("textSettingInput");
  textSettingValues = ["Word", "Sentence", "Paragraph", "Document"];
  textSettingNode.addEventListener("input", updateTextSetting);

  function updateTextSetting() {
    if (textSettingNode.value == 1 && wordReplacementDisabled) {
      textSettingNode.value++;
    }
    textSetting = textSettingValues[textSettingNode.value - 1];
    chrome.storage.sync.set({ textSetting: textSetting}, function () {
      sendtoContentJS({
        textSetting: textSetting,
        settingType: "howMuch"
      });
    })
  }

  /* Capture input for where? slider
   */
  whereToSettingNode = document.getElementById("whereTo");
  whereToSettingValues = ["InPlace", "Popup", "Side"];
  whereToSettingNode.addEventListener("input", function () {
    whereToSetting = whereToSettingValues[this.value - 1]
    chrome.storage.sync.set({ whereToSetting: whereToSetting}, function () {
      sendtoContentJS({
        whereToSetting: whereToSetting,
        settingType: "whereTo"
      });
    });
    toggleHighlightReplacement(whereToSetting != "InPlace");
  });

  /* Capture input for how long?
   */
  howLongSettingNode = document.getElementById("showDuration");
  howLongSettingValues = ["Temporary", "UntilClick", "Permanent"];
  howLongSettingNode.addEventListener("input", function () {
    howLongSetting = howLongSettingValues[this.value - 1]
    chrome.storage.sync.set({ howLongSetting: howLongSetting}, function () {
      sendtoContentJS({
        howLongSetting: howLongSetting,
        settingType: "howLong"
      });
    });
  });

  /*
   * storageGetHelper is used to check the current setting
   *   - checking chrome storage is asynchronous - which creates the need for the structure seen
   *   - sets value and sends value if nothing is stored yet, otherwise asjusts value to stored
   *   - allow for persisting settings after popup is closed
   */
  storageGetHelper("simpSetting").then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      simpSettingNode.value = simpSettingValues.indexOf(value.simpSetting) + 1;
    } else {
      chrome.storage.sync.set({ simpSetting: "lexical" });
      simpSettingNode.value = 1;
    }
    toggleWordReplacement(simpSettingNode.value !== "1");
  });

  storageGetHelper("textSetting").then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      console.log("resetting to ", value.textSetting)
      textSettingNode.value = textSettingValues.indexOf(value.textSetting) + 1;
    } else {
      console.log("this is running, too");
      chrome.storage.sync.set({ textSetting: "Word" });
      textSettingNode.value = 1;
    }
  });

  storageGetHelper("whereToSetting").then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      if (value.whereToSetting === "InPlace") {
        whereToSettingNode.value = 1;
      } else if (value.whereToSetting === "Popup") {
        whereToSettingNode.value = 2;
      } else if (value.whereToSetting === "Side") {
        whereToSettingNode.value = 3;
      }
    } else {
      chrome.storage.sync.set({ whereToSetting: "InPlace" });
      whereToSettingNode.value = 1;
    }
  });

  storageGetHelper("howLongSetting").then(function (value) {
    if (!(Object.keys(value).length === 0)) {
      if (value.howLongSetting === "Temporary") {
        howLongSettingNode.value = 1;
      } else if (value.howLongSetting === "UntilClick") {
        howLongSettingNode.value = 2;
      } else if (value.howLongSetting === "Permanent") {
        howLongSettingNode.value = 3;
      }
    } else {
      chrome.storage.sync.set({ howLongSetting: "Temporary" });
      howLongSettingNode.value = 1;
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
      checkbox.checked = true;
    }
  });

  storageGetHelper("highlightReplaced").then(function (value) {
    if (value.highlightReplaced === true) {
      highlightReplacedBtn.checked = true;
    }
    toggleHighlightReplacement(whereToSettingNode.value !== "1");
  });

  /*
   * Given checkbox present, listener for: setting checkbox value and storing in chrome.storage.sync
   * send message to background through chrome.runtime - to signal highlight on
   */
  if (checkbox) {
    checkbox.addEventListener("change", async function () {
      if (checkbox.checked) {
        chrome.runtime.sendMessage({
          highlight: true,
          settingType: "highlightComplex",
        });
        chrome.storage.sync.set({ highlight: true });
      } else if (checkbox.checked === false) {
        chrome.runtime.sendMessage({
          highlight: false,
          settingType: "highlightComplex",
        });
        chrome.storage.sync.set({ highlight: false });
      }
    });
  }

  /*
   * Given checkbox present, listener for: setting checkbox value and storing in chrome.storage.sync
   * send message to background through chrome.runtime - to signal highlight on
   */
  if (highlightReplacedBtn) {
    highlightReplacedBtn.addEventListener("change", async function () {
      if (highlightReplacedBtn.checked) {
        console.log("true clicked");
        chrome.runtime.sendMessage({
          highlightReplaced: true,
          settingType: "highlightReplaced",
        });
        chrome.storage.sync.set({ highlightReplaced: true });
      } else if (highlightReplacedBtn.checked === false) {
        console.log("fasle clicked");
        chrome.runtime.sendMessage({
          highlightReplaced: false,
          settingType: "highlightReplaced",
        });
        chrome.storage.sync.set({ highlightReplaced: false });
      }
    });
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

  function toggleHighlightReplacement(disabled) {
    highlightReplacedBtn.disabled = disabled;
    highlightReplaced = document.getElementById("highlightReplaced");
    highlightReplaced.classList.toggle("disabled",disabled);
  }

  function toggleWordReplacement(disabled) {
    wordsSetting = document.getElementById("wordsSetting");
    wordsSetting.classList.toggle("disabled",disabled);
    wordReplacementDisabled = disabled;
  }
});
