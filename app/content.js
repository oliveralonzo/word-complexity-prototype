// content.js - modification and behaviors for active tab page

// construct list for id-text association
var sentenceIDNum = 0;

var currTabSentences = {};

var originalSentences = {};

// Replacement values
var replacedSentences = null;

// Extension settings
var simpSetting = "lexical";
var howMuchSetting = "Word";
var highlightComplexToggle = false;
var whereToSetting = "InPlace";
var howLongSetting = "Temporary";
var confidenceSetting = "No";
var highlightReplacedToggle = false;

let USE_PRESET = true;
let FIREBASE_URL = '';

var PRESET_VALUES = {
  "lexical": {
    "howMuchSetting": "Word",
    "highlight": true,
    "whereToSetting": "Popup",
    "howLongSetting": "UntilClick",
    "highlightReplaced": true
  },
  "syntactic_and_lexical": {
    "howMuchSetting": "Sentence",
    "highlight": true,
    "whereToSetting": "InPlace",
    "howLongSetting": "UntilClick",
    "highlightReplaced": true
  },
  "syntactic": {
    "howMuchSetting": "Sentence",
    "highlight": true,
    "whereToSetting": "InPlace",
    "howLongSetting": "UntilClick",
    "highlightReplaced": true
  }
}

// Check if any user data exists. If it does, set the variables that store the extension setting.
chrome.storage.sync.get("simpSetting", (status) => {
  if (Object.keys(status).length > 0 && status.simpSetting !== null) {
    switchSimpSetting(status);
  }
});

if (!USE_PRESET) {
  chrome.storage.sync.get("whereToSetting", (status) => {
    if (Object.keys(status).length > 0 && status.whereToSetting !== null) {
      whereToSetting = status.whereToSetting;
    }
  });

  chrome.storage.sync.get("howLongSetting", (status) => {
    if (Object.keys(status).length > 0 && status.howLongSetting !== null) {
      howLongSetting = status.howLongSetting;
    }
  });

  chrome.storage.sync.get("howMuchSetting", (status) => {
    if (Object.keys(status).length > 0 && status.howMuchSetting !== null) {
      howMuchSetting = status.howMuchSetting;
    }
  });

  chrome.storage.sync.get("highlight", (status) => {
    if (Object.keys(status).length > 0 && status.highlight !== null) {
      highlightComplexToggle = status.highlight;
    }
    toggleHighlightComplex({
      settingType: "highlightComplex",
      highlight: highlightComplexToggle,
    });
  });

  chrome.storage.sync.get("highlightReplaced", (status) => {
    if (Object.keys(status).length > 0 && status.highlightReplaced !== null) {
      highlightReplacedToggle = status.highlightReplaced;
    }
    toggleHighlightReplaced({
      settingType: "highlightReplaced",
      highlightReplaced: highlightReplacedToggle,
    });
  });
}

var idx = 0; // used for id index of words


// Identify page main content
const mainContent = identifyPageMainContent();
mainContent.classList.add("document");
mainContent.setAttribute("id", "document0");

// Get all paragraphs within the main content of the page
const paragraphs = document.querySelectorAll(".document p");

for (var i = 0; i < paragraphs.length; i++) {
  let currElement = paragraphs[i];
  currElement.classList.add("paragraph");
  currElement.setAttribute("id", `paragraph${i}`)
  collectText(currElement);
}

document.querySelectorAll('[id*="sentence"]').forEach(function(sentence) {
  originalSentences[sentence.id] = sentence.innerHTML;
});

// send message to background.js with collected complex words, sentences etc
chrome.runtime.sendMessage({
  wordUpdate: "True",
  toSimplifySentence: currTabSentences
});

window.addEventListener("load", function load(event) {
  window.removeEventListener("load", load, false); //remove listener, no longer needed
}, false);


/*
 * Listen to the settings being changed on extension. Depending on the type of setting,
 * appropriate actions are taken. The setting types are - "How Much", "Where",
 * "Highlight Complex", "How Long", "Display Confidence"
 */
chrome.runtime.onMessage.addListener(function(request) {
  switch (request.settingType) {
    case "simpType":
      switchSimpSetting(request);
      break;
    case "howMuch":
      switchHowMuchSetting(request);
      break;
    case "highlightComplex":
      toggleHighlightComplex(request);
      break;
    case "whereTo":
      switchWhereToSetting(request);
      break;
    case "highlightReplaced":
      toggleHighlightReplaced(request);
      break;
    case "howLong":
      switchHowLongSetting(request);
      break;
    case "displayConfidence":
      console.log(
        "Display Confidence selected! Functionality yet to be implemented"
      );
      break;
  }
});

/*
 * Listener to pull in simplified words
 * expects {type: "InPlace", sentenceStart: stringified list of new words, textType: "word"/"sentence"/etc}
 * set complexWordGroup, complexSentencesGroup to appropriate element groups
 */
chrome.runtime.onMessage.addListener(function(request) {
  if (request.type === "simplifiedText") {
    if (request.textType === "sentence") {
      replacedSentences = JSON.parse(request.toChange);
      replacedSentences.forEach(sentence => {
        sentence.text = JSON.parse(sentence.text);
      });

      markupComplexWords();
      markupComplexText();
    }
  }
});

/*
 * Wrapper function to revert swapped/replaced/simplified text to original text
 */
function revertContentToOriginal() {
  const currSentences = document.querySelectorAll('[id*="sentence"]');
  currSentences.forEach(function(sentence) {
    sentence.classList.remove("complex-sentence");
    sentence.innerHTML = originalSentences[sentence.id];
  });
}

function toggleListeners(todo) {
  const className = ".complex-" + howMuchSetting.toLowerCase();
  document.querySelectorAll(className).forEach(function(element) {
    let events = [];
    if (howLongSetting == "Temporary") {
      events.push("mouseenter", "mouseleave");
    } else {
      events.push("click");
    }
    events.forEach(function(evt) {
      if (todo === "add") {
        element.addEventListener(evt, toggleReplacement);
        element.classList.add("clickable-pointer");
      } else if (todo === "remove") {
        element.removeEventListener(evt, toggleReplacement);
        element.classList.remove("clickable-pointer");
      }
    });
  });
}

function getSideTipContentEl(text) {
  const dialogContent = createNode("div", "", "modal1-content")
  dialogContent.setAttribute("data-text", text);

  if (howLongSetting == "UntilClick") {
    const closeButton = createNode("span", "", "close");
    closeButton.addEventListener("click", closeSideTip);
    dialogContent.appendChild(closeButton);
  }

  splitTextIntoNodes(text, dialogContent);

  return dialogContent;
}

function toggleSideTipHighlights(highlight, sideTip = null) {
  const textEl = getSideTipText(sideTip);
  const className = "highlight-mapped";
  if (highlight) {
    textEl.classList.add(className);
  } else {
    textEl.classList.remove(className);
  }
};

function getSideTipText(sideTip) {
  const textID = sideTip.id.replace("sidetip-", "");
  return document.getElementById(textID);
}

const closeSideTip = function(event) {
  removeSideTips(event.currentTarget.parentNode.parentNode);
};

function switchingSetting(resetHighlights = false) {
  removePopups();
  removeSideTips();
  toggleListeners("remove");
  toggleSwappedClass(false);
  if (resetHighlights) {
    toggleHighlights(false, "complex");
    toggleHighlights(false, "simple");
  }
}

/**
 * Changes the value of "Simplification" setting. Removes all the
 * configurations of previous setting and reverts any changes
 * to original. Adds listeners for the new setting.
 * @param {Object}  request   Specifies the value of howLongSetting.
 *                            Values could be Temporary, UntilClick,
 *                            Permanent.
 *
 */

function switchSimpSetting(request) {
  let prevSimpSetting = simpSetting;
  switchingSetting(resetHighlights = true);
  simpSetting = request.simpSetting;
  if (USE_PRESET) switchToPreset(PRESET_VALUES[simpSetting]);
  toggleHighlights(highlightComplexToggle, "complex");
  toggleHighlights(highlightReplacedToggle, "simple");
  markupComplexText();
  logChange("switching simp setting", prevSimpSetting, simpSetting)
}

function switchToPreset(settings) {
  switchHowMuchSetting(settings);
  toggleHighlightComplex(settings);
  switchWhereToSetting(settings);
  toggleHighlightReplaced(settings);
  switchHowLongSetting(settings);
}

/**
 * Changes the value of "How much" setting. Removes all the
 * configurations of previous setting and reverts any changes
 * to original. Adds listeners for the new setting.
 * @param {Object}  request   Specifies the value of howMuchSetting.
 *                            Values are Words, Sentence, Paragraphs,
 *                            Document
 */

function switchHowMuchSetting(request) {
  switchingSetting();
  howMuchSetting = request.howMuchSetting;
  markupComplexText();
}

/**
 * Changes the value of "How long" setting. Removes all the
 * configurations of previous setting and reverts any changes
 * to original. Adds listeners for the new setting.
 * @param {Object}  request   Specifies the value of howLongSetting.
 *                            Values could be Temporary, UntilClick,
 *                            Permanent.
 *
 */

function switchHowLongSetting(request) {
  switchingSetting();
  howLongSetting = request.howLongSetting;
  markupComplexText();
}

/*
* Adds or removes highlight to/from complex texts based on request
*  - if highlight true
        - Add highlight class to words/sentences/paragraphs/Document
*  - if highlight false
*       - remove highlight class from words/sentences/paragraphs/Document
*/
function toggleHighlightComplex(request) {
  if (request.highlight === true) {
    chrome.storage.sync.set({
      highlight: true
    });
    highlightComplexToggle = true;
  } else {
    chrome.storage.sync.set({
      highlight: false
    });
    highlightComplexToggle = false;
  }
  toggleHighlights(highlightComplexToggle, "complex");
}

/**
 * Adds or removes highlight to/from simplified text based on request
 *  - if highlightReplaced true
 *      - Add yellow highlight to the text
 *  - if highlightReplaced false
 */

function toggleHighlightReplaced(request) {
  if (request.highlightReplaced === true) {
    chrome.storage.sync.set({
      highlightReplaced: true
    });
    highlightReplacedToggle = true;
  } else {
    chrome.storage.sync.set({
      highlightReplaced: false
    });
    highlightReplacedToggle = false;
  }
  toggleHighlights(highlightReplacedToggle, "simple");
}

/**
 * Changes the value of "Where" setting. Removes all the
 * configurations of previous setting and reverts any changes
 * to original. Adds listeners for the new setting.
 * @param {Object}  request   Specifies the value of whereToSetting.
 *                            Values could be InPlace, Popup, Side.
 *
 */

function switchWhereToSetting(request) {
  switchingSetting(resetHighlights = true);
  whereToSetting = request.whereToSetting;
  toggleHighlights(highlightComplexToggle, "complex");
  toggleHighlights(highlightReplacedToggle, "simple");
  markupComplexText();
}

function removePopups() {
  document.querySelectorAll(".tooltip1").forEach(function(a) {
    a.remove();
  });
}

function toggleHighlights(highlight, type) {
  const body = document.querySelector("body");
  const highlightClass = getHighighlightClass(type);
  if (highlight) {
    body.classList.add(highlightClass);
  } else {
    body.classList.remove(highlightClass);
  }
}

function getHighighlightClass(type) {
  const highlightType = simpSetting == "lexical" ? "words" : "sentences"
  return "highlight-" + type + "-" + highlightType;
}

/*
 *  Identifies main textual content of the webpage. Starting from the body tag,
 *  recursively explores child nodes to coverge at a node (DIV tag) that has maximum
 *  number of p tag or TEXT_NODES having valid sentences. In this case, valid
 *  sentence is any sentence that has punctuations and spaces
 */
function identifyPageMainContent() {
  node = document.body;
  let queue = [node];
  let mainDiv = node;
  let maxMainCandiates = 0;

  while (queue.length > 0) {
    let currNode = queue.pop();
    let childNodes = currNode.childNodes;
    let candidateCount = 0;
    Array.from(childNodes).forEach((child) => {
      if (isMainContentCandidate(child)) {
        candidateCount += 1;
      } else {
        if (child.tagName === "DIV") {
          queue.unshift(child);
        }
      }
    });
    if (candidateCount > maxMainCandiates) {
      mainDiv = currNode;
      maxMainCandiates = candidateCount;
    }
  }

  while (getMainContentCandidateSiblings(mainDiv).length > 0) {
    mainDiv = mainDiv.parentNode;
  }
  return mainDiv;
}

function isMainContentCandidate(node) {
  if (node.tagName === "P" || node.nodeType === Node.TEXT_NODE) {
    let re = /[\.,"\-\!;`:\?']/;
    if (re.test(node.innerText)) {
      return true;
    }
  } else if (node.tagName === "DIV") {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        let re = /[\.,"\-\!;`:\?']/;
        if (re.test(child.innerHTML)) {
          return true;
        }
      }
    });
  }
  return false;
}

function getMainContentCandidateSiblings(node) {
  let siblings = [];
  // if no parent, return no sibling
  if (!node.parentNode) {
    return siblings;
  }
  // first child of the parent node
  let sibling = node.parentNode.firstChild;

  // collecting siblings
  while (sibling) {
    if (sibling !== node) {
      if (isMainContentCandidate(sibling)) {
        siblings.push(sibling);
      }
    }
    sibling = sibling.nextSibling;
  }
  return siblings;
}

function getSwappedClassName() {
  return `swapped-${whereToSetting.toLowerCase()}`;
}

function toggleSwappedClass(swapped, el = null) {
  const swappedClass = getSwappedClassName();
  if (el) {
    el.classList.toggle(swappedClass, swapped);
  } else {
    const swappedElements = document.getElementsByClassName(swappedClass);
    Array.from(swappedElements).forEach((el) => {
      el.classList.toggle(swappedClass, swapped);
    });
  }
}

function toggleReplacement(evt) {
  eventType = evt.type;
  eventX = evt.clientX;
  eventY = evt.clientY;

  // Check the name of these variables, not quite capturing what's happening
  // When undoing, currentNode will have the value of the replacement
  node = evt.currentTarget;

  const tooltips = node.querySelectorAll(".tooltip1");
  const sidetip = document.querySelector(`#sidetip-${node.id}`);
  const swapped = node.classList.contains(getSwappedClassName());

  if (howLongSetting == "Permanent" && swapped) {
    bringTooltipToFront(node, tooltips);
    return;
  }

  if (swapped && eventType != "mouseenter") {
    let replacement = node.querySelector(".replacement").innerText;
    console.log(replacement);
    switch (whereToSetting) {
      case "InPlace":
        removeInPlace(node, evt);
        break;
      case "Popup":
        removeToolTips(tooltips);
        break;
      case "Side":
        removeSideTips(sidetip);
        break;
    }

    toggleSwappedClass(false, node);

    logChange("undoing", node.innerText, replacement, eventX, eventY);
    return;
  }

  let replacement = null;
  const currText = node.innerText;

  if (node.classList.contains("complex-word")) {
    var parentID = node.parentElement.id;
    var simple = replacedSentences.find(({
      sentenceID
    }) => sentenceID === parentID);

    replacement = simple.text["words"][currText];

  } else if (node.classList.contains("complex-sentence")) {
    if (simpSetting == "lexical" && whereToSetting == "InPlace") {
      setChildrenToOtherText(node);
    } else {
      var id = node.id;
      var simple = replacedSentences.find(({
        sentenceID
      }) => sentenceID === id);

      replacement = simple.text[simpSetting];

      if (replacement != "") {
        if (howMuchSetting != "Sentence" && whereToSetting != "InPlace") {
          return replacement + " ";
        }
      }
    }
  } else if (node.classList.contains("complex-paragraph") || node.classList.contains("complex-document")) {
    if (whereToSetting == "InPlace") {
      removeClickablePointerWhenPermanent(node);
      setChildrenToOtherText(node);
    } else {
      replacement = "";
      replacement += setChildrenToOtherText(node);
      if (howMuchSetting == "Document" && node.classList.contains("complex-paragraph")) {
        return replacement + "\n";
      }
    }
  } else if (node.classList.contains("sentence")) {
    return node.innerText + " ";
  }

  if (replacement && eventType != "mouseleave") {
    let original = node.innerText;

    switch (whereToSetting) {
      case "InPlace":
        replaceInPlace(node, replacement, evt);
        removeClickablePointerWhenPermanent(node);
        break;
      case "Popup":
        showToolTip(node, replacement);
        break;
      case "Side":
        showSideTip(node, replacement);
        break;
    }

    toggleSwappedClass(true, node);
    logChange("simplifying", original, replacement, eventX, eventY);
  }
}

async function logChange(type, old = null, updated = null, x = null, y = null) {
  var dataToLog = {
    "article_title": window.location.href,
    "current_setting": simpSetting,
    "type": type,
    "timestamp": Date.now
  }

  if (type == "simplifying" || type == "undoing") {
    dataToLog.complex = old;
    dataToLog.replacement = updated;
    dataToLog.coordinates = {
      "x": x,
      "y": y
    }
  } else if (type.includes("switching")) {
    dataToLog.from = old;
    dataToLog.to = updated;
  }

  fetch(FIREBASE_URL.replace("{path}", "/" + getParticipant() + "/interactions"),{
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(dataToLog)
  }).
  then(response=>response.json())
  .then(data=>console.log(data));
}

function getParticipant() {
  let url  = window.location.search;
  let urlParams = new URLSearchParams(url);
  let participant = urlParams.get('participant');
  console.log(participant);
  return participant ? participant : "";
}



function setChildrenToOtherText(node) {
  let replacement = "";
  const childrenClassNames = {
    "complex-document": ".complex-paragraph",
    "complex-paragraph": ".sentence",
    "complex-sentence": ".complex-word",
  };

  let childrenClassName;

  for (let [parent, child] of Object.entries(childrenClassNames)) {
    if (node.classList.contains(parent)) {
      childrenClassName = child;
      break;
    }
  }

  Array.from(node.querySelectorAll(childrenClassName)).forEach(function(child) {
    replacement += toggleReplacement(child);
  });

  return replacement;
}

function removeClickablePointerWhenPermanent(node) {
  if (howLongSetting == "Permanent") {
    let currNode = node;
    while (!currNode.classList.contains("clickable-pointer")) {
      if (currNode.parentNode) {
        currNode = currNode.parentNode;
        break;
      } else {
        return;
      }
    }
    currNode.classList.remove("clickable-pointer");
  }
}

function replaceInPlace(node, replacement, evt = null) {
  if (!node.getAttribute("original")) {
    node.setAttribute("original", node.innerHTML);
  }

  if (howLongSetting == "Temporary") {
    if (node.classList.contains("complex-word")) {
      const originalWidth = node.offsetWidth;
      let replacementSpan = createNode("span", replacement, "replacement");
      replaceHTML(node, replacementSpan);

      const newWidth = node.offsetWidth;

      let paddingSpan = createNode("span", "", "padding-span");
      const padding = originalWidth > newWidth ? originalWidth - node.offsetWidth : 0;
      paddingSpan.style["padding-right"] = padding / 2 + "px";
      node.prepend(paddingSpan);
      node.appendChild(paddingSpan.cloneNode());
    } else {
      node.innerHTML = replacement;
      let id = howMuchSetting == "Sentence" ? node.id : howMuchSetting == "Paragraph" ? node.parentNode.id : "document0";
      setTimeout(function() {
        if (!idIsHovered(id)) {
          removeInPlace(node, evt);
          toggleSwappedClass(false, node);
        };
      }, 1);
    }
  } else {
    let replacementSpan = createNode("span", replacement, "replacement");
    replaceHTML(node, replacementSpan);
  }
}

function idIsHovered(id) {
  return $("#" + id + ":hover").length > 0;
}

function createNode(type, content, className = null) {
  let newSpan = document.createElement(type);
  if (content.innerHTML) {
    newSpan.appendChild(content);
  } else {
    newSpan.innerHTML = content;
  }

  if (className) {
    newSpan.classList.add(className);
  }
  return newSpan;
}

function replaceHTML(node, replacement) {
  node.innerHTML = "";
  if (typeof(replacement) == "object") {
    node.appendChild(replacement);
  } else {
    node.innerHTML = replacement;
  }
}

function isParent(refNode, otherNode) {
  var parent = otherNode.parentNode;
  do {
    if (refNode == parent) {
      return true;
    } else {
      parent = parent.parentNode;
    }
  } while (parent);
  return false;
}

function splitTextIntoNodes(text, wrapper) {
  const br = createNode("br", "");

  text.split("\n").forEach(function(t, i, all) {
    const newNode = createNode("span", t);
    if (i != all.length - 1) {
      newNode.append(br.cloneNode(), br.cloneNode());
    }
    wrapper.appendChild(newNode);
  })
}

const showToolTip = function(node, replacement) {
  if (howLongSetting != "Permanent") {
    removeToolTips();
  }

  const id = node.id;
  const tooltipWrap = document.createElement("div");
  splitTextIntoNodes(replacement, tooltipWrap);

  tooltipWrap.classList.add("tooltip1");
  tooltipWrap.classList.add("replacement");
  tooltipWrap.id = "Popup" + id;

  node.insertBefore(tooltipWrap, node.firstChild);
  bringTooltipToFront(node, [tooltipWrap]);
};

function bringTooltipToFront(node, tooltips) {
  // In case it's permanent and there are tooltips, bring the tooltip to the front...
  Array.from(node.parentNode.querySelectorAll(".tooltip1")).forEach(function(otherTooltip) {
    otherTooltip.style.zIndex = 2;
  });
  // and set the rest of the tooltips behind
  Array.from(tooltips).forEach(function(currTooltip) {
    currTooltip.style.zIndex = 3;
  });
}


const showSideTip = function(node, replacement) {
  let id = node.id;

  // Create a dialog box - this box contains "content" and "header".
  // Header contains the heading and close button
  const dialogBox = document.createElement("div");
  if (replacement) {
    const dialogContent = getSideTipContentEl(replacement);

    dialogBox.appendChild(dialogContent);

    dialogBox.setAttribute("id", `sidetip-${id}`);
    dialogBox.addEventListener("mouseenter", (event) => toggleSideTipHighlights(true, event.currentTarget));
    dialogBox.addEventListener("mouseleave", (event) => toggleSideTipHighlights(false, event.currentTarget));

    dialogBox.classList.add("modal1");
    dialogBox.classList.add("highlight");

    let modalContainer = document.getElementById("modal1-container");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.setAttribute("id", "modal1-container");
      modalContainer.appendChild(dialogBox);
      document.body.insertBefore(modalContainer, document.body.firstChild);
    } else {
      modalContainer.insertBefore(dialogBox, modalContainer.firstChild);
    }

    [...modalContainer.children]
    .sort((a, b) => a.id.localeCompare(b.id, undefined, {
        numeric: true,
        sensitivity: 'base'
      }))
      .forEach(node => modalContainer.appendChild(node));

    node.addEventListener("mouseenter", (event) => dialogBox.classList.add("highlight"));
    node.addEventListener("mouseleave", (event) => dialogBox.classList.remove("highlight"));

  } else {
    alert("Error: A simplification wasn't found for this.")
  }
};

function removeInPlace(node, evt) {
  if (howLongSetting == "Temporary" && howMuchSetting != "Word") {
    let original = makeCleanText(node.getAttribute("original"));
    node.innerHTML = original;
  } else {
    node.innerHTML = node.getAttribute("original");
  }
}

function removeToolTips(tooltips = null) {
  if (!tooltips) {
    tooltips = document.querySelectorAll(".tooltip1");
  }

  Array.from(tooltips).forEach(function(tooltip) {
    toggleSwappedClass(false, tooltip.parentNode);
    tooltip.remove();
  });
}

function removeSideTips(sideTip = null) {
  if (sideTip) {
    toggleSideTipHighlights(false, sideTip);
    toggleSwappedClass(false, getSideTipText(sideTip));
    sideTip.remove();
  } else {
    const container = document.querySelector("#modal1-container")
    if (container) {
      container.remove();
    }
  }
};

/* helper function to identify words with length above 6 - identify complex words
 * increase index for IDs
 * add span with id and highlight class for
 */
function identifyWords(word, index) {

  // remove anything from the word that isn't purely the text itself - for instance, "<b>word</b>" should become "word"
  let cleanWord = word.replace(/\<(.*?)\>/g, "");
  // cleanWord = cleanWord.replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g,"");

  matchInd = word.indexOf(cleanWord);

  if (cleanWord === "") {
    return word;
  }

  if (!cleanWord.includes("http")) {
    let id = "word" + index;
    complexTagged = `<span id=${id}>${cleanWord}</span>`;
    freshHTML =
      word.substring(0, matchInd) +
      complexTagged +
      word.substring(matchInd + cleanWord.length, word.length);
    ++idx;
    return freshHTML;
  } else {
    return word;
  }
}

/*
* Identify complex sentences within document
*  - complex - list of text items from document that have been separated by a space
*  - This function builds up the sentence variable, checks if a valid ending is seen,
        then will add that sentence to the final set if the sentence is complex enough
*  - current complexity check is number of complex words - likely to be replaced with sending off each sentence to an API potentially
*/
function identifySentences(words) {
  const abbreviationsToAvoid = ["Dr.", "Mr.", "Mrs.", "Ms.", "No.", "Ph.D."];

  var sentenceEndIndices = [];

  // get indices for any text that includes a ending character ---> [? . !]
  words.forEach(function(word, index) {
    const cleanWord = makeCleanText(word);
    var re = '(.[.?!])|([.?!]\")';
    let match = cleanWord.slice(-2).match(re) && !abbreviationsToAvoid.includes(cleanWord);
    if (match && cleanWord.length > 2) {
      sentenceEndIndices.push(index);
    }
  });

  var currEndInd = 0;
  var sentenceStart = {};
  var complexCount = 0;
  var nextTextInd = 0;
  var sentence = [];
  var id = null;

  // loop over words list
  words.forEach(function(text, index) {
    sentence.push(text);

    if (index === 0) {
      // With the very first item in complex, create a modified start, with an id and a beginning span
      let id = "sentence" + sentenceIDNum;
      sentenceStart[0] = "<span class=\"sentence\" id=" + id + ">" + text;
      sentenceIDNum++;
    } else if (index === sentenceEndIndices[currEndInd]) {
      // create this sentence, as it qualifies + modify current text to add span
      this[index] = text + "</span>";
      currEndInd++;
      startVals = Object.entries(sentenceStart)[0];
      this[startVals[0]] = startVals[1];

      let cleanSentence = makeCleanText(sentence.join(" "));
      cleanSentence = cleanSentence.replace(/\s+/g, " ");

      let id = "sentence" + (sentenceIDNum - 1);
      currTabSentences[id] = cleanSentence;

      sentenceStart = {};
      nextTextInd = index + 1;
      if (this[nextTextInd] != null) {
        id = "sentence" + (sentenceIDNum);
        sentenceStart[nextTextInd] =
          "<span class=\"sentence\" id=" + id + "> " + this[nextTextInd];
        sentenceIDNum++;
      }

      sentence = [];
    }

  }, words);
}

function makeCleanText(text) {
  var htmlToCleanObject = document.createElement("div");
  htmlToCleanObject.innerHTML = text;
  let cleanText = htmlToCleanObject.innerText;
  htmlToCleanObject.remove();
  return cleanText;
}

function markupComplexWords(word, index) {
  const sentences = document.querySelectorAll('[id*="sentence"]');
  sentences.forEach(function(sentence) {
    try {
      let replacements = replacedSentences.find(({
        sentenceID
      }) => sentenceID === sentence.id).text;
      let replacement_words = replacements["words"];

      Array.from(sentence.children).forEach(function(child) {
        try {
          const word = child.innerText;
          let replacement_word = replacement_words[word]
          if (replacement_word) {
            child.classList.add("complex-word");
          }
        } catch {
          return;
        }

      });

    } catch {
      return;
    }
  });

  postMarkUpText();
}

function markupComplexText(revertToOriginal = true) {
  if (revertToOriginal) {
    revertContentToOriginal();
  }
  const sentences = document.querySelectorAll('[id*="sentence"]');

  sentences.forEach(function(sentence) {
    try {
      let replacements = replacedSentences.find(({
        sentenceID
      }) => sentenceID === sentence.id).text;
      let replacement_sentences = replacements[simpSetting];
      let replacement_words = replacements["words"];

      if (typeof(replacement_sentences) === "object" && Object.keys(replacement_sentences).length === 0) {
        return;
      } else if (replacement_sentences) {
        sentence.classList.add("complex-sentence");
        sentence.closest("p").classList.add("complex-paragraph");
        document.querySelector(".document").classList.add("complex-document");
      }

      Array.from(sentence.children).forEach(function(child) {
        try {
          const word = child.innerText;
          let replacement_word = replacement_words[word]
          if (replacement_word) {
            child.classList.add("complex-word");
          }
        } catch {
          return;
        }

      });

    } catch {
      return;
    }
  });

  postMarkUpText();
}

function postMarkUpText() {
  let difference = parseInt($(".sentence").css("line-height")) - parseInt($(".sentence").css("font-size"));
  let padding = Math.ceil(difference / 4);
  $(".sentence").css("padding-bottom", padding);
  $(".sentence").css("padding-top", padding);

  toggleListeners("add");
  toggleHighlightComplex({
    settingType: "highlightComplex",
    highlight: highlightComplexToggle,
  });
}


function collectText(node) {
  if (node.parentNode && node.parentNode.nodeName === "TEXTAREA") {
    return;
  }

  let currText;
  if (node.childNodes.length == 1) {
    currText = node.innerHTML.split(" ");
  } else {
    // Document this clearly because it is confusing, maybe abstract it out into a function
    currText = [];
    Array.from(node.childNodes).forEach((child, i) => {
      let childText;
      if (child.outerHTML) {
        childText = [];

        let tags = child.outerHTML.match(/\<(.*?)\>/g);
        let innerText = child.innerText.split(" ");
        childText.push(...tags, ...innerText);

        childText.sort(function(a, b) {
          return child.outerHTML.indexOf(a) - child.outerHTML.indexOf(b);
        });
      } else {
        childText = child.textContent.split(" ");
      }
      currText.push(...childText);
    });

    currText.forEach((child, i) => {
      // document all these conditions, looking for a single punctuation mark separated
      // from its original text by a tag
      if (child.length == 1 && child.match(/[\.,\?\!]/g) && !isTag(child)) {
        let stepBack = 1;
        while (isTag(currText[i - stepBack])) {
          stepBack++;
          if (i - stepBack < 0) {
            break;
          }
        }
        currText[i - stepBack] = currText[i - stepBack] + currText[i];
        currText.splice(i, 1);
      }
    });
  }


  var words = currText.map((word) => {
    let wordsWithID = identifyWords(word, idx);
    return wordsWithID;
  });

  identifySentences(words);

  node.innerHTML = words.join(" ");
}

function isTag(el) {
  return el.match(/\<(.*?)\>/g);
}
