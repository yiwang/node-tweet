var sys = require("sys"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    events = require("events");

function load_static_file(uri, response) {
	var filename = path.join(process.cwd(), uri);
	path.exists(filename, function(exists) {
		if(!exists) {
			response.writeHeader(404, {"Content-Type": "text/plain"});
			response.end("404 Not Found\n");
			return;
		}

		fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				response.writeHeader(500, {"Content-Type": "text/plain"});
				response.end(err + "\n");
				return;
			}
			response.writeHeader(200);
			response.end(file, "binary");
		});
	});
}

var twitter_client = http.createClient(80,"api.twitter.com");
var tweet_emitter = new events.EventEmitter();
function get_tweets(){
	var req = twitter_client.request("GET","/1/statuses/public_timeline.json", {"host":"api.twitter.com"});
	req.addListener("response",function(res){
		var body = "";
		res.addListener("data",function(data){
			body += data;
		});
		res.addListener("end",function(){
			var tweets = JSON.parse(body);
			if(tweets.length > 0){
				tweet_emitter.emit("tweets", tweets);
			}
		});
	});
	req.end();
}
setInterval(get_tweets, 5000);

http.createServer(function(req, res){
	var uri = url.parse(req.url).pathname;
	if(uri === "/stream"){
		var listener = tweet_emitter.addListener("tweets", function(tweets){
			res.writeHeader(200, { "Content-Type" : "text/plain"});
			res.end(JSON.stringify(tweets));
			clearTimeout(timeout);
		});
		
		var timeout = setTimeout(function(){
			res.writeHeader(200, {"Content-Type":"text/plain"});
			res.end(JSON.stringify([]));
			tweet_emitter.removeListener(listener);
		}, 10000);
	}else{
		load_static_file(uri, res);
	}
}).listen(8000);
sys.puts("Server running at port 8000");
