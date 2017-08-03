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
  /** keyword search for one or more keyword match in user query 
   *  @param {String} query - user input
   *  @return {Object} this.rank(query, result) - calls ranking function to re-rank results. 
   */
   search(query){
    const result = {};
    const queries = subtitle.escape(query).split(' ');
    for (const time in this.content){
      const curr = this.content[time];
      let present = false;
      for (const w in queries){
        if (curr.toLowerCase().indexOf(queries[w].toLowerCase()) != -1){ // if curr contains any words in user query
          present = true;
        }
      }
      if (present == true)
        result[time] = curr;
    }
    return this.rank(query, result);
  }
  /** rank result based on user input and ranking function
   *  @param {String} query - user input
   *  @param {Object} result - matched result, in {time:sentence}
   *  @return {Object} this.handle(query, result) - calls handle function to format into <li> items. 
   */
   rank(query, result){
    const queries = subtitle.escape(query).split(' ').filter(Boolean);
    const n = queries.length + 1; // always consider one more word. 
    let score = function(query, result){
      const queries = subtitle.escape(query).split(' ').filter(Boolean);
      const n = queries.length + 1;
      const scoreBoard = [];
      for (let i in result){
        let s = 0;
        for (let j in queries){
          if (result[i].toLowerCase().indexOf(queries[j].toLowerCase()) != -1)
            s += 10;
        }
        scoreBoard.push([s, i, result[i]]);
      }
      scoreBoard.sort(function(a, b) {
        if (a[0] != b[0])
          return b[0] - a[0];
        else
          return a[1] - b[1];
      });
      return scoreBoard;
    }
    return this.handle(query, score(query, result));
  }
  /** format and return search result
   *  @param {String} query - user input
   *  @param {Array} result - matched result, each element is in [score, timeStamp, sentence] format.
   *  @return {Array} html - array of <li> items. 
   */
   handle(query, result){
    // temp helper functions
    String.prototype.replaceAll = function(strReplace, strWith) {
      // See http://stackoverflow.com/a/3561711/556609
      var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var reg = new RegExp(esc, 'ig');
      return this.replace(reg, strWith);
    };
    let str_pad_left = function(string,pad,length){
      return (new Array(length+1).join(pad)+string).slice(-length);
    }
    const html = [];
    for (let i in result){
      const timeStamp = result[i][1],
      queries = subtitle.escape(query).split(' ').filter(Boolean),
      li = document.createElement("li"),
      minutes = Math.floor(timeStamp / 60),
      seconds = parseInt(timeStamp % 60),
      finalTime = str_pad_left(minutes,'0',2) + ':' + str_pad_left(seconds,'0',2);
      let sentence = result[i][2];
      for (let j in queries)
        sentence = sentence.replaceAll(queries[j],"<b style='color:#e74c3c'>"+queries[j]+"</b>");
      li.className = "match-item";
      li.innerHTML = finalTime + ' ' + sentence;
      li.addEventListener("click", function(){ // add event listener for click
        document.getElementsByTagName("video")[0].currentTime = Number(timeStamp);
      });
      html.push(li);
    }
    return html;
  }     
  /** simple get function*/
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