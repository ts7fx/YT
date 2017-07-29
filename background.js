/** Monitor, Grab & Pass */
var dict = {}; // once sent already, stop sending again
chrome.webRequest.onCompleted.addListener(function monitor(request){
	// Grab
	if (request.url.match(/timedtext/g) != null && dict[request.url] == null){
		alert(request.url);
		dict[request.url] = true;
		// Pass grabbed object to corresponding tab
		var reg = /v=(.+?)&/;
		var video_id = request.url.match(reg)[1];
		var queryInfo = {
			active: true,
			currentWindow: true,
			url: 'https://*.youtube.com/*' + video_id + '*' // match tab with corresponding video id
		};
		chrome.tabs.query(queryInfo, function(tabs){
			var targetTabID = tabs[0].id; 
			chrome.tabs.sendMessage(targetTabID, {url:request.url, id:request.url.match(/v=(.+?)&/)[1]}, function(response){ // ******Two options here******
				// option 1: pass request
				// option 2: pass request.url
			}); 
			});
	}
},{
	urls: ["*://www.youtube.com/*"]
});

/** monitor all tab updates and zoom in on those that include the keyword Youtube & v= */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		chrome.tabs.sendMessage(tabId, {message:'flick button'},function(response){});
		// chrome.tabs.get(tabId, function(tab){
		// 	// when pageload completes, and pageURL ready: 
		// 	// 1. does the url match predefined conditions?
		// 	// if it does, flick the captions twice. 
		// 	//alert(tab.url);
		// 	if (tab.url.match(/youtube/g) != null && tab.url.match(/v=/g) != null){
		// 		alert(tab.url);
		// 	}
		// });
	}
});