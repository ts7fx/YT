// Crawl, Search, Inject & Show

/* 
 * 1. Handle responseText
 * 2. Perform Keyword search
 * @param {string} query - user input query
 * @return {object} result - query result in dictionary format
 */
 
 function search(query){
  // 1. Handle responseText in HTML format
  var result = {};
  var regExp = /(<p\b[^>]*>([\s\S]*?)<\/p>)/g; // regex for extracting <p> elements
  var captureGroups = content.match(regExp); // this is a list of <p> elements in raw formats
  for (i in captureGroups) { 
    // parse each <p> element
    // a. pick out timeStamp information
    // b. extract sentence by getting rid of useless characters
    var timeStamp = captureGroups[i].match(/t="(\d*?)"/)[1];
    // if length is less than 4, means single-digit timestamp. e.g., @30 is @3 seconds.
    if (timeStamp.length < 4){
      timeStamp += '00';
      timeStamp = +timeStamp;
    }
    timeStamp = +timeStamp;
    timeStamp /= 1000;
    var sentence = captureGroups[i].replace(/<[^>]*>/g, ''); // substitute unwant chars with empty ones
    result[timeStamp] = sentence; // now result contains (timeStamp : sentence) key-value pairs
  } 
  // 2. Perform keyword search
  for (time in result){
    if (query.length == 0){
      break;
    }
    var currentLine = result[time];
    var queryLowerCase = query.toLowerCase();
    if (currentLine.toLowerCase().indexOf(queryLowerCase) != -1){
      var beg = currentLine.toLowerCase().indexOf(queryLowerCase);
      var queryActualCase = currentLine.substr(beg, queryLowerCase.length);
      var li = handleResult(queryActualCase, time, currentLine);
      document.getElementById("resultPanel").appendChild(li);
    }
  }
}

/*
 * Handle sentence found in the subtitle, return a list item that is ready to be inserted to results panel.
 * @param {String} query - user input
 * @param {String} timeStamp - timeStamp of sentence
 * @param {String} sentence - sentence itself
 * @return {Object} listElement - ready-to-use list item
 */
 function handleResult(query, timeStamp, sentence){
  // temp helper functions
  String.prototype.replaceAll = function(strReplace, strWith) {
    // See http://stackoverflow.com/a/3561711/556609
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var reg = new RegExp(esc, 'ig');
    return this.replace(reg, strWith);
  };
  str_pad_left = function(string,pad,length){
    return (new Array(length+1).join(pad)+string).slice(-length);
  };

  var li = document.createElement("li");
  li.className = "list-group-item";
  // find query in sentence, highlight it 
  sentence = sentence.replaceAll(query,"<b style='color:#e74c3c'>"+query+"</b>"); 
  // format time
  var minutes = Math.floor(timeStamp / 60);
  var seconds = parseInt(timeStamp%60);
  var finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
  // put time & sentence together
  li.innerHTML = finalTime + ' ' + sentence;
  // add event listener for click
  li.addEventListener("click", function(){
    var video = document.getElementsByTagName("video")[0];
    video.currentTime = Number(timeStamp);
  });
  return li;
}

/* 
 * Initiate search box with instant search feature
 * @return {void}
 */
 function buildSearchBox(){
  var container = document.getElementById("watch-header");
  var searchBox = document.createElement('INPUT'); 
  var listGroup = document.createElement("UL");
  searchBox.id = "searchBox";
  listGroup.id = "resultPanel";
  listGroup.className = "list-group";
  
  searchBox.addEventListener("keyup", function(){
    document.getElementById("resultPanel").innerHTML = ''; // clean the result panel for every new search
    var text = document.getElementById("searchBox").value;
    search(text);
  });

  container.insertBefore(listGroup, container.childNodes[0]);
  container.insertBefore(searchBox, container.childNodes[0]);
}

var content = '';
var subURL = '';
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var crawler = new XMLHttpRequest();
    crawler.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        content = crawler.responseText;
        subURL = request.url;
        buildSearchBox();
        console.log('v_id: ' + request.id + ' url:' + subURL);
      }
    };
    crawler.open("GET", request.url, true);
    crawler.send();
  });

