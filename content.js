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
    li.className = "list-group-item";
    sentence = sentence.replaceAll(query,"<b style='color:#e74c3c'>"+query+"</b>"); // find query in sentence, highlight it
    li.innerHTML = finalTime + ' ' + sentence;
    li.addEventListener("click", function(){ // add event listener for click
      document.getElementsByTagName("video")[0].currentTime = Number(timeStamp);
    });
    return li;
  }     
  getSubURL(){
    return this.subURL;
  }
}

/** main: whenever a new request is received, new UI & subtitle object are created */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'flick button'){
      document.getElementsByTagName("video")[0].oncanplay = function(){ // when video can be played, it is done loading.
        $( ".ytp-subtitles-button" ).click(); 
        setTimeout(function(){$(".ytp-subtitles-button").click();}, 300);
      };
    }
    var crawler = new XMLHttpRequest();
    crawler.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // create UI & initiate new subtitle 
        var subObject = new subtitle(crawler.responseText, request.url),
        container = document.getElementById("watch-header"),
        searchBox = document.createElement('input'), 
        listGroup = document.createElement("div"),
        hiddenGrp = document.createElement("div"),
        collabutt = document.createElement("button");
        searchBox.id = "searchBox";
        listGroup.id = "resultPanel";
        hiddenGrp.id = "collapsePanel";
        hiddenGrp.className = "collapse";
        hiddenGrp.setAttribute("style", "display: none");
        collabutt.id = "collaButton";
        collabutt.innerHTML = "...";
        searchBox.addEventListener("keyup", function(){ // enable instant search
          listGroup.innerHTML = hiddenGrp.innerHTML = ''; // clean the result panel for every new search
          var maxEleShown = 5; // limit up to 5 results displayed
          if (searchBox.value.length == 0)
            console.log('empty query');
          else {
            var searchResult = subObject.search(searchBox.value);
            for (var i in searchResult){
              hiddenGrp.setAttribute("style", "display: none");
              if (i < maxEleShown)
                listGroup.appendChild(searchResult[i]);
              else{
                hiddenGrp.appendChild(searchResult[i]);
              }
            }
          }
        });
        container.insertBefore(hiddenGrp, container.childNodes[0]);
        container.insertBefore(collabutt, container.childNodes[0]);
        container.insertBefore(listGroup, container.childNodes[0]);
        container.insertBefore(searchBox, container.childNodes[0]);
        $('#collaButton').click(function(){ // jquery bootStrap
            $('#collapsePanel').toggle();
        });
      }
    };
    crawler.open("GET", request.url, true);
    crawler.send();
  });