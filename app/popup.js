document.addEventListener("DOMContentLoaded", function(event) {
  console.log("popup js on");
  var checkbox = document.getElementById("togBtn");
  var checkRecord = false;

  // checks for checkbox element present
  // check for "checked" value to start highlight flow - sends messages to background.js
  if(checkbox){
        checkbox.addEventListener('change', function () {
          if (checkbox.checked && checkRecord === false) {
            // fire off event to background script
            console.log('Checked');

            chrome.runtime.sendMessage( {highlight: "True"});
            checkRecord = true;
            

          } else if(checkbox.checked === false && checkRecord === true) {
            // do that
            console.log('Need to unhighlight');
            chrome.runtime.sendMessage( {highlight: "False"});
            checkRecord = false;
          }
        });} else {
            console.log("not loaded");
        }


        
});