var express = require('express');
var app = express();

var path = require('path');
var port = process.env.PORT || 3000;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var _send = res.send;
    var sent = false;
    res.send = function(data) {
        if (sent) return;
        _send.bind(res)(data);
        sent = true;
    };
    next();
});

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

console.log("Push Notification Running...");

app.listen(port);
