console.log("content js on");
document.addEventListener("DOMContentLoaded", function (event) {
    // var complexWordGroup = document.getElementsByClassName('complex-word')
    // Array.from(complexWordGroup).forEach(function (element) {
    //     element.addEventListener("click", function changeWord(event) {
    //         console.log("we got a click", event);
    //         console.log(event.target);

    //     });
    // });

    });
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

// console.log("running along fine b");

//const currTabURL = new URL(url).origin;

// construct list for id-text association
const currTabURL = "url..."
var complexWords = {currTabURL:{}};
console.log(complexWords.currTabURL);
var wordsIdentified = false;
var freshWords = null;
var canConvert = false;
var newWords = null;


// find all <p> tags and highlight words with length greater than 6
// need to find a way to avoid picking up non-letters + urls
const paragraphs = document.getElementsByTagName("p");
idx = 0;
for (var i = 0; i < paragraphs.length; i++) {
    let currElement = paragraphs[i];
    replaceText(currElement);
    // var currText = paragraphs[i].textContent.split(' ');
    // console.log(currText);
    // var complex = currText.map((word) => {
    //     console.log(word);
    //     var wordWithNewTag = identifyWords(word, idx);
    //     idx += 1
    //     return wordWithNewTag;
    // });
    // var output = complex.join(" ");
    // paragraphs[i].textContent = output;

}
console.log(complexWords);
console.log(Object.keys(complexWords["currTabURL"]).length);
wordsIdentified = true;
console.log("Picked up words:" + wordsIdentified)
chrome.runtime.sendMessage( {
    wordUpdate: "True",
    toSimplify: complexWords["currTabURL"]});

// listener - highlight or unhighlight words
chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.mash === "True") {
            console.log("got highlight message bckg");

            let elements = document.getElementsByClassName('complex-word');
            console.log(" n highlighted");
            //elements.forEach( word => word.classList.add('highlight'));
            [].forEach.call(elements, function (word) {
                console.log("highlight " + word)
                word.classList.add('highlight');
            });
        } else {
            let highlighted = document.getElementsByClassName("highlight");
            var numm = 0;
            // If it exists, remove it.
            if (highlighted.length > 0) {
                console.log("unhighlight");
                while (highlighted.length) {
                    numm = numm + 1;
                    highlighted[0].classList.remove("highlight");
                }
            }
            console.log("highlighted " + numm);
        }
    });



//listener - replace words or not
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.type === "InPlace") {
            canConvert = true;
            console.log(" bout to replace in place");
            console.log(request.toChange);
            //elements.forEach( word => word.classList.add('highlight'));
            newWords = request.toChange;
            newWords = JSON.parse(newWords);
            console.log(newWords);
            // newWords.forEach( function(wordObj) {
            //     console.log(wordObj);
            //     console.log(wordObj.wordID)
            //     document.getElementById(wordObj.wordID).innerText = wordObj.word;

            // });

            var complexWordGroup = document.getElementsByClassName('complex-word-button')
            Array.from(complexWordGroup).forEach(function (element) {
                element.addEventListener("click", function changeWord(event) {
                    console.log("we got a click", event);
                    setToOtherWord(event.target)
        
                });
            });
        } else {
            console.log("No words received.")
        }
        return true;
    });

// swap word in place
function setToOtherWord(node){
    let id = node.id;
    console.log(id)
    let complex = newWords.find(({wordID}) => wordID === id);
    let foundIndex = newWords.findIndex(word => word.wordID == id);
    
    let currWord = node.innerText;
    node.innerText = complex.word;
    newWords[foundIndex].word = currWord;
    //newWords[id] = currWord;
}


// helper function to identify words with length above 6 - identify complex words
// increase index for IDs
// add span with id and highlight class for 
function identifyWords(word, index) {
    //wordToCheck = word.replace(/[^A-Za-z]/g, '');
    //wordToCheck = word;
    console.log("Complex, unclean state: ", word);
    matchInd = word.search(/\b(\w+)\b/g);
    matchData = word.match(/\b(\w+)\b/g);
    if(matchData === null){
        console.log("yikes")
        return word;
    }
    console.log(matchInd, matchData, matchData[0].length)
    // need to handle when length is greater than two
    wordToCheck = matchData[0];
    matchLength = matchData[0].length;
   // console.log("cleaned pre complex word " + wordToCheck )
    if (wordToCheck.length > 6 && !wordToCheck.includes("http") && matchData.length == 1) {
       // complexWords.push(word);
        let id = "id"+index;
        complexWords.currTabURL[id] = [wordToCheck];
        console.log("Complex word " + id + " word is " + wordToCheck + " word length is " + word.length);
        complexTagged = "<button class='link complex-word-button'><span class='complex-word' id= "+ id +">" + wordToCheck + "</span></button>";
        freshHTML = word.substring(0,matchInd) + complexTagged + word.substring(matchInd + matchLength, word.length);
        console.log(freshHTML)
        ++idx;
        return freshHTML;
    }
    else {
        return word;
    }
}


// document.querySelectorAll('.complex-word').forEach(item => {
//     item.addEventListener('click', event => {
//         newWord = freshWords[item.id];
//         item.innerText = wordObj.word;
//     })
//   })

// remove highlight tag
function unHighlightWord(word) {
    if (word.includes('highlight')) {
        var clean_word = word.replace("highlight", "");
        console.log(clean_word);
        return clean_word;
    }
    else {
        console.log("not matching")
        return word;
    }
}


// drill down to find text
function replaceText (node) {
    if (node.childNodes.length == 1) {
      if (node.parentNode &&
          node.parentNode.nodeName === 'TEXTAREA') {
        return;
      }
      console.log([node]);
      if(node.innerHTML.length <= node.innerText.length+2 || node.innerHTML.length >= node.innerText.length) {
        console.log("****SELECTED NODE******")
        var currText = node.innerHTML.split(' ');
        var complex = currText.map((word) => {
        var wordWithNewTag = identifyWords(word, idx);
        return wordWithNewTag;
        });
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
    
