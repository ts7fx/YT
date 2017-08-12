function addMotherBoard(t,l,callback){
  const m = document.createElement('div'),
  container = document.getElementById('watch-header');
  m.id = 'mother-board';
  container.insertBefore(m, container.childNodes[0]);
  if (callback) {
    callback(t,l);
  }
}
/** main: whenever a new request is received, new UI & subtitle object are created */
var myVar;
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'reset'){
      myVar = setInterval(function(){
        document.getElementsByClassName('ytp-subtitles-button')[0].click();
        setTimeout(function(){
          document.getElementsByClassName('ytp-subtitles-button')[0].click();
        }, 100);
      }, 1000);
    }
    else if (request.message == 'subURL'){
      clearInterval(myVar);
      let crawler = new XMLHttpRequest();
      crawler.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          const c = new subtitle(crawler.responseText, request.url);
          controlPanel.addMotherBoard(c, controlPanel.addSearchBox, controlPanel.addMouseListener);
          //sendResponse({message: "subtitle loaded"});
          // let sender = new XMLHttpRequest();
          // sender.open("POST", "http://127.0.0.1:1234/", true);
          // sender.setRequestHeader("vid-id", request.id);
          // sender.send(JSON.stringify(c.content));
        }
      };
      crawler.open("GET", request.url, true);
      crawler.send();
      return true;
    }
    else{
      console.log('error');
    }
  });
