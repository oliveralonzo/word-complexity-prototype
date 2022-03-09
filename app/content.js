// content.js - modification and behaviors for active tab page

// construct list for id-text association
const complexText = {
  currTabWords: {},
  currTabSentences: {},
  currTabParagraphs: {},
  currTabDocumentParagraphs: {},
};
var sentenceIDNum = 21;
var complexWordGroup = null;
var complexSentencesGroup = null;
var complexParagraphGroup = null;
var complexDocumentParagraphGroup = null;

// Initial values
var originalComplexWordGroup = [];
var originalComplexSentencesGroup = [];
var originalComplexParagraphGroup = [];
var originalComplexDocumentParagraphGroup = [];

// Replacement values
var replacedWords = null;
var replacedSentences = null;
var replacedParagraphs = null;
var replacedDocumentParagraphs = null;

// Extension settings
var simpSetting = "lexical";
var textSetting = "Word";
var highlightToggle = false;
var whereToSetting = "InPlace";
var howLongSetting = "Temporary";
var confidenceSetting = "No";
var highlightReplacedToggle = false;

var complexDocumentParagraphsCount = 0;

// Check if any user data exists. If it does, set the variables that store the extension setting.
chrome.storage.sync.get("simpSetting", (status) => {
  if (Object.keys(status).length > 0 && status.simpSetting !== null) {
    simpSetting = status.simpSetting;
  }
});

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

chrome.storage.sync.get("textSetting", (status) => {
  if (Object.keys(status).length > 0 && status.textSetting !== null) {
    textSetting = status.textSetting;
  }
  addListeners();
});

chrome.storage.sync.get("highlight", (status) => {
  if (Object.keys(status).length > 0 && status.highlight !== null) {
    highlightToggle = status.highlight;
  }
  toggleHighlightComplex({
    settingType: "highlightComplex",
    highlight: highlightToggle,
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

var idx = 0; // used for id index of words

// Identify page main content
const mainContent = identifyPageMainContent();
mainContent.classList.add("mainContentContainer");

// Get all paragraphs within the main content of the page
const paragraphs = document.querySelectorAll(".mainContentContainer p");

for (var i = 0; i < paragraphs.length; i++) {
  let currElement = paragraphs[i];
  replaceText(currElement);
}

// Identify complex paragraphs
identifyParagraphs();

// Identify complex document
identifyDocument();

console.log("Number of complex paras = ", complexDocumentParagraphsCount);

complexWordGroup = document.getElementsByClassName("complex-word");
complexSentencesGroup = document.getElementsByClassName("complex-sentence");
complexParagraphGroup = document.getElementsByClassName("complex-paragraph");
complexDocumentParagraphGroup =
  document.getElementsByClassName("complex-document");

// Store all the original complex text groups.
for (let i = 0; i < complexWordGroup.length; i++) {
  originalComplexWordGroup.push(complexWordGroup[i].innerHTML);
}

for (let i = 0; i < complexSentencesGroup.length; i++) {
  originalComplexSentencesGroup.push(complexSentencesGroup[i].innerHTML);
}

for (let i = 0; i < complexParagraphGroup.length; i++) {
  originalComplexParagraphGroup.push(complexParagraphGroup[i].innerHTML);
}

for (let i = 0; i < complexDocumentParagraphGroup.length; i++) {
  originalComplexDocumentParagraphGroup.push(
    complexDocumentParagraphGroup[i].innerHTML
  );
}

// send message to background.js with collected complex words, sentences etc
chrome.runtime.sendMessage({
  wordUpdate: "True",
  totalParagraphs: complexDocumentParagraphsCount,
  toSimplify: complexText["currTabWords"],
  toSimplifySentence: complexText["currTabSentences"],
  toSimplifyParagraph: complexText["currTabParagraphs"],
  toSimplifyDocument: complexText["currTabDocumentParagraphs"],
});

/*
 * Listen to the settings being changed on extension. Depending on the type of setting,
 * appropriate actions are taken. The setting types are - "How Much", "Where",
 * "Highlight Complex", "How Long", "Display Confidence"
 */
chrome.runtime.onMessage.addListener(function (request) {
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
chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === "simplifiedText") {
    newWords = request.toChange;
    newWords = JSON.parse(newWords);
    if (request.textType === "sentence") {
      replacedSentences = JSON.parse(request.toChange);
    } else if (request.textType === "word") {
      replacedWords = JSON.parse(request.toChange);
    } else if (request.textType === "paragraph") {
      replacedParagraphs = JSON.parse(request.toChange);
    } else if (request.textType === "document") {
      replacedDocumentParagraphs = JSON.parse(request.toChange);
    }
  }
});

/*
 * Wrapper function to revert swapped/replaced/simplified text to original text
 */
function revertContentToOriginal() {
  const groups = {
    Word: complexWordGroup,
    Sentence: complexSentencesGroup,
    Paragraph: complexParagraphGroup,
    Document: complexDocumentParagraphGroup,
  };
  const originalGroups = {
    Word: originalComplexWordGroup,
    Sentence: originalComplexSentencesGroup,
    Paragraph: originalComplexParagraphGroup,
    Document: originalComplexDocumentParagraphGroup,
  };
  const replacedGroups = {
    Word: replacedWords,
    Sentence: replacedSentences,
    Paragraph: replacedParagraphs,
    Document: replacedDocumentParagraphs,
  };

  if (textSetting !== "Document") {
    revertNonDocumentsToOrginal(
      groups[textSetting],
      originalGroups[textSetting],
      replacedGroups[textSetting]
    );
  } else {
    revertDocumentToOrginal(
      groups[textSetting],
      originalGroups[textSetting],
      replacedGroups[textSetting]
    );
  }
}

/**
 * Changes the elements(words, sentences, paragraphs) back to the original text
 */
function revertNonDocumentsToOrginal(group, originalGroup, replacedGroup) {
  const groupLength = group.length;
  for (let i = 0; i < groupLength; i++) {
    if (group[i].innerHTML !== originalGroup[i]) {
      removeSimplifiedHighlights(group[i]);
      replacedGroup[i].text = group[i].innerText;
    }
    group[i].innerHTML = originalGroup[i];
  }
}

/**
 * Changes the entire document back to the original text
 */
function revertDocumentToOrginal(group, originalGroup, replacedGroup) {
  let text = "";
  let simplerParagraphs = replacedGroup[0].text.split("\\n \\n");

  const paragraphsGroupLength = originalGroup.length;

  for (let i = 0; i < paragraphsGroupLength; i++) {
    if (group[i].innerHTML !== originalGroup[i]) {
      removeSimplifiedHighlights(group[i]);

      let currDoc = group[i].innerHTML;
      group[i].innerHTML = simplerParagraphs[i];
      text += currDoc + "\\n \\n";
    }
  }
  if (text) {
    replacedGroup[0].text = text.replace(/^\\n+|\\n \\n+$/g, "");
  }
}

/**
 * Adds eventlistners to elements depending on the type of text selected
 * (words, sentences, paragraphs, document) and the place selected
 * (In place, highlight, popup, side).
 */
function addListeners() {
  const groups = {
    Word: complexWordGroup,
    Sentence: complexSentencesGroup,
    Paragraph: complexParagraphGroup,
    Document: complexDocumentParagraphGroup,
  };

  Array.from(groups[textSetting]).forEach(function (element) {
    switch (whereToSetting) {
      case "InPlace":
        addInPlaceListeners(element);
        break;
      case "Popup":
        addPopupListeners(element);
        break;
      case "Side":
        addSideTipListeners(element);
        break;
    }
    // Get the pointer icon on-hover
    element.classList.add("clickable-pointer");
  });
}

/**
 * Wrapper function to add listners to the selected element to
 * trigger relevant action
 * @param {HTMLElement} element
 */
function addInPlaceListeners(element) {
  if (howLongSetting === "Temporary") {
    addTemporaryInPlaceListeners(element);
  } else if (howLongSetting === "UntilClick") {
    addUntilClickInPlaceListeners(element);
  } else if (howLongSetting === "Permanent") {
    addPermanentInPlaceListeners(element);
  }
}

function addPermanentInPlaceListeners(element) {
  element.addEventListener("click", permanentInPlaceReplace);
}

const permanentInPlaceReplace = (event) => {
  if (!event.currentTarget.classList.contains("swapped")) {
    if (textSetting !== "Document") {
      setToOtherText(event.currentTarget);
    } else {
      setToOtherDocument(event.currentTarget);
    }
  }
};

function addTemporaryInPlaceListeners(element) {
  element.addEventListener("mouseenter", changeTextOnMouseOver);
  element.addEventListener("mouseleave", changeTextOnMouseOut);
}

function addUntilClickInPlaceListeners(element) {
  element.addEventListener("click", setToOtherWord);
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

const changeTextOnMouseOver = function (event) {
  if (
    event.relatedTarget &&
    event.relatedTarget.parentNode &&
    !isParent(this, event.relatedTarget) &&
    event.target === this &&
    !event.currentTarget.classList.contains("swapped")
  ) {
    let el = document.getElementById(event.currentTarget.id);
    if (textSetting === "Document") {
      setToOtherDocument(el);
    } else {
      setToOtherText(el);
    }
  }
};

const changeTextOnMouseOut = function (event) {
  let el = document.getElementById(event.currentTarget.id);
  if (event.currentTarget.classList.contains("swapped")) {
    if (textSetting === "Document") {
      setToOtherDocument(el);
    } else {
      setToOtherText(el);
    }
  }
};

function addPopupListeners(element) {
  if (howLongSetting === "Temporary") {
    addTemporaryPopupListeners(element);
  } else if (howLongSetting === "UntilClick") {
    addUntilClickPopupListeners(element);
  } else if (howLongSetting === "Permanent") {
    addPermanentPopupListeners(element);
  }
}

function addTemporaryPopupListeners(element) {
  element.addEventListener("mouseover", showToolTip);
  element.addEventListener("mouseout", removeToolTip);
}

function addUntilClickPopupListeners(element) {
  element.addEventListener("click", toggleUntilClickPopup);
}

const permanentPopup = function (event) {
  if (textSetting !== "Document") {
    const tooltip = this.firstChild;
    const isToolTip =
      tooltip.tagName === "DIV" && tooltip.classList.contains("tooltip1");
    if (!isToolTip) {
      showNonDocumentTooltip(event.currentTarget);
    }
  } else {
    const mainContent = identifyPageMainContent();
    console.log(mainContent.firstChild);
    const tooltip = mainContent.firstChild;
    if (
      !(
        tooltip instanceof HTMLElement && tooltip.classList.contains("tooltip1")
      )
    ) {
      toggleUntilClickPopup(mainContent);
    }
  }
};

const toggleUntilClickPopup = function (el) {
  if (textSetting !== "Document") {
    const tooltip = this.firstChild;
    const isToolTip =
      tooltip.tagName === "DIV" && tooltip.classList.contains("tooltip1");
    if (isToolTip) {
      removeSpecificTooltip(tooltip);
    } else {
      showNonDocumentTooltip(el.currentTarget);
    }
  } else {
    const tooltip = document.getElementsByClassName("tooltip1");
    if (tooltip.length > 0) {
      removeToolTip();
    } else {
      showDocumentTooltip(el.target);
    }
  }
};

function addPermanentPopupListeners(element) {
  element.addEventListener("click", permanentPopup);
}

function addSideTipListeners(element) {
  if (howLongSetting === "Temporary") {
    addTemporarySideTipListeners(element);
  } else if (howLongSetting === "UntilClick") {
    addUntilClickSideTipListeners(element);
  } else if (howLongSetting === "Permanent") {
    addPermanentSideTipListeners(element);
  }
}

function addUntilClickSideTipListeners(element) {
  if (textSetting !== "Document") {
    element.addEventListener("click", showNonDocumentSideTipUntilClick);
  } else {
    // Using same function as temporary as logic is the same
    element.addEventListener("click", function(node) {
      showDocumentSideTip(node);
    });
  }
}

function addPermanentSideTipListeners(element) {
  if (textSetting !== "Document") {
    element.addEventListener("click", showNonDocumentSideTipUntilClick);
  } else {
    // Using same function as temporary as logic is the same
    element.addEventListener("click", showDocumentSideTip);
  }
}

function addTemporarySideTipListeners(element) {
  if (textSetting !== "Document") {
    element.addEventListener("mouseover", showTemporaryNonDocumentSideTip);
    element.addEventListener("mouseout", removeSideTip);
  } else {
    element.addEventListener("mouseover", showDocumentSideTip);
    element.addEventListener("mouseout", removeSideTip);
  }
}

/**
 * Removes eventlistners from elements depending on the type of text
 * previously selected (words, sentences, paragraphs, document) and/or
 * the place selected (In place, popup, side) and the duration selected
 * (temporary, until click, permanent)
 */
function removeListeners() {
  const groups = {
    Word: complexWordGroup,
    Sentence: complexSentencesGroup,
    Paragraph: complexParagraphGroup,
    Document: complexDocumentParagraphGroup,
  };

  Array.from(groups[textSetting]).forEach(function (element) {
    switch (whereToSetting) {
      case "InPlace":
        removeInPlaceListeners(element);
        break;
      case "Popup":
        removePopupListeners(element);
        break;
      case "Side":
        removeSideTipListeners(element);
        break;
      default:
        console.log("Did not match any setting");
    }
    element.classList.remove("clickable-pointer");
  });
}

function removeInPlaceListeners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporaryInPlaceListeners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickInPlaceListeners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentInPlaceListeners(element);
  }
}

function removePermanentInPlaceListeners(element) {
  element.removeEventListener("click", permanentInPlaceReplace);
}

function removeTemporaryInPlaceListeners(element) {
  element.removeEventListener("mouseenter", changeTextOnMouseOver);
  element.removeEventListener("mouseleave", changeTextOnMouseOut);
}

function removeUntilClickInPlaceListeners(element) {
  element.removeEventListener("click", setToOtherWord);
}

function removePopupListeners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporaryPopupListeners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickPopupListeners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentPopupListeners(element);
  }
}

function removePermanentPopupListeners(element) {
  element.removeEventListener("click", permanentPopup);
}

function removeTemporaryPopupListeners(element) {
  element.removeEventListener("mouseover", showToolTip);
  element.removeEventListener("mouseout", removeToolTip);
}

function removeUntilClickPopupListeners(element) {
  element.removeEventListener("click", toggleUntilClickPopup);
}

function removeSideTipListeners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporarySideTipListeners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickSideTipListeners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentSideTipListeners(element);
  }
}

function removePermanentSideTipListeners(element) {
  if (textSetting !== "Document") {
    element.removeEventListener("click", showNonDocumentSideTipUntilClick);
  } else {
    // Using same function as temporary as logic is the same
    element.removeEventListener("click", showDocumentSideTip);
  }
}

function removeTemporarySideTipListeners(element) {
  if (textSetting !== "Document") {
    element.removeEventListener("mouseover", showTemporaryNonDocumentSideTip);
    element.removeEventListener("mouseout", removeSideTip);
  } else {
    element.removeEventListener("mouseover", showDocumentSideTip);
    element.removeEventListener("mouseout", removeSideTip);
  }
}

function removeUntilClickSideTipListeners(element) {
  if (textSetting !== "Document") {
    element.removeEventListener("click", showNonDocumentSideTipUntilClick);
  } else {
    //Using same function as temporary as logic is same
    element.removeEventListener("click", showDocumentSideTip);
  }
}

const showTemporaryNonDocumentSideTip = function (node) {
  const wordSet = {
    Word: replacedWords,
    Sentence: replacedSentences,
    Paragraph: replacedParagraphs,
    Document: replacedDocumentParagraphs,
  };

  if (textSetting === "Word") {
    node = node.target;
  } else {
    node = node.currentTarget;
  }

  let id = node.id;
  let complex = wordSet[textSetting].find(({ wordID }) => wordID === id);

  // Create a dialog box - this box contains "content" and "header".
  // Header contains the heading and close button
  const dialogBox = document.createElement("div");
  const dialogContent = getSideTipContentEl(complex.text);
  const dialogHeader = getSideTipHeaderEl();

  dialogBox.appendChild(dialogHeader);
  dialogBox.appendChild(dialogContent);
  dialogBox.classList.add("modal1");

  const modalContainer = document.getElementsByClassName("modal1-container");
  if (modalContainer.length == 0) {
    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal1-container");
    modalContainer.appendChild(dialogBox);
    document.body.insertBefore(modalContainer, document.body.firstChild);
  } else {
    modalContainer[0].insertBefore(dialogBox, modalContainer[0].firstChild);
  }
};

const showDocumentSideTip = function (node, untilClick = false) {
  node = node.target;

  let simplifiedParagraphs =
    replacedDocumentParagraphs[0].text.split("\\n \\n");
  const dialogContent = document.createElement("div");
  const textContent = document.createElement("div");
  dialogContent.classList.add("modal1-content");

  Array.from(simplifiedParagraphs).forEach((para) => {
    textContent.innerHTML += `<p>${para}</p>`;
  });
  dialogContent.appendChild(textContent);
  const dialogBox = document.createElement("div");
  const dialogHeader = getSideTipHeaderEl();

  dialogBox.appendChild(dialogHeader);
  dialogBox.appendChild(dialogContent);
  dialogBox.classList.add("modal1");

  const modalContainer = document.getElementsByClassName("modal1-container");
  if (modalContainer.length == 0) {
    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal1-container");
    modalContainer.appendChild(dialogBox);
    document.body.insertBefore(modalContainer, document.body.firstChild);
  } else {
    modalContainer[0].insertBefore(dialogBox, modalContainer[0].firstChild);
  }
};

/**
 * Creates a header element containing close button and title.
 */
function getSideTipHeaderEl() {
  const dialogHeader = document.createElement("div");
  const dialogHeading = document.createElement("SPAN");
  const closeButton = document.createElement("SPAN");
  closeButton.appendChild(document.createTextNode("X"));
  closeButton.classList.add("close");
  closeButton.addEventListener("click", closeSideTip);

  let heading = document.createTextNode(
    `Simplified ${textSetting.toLowerCase()}`
  );

  if (howLongSetting === "Permanent") {
    closeButton.style.display = "none";
  }

  dialogHeading.classList.add("dialogHeading");
  dialogHeading.appendChild(heading);
  dialogHeader.classList.add("dialogHeader");
  dialogHeader.appendChild(dialogHeading);
  dialogHeader.appendChild(closeButton);
  return dialogHeader;
}

function getSideTipContentEl(text) {
  const dialogContent = document.createElement("div");
  dialogContent.classList.add("modal1-content");
  dialogContent.setAttribute("data-text", text);
  dialogContent.appendChild(document.createTextNode(text));
  return dialogContent;
}

const highlightSideTipMappedText = function (event) {
  let id = event.currentTarget.id.substring(8);
  const textEl = document.getElementById(id);
  textEl.classList.add("sidetip-mapped-text-highlight");
};

const removeSideTipMappedTextHighlights = function (event, currTarget = null) {
  let id = currTarget ? currTarget.id.substring(8) : event.currentTarget.id.substring(8);
  const textEl = document.getElementById(id);
  if (textEl) {
    textEl.classList.remove("sidetip-mapped-text-highlight");
  }
};

const showNonDocumentSideTipUntilClick = function (node) {
  const wordSet = {
    Word: replacedWords,
    Sentence: replacedSentences,
    Paragraph: replacedParagraphs,
    Document: replacedDocumentParagraphs,
  };

  if (textSetting === "Word") {
    node = node.target;
  } else {
    node = node.currentTarget;
  }

  let id = node.id;
  let complex = wordSet[textSetting].find(({ wordID }) => wordID === id);

  // Create a dialog box - this box contains "content" and "header".
  // Header contains the heading and close button
  const dialogBox = document.createElement("div");
  const dialogContent = getSideTipContentEl(complex.text);
  const dialogHeader = getSideTipHeaderEl();

  dialogBox.appendChild(dialogHeader);
  dialogBox.appendChild(dialogContent);

  dialogBox.setAttribute("id", `sidetip-${id}`);
  dialogBox.addEventListener("mouseenter", highlightSideTipMappedText);
  dialogBox.addEventListener("mouseleave", removeSideTipMappedTextHighlights);

  dialogBox.classList.add("modal1");

  const modalContainer = document.getElementsByClassName("modal1-container");
  if (modalContainer.length == 0) {
    const modalContainer = document.createElement("div");
    modalContainer.classList.add("modal1-container");
    modalContainer.appendChild(dialogBox);
    document.body.insertBefore(modalContainer, document.body.firstChild);
  } else {
    modalContainer[0].insertBefore(dialogBox, modalContainer[0].firstChild);
  }
};

const removeSideTip = function () {
  document.querySelectorAll(".modal1-container").forEach(function (a) {
    a.remove();
  });
};

const closeSideTip = function (event) {
  removeSideTipMappedTextHighlights(event, event.currentTarget.parentNode.parentNode);
  event.currentTarget.parentNode.parentNode.remove();
};

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
  removePopups();
  removeSideTip();
  removeListeners();
  removeSwappedClass();
  removeHighlights();
  removeReplacedHighlights();

  revertContentToOriginal();

  howLongSetting = request.howLongSetting;

  addListeners();
  addHighlights();
}

/*
* Adds or removes highlight to/from complex texts based on request
*  - if highlight true
        - Add highlight class to words/sentences/paragraphs/Document
*  - if highlight false
*       - remove highlight class from words/sentences/paragraphs/Document
*/
function toggleHighlightComplex(request) {
  if (request.settingType == "highlightComplex") {
    if (request.highlight === true) {
      chrome.storage.sync.set({ highlight: true });
      highlightToggle = true;
      addHighlights();
    } else {
      chrome.storage.sync.set({ highlight: false });
      highlightToggle = false;
      removeHighlights();
    }
  }
}

/**
 * Adds or removes highlight to/from simplified text based on request
 *  - if highlightReplaced true
 *      - Add yellow highlight to the text
 *  - if highlightReplaced false
 */

function toggleHighlightReplaced(request) {
  if (request.settingType == "highlightReplaced") {
    if (request.highlightReplaced === true) {
      chrome.storage.sync.set({ highlightReplaced: true });
      highlightReplacedToggle = true;
      addReplacedHighlights();
    } else {
      chrome.storage.sync.set({ highlightReplaced: false });
      highlightReplacedToggle = false;
      removeReplacedHighlights();
    }
  }
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
  removePopups();
  removeSideTip();
  removeListeners();
  removeHighlights();
  removeSwappedClass();
  revertContentToOriginal();
  whereToSetting = request.whereToSetting;
  if (highlightToggle) {
    addHighlights();
  }
  addListeners();
}

/**
 * Changes the value of "How much" setting. Removes all the
 * configurations of previous setting and reverts any changes
 * to original. Adds listeners for the new setting.
 * @param {Object}  request   Specifies the value of textSetting.
 *                            Values are Words, Sentence, Paragraphs,
 *                            Document
 */

function switchHowMuchSetting(request) {
  removePopups();
  removeSideTip();
  removeListeners();
  removeHighlights();
  removeSwappedClass();
  removeReplacedHighlights();

  revertContentToOriginal();

  textSetting = request.textSetting;
  if (highlightToggle) {
    addHighlights();
  }
  addListeners();
}

function removePopups() {
  document.querySelectorAll(".tooltip1").forEach(function (a) {
    a.remove();
  });
}

function removeHighlights() {
  let className = `highlight-${this.textSetting.toLowerCase()}`;
  let highlighted = document.getElementsByClassName(className);
  Array.from(highlighted).forEach((element) => {
    element.classList.remove(className);
  });
}

function addHighlights() {
  let styleClass = `highlight-${textSetting.toLowerCase()}`;
  let className = `complex-${textSetting.toLowerCase()}`;
  elements = document.getElementsByClassName(className);
  [].forEach.call(elements, function (word) {
    word.classList.add(styleClass);
  });
}

function addReplacedHighlights() {
  const group = {
    Word: complexWordGroup,
    Sentence: complexSentencesGroup,
    Paragraph: complexParagraphGroup,
    Document: complexDocumentParagraphGroup,
  };
  const originalGroup = {
    Word: originalComplexWordGroup,
    Sentence: originalComplexSentencesGroup,
    Paragraph: originalComplexParagraphGroup,
    Document: originalComplexDocumentParagraphGroup,
  };

  const groupLength = group[textSetting].length;

  // Identify the elements that have been changed and add highlights
  for (let i = 0; i < groupLength; i++) {
    if (group[textSetting][i].innerHTML !== originalGroup[textSetting][i]) {
      addSimplifiedHighlights(group[textSetting][i]);
    }
  }
}

function removeReplacedHighlights() {
  const replacedText = document.getElementsByClassName(
    `highlight-simplified-${textSetting.toLowerCase()}`
  );
  Array.from(replacedText).forEach((el) => {
    removeSimplifiedHighlights(el);
  });
}

function getPTags(node) {
  if (!node) return;
  if (node.nodeName === "P") {
    complexDocumentParagraphsCount += 1;
    node.classList.add("complex-document");
  }

  for (let i = 0; i < node.childNodes.length; i++) {
    getPTags(node.childNodes[i]);
  }
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

function removeSwappedClass() {
  const swappedElements = document.getElementsByClassName("swapped");
  Array.from(swappedElements).forEach((el) => {
    el.classList.remove("swapped");
  });
}

const setToOtherDocument = function (node) {
  wordSet = replacedDocumentParagraphs;

  let simplerParagraphs = wordSet[0].text.split("\\n \\n");
  wordSet[0].text = "";
  Array.from(complexDocumentParagraphGroup).forEach((node) => {
    let currDoc = node.innerHTML;

    node.innerHTML = simplerParagraphs.shift();

    if (node.classList.contains("swapped")) {
      node.classList.remove("swapped");
      if (highlightToggle) {
        addComplexHighlights(node);
      }
      removeSimplifiedHighlights(node);
    } else {
      node.classList.add("swapped");
      if (highlightReplacedToggle) {
        addSimplifiedHighlights(node);
      }
      removeComplexHighlights(node);
    }

    wordSet[0].text += currDoc + "\\n \\n";
  });
  wordSet[0].text = wordSet[0].text.replace(/^\\n+|\\n \\n+$/g, "");
};

const setToOtherText = function (node) {
  const replacedGroups = {
    Word: replacedWords,
    Sentence: replacedSentences,
    Paragraph: replacedParagraphs,
  };

  let id = node.id;
  let wordSet = replacedGroups[textSetting];
  let complex = wordSet.find(({ wordID }) => wordID === id);
  let foundIndex = wordSet.findIndex((word) => word.wordID == id);
  let currWord = node.innerHTML;

  node.innerHTML = complex.text;

  if (node.classList.contains("swapped")) {
    node.classList.remove("swapped");
    if (highlightToggle) {
      addComplexHighlights(node);
    }
    removeSimplifiedHighlights(node);
  } else {
    node.classList.add("swapped");
    if (highlightReplacedToggle) {
      addSimplifiedHighlights(node);
    }
    removeComplexHighlights(node);
  }
  wordSet[foundIndex].text = currWord;
};

const setToOtherWord = (event) => {
  node = event.currentTarget;
  if (textSetting === "Document") {
    setToOtherDocument(node);
  } else {
    setToOtherText(node);
  }
};

function addSimplifiedHighlights(element) {
  element.classList.add(`highlight-simplified-${textSetting.toLowerCase()}`);
}

function removeSimplifiedHighlights(element) {
  element.classList.remove(`highlight-simplified-${textSetting.toLowerCase()}`);
}

function removeComplexHighlights(element) {
  element.classList.remove(`highlight-${textSetting.toLowerCase()}`);
}

function addComplexHighlights(element) {
  element.classList.add(`highlight-${textSetting.toLowerCase()}`);
}

const showToolTip = function (event) {
  if (textSetting !== "Document") {
    showNonDocumentTooltip(event.currentTarget);
  } else {
    showDocumentTooltip(event.target);
  }
};

const removeToolTip = () => {
  document.querySelectorAll(".tooltip1").forEach(function (a) {
    a.remove();
  });
};

const removeSpecificTooltip = (el) => {
  el.remove();
};

const showDocumentTooltip = function (node) {
  let simplifiedParagraphs =
    replacedDocumentParagraphs[0].text.split("\\n \\n");
  const tooltipWrap = document.createElement("div");

  Array.from(simplifiedParagraphs).forEach((para) => {
    tooltipWrap.innerHTML += `<p>${para}</p>`;
  });

  tooltipWrap.classList.add("tooltip1", "complex-document");
  const mainDiv = identifyPageMainContent();

  mainDiv.appendChild(tooltipWrap);
  mainDiv.insertBefore(tooltipWrap, mainDiv.firstChild);
};

const showNonDocumentTooltip = function (node) {
  const wordSet = {
    Word: replacedWords,
    Sentence: replacedSentences,
    Paragraph: replacedParagraphs,
    Document: replacedDocumentParagraphs,
  };

  let id = node.id;
  let complex = wordSet[textSetting].find(({ wordID }) => wordID === id);
  const tooltipWrap = document.createElement("div");
  tooltipWrap.classList.add("tooltip1");
  tooltipWrap.id = "Popup" + id;
  tooltipWrap.setAttribute("data-text", complex.text);
  tooltipWrap.appendChild(document.createTextNode(complex.text));
  node.insertBefore(tooltipWrap, node.firstChild);
};

/* helper function to identify words with length above 6 - identify complex words
 * increase index for IDs
 * add span with id and highlight class for
 */
function identifyWords(word, index) {
  // remove anything from the word that isn't purely the text itself - for instance, "<b>word</b>" should become "word"
  matchInd = word.search(/\b(\w+)\b/g);
  matchData = word.match(/\b(\w+)\b/g);
  if (matchData === null) {
    return word;
  }
  // word is first match in matchData, matchData.length indicates only one result was found
  // risk - in a scenario where matchData[0].length is greater than one, the data isn't handled
  wordToCheck = matchData[0];
  matchLength = matchData[0].length;
  if (
    wordToCheck.length > 6 &&
    !wordToCheck.includes("http") &&
    matchData.length == 1
  ) {
    let id = "id" + index;
    complexText.currTabWords[id] = [wordToCheck];
    complexTagged = `<span class='complex-word' id=${id}>${wordToCheck}</span>`;
    freshHTML =
      word.substring(0, matchInd) +
      complexTagged +
      word.substring(matchInd + matchLength, word.length);
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
function identifySentences(complex) {
  var sentenceEndIndices = [];

  // get indices for any text that includes a ending character ---> [? . !]
  complex.forEach(function (value, index) {
    if (index != 0) {
      lastChar = value.charAt(value.length - 1);
      var isEnd = /[.!?]$/.test(value);
      if (isEnd === true) {
        sentenceEndIndices.push(index);
      }
    }
  });

  var currEndInd = 0;
  var sentenceStart = {};
  var complexCount = 0;
  var nextTextInd = 0;
  var sentence = [];
  var id = null;

  // loop over complex text list
  complex.forEach(function (text, index) {
    sentence.push(text);

    // check if current text contains a complex word - doesn't handle if multiple complex words in text
    if (text.includes("class='complex-word'")) {
      complexCount++;
    }

    if (index === 0) {
      // With the very first item in complex, create a modified start, with an id and a beginning span
      let id = "sentence" + sentenceIDNum;
      sentenceStart[0] = "<span class='complex-sentence' id=" + id + ">" + text;
      sentenceIDNum++;
    } else if (index === sentenceEndIndices[currEndInd]) {
        if (complexCount >= 7) {
          // create this sentence, as it qualifies + modify current text to add span
          this[index] = text + "</span>";
          currEndInd++;
          startVals = Object.entries(sentenceStart)[0];
          this[startVals[0]] = startVals[1];

          let fullSentence = sentence.join(" ");
          // create html object to attain clean text
          var htmlToCleanObject = document.createElement("div");
          htmlToCleanObject.innerHTML = fullSentence;
          let cleanSentence = htmlToCleanObject.innerText;
          htmlToCleanObject.remove();

          let id = "sentence" + (sentenceIDNum - 1);
          complexText.currTabSentences[id] = [[cleanSentence, fullSentence]];
        } else {
          sentenceIDNum--;
        }
        sentenceStart = {};
        nextTextInd = index + 1;
        if (this[nextTextInd] != null) {
          id = "sentence" + (sentenceIDNum);
          sentenceStart[nextTextInd] =
            "<span class='complex-sentence' id=" + id + "> " + this[nextTextInd];
          sentenceIDNum++;
        }
        complexCount = 0;

        sentence = [];
      }
    }, complex);
}
/*
 * Identifies complex paragraphs within the main content of the
 * webpage. For a paragraph to be complex, at least two sentences
 * having length greater than 20 words should be present.
 */
function identifyParagraphs() {
  let paraIndex = 0;
  document
    .querySelectorAll(".mainContentContainer p")
    .forEach(function (paragraph) {
      paraIndex += 1;
      let paraText = paragraph.innerText;
      let sentences = paraText.split(".");
      let count = 0;
      sentences.forEach((sentence) => {
        if (sentence.split(" ").length > 20) {
          count++;
        }
      });
      if (count > 2) {
        let paraId = "paragraph" + paraIndex;
        complexText.currTabParagraphs[paraId] = [paraText];
        paragraph.setAttribute("id", "paragraph" + paraIndex);
        paragraph.classList.add("complex-paragraph");
      }
    });
}

function identifyDocument() {
  let complexParagraphs = document.getElementsByClassName("complex-paragraph");
  let doc = identifyPageMainContent();
  doc.classList.add("mainContentContainer");
  let allParagraphs = document.querySelectorAll(".mainContentContainer p");

  complexText.currTabDocumentParagraphs["document" + 1] = [];
  Array.from(allParagraphs).forEach((para) => {
    complexText.currTabDocumentParagraphs["document" + 1].push(para);
  });

  // As of now, a document is considered complex if it has more than 2 complex paragraphs
  if (complexParagraphs.length > 2) {
    Array.from(allParagraphs).forEach((node) => {
      // Get all the valid p tags (which has at least 20 over words) within main
      // content and mark them as complex-document
      if (node.innerText.split(" ").length > 20) getPTags(node);
    });
  }
}

/*
 * Drills down to find text within element to replace
 * as of now, only being passed in <p> nodes from document
 * - approach roughly from easier project
 */
function replaceText(node) {
  if (node.childNodes.length == 1) {
    if (node.parentNode && node.parentNode.nodeName === "TEXTAREA") {
      return;
    }

    if (
      node.innerHTML.length <= node.innerText.length + 2 ||
      node.innerHTML.length >= node.innerText.length
    ) {
      var currText = node.innerHTML.split(" ");
      var complex = currText.map((word) => {
        var wordWithNewTag = identifyWords(word, idx);
        return wordWithNewTag;
      });
      identifySentences(complex);
      var output = complex.join(" ");
      node.innerHTML = output;
    }
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      replaceText(node.childNodes[i]);
    }
  }
}
