console.log("content js on");
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
const currTabURL = "url..."
var complexWords = {currTabURL:{}};
console.log(complexWords.currTabURL);
var wordsIdentified = false;
// find all <p> tags and highlight words with length greater than 6
// need to find a way to void picking up letters
const paragraphs = document.getElementsByTagName("p");
for (var i = 0; i < paragraphs.length; i++) {
    var currText = paragraphs[i].innerHTML.split(" ");
    console.log(" adding span first time");
    var complex = currText.map((word, index) => {
        var wordWithNewTag = identifyWords(word, index);
        return wordWithNewTag;
    });
    var output = complex.join(" ");
    paragraphs[i].innerHTML = output;

}
console.log(complexWords);
console.log(Object.keys(complexWords["currTabURL"]).length);
wordsIdentified = true;
if(Object.keys(complexWords["currTabURL"]).length == 104){
chrome.runtime.sendMessage( {
    wordUpdate: "True",
    toSimplify: complexWords["currTabURL"]});
}

chrome.runtime.onMessage.addListener(
    function (request) {

        if (request.mash === "True") {
            let elements = document.getElementsByClassName('complex-word');
            console.log(" n highlighted");
            //elements.forEach( word => word.classList.add('highlight'));
            [].forEach.call(elements, function (word) {
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
            console.log("replaced " + numm);
        }
    });



// helper function to identify words with length above 6
function identifyWords(word, index) {
    if (word.length > 6) {
       // complexWords.push(word);
        let id = "id"+index;
        complexWords.currTabURL[id] = [word];
        return "<span class='complex-word' id= "+ id +" >" + word + "</span>";
    }
    else {
        return word;
    }
}

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
