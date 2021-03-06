var dict = {};
var current_vid = '';
chrome.webRequest.onCompleted.addListener(function monitor(request){
	if (request.url.match(/timedtext/g) != null && dict[request.url] == null){
		dict[request.url] = true;
		var reg = /v=(.+?)&/;
		var video_id = request.url.match(reg)[1];
		if (video_id === current_vid){ // close CC button only when current vid CC obtained.
			var queryInfo = {
				active: true,
				currentWindow: true,
				url: 'https://*.youtube.com/*' + video_id + '*'
			};
			chrome.tabs.query(queryInfo, function(tabs){
				var tabId = tabs[0].id;
				chrome.tabs.sendMessage(tabId, {message:'subURL', url:request.url, id:request.url.match(/v=(.+?)&/)[1]}, function(response){});
			});
		}
	}
},{
	urls: ["*://www.youtube.com/*"]
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		chrome.tabs.get(tabId, function(currentTab){
		    if(tab.url == currentTab.url && changeInfo.status == 'complete'){
		    	if (tab.url.match(/youtube/g) != null && tab.url.match(/v=/g) != null ){
						var reg = /v=([^&]+)/;
						current_vid = tab.url.match(reg)[1];
		    		chrome.tabs.sendMessage(tabId, {message:'reset'},function(response){});
		    	}
		    }
		});
	}
});
