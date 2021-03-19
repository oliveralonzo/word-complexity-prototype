// content.js - modification and behaviors for active tab page

// construct list for id-text association
const currTabWords = "url...";
var complexText = {
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

//Initial values
var originalComplexWordGroup = [];
var originalComplexSentencesGroup = [];
var originalComplexParagraphGroup = [];
var originalComplexDocumentParagraphGroup = [];

var replacedWords = null;
var replacedSentences = null;
var replacedParagraphs = null;
var replacedDocumentParagraphs = null;
var textSetting = null;
var highlightToggle = null;

var complexDocumentParagraphsCount = 0;

chrome.storage.sync.get(["highlight"], (status) => {
  if (status.value === null) {
    highlightToggle = false;
  } else {
    highlightToggle = status.value;
  }
});

chrome.storage.sync.get("textSetting", (status) => {
  if (status.textSetting === null) {
    textSetting = "Word";
  } else {
    textSetting = status.textSetting;
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

console.log(
  "original complexPara ---> ",
  originalComplexDocumentParagraphGroup
);

// send message to background.js with collected complex words, sentences etc
chrome.runtime.sendMessage({
  wordUpdate: "True",
  toSimplify: complexText["currTabWords"],
  toSimplifySentence: complexText["currTabSentences"],
  toSimplifyParagraph: complexText["currTabParagraphs"],
  toSimplifyDocument: complexText["currTabDocumentParagraphs"],
});

function removePreviousAttributes() {
  let complexGroup = getGroupType(request.textSetting);
  removeListeners(complexGroup, request.textSetting);
  removeHighlights("highlight-" + textSetting.toLowerCase());
}

/*
* Listen for textSetting value
*  - disables click for sentences, given "Word" setting
        - removeEventListener used - as spans are made clickable
*  - dissable click for words, given "Sentence" setting
*       - element.disabled used to turn off ability to click button element for words
*/
chrome.runtime.onMessage.addListener(function (request) {
  if (request.settingType === "howMuch") {
    if (request.textSetting === "Sentence") {
      console.log("Received text-type = Sentence input from popup", request);

      if (textSetting !== "Sentence") {
        let complexGroup = getGroupType(request.textSetting);
        // removeListeners(complexGroup, request.textSetting);
        removeListeners();
        removeHighlights();
        // removeHighlights("highlight-" + textSetting.toLowerCase());
      }

      textSetting = request.textSetting;

      for (let i = 0; i < complexSentencesGroup.length; i++) {
        if (
          complexSentencesGroup[i].innerHTML !==
          originalComplexSentencesGroup[i]
        ) {
          removeSimplifiedHighlights(complexSentencesGroup[i]);
          replacedSentences[i].text = complexSentencesGroup[i].innerText;
        }
        complexSentencesGroup[i].innerHTML = originalComplexSentencesGroup[i];
      }

      if (highlightToggle) {
        addHighlights(
          "highlight-" + request.textSetting.toLowerCase(),
          "complex-" + request.textSetting.toLowerCase()
        );
      }

      Array.from(complexSentencesGroup).forEach(function (element) {
        element.addEventListener("click", changeText);
      });
    } else if (request.textSetting === "Word") {
      console.log("Received text-type = word from popup", request);

      if (textSetting != "Word") {
        // let complexGroup = getGroupType(request.textSetting);
        // removeHighlights("highlight-" + textSetting.toLowerCase());
        // removeListeners(complexGroup, request.textSetting);

        removeListeners();
        removeHighlights();
      }

      textSetting = request.textSetting;

      for (let i = 0; i < complexWordGroup.length; i++) {
        if (complexWordGroup[i].innerHTML !== originalComplexWordGroup[i]) {
          removeSimplifiedHighlights(complexWordGroup[i]);
          replacedWords[i].text = complexWordGroup[i].innerText;
        }
        complexWordGroup[i].innerHTML = originalComplexWordGroup[i];
      }

      if (highlightToggle) {
        addHighlights(
          "highlight-" + request.textSetting.toLowerCase(),
          "complex-" + request.textSetting.toLowerCase()
        );
      }
      Array.from(complexWordGroup).forEach(function (element) {
        element.addEventListener("click", changeText);
      });
    } else if (request.textSetting === "Paragraph") {
      console.log("Received text-type = Paragraph input from popup", request);

      if (textSetting != "Paragraph") {
        // let complexGroup = getGroupType(request.textSetting);
        // removeHighlights("highlight-" + textSetting.toLowerCase());
        // removeListeners(complexGroup, request.textSetting);
        removeListeners();
        removeHighlights();
      }

      textSetting = request.textSetting;

      for (let i = 0; i < complexParagraphGroup.length; i++) {
        if (
          complexParagraphGroup[i].innerHTML !==
          originalComplexParagraphGroup[i]
        ) {
          removeSimplifiedHighlights(complexParagraphGroup[i]);
          replacedParagraphs[i].text = complexParagraphGroup[i].innerText;
        }
        complexParagraphGroup[i].innerHTML = originalComplexParagraphGroup[i];
      }

      if (highlightToggle) {
        addHighlights(
          "highlight-" + request.textSetting.toLowerCase(),
          "complex-" + request.textSetting.toLowerCase()
        );
      }

      Array.from(complexParagraphGroup).forEach(function (element) {
        element.addEventListener("click", changeText);
      });
    } else if (request.textSetting === "Document") {
      console.log("Received text-type = Document input from popup", request);

      if (textSetting != "Document") {
        // let complexGroup = getGroupType(request.textSetting);
        // removeHighlights("highlight-" + textSetting.toLowerCase());
        // removeListeners(complexGroup, request.textSetting);
        removeListeners();
        removeHighlights();
      }

      textSetting = request.textSetting;

      let text = "";
      let simplerParagraphs = replacedDocumentParagraphs[0].text.split(
        "\\n \\n"
      );

      for (let i = 0; i < originalComplexDocumentParagraphGroup.length; i++) {
        if (
          complexDocumentParagraphGroup[i].innerHTML !==
          originalComplexDocumentParagraphGroup[i]
        ) {
          removeSimplifiedHighlights(complexDocumentParagraphGroup[i]);

          let currDoc = complexDocumentParagraphGroup[i].innerHTML;
          complexDocumentParagraphGroup[i].innerHTML = simplerParagraphs[i];

          text += currDoc + "\\n \\n";
        }
      }
      if (text) {
        replacedDocumentParagraphs[0].text = text.replace(
          /^\\n+|\\n \\n+$/g,
          ""
        );
      }

      // if (
      //   complexDocumentParagraphGroup !== originalComplexDocumentParagraphGroup
      // ) {
      //   complexDocumentParagraphGroup = [];
      //   for (let i = 0; i < originalComplexDocumentParagraphGroup.length; i++) {
      //     complexDocumentParagraphGroup.push(
      //       originalComplexDocumentParagraphGroup[i].innerHTML
      //     );
      //   }
      // }

      console.log(
        "Length of complexDoc~~~~",
        complexDocumentParagraphGroup.length
      );

      // if (
      //   complexDocumentParagraphGroup !== originalComplexDocumentParagraphGroup
      // ) {
      //   for (let i = 0; i < complexDocumentParagraphGroup.length; i++) {
      //     removeSimplifiedHighlights(complexDocumentParagraphGroup[i]);
      //   }
      //   complexDocumentParagraphGroup = originalComplexDocumentParagraphGroup;
      // }

      if (highlightToggle) {
        addHighlights(
          "highlight-" + request.textSetting.toLowerCase(),
          "complex-" + request.textSetting.toLowerCase()
        );
      }

      Array.from(complexDocumentParagraphGroup).forEach(function (element) {
        element.addEventListener("click", changeText);
      });
    }
  }
});

const changeText = (event) => {
  setToOtherWord(event.target, textSetting);
};

/*
* Listen for highlight value
*  - if highlight true
        - supply highlight class for paragraph or text
*  - if highlight false
*       - remove highlight class for paragraph text
*/
chrome.runtime.onMessage.addListener(function (request) {
  if (request.settingType == "highlightComplex") {
    if (request.highlight === "True") {
      chrome.storage.sync.set({ highlight: true });
      highlightToggle = true;
      if (textSetting === "Word") {
        addHighlights("highlight-word", "complex-word");
      } else if (textSetting === "Sentence") {
        addHighlights("highlight-sentence", "complex-sentence");
      } else if (textSetting === "Paragraph") {
        addHighlights("highlight-paragraph", "complex-paragraph");
      }
    } else {
      chrome.storage.sync.set({ highlight: false });
      highlightToggle = false;
      if (textSetting === "Word") {
        // removeHighlights("highlight-word");
        removeHighlights();
      } else if (textSetting === "Sentence") {
        // removeHighlights("highlight-sentence");
        removeHighlights();
      } else if (textSetting === "Paragraph") {
        removeHighlights();
        // removeHighlights("highlight-paragraph");
      } else if (textSetting === "Document") {
        removeHighlights();
      }
    }
  }
});

// function removeHighlights(className) {
//   console.log("Removed highlights - ", className);
//   let highlighted = document.getElementsByClassName(className);
//   while (highlighted.length) {
//     highlighted[0].classList.remove(className);
//   }
// }

function removeHighlights() {
  let className = `highlight-${this.textSetting.toLowerCase()}`;
  let highlighted = document.getElementsByClassName(className);
  // while (highlighted.length) {
  //   highlighted[0].classList.remove(className);
  // }
  Array.from(highlighted).forEach((element) => {
    element.classList.remove(className);
  });
}

function removeSimplifiedHighlights(element) {
  element.classList.remove(`highlight-simplified-${textSetting.toLowerCase()}`);
}

function addHighlights(styleClass, className) {
  console.log("Added highlights - ", className);
  elements = document.getElementsByClassName(className);
  [].forEach.call(elements, function (word) {
    word.classList.add(styleClass);
  });
}

// function removeListeners(groupType) {
//   groups = [
//     complexWordGroup,
//     complexSentencesGroup,
//     complexParagraphGroup,
//     complexDocumentParagraphGroup,
//   ];
//   for (let i = 0; i < groups.length; i++) {
//     if (groups[i].length > 0 && groups[i] != groupType) {
//       Array.from(groups[i]).forEach(function (element) {
//         element.removeEventListener("click", changeText);
//       });
//     }
//   }
// }

function removeListeners() {
  const groups = {
    Word: complexWordGroup,
    Sentence: complexSentencesGroup,
    Paragraph: complexParagraphGroup,
    Document: complexDocumentParagraphGroup,
  };
  Array.from(groups[textSetting]).forEach(function (element) {
    element.removeEventListener("click", changeText);
  });
}

function getGroupType(textSetting) {
  if (textSetting === "Word") {
    return complexWordGroup;
  } else if (textSetting === "Paragraph") {
    return complexParagraphGroup;
  } else if (textSetting === "Document") {
    return complexDocumentParagraphGroup;
  } else if (textSetting === "Sentence") {
    return complexSentencesGroup;
  }
}

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
      console.log(
        "replacedDocumentParagraphs ---> ",
        replacedDocumentParagraphs
      );
    }
  } else {
    console.log("No words received.");
  }
});

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

const setToOtherWord = (node, type) => {
  let id = node.id;
  let wordSet = null;
  if (type === "Sentence") {
    wordSet = replacedSentences;
  } else if (type === "Word") {
    wordSet = replacedWords;
  } else if (type === "Paragraph") {
    wordSet = replacedParagraphs;
  } else if (type === "Document") {
    wordSet = replacedDocumentParagraphs;

    let simplerParagraphs = wordSet[0].text.split("\\n \\n");
    wordSet[0].text = "";
    Array.from(complexDocumentParagraphGroup).forEach((node) => {
      let currDoc = node.innerHTML;
      node.innerHTML = simplerParagraphs.shift();
      if (highlightToggle) {
        if (
          !node.classList.contains(
            `highlight-simplified-${textSetting.toLowerCase()}`
          )
        ) {
          addSimplifiedHighlights(node);
        } else {
          removeSimplifiedHighlights(node);
        }
      }
      wordSet[0].text += currDoc + "\\n \\n";
    });
    wordSet[0].text = wordSet[0].text.replace(/^\\n+|\\n \\n+$/g, "");
    console.log("complexDoc", wordSet);
  }

  if (type !== "Document") {
    let complex = wordSet.find(({ wordID }) => wordID === id);
    let foundIndex = wordSet.findIndex((word) => word.wordID == id);
    let currWord = node.innerHTML;
    node.innerHTML = complex.text;
    if (highlightToggle) {
      if (
        !node.classList.contains(
          `highlight-simplified-${textSetting.toLowerCase()}`
        )
      ) {
        addSimplifiedHighlights(node);
      } else {
        removeSimplifiedHighlights(node);
      }
    }
    wordSet[foundIndex].text = currWord;
  }
};

function addSimplifiedHighlights(element) {
  element.classList.add(`highlight-simplified-${textSetting.toLowerCase()}`);
}

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
    complexTagged =
      "<button class='link complex-word-button' ><span class='complex-word' id= " +
      id +
      ">" +
      wordToCheck +
      "</span></button>";
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
 * Remove highlight tag to unhighlight text
 */
function unHighlightWord(word) {
  if (word.includes("highlight")) {
    var clean_word = word.replace("highlight", "");
    return clean_word;
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
    // paragraph.classList.add("complex-paragraph");
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
      // addHighlights("highlight-paragraph", "complex-paragraph");
    }
    // paragraph.classList.toggle('pilcrow');
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
      complexWordGroup = document.getElementsByClassName("complex-word-button");
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
