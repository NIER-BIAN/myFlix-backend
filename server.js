// Serve "documentation.html" file when users send a request to the “/documentation” URL

console.log('console: ' + console);
console.log('global: ' + global);
console.log('process: ' + process);


const http = require('http'),
      fs = require('fs'),
      url = require('url');

// http module: server set up
// request handler function called every time an HTTP request is made against that server
http.createServer((request, response) => {

    // url module: URL parsing
    let addr = request.url,
	q = new URL(addr,  'http://' + request.headers.host),
	// request.headers.host would be smth like 'localhost:8080'),
	filePath = '';

    if (q.pathname.includes('documentation')) {
	filePath = (__dirname + '/documentation.html');
    } else {
	filePath = 'index.html';
    }

    // fs module: append to log.txt
    // appendFile() takes three arguments:
    // name of file to append, new information to be appended, and error-handler.
    fs.appendFile('log.txt',
		  'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n',
		  (err) =>
		  {if (err) {
			  console.log(err);
		      } else {
			  console.log('Added to log.');
		      }
		  });
    
    // fs module: send back the appropriate file
    fs.readFile(filePath, (err, data) => {
	if (err) {
	    throw err;
	}

	// add a header to the response it sends back along with the HTTP code "200" for "ok"
	response.writeHead(200, { 'Content-Type': 'text/html' });
	response.write(data);
	// ends the response sans message
	response.end();
    });
}).listen(8080);

console.log('My test server is running on Port 8080.');
