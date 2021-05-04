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
var textSetting = "Word";
var highlightToggle = false;
var whereToSetting = "InPlace";
var howLongSetting = "Temporary";
var confidenceSetting = "No";
var highlightReplacedToggle = false;

var complexDocumentParagraphsCount = 0;

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
});

var idx = 0; // used for id index of words

// find all <p> tags and highlight words with length greater than 6
const paragraphs = document.getElementsByTagName("p");

for (var i = 0; i < paragraphs.length; i++) {
  let currElement = paragraphs[i];
  replaceText(currElement);
}

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
    case "howMuch":
      switchHowMuchSetting(request);
      break;
    case "highlightComplex":
      toggleHighlightComplex(request);
      break;
    case "whereTo":
      switchWhereToSetting(request);
      break;
    case "howLong":
      switchHowLongSetting(request);
      break;
    case "displayConfidence":
      console.log("Display Confidence selected!");
      break;
    default:
      console.log("Did not receive any setting!");
  }
});

/*
 * Listener to pull in simplified words
 * expects {type: "InPlace", sentenceStart: stringified list of new words, textType: "word"/"sentence"/etc}
 * set complexWordGroup, complexSentencesGroup to appropriate element groups
 */
chrome.runtime.onMessage.addListener(function (request) {
  if (request.type === "InPlace") {
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
  } else {
    console.log("No words received.");
  }
});

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
      case "Highlight":
        element.addEventListener("click", changeText);
        break;
      case "Popup":
        addPopupListners(element);
        break;
      case "Side":
        addSideTipListeners(element);
        break;
      default:
        console.log("Did not match any setting");
    }
    element.classList.add("clickable-pointer");
  });
}

function addInPlaceListeners(element) {
  if (howLongSetting === "Temporary") {
    addTemporaryInPlaceListeners(element);
  } else if (howLongSetting === "UntilClick") {
    addUntilClickInPlaceListeners(element);
  } else if (howLongSetting === "Permanent") {
    addPermanentInPlaceListeners();
  }
}

function addTemporaryInPlaceListeners(element) {
  element.addEventListener("mouseenter", changeTextOnMouseOver);
  element.addEventListener("mouseleave", changeTextOnMouseOut);
}

function addUntilClickInPlaceListeners(element) {
  element.addEventListener("click", changeText);
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
    event.relatedTarget.parentNode &&
    !isParent(this, event.relatedTarget) &&
    event.target === this
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
  console.log("Mouse out called");
  // console.log("relatedTarget => ", event.relatedTarget);

  // if (
  //   event.relatedTarget.parentNode &&
  //   !isParent(this, event.relatedTarget) &&
  //   event.target === this
  // ) {
  let el = document.getElementById(event.currentTarget.id);
  setToOtherWord(el);
  //}
};

function addPopupListners(element) {
  if (howLongSetting === "Temporary") {
    addTemporaryPopupListners(element);
  } else if (howLongSetting === "UntilClick") {
    addUntilClickPopupListners(element);
  } else if (howLongSetting === "Permanent") {
    addPermanentPopupListners(element);
  }
}

function addTemporaryPopupListners(element) {
  element.addEventListener("mouseover", showToolTip);
  element.addEventListener("mouseout", removeToolTip);
}

function addUntilClickPopupListners(element) {
  element.addEventListener("click", toggleUntilClickPopup);
}

function findClosestComplexAncestor(el, sel) {
  while (
    (el = el.parentElement) &&
    !(el.matches || el.matchesSelector).call(el, sel)
  );
  return el;
}

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

function addPermanentPopupListners(element) {
  console.log("Permanent popup yet to be implemented");
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

function addUntilClickSideTipListeners() {
  console.log("Add until click side tip listeners yet to be implemented");
}

function addPermanentSideTipListeners() {
  console.log("Add Permanent side tip listeners yet to be implemented");
}

function addTemporarySideTipListeners(element) {
  if (textSetting !== "Document") {
    element.addEventListener("mouseover", showTemporaryNonDocumentSideTip);
    element.addEventListener("mouseout", removeSideTip);
  } else {
    element.addEventListener("mouseover", showTemporaryDocumentSideTip);
    element.addEventListener("mouseout", removeSideTip);
  }
}

/**
 * Removes eventlistners from elements depending on the type of text
 * previously selected (words, sentences, paragraphs, document) and/or
 * the place selected (In place, highlight, popup, side).
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
      case "Highlight":
        element.removeEventListener("click", changeText);
        break;
      case "Popup":
        removePopupListners(element);
        break;
      case "Side":
        removeSideTipListners(element);
        break;
      default:
        console.log("Did not match any setting");
    }
    element.classList.remove("clickable-pointer");
  });
}

function removeInPlaceListeners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporaryInPlaceListners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickInPlaceListners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentInPlaceListners(element);
  }
}

function removeTemporaryInPlaceListners(element) {
  console.log("Removing inplace for ", textSetting);
  // element.removeEventListener("mouseover", changeText);
  // element.removeEventListener("mouseout", changeText);
  element.removeEventListener("mouseenter", changeTextOnMouseOver);
  element.removeEventListener("mouseleave", changeTextOnMouseOut);
}

function removeUntilClickInPlaceListners(element) {
  element.removeEventListener("click", changeText);
}

function removePopupListners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporaryPopupListners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickPopupListners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentPopupListners(element);
  }
}

function removeTemporaryPopupListners(element) {
  element.removeEventListener("mouseover", showToolTip);
  element.removeEventListener("mouseout", removeToolTip);
}

function removeUntilClickPopupListners(element) {
  element.removeEventListener("click", toggleUntilClickPopup);
}

function removeSideTipListners(element) {
  if (howLongSetting === "Temporary") {
    removeTemporarySideTipListeners(element);
  } else if (howLongSetting === "UntilClick") {
    removeUntilClickSideTipListeners(element);
  } else if (howLongSetting === "Permanent") {
    removePermanentSideTipListeners(element);
  }
}

function removeTemporarySideTipListeners(element) {
  if (textSetting !== "Document") {
    element.removeEventListener("mouseover", showTemporaryNonDocumentSideTip);
    element.removeEventListener("mouseout", removeSideTip);
  } else {
    element.removeEventListener("mouseover", showTemporaryDocumentSideTip);
    element.removeEventListener("mouseout", removeSideTip);
  }
}

// function showSideTip(element) {
//   if (textSetting !== "Document") {
//     showNonDocumentSideTip(element);
//   } else {
//     showDocumentSideTip(element);
//   }
// }

// function showNonDocumentSideTip(element) {
//   if (howLongSetting === "Temporary") {
//     element.addEventListener("mouseover", showTemporaryNonDocumentSideTip);
//     element.addEventListener("mouseout", removeSideTip);
//   } else if (howLongSetting === "UntilClick") {
//     showNonDocumentSideTipUntilClick(element);
//   } else if (howLongSetting === "Permanent") {
//     showNonDocumentPermanentSideTip(element);
//   }
// }

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
  const dialogBox = document.createElement("div");
  const dialogContent = getSideTipContentEl(complex.text);
  const dialogHeader = getSideTipHeaderEl();

  dialogBox.appendChild(dialogHeader);
  dialogBox.appendChild(dialogContent);

  dialogBox.classList.add("modal1");
  node.appendChild(dialogBox);
};

const showTemporaryDocumentSideTip = function (node) {
  node = node.target;

  let simplifiedParagraphs = replacedDocumentParagraphs[0].text.split(
    "\\n \\n"
  );
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

  const mainDiv = identifyPageMainContent(document.body);

  mainDiv.appendChild(dialogBox);
};

function getSideTipHeaderEl() {
  const dialogHeader = document.createElement("div");
  const dialogHeading = document.createElement("SPAN");
  const closeButton = document.createElement("SPAN");
  closeButton.appendChild(document.createTextNode("X"));
  closeButton.classList.add("close");

  let heading = document.createTextNode(
    `Simplified ${textSetting.toLowerCase()}`
  );
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

function showNonDocumentSideTipUntilClick(element) {}

function showNonDocumentPermanentSideTip(element) {}

const removeSideTip = function () {
  document.querySelectorAll(".modal1").forEach(function (a) {
    a.remove();
  });
};

function switchHowLongSetting(request) {
  console.log("from switch how long setting");
  removePopups();
  removeSideTip();
  removeListeners();
  howLongSetting = request.howLongSetting;
  addListeners();
}

const changeText = (event) => {
  const clickedEl = event.currentTarget;
  setToOtherWord(clickedEl);
};

/*
* Adds or removes highlight to/from complex texts based on request
*  - if highlight true
        - Add highlight class to words/sentences/paragraphs/Document
*  - if highlight false
*       - remove highlight class from words/sentences/paragraphs/Document
*/
function toggleHighlightComplex(request) {
  console.log(request);
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

function switchWhereToSetting(request) {
  removePopups();
  removeSideTip();
  removeListeners();
  whereToSetting = request.whereToSetting;
  addListeners();
}

function switchHowMuchSetting(request) {
  console.log("switching how much");
  removePopups();
  removeSideTip();
  removeListeners();
  removeHighlights();
  // }
  revertContentToOriginal();
  textSetting = request.textSetting;
  console.log("reverted content");
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

function identifyPageMainContent(node) {
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

const setToOtherDocument = function (node) {
  // node = node.currentTarget;
  wordSet = replacedDocumentParagraphs;

  let simplerParagraphs = wordSet[0].text.split("\\n \\n");
  wordSet[0].text = "";
  Array.from(complexDocumentParagraphGroup).forEach((node) => {
    let currDoc = node.innerHTML;
    if (whereToSetting === "InPlace") {
      node.innerHTML = simplerParagraphs.shift();
      if (!node.classList.contains(`highlight-${textSetting.toLowerCase()}`)) {
        if (highlightToggle) {
          addComplexHighlights(node);
        }
      } else {
        removeComplexHighlights(node);
      }
      wordSet[0].text += currDoc + "\\n \\n";
    } else if (whereToSetting === "Highlight") {
      node.innerHTML = simplerParagraphs.shift();
      if (
        !node.classList.contains(
          `highlight-simplified-${textSetting.toLowerCase()}`
        )
      ) {
        addSimplifiedHighlights(node);
      } else {
        removeSimplifiedHighlights(node);
      }
      wordSet[0].text += currDoc + "\\n \\n";
    }
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

  if (whereToSetting === "InPlace") {
    node.innerHTML = complex.text;
    if (!node.classList.contains(`highlight-${textSetting.toLowerCase()}`)) {
      if (highlightToggle) {
        addComplexHighlights(node);
      }
    } else {
      removeComplexHighlights(node);
    }
    wordSet[foundIndex].text = currWord;
  } else if (whereToSetting === "Highlight") {
    node.innerHTML = complex.text;
    if (
      !node.classList.contains(
        `highlight-simplified-${textSetting.toLowerCase()}`
      )
    ) {
      addSimplifiedHighlights(node);
    } else {
      removeSimplifiedHighlights(node);
    }
    wordSet[foundIndex].text = currWord;
  }
};

const setToOtherWord = (node) => {
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
  let simplifiedParagraphs = replacedDocumentParagraphs[0].text.split(
    "\\n \\n"
  );
  const tooltipWrap = document.createElement("div");

  Array.from(simplifiedParagraphs).forEach((para) => {
    tooltipWrap.innerHTML += `<p>${para}</p>`;
  });

  tooltipWrap.classList.add("tooltip1", "complex-document");
  const mainDiv = identifyPageMainContent(document.body);

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
  // node.appendChild(tooltipWrap);
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
      id = "sentence" + sentenceIDNum;
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
        id = "sentence" + (sentenceIDNum - 1);
        sentenceStart[nextTextInd] =
          "<span class='complex-sentence' id=" + id + "> " + this[nextTextInd];
        sentenceIDNum++;
      }
      complexCount = 0;

      sentence = [];
    }
  }, complex);
}

function identifyParagraphs() {
  let paraIndex = 0;
  document.querySelectorAll("p").forEach(function (paragraph) {
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
  let doc = document.getElementById("story_text");

  let allParagraphs = document.getElementsByTagName("P");

  complexText.currTabDocumentParagraphs["document" + 1] = [doc.textContent];
  if (complexParagraphs.length > 2) {
    Array.from(allParagraphs).forEach((node) => {
      if (node.innerText.split(" ").length > 20) getPTags(node);
    });
  }

  // Need to verified what needs to be sent
  // complexText.currTabDocumentParagraphs["document" + 1] = [doc.textContent];
  // if (complexParagraphs.length > 2) {
  //   let content = document.getElementById("story_text");
  //   // content.classList.add("complex-document");
  //   getPTags(content);
  // }
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
      identifyParagraphs();
      identifyDocument();
      var output = complex.join(" ");
      node.innerHTML = output;
      complexWordGroup = document.getElementsByClassName("complex-word");
      complexSentencesGroup = document.getElementsByClassName(
        "complex-sentence"
      );
      complexParagraphGroup = document.getElementsByClassName(
        "complex-paragraph"
      );
      complexDocumentParagraphGroup = document.getElementsByClassName(
        "complex-document"
      );
    }
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      replaceText(node.childNodes[i]);
    }
  }
}

// url stuff - not necessary, potentially useful
// var url = null;
// console.log("running along fine");
// chrome.runtime.onMessage.addListener(
//     function (request) {
//         if(request.message === "New URL!") {
//             console.log("passed through");
//             url = request.url;
//             console.log(url);
//         }
//     });
