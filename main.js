//set an interval as a pipeline for reacting to specific DOM conditions.

sessionStorage['itval']=setInterval(checkList,1000);

var goSignal={
  'clickButton': false
};
var reactions={
  'clickButton':clickButton
};

function checkList(){
  //console.log('counting');
  //list of conditions, change corresponding goSignal
  if (document.querySelector('#search-box')==null &&
      document.getElementsByClassName('ytp-subtitles-button')[0].clientHeight != 0 &&
      document.getElementsByClassName('ytp-subtitles-button')[0].getAttribute('aria-pressed') == 'false'){
    goSignal['clickButton']=true;
  }
  //loop through to run all reactions
  for (key in goSignal) {
    if(goSignal[key]){
      reactions[key]();
      goSignal[key]=false;
      //console.log(key,'triggered')
    };
  }
}
function clickButton(){
  document.getElementsByClassName('ytp-subtitles-button')[0].click();
}

/** main: whenever a new request is received, new UI & subtitle object are created */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == 'subURL'){
      let crawler = new XMLHttpRequest();
      crawler.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          const c = new subtitle(crawler.responseText, request.url);
          controlPanel.addMotherBoard(c, controlPanel.addSearchBox, controlPanel.addMouseListener);
          document.getElementsByClassName('ytp-subtitles-button')[0].click();
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
      document.getElementById('mother-board').remove();
      console.log(request.message);
    }
  });
