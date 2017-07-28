/** Monitor, Grab & Pass */
var dict = {}; // once sent already, stop sending again
chrome.webRequest.onCompleted.addListener(function monitor(request){
	// Grab
	if (request.url.match(/timedtext/g) != null && dict[request.url] == null){
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