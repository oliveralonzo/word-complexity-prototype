

// construct list for id-text association
const currTabURLWord = "url..."
var complexWords = { currTabURLWord: {}, currTabURLSentence: {} };
//console.log(complexWords.currTabURLWord);
var wordsIdentified = false;
var freshWords = null;
var canConvert = false;
var startFound = false;
var endFound = false;
var sentenceIDNum = 21;
var complexWordGroupWords = null;
var complexWordGroupSentences = null;
var replacedWords = null;
var replacedSentences = null;
var textSetting = null;


// find all <p> tags and highlight words with length greater than 6
const paragraphs = document.getElementsByTagName("p");
var idx = 0;
for (var i = 0; i < paragraphs.length; i++) {
    let currElement = paragraphs[i];
    replaceText(currElement);
}


wordsIdentified = true;

// send message to background.js with collected complex words, sentences etc
chrome.runtime.sendMessage({
    wordUpdate: "True",
    toSimplify: complexWords["currTabURLWord"],
    toSimplifySentence: complexWords["currTabURLSentence"]
});

// Listen for textSetting values

/*
* Listen for textSetting value
*  - disables click for sentences, given "Word" setting
        - removeEventListener used - as spans are made clickable
*  - dissable click for words, given "Sentence" setting
*       - element.disabled used to turn off ability to click button element for words
*/
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.textSetting === "Sentence") {
            textSetting = request.textSetting;
            //console.log(complexWordGroupWords, complexWordGroupSentences)
            Array.from(complexWordGroupWords).forEach(function (element) {
                element.disabled = true;
            });
            Array.from(complexWordGroupSentences).forEach(function (element) {
                console.log("doing anything at all", element);
                element.addEventListener("click", function changeWord(event) {
                    setToOtherWord(event.target, request.textSetting)
                });
            });

        } else if (request.textSetting === "Word") {
            textSetting = request.textSetting;
            Array.from(complexWordGroupSentences).forEach(function (element) {
                element.removeEventListener("click", function changeWord(event) {
                    console.log("making ", event.target, " clickable");
                    setToOtherWord(event.target, request.textSetting)
                })
            });

            Array.from(complexWordGroupWords).forEach(function (element) {
                element.disabled = false;
                element.addEventListener("click", function changeWord(event) {
                    console.log("making ", event.target, " clickable");
                    setToOtherWord(event.target, request.textSetting)
                });
            });

        }
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

        if (request.highlight === "True") {
            let elements = null;
            // if(request.textType === "Word") {}
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
                var numm = 0;
                // If it exists, remove it.
                if (highlighted.length > 0) {
                    while (highlighted.length) {
                        numm = numm + 1;
                        highlighted[0].classList.remove("highlight-word");
                    }
                }
            } else {
                let highlighted = document.getElementsByClassName("highlight-sentence");
                var numm = 0;
                // If it exists, remove it.
                if (highlighted.length > 0) {
                    while (highlighted.length) {
                        numm = numm + 1;
                        highlighted[0].classList.remove("highlight-sentence");
                    }
                }
            }
        }
    });




/*
* Listener to pull in simplified words
*/
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.type === "InPlace") {
            console.log("THIS OCCURED");
            canConvert = true;
            newWords = request.toChange;
            newWords = JSON.parse(newWords);
            if (request.textType === "sentence") {
                // console.log("Should b sentences");
                replacedSentences = JSON.parse(request.toChange);
                console.log("Should b sentences", replacedSentences);
            } else {
                replacedWords = JSON.parse(request.toChange);
                console.log("should be words", replacedWords);
            }

            complexWordGroupWords = document.getElementsByClassName('complex-word-button');
            complexWordGroupSentences = document.getElementsByClassName('complex-sentence');

        } else {
            console.log("No words received.")
        }
        //    return true;
    });

// swap word in place
function setToOtherWord(node, type) {
    let id = node.id;
    let wordSet = null;
    if (type === 'Sentence') {
        wordSet = replacedSentences;
        console.log("checking some node", node, wordSet);
    } else if (type === 'Word') {
        wordSet = replacedWords;
    }
    let complex = wordSet.find(({ wordID }) => wordID === id);
    let foundIndex = wordSet.findIndex(word => word.wordID == id);
    console.log(complex, foundIndex, node.innerText);
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
        complexWords.currTabURLWord[id] = [wordToCheck];
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
            console.log("checking ", value);
            if (isEnd === true) {
                console.log("adding ", value)
                sentenceEndIndices.push(index);
            }
        }
    });

    var currEndInd = 0;
    var toChange = {};
    var complexCount = 0;
    var nextTextInd = 0;
    var sentence = [];
    var id = null;

    // loop over complex text list
    complex.forEach(function (text, index) {
        sentence.push(text);

        if (text.includes('class=\'complex-word\'')) {
            complexCount++;
        }


        if (index === 0) {
            // With the very first item in complex, create a modified start, with an id and a beginning span
            id = "sentence" + sentenceIDNum;
            toChange[0] = "<span class='complex-sentence' id=" + id + ">" + text;
            console.log("This is the new  p intro for the current sentence ", toChange);
            sentenceIDNum++;
        } else if (index === sentenceEndIndices[currEndInd]) {
            if (complexCount >= 7) {
                console.log("This is the end.");
                this[index] = text + "</span>";

                console.log("Added on ending span, ", this[index]);

                currEndInd++;
                startVals = Object.entries(toChange)[0];
                this[startVals[0]] = startVals[1];

                let fullSentence = sentence.join(" ");
                var htmlObject = document.createElement('div');
                htmlObject.innerHTML = fullSentence;
                let cleanSentence = htmlObject.innerText;
                htmlObject.remove();
                let id = "sentence" + (sentenceIDNum - 1);
                //sentenceIDNum++;
                complexWords.currTabURLSentence[id] = [[cleanSentence, fullSentence]];
                // toChange = {};
            } else {
                console.log("Sentence does not qualify.");
                sentenceIDNum--;
            }
            toChange = {};
            nextTextInd = index + 1;
            if (this[nextTextInd] != null) {
                id = "sentence" + (sentenceIDNum - 1);
                toChange[nextTextInd] = "<span class='complex-sentence' id=" + id + "> " + this[nextTextInd];
                console.log("This is the new p intro b for the current sentence ", toChange);
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
*/
function replaceText(node) {
    if (node.childNodes.length == 1) {
        if (node.parentNode &&
            node.parentNode.nodeName === 'TEXTAREA') {
            return;
        }
        console.log([node]);
        if (node.innerHTML.length <= node.innerText.length + 2 || node.innerHTML.length >= node.innerText.length) {
            var currText = node.innerHTML.split(' ');
            console.log("Checking old\n", node.innerHTML);
            var complex = currText.map((word) => {
                var wordWithNewTag = identifyWords(word, idx);
                return wordWithNewTag;
            });
            console.log(complex);
            identifySentences(complex);
            console.log(complexWords.currTabURLSentence);
            var output = complex.join(" ");
            node.innerHTML = output;
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

