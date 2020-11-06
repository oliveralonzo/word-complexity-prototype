console.log("content js on");
var words_to_send = [];

// find all <p> tags and highlight words with length greater than 6
chrome.runtime.onMessage.addListener(
    function (request) {
        var paragraphs = document.getElementsByTagName("p");
        if (request.mash === "True") {
            console.log("can highlight now cntnt");
            
            for (var i = 0; i < paragraphs.length; i++) {
                var currText = paragraphs[i].innerHTML.split(" ");

                var complex = currText.map(word => toHighlightWord(word));

                var output = complex.join(" ");
                console.log(output);
                paragraphs[i].innerHTML = output;

            }
        } else {
            // for (var i = 0; i < paragraphs.length; i++) {
            //     var currText = paragraphs[i].innerHTML.split(" ");

            //     var complex = currText.map(word => unHighlightWord(word));

            //     var output = complex.join(" ");
            //     paragraphs[i].innerHTML = output;

            // }  
            
            let highlighted = document.getElementsByClassName("highlight");
            console.log(highlighted.length);
            console.log(highlighted[1]);
            var numm = 0;
            // If it exists, remove it.
            if(highlighted.length > 0) { 
                console.log("my js is ruf");
                while(highlighted.length){
                    numm = numm + 1;
                    highlighted[0].classList.remove("highlight");
                    // // get the element's parent node
                    // var parent = el.parentNode;

                    // // move all children out of the element
                    // while (el.firstChild) parent.insertBefore(el.firstChild, el);

                    // // remove the empty element
                    // parent.removeChild(el);
                    highlighted[0].replace("<span class>", "");
                    highlighted[0].replace("</span>", "");    
                }
            }
            console.log("replaced " + numm);
        }
    });



// helper function to identify words with length above 6
function toHighlightWord(word) {
    if (word.length > 6) {
        words_to_send.push(word);
        return "<span class='highlight'>" + word + "</span>";
    }
    else {
        return word;
    }
}

// remove highlight tag
function unHighlightWord(word) {
    if (word.includes('highlight')) {
        var clean_word = word.replace("highlight","");
        console.log(clean_word);
        return clean_word;
    }
    else {
        console.log("not matching")
        return word;
    }
}
