class subtitle {
  /** create a subtitle object */
  constructor(content, subURL) {
    this.content = this.cleanContent(content);
    this.subURL = subURL;
  }
  /** clean content, return object in key-value pairs (timeStamp: sentence) */
  cleanContent(responseText){
    // return cleaned content
    var cleanText = {};
    var regExp = /(<p\b[^>]*>([\s\S]*?)<\/p>)/g; // regex for extracting <p> elements
    var captureGroups = responseText.match(regExp); // this is a list of <p> elements in raw formats
    for (var i in captureGroups) { 
      // format timeStamp information
      var timeStamp = captureGroups[i].match(/t="(\d*?)"/)[1];
      if (timeStamp.length < 4){ // handles single digit timestamps
        timeStamp += '00';
        timeStamp = +timeStamp;
      }
      timeStamp = +timeStamp;
      timeStamp /= 1000;
      cleanText[timeStamp] = captureGroups[i].replace(/<[^>]*>/g, ''); // clean sentence and store as (time:sentence)
    } 
    return cleanText;
  }
  /** search for query in this.content, returns an array of li objects */
  search(query){
    var result = [];
    for (var time in this.content){
      var curr = this.content[time];
      var qLowCase = query.toLowerCase();
      if (curr.toLowerCase().indexOf(qLowCase) != -1){
        var beg = curr.toLowerCase().indexOf(qLowCase);
        var ori = curr.substr(beg, qLowCase.length);
        result.push(this.handleResult(ori, time, curr));
      }
    }
    return result; 
  }
  /** temp helper func */
  str_pad_left(string,pad,length){
    return (new Array(length+1).join(pad)+string).slice(-length);
  }
  /** format and return search result */
  handleResult(query, timeStamp, sentence){
    // temp helper functions
    String.prototype.replaceAll = function(strReplace, strWith) {
      // See http://stackoverflow.com/a/3561711/556609
      var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var reg = new RegExp(esc, 'ig');
      return this.replace(reg, strWith);
    };
    var li = document.createElement("li"),
    minutes = Math.floor(timeStamp / 60),
    seconds = parseInt(timeStamp % 60),
    finalTime = this.str_pad_left(minutes,'0',2)+':'+this.str_pad_left(seconds,'0',2);
    li.className = "match-item";
    sentence = sentence.replaceAll(query,"<b style='color:#e74c3c'>"+query+"</b>"); // find query in sentence, highlight it
    li.innerHTML = finalTime + ' ' + sentence;
    li.addEventListener("click", function(){ // add event listener for click
      document.getElementsByTagName("video")[0].currentTime = Number(timeStamp);
      document.getElementsByTagName("video")[0].oncanplay = function(){};
    });
    return li;
  }     
  getSubURL(){
    return this.subURL;
  }
}
/** create UI */
function create(text, url, callback){
  var mother = document.createElement("div"),
      subObject = new subtitle(text, url),
      container = document.getElementById("watch-header");
  mother.id = 'mother-board';
  // create search box
  var searchBox = document.createElement("input");
  searchBox.id = 'search-box';
  searchBox.setAttribute('placeholder', 'Search Subtitle');
  var results = document.createElement("ul");
  results.classList.add('result-panel');
  results.id = 'my-results';
  searchBox.addEventListener("keyup", function(){ // instant search
    results.innerHTML = ''; // clean the result panel for every new search
    if (searchBox.value.length == 0)
      $('.result-panel').removeClass('show');
    else{
      var searchResult = subObject.search(searchBox.value);
      if (searchResult.length != 0)
        $('.result-panel').addClass('show');
      else if (searchResult.length == 0)
        $('.result-panel').removeClass('show');
      for (var i in searchResult)
        results.appendChild(searchResult[i]);
    }
  });
  mother.appendChild(searchBox);
  mother.appendChild(results);
  container.insertBefore(mother, container.childNodes[0]);
  $(document).click(function(event) { 
    if(!$(event.target).closest('#mother-board').length) {
      $('.result-panel').removeClass('show');
    }        
});
}
/** main: whenever a new request is received, new UI & subtitle object are created */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'flick button'){
      do{
        console.log('vid still not loaded');
      }
      while (document.getElementsByTagName("video")[0] == null);
      document.getElementsByTagName("video")[0].oncanplay = function(){
          console.log('button flicked onload');
          document.getElementsByClassName('ytp-subtitles-button')[0].click();
      };
    }
    else if (request.message == 'flick button twice'){
      console.log('button restored');
      document.getElementsByClassName('ytp-subtitles-button')[0].click();
    }
    else{
      var crawler = new XMLHttpRequest();
      crawler.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          create(crawler.responseText, request.url, sendResponse({message: "subtitle loaded"}));
        }
      };
      crawler.open("GET", request.url, true);
      crawler.send();
      return true;
    }
  });