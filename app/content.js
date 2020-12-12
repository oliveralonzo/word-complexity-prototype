// construct list for id-text association
const currTabWords = "url..."
var complexText = { currTabWords: {}, currTabSentences: {} };
var sentenceIDNum = 21;
var complexWordGroup = null;
var complexSentencesGroup = null;
var replacedWords = null;
var replacedSentences = null;
var textSetting = null;
var idx = 0; // used for id index of words


// find all <p> tags and highlight words with length greater than 6
const paragraphs = document.getElementsByTagName("p");

for (var i = 0; i < paragraphs.length; i++) {
    let currElement = paragraphs[i];
    replaceText(currElement);
}



// send message to background.js with collected complex words, sentences etc
chrome.runtime.sendMessage({
    wordUpdate: "True",
    toSimplify: complexText["currTabWords"],
    toSimplifySentence: complexText["currTabSentences"]
});



/*
* Listen for textSetting value
*  - disables click for sentences, given "Word" setting
        - removeEventListener used - as spans are made clickable
*  - dissable click for words, given "Sentence" setting
*       - element.disabled used to turn off ability to click button element for words
*/
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.textSetting === 'Sentence') {
            //textSetting = request.textSetting;
            if (textSetting != 'Sentence') {
                Array.from(complexWordGroup).forEach(function (element) {
                    element.disabled = true;
                });
                Array.from(complexSentencesGroup).forEach(function (element) {
                    element.addEventListener("click", function changeWord(event) {
                        setToOtherWord(event.target, request.textSetting);
                    });
                });
                textSetting = request.textSetting;
            }

        } else if (request.textSetting === 'Word') {
            if (textSetting != 'Word') {
                Array.from(complexSentencesGroup).forEach(function (element) {
                    element.removeEventListener("click", function changeWord(event) {
                        setToOtherWord(event.target, request.textSetting);
                    })
                });

                Array.from(complexWordGroup).forEach(function (element) {
                    element.disabled = false;
                    element.addEventListener("click", function changeWord(event) {
                        setToOtherWord(event.target, request.textSetting);
                    });
                });
                textSetting = request.textSetting;
            }

        }
    });


/*
* Listen for highlight value
*  - if highlight true
        - supply highlight class for paragraph or text
*  - if highlight false
*       - remove highlight class for paragraph text
*/
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.highlight === "True") {

            let elements = null;
            if (textSetting === "Word") {
                elements = document.getElementsByClassName('complex-word');
                [].forEach.call(elements, function (word) {
                    word.classList.add('highlight-word');
                });
            } else if (textSetting === "Sentence") {
                elements = document.getElementsByClassName('complex-sentence');
                [].forEach.call(elements, function (word) {
                    word.classList.add('highlight-sentence');
                });
            }
        } else {
            if (textSetting === "Word") {
                let highlighted = document.getElementsByClassName("highlight-word");
                // If it exists, remove it.
                if (highlighted.length > 0) {
                    while (highlighted.length) {
                        highlighted[0].classList.remove("highlight-word");
                    }
                }
            } else {
                let highlighted = document.getElementsByClassName("highlight-sentence");
                // If it exists, remove it.
                if (highlighted.length > 0) {
                    while (highlighted.length) {
                        highlighted[0].classList.remove("highlight-sentence");
                    }
                }
            }
        }
    });




/*
* Listener to pull in simplified words
* expects {type: "InPlace", sentenceStart: stringified list of new words, textType: "word"/"sentence"/etc}
* set complexWordGroup, complexSentencesGroup to appropriate element groups
*/
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.type === "InPlace") {
            newWords = request.toChange;
            newWords = JSON.parse(newWords);
            if (request.textType === "sentence") {
                replacedSentences = JSON.parse(request.toChange);
            } else {
                replacedWords = JSON.parse(request.toChange);
            }

        } else {
            console.log("No words received.")
        }
    });

// swap word in place
function setToOtherWord(node, type) {
    let id = node.id;
    let wordSet = null;
    if (type === 'Sentence') {
        wordSet = replacedSentences;
    } else if (type === 'Word') {
        wordSet = replacedWords;
    }
    let complex = wordSet.find(({ wordID }) => wordID === id);
    let foundIndex = wordSet.findIndex(word => word.wordID == id);
    let currWord = node.innerText;
    node.innerText = complex.text;
    wordSet[foundIndex].text = currWord;
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
    if (wordToCheck.length > 6 && !wordToCheck.includes("http") && matchData.length == 1) {
        let id = "id" + index;
        complexText.currTabWords[id] = [wordToCheck];
        complexTagged = "<button class='link complex-word-button' ><span class='complex-word' id= " + id + ">" + wordToCheck + "</span></button>";
        freshHTML = word.substring(0, matchInd) + complexTagged + word.substring(matchInd + matchLength, word.length);
        ++idx;
        return freshHTML;
    }
    else {
        return word;
    }
}


/*
* Remove highlight tag to unhighlight text
*/
function unHighlightWord(word) {
    if (word.includes('highlight')) {
        var clean_word = word.replace("highlight", "");
        return clean_word;
    }
    else {
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
        if (text.includes('class=\'complex-word\'')) {
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
                var htmlToCleanObject = document.createElement('div');
                htmlToCleanObject.innerHTML = fullSentence;
                let cleanSentence = htmlToCleanObject.innerText;
                htmlToCleanObject.remove();

                let id = "sentence" + (sentenceIDNum - 1);
                complexText.currTabSentences[id] = [[cleanSentence, fullSentence]];
            } else {
                console.log("Sentence does not qualify.");
                sentenceIDNum--;
            }
            sentenceStart = {};
            nextTextInd = index + 1;
            if (this[nextTextInd] != null) {
                id = "sentence" + (sentenceIDNum - 1);
                sentenceStart[nextTextInd] = "<span class='complex-sentence' id=" + id + "> " + this[nextTextInd];
                sentenceIDNum++;
            }
            complexCount = 0;

            sentence = [];
        }
    }, complex);

}


/*
* Drills down to find text within element to replace
* as of now, only being passed in <p> nodes from document
* - approach roughly from easier project
*/
function replaceText(node) {
    if (node.childNodes.length == 1) {
        if (node.parentNode &&
            node.parentNode.nodeName === 'TEXTAREA') {
            return;
        }

        if (node.innerHTML.length <= node.innerText.length + 2 || node.innerHTML.length >= node.innerText.length) {
            var currText = node.innerHTML.split(' ');
            var complex = currText.map((word) => {
                var wordWithNewTag = identifyWords(word, idx);
                return wordWithNewTag;
            });
            identifySentences(complex);
            var output = complex.join(" ");
            node.innerHTML = output;
            complexWordGroup = document.getElementsByClassName('complex-word-button');
            complexSentencesGroup = document.getElementsByClassName('complex-sentence');
        }
    }
    else {
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

