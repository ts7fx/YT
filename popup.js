document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('git').addEventListener("click", function(){ // add event listener for click
    chrome.tabs.create({ url: 'https://github.com/ts7fx/YT' });
  });
});
