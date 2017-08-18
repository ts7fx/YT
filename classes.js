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
  /** takes in HTML text, return HTML object*/
  cleanContent(responseText){
    var obj = document.createElement('div'),
        results = document.createElement('div');
    obj.innerHTML=responseText;
    var sentences = obj.querySelectorAll('p');
    for (let i = 0; i < sentences.length; i++){
      if (sentences[i].textContent == '\n'){
        continue;
      }
      else{
        var individualSentence = document.createElement('p');
        individualSentence.innerHTML = sentences[i].textContent;
        var timestamp = sentences[i].getAttribute('t');
        individualSentence.setAttribute('timestamp', timestamp);
        results.append(individualSentence);
      }
    }
    return results;
  }
  /** performs user search on HTMl object. */
  search(query){
    const queryIsHit = function(query, line){
            return (line.innerHTML.indexOf(query)>-1);
          },
          handle = function(query, line){
            var result=line.innerHTML;
            var copy =  line.cloneNode();
            for (let i of query){
              result=result.split(i).join("|"+i+"^");
            }
            result = result.split('|').join("<b style='color:#e74c3c'>");
            result = result.split('^').join("</b>");
            copy.innerHTML=result;
            var timestamp=document.createElement('span');
            var time=parseFloat(copy.getAttribute('timestamp'))/1000;
            var h = Math.floor(time/3600); //Get whole hours
            time -= h*3600;
            var m = Math.floor(time/60);
            time-= m*60;
            time=Math.floor(time);
            timestamp.innerHTML=h+":"+(m < 10 ? '0'+m : m)+":"+(time < 10 ? '0'+time : time)+" ";
            copy.prepend(timestamp);
            return copy;
          },
          rank = function(results){ return results; };
    const queries = subtitle.escape(query).split(' ').filter(Boolean);
    var regFromQuery = new RegExp(queries.join("|"), 'gi');
    var results = document.createElement('div');
    var subtitles = this.content.querySelectorAll('p');
    //var now = Date.now();
    for (let i = 0; i < subtitles.length; i++){
      var hit = subtitles[i].innerHTML.match(regFromQuery);
      if (hit == null){
        continue;
      }
      else{
        var element = handle(Array.from(new Set(hit)), subtitles[i]);
        results.append(element);
      }
    }
    //console.log((Date.now()-now)/1000);
    return rank(results);
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

        if (sr.innerHTML !== '')
          $('.result-panel').addClass('show');
        else
          $('.result-panel').removeClass('show');
        r.appendChild(sr);
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
