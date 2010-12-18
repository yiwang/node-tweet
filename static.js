var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    path.exists(filename, function(exists) {
    	if(!exists) {
    		response.writeHeader(404, {"Content-Type": "text/plain"});
    		response.write("404 Not Found\n");
    		response.end();
    		return;
    	}

    	fs.readFile(filename, "binary", function(err, file) {
    		if(err) {
    			response.writeHeader(500, {"Content-Type": "text/plain"});
    			response.write(err + "\n");
    			response.end();
    			return;
    		}

    		response.writeHeader(200);
    		response.write(file, "binary");
    		response.end();
    	});
    });
}).listen(8000);

sys.puts("Server running at http://localhost:8080/");
