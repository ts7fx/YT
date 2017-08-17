class subtitle {
  /** create a subtitle object */
  constructor(content, subURL) {
    this.content = this.cleanContent(content);
    this.subURL = subURL;
    this.send2Server = this.cleanContent(content);
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
    const cleanText = [];
    const regExp = /(<p\b[^>]*>([\s\S]*?)<\/p>)/g; // regex for extracting <p> elements
    const captureGroups = responseText.match(regExp); // this is a list of <p> elements in raw formats
    for (const i in captureGroups) {
      if(captureGroups[i].replace(/<[^>]*>/g, '')==='\n')
      continue;
      
      // format timeStamp information
      let timeStamp = captureGroups[i].match(/t="(\d*?)"/)[1];
      if (timeStamp.length < 4){ // handles single digit timestamps
        timeStamp += '00';
        timeStamp = +timeStamp;
      }
      timeStamp = +timeStamp;
      timeStamp /= 1000;
      cleanText.push([timeStamp, subtitle.escape(captureGroups[i].replace(/<[^>]*>/g, ''))]);
    }
    return cleanText;
  }
  /** keyword search for one or more keyword match in user query
  *  @param {String} query - user input
  *  @return {Array} this.rank(query, result) - calls ranking function to re-rank results.
  */
  search(query){
    const result = [];
    const queries = subtitle.escape(query).split(' ');
    for (const i in this.content){
      const curr = this.content[i][1];
      let present = false;
      for (const w in queries){
        if (curr.toLowerCase().indexOf(queries[w].toLowerCase()) != -1 && w != ' '){ // if curr contains any words in user query
          present = true;
        }
      }
      if (present == true)
      result.push([this.content[i][0],this.content[i][1]]);
    }
    return this.rank(query, result);
  }
  /** rank result based on user input and ranking function
  *  @param {String} query - user input
  *  @param {ArrayList} result - matched result, in [time,sentence]
  *  @return {Array} this.handle(query, result) - calls handle function to format into <li> items.
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
          if (result[i][1].toLowerCase().indexOf(queries[j].toLowerCase()) != -1)
          s += 10;
        }
        scoreBoard.push([s, result[i][0], result[i][1]]);
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
      const esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let reg = new RegExp(esc, 'ig');
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
      //console.log(queries);
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
