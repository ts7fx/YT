class subtitle {
  /** create a subtitle object */
  constructor(content, subURL) {
    this.content = this.cleanContent(content);
    this.subURL = subURL;
  }
  /** helpfer function to handle special characters*/
  static escape(t) {
    return t
    .replace(/&amp;/g, '\&')
    .replace(/&lt;/g, '\<')
    .replace(/&gt;/g, '\>')
    .replace(/&quot;/g, '\"')
    .replace(/&#39;/g, "\'");
  }
  /** clean content, return object in key-value pairs (timeStamp: sentence) */
  cleanContent(responseText){
    // return cleaned content
    var cleanText = {};
    var regExp = /(<p\b[^>]*>([\s\S]*?)<\/p>)/g; // regex for extracting <p> elements
    var captureGroups = responseText.match(regExp); // this is a list of <p> elements in raw formats
    for (const i in captureGroups) { 
      if(captureGroups[i].replace(/<[^>]*>/g, '')==='\n')
        continue;
      // format timeStamp information
      var timeStamp = captureGroups[i].match(/t="(\d*?)"/)[1];
      if (timeStamp.length < 4){ // handles single digit timestamps
        timeStamp += '00';
        timeStamp = +timeStamp;
      }
      timeStamp = +timeStamp;
      timeStamp /= 1000;
      cleanText[timeStamp] = subtitle.escape(captureGroups[i].replace(/<[^>]*>/g, '')); // clean sentence and store as (time:sentence)
    } 
    return cleanText;
  }
  /** search for query in this.content, returns an array of li objects */
  search(query){
    var result = [];
    var queries = subtitle.escape(query).split(' ');
    var maxRating = 0;
    for (var time in this.content){
      var curr = this.content[time];
      var rating = 0; 
      for (var i in queries){
        var qLowCase = query.toLowerCase();
        if (curr.toLowerCase().indexOf(qLowCase)!=-1)
          rating++;
      }

      if (rating > 0){
        rating-=(time/10000);
        var beg = curr.toLowerCase().indexOf(qLowCase);
        var ori = curr.substr(beg, qLowCase.length);
        if (maxRating < rating){
          result.unshift(this.handleResult(ori, time, curr));
          maxRating = rating;
        }
        else {
          result.push(this.handleResult(ori, time, curr));
        }
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
function addMotherBoard(t,l,callback){
  const m = document.createElement('div'),
  container = document.getElementById('watch-header');
  m.id = 'mother-board';
  container.insertBefore(m, container.childNodes[0]);    
  if (callback) {
    callback(t,l);
  }
}
class controlPanel{
  /** set of static methods to help initializing UI */
  constructor() {
  }
  static addMotherBoard(c,f1,f2){
    const m = document.createElement('div'),
    container = document.getElementById('watch-header');
    m.id = 'mother-board';
    container.insertBefore(m, container.childNodes[0]);
    if (f1) {
      f1(c);
      f2();
    }
  }
  static addSearchBox(c){
    const sb = document.createElement('input'),
    r = document.createElement("ul");
    sb.id = 'search-box';
    r.id = 'my-results';
    sb.setAttribute('placeholder', 'Search Subtitle');
    r.classList.add('result-panel');
    sb.addEventListener('keyup', function(){ // instant search
      r.innerHTML = ''; // clean the result panel for every new search
      if (sb.value.length == 0){
        $('.result-panel').removeClass('show');
      }
      else{
        const sr = c.search(sb.value);
        if (sr.length != 0)
          $('.result-panel').addClass('show');
        else if (sr.length == 0)
          $('.result-panel').removeClass('show');
        for (const i in sr)
          r.appendChild(sr[i]);
      }
    });
    document.getElementById('mother-board').appendChild(sb);
    document.getElementById('mother-board').appendChild(r);
  }
  static addMouseListener(){
    $(document).click(function(e) { 
      if(!$(e.target).closest('#mother-board').length) 
        $('.result-panel').removeClass('show');
    });
  }
}
/** main: whenever a new request is received, new UI & subtitle object are created */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'flick button'){
      setTimeout(function(){
        $( document ).ready(function() {
          document.getElementsByClassName('ytp-subtitles-button')[0].click();
        });
      }, 1001); // room for optimization. How to handle ads b4 vid?
    }
    else if (request.message == 'flick button twice'){
      document.getElementsByClassName('ytp-subtitles-button')[0].click();
    }
    else{
      var crawler = new XMLHttpRequest();
      crawler.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          const c = new subtitle(crawler.responseText, request.url);
          controlPanel.addMotherBoard(c, controlPanel.addSearchBox, controlPanel.addMouseListener);
          sendResponse({message: "subtitle loaded"});
        }
      };
      crawler.open("GET", request.url, true);
      crawler.send();
      return true;
    }
  });