const http = require('http');
const fs = require('fs');
//const qs = require('querystring');
const serverPort = 1234;

http.createServer(function(req,res){
  if (req.method === 'POST'){
    console.log('post request received, logging vid '+req.headers['vid-id']);
    var requestBody = '';
    req.on('data', function(data) {
      requestBody += data;
    });
    req.on('end', function() {
      //var formData = qs.parse(requestBody);
      fs.appendFile(req.headers['vid-id'], requestBody, function(err){
        if (err) {
          console.log('unable to write to file');
        }
        else {
          console.log('subtitle logged');
        }
      });
    });
  }
  else{
    console.log('other request received');
  }
}).listen(serverPort);
